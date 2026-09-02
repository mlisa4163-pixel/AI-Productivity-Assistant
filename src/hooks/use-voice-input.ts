import { useCallback, useRef, useState } from "react";

import { transcribeAudio } from "@/lib/assistant.functions";

type State = "idle" | "recording" | "transcribing";

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

/** Decode any recorded audio and re-encode it as 16 kHz mono WAV (base64). */
async function blobToWavBase64(blob: Blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioCtx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) throw new Error("Audio recording is not supported in this browser.");

  const context = new AudioCtx();
  const decoded = await context.decodeAudioData(arrayBuffer.slice(0));
  await context.close();

  const targetRate = 16000;
  const ratio = decoded.sampleRate / targetRate;
  const frames = Math.floor(decoded.length / ratio);
  const channels = Array.from({ length: decoded.numberOfChannels }, (_, index) =>
    decoded.getChannelData(index),
  );

  const buffer = new ArrayBuffer(44 + frames * 2);
  const view = new DataView(buffer);
  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + frames * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, targetRate, true);
  view.setUint32(28, targetRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, frames * 2, true);

  for (let frame = 0; frame < frames; frame += 1) {
    const sourceIndex = Math.floor(frame * ratio);
    let sample = 0;
    for (const channel of channels) sample += channel[sourceIndex] ?? 0;
    sample = Math.max(-1, Math.min(1, sample / channels.length));
    view.setInt16(44 + frame * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }

  return bytesToBase64(new Uint8Array(buffer));
}

/**
 * Microphone capture + AI transcription. Audio is sent to the server for
 * transcription and never stored.
 */
export function useVoiceInput(onTranscript: (text: string) => void) {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
  }, []);

  const start = useCallback(async () => {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Microphone recording is not supported in this browser.");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Microphone access was blocked. Allow microphone access and try again.");
      return;
    }

    const mimeType = ["audio/webm", "audio/mp4", "audio/ogg"].find((type) =>
      typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type),
    );
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorderRef.current = recorder;
    const chunks: Blob[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      recorderRef.current = null;
      const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
      if (blob.size === 0) {
        setState("idle");
        return;
      }

      setState("transcribing");
      try {
        const data = await blobToBase64(blob);
        const result = await transcribeAudio({
          data: { mediaType: (recorder.mimeType || "audio/webm").split(";")[0], data },
        });
        if (result?.text) onTranscript(result.text);
        else setError("No speech was detected in that recording.");
      } catch (transcribeError) {
        setError(
          transcribeError instanceof Error
            ? transcribeError.message
            : "Could not transcribe that recording.",
        );
      } finally {
        setState("idle");
      }
    };

    recorder.start();
    setState("recording");
  }, [onTranscript]);

  const toggle = useCallback(() => {
    if (state === "recording") stop();
    else if (state === "idle") void start();
  }, [state, start, stop]);

  return { state, error, toggle, clearError: () => setError(null) };
}
