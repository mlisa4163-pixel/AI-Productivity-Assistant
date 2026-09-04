import { useChat } from "@ai-sdk/react";
import { createFileRoute } from "@tanstack/react-router";
import { DefaultChatTransport } from "ai";
import { Paperclip, X } from "lucide-react";
import { useRef, useState } from "react";

import { AiDisclaimer } from "@/components/ai-disclaimer";
import { AppShell } from "@/components/app-shell";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { VoiceInputButton } from "@/components/voice-input-button";
import { Button } from "@/components/ui/button";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { useSession } from "@/lib/session-store";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Chatbot — Workplace AI" },
      {
        name: "description",
        content:
          "A professional workplace chat assistant with suggested prompts for planning, writing and decision support.",
      },
      { property: "og:title", content: "AI Chatbot — Workplace AI" },
      {
        property: "og:description",
        content: "Ask work questions and get practical, professional answers.",
      },
    ],
  }),
  component: Chat,
});

const SUGGESTIONS = [
  "Help me plan a focused morning around two deadlines",
  "Draft an agenda for a 30-minute project kickoff",
  "Rewrite this update to be shorter and clearer",
  "What questions should I ask before agreeing to this deadline?",
];

type ChatFile = { id: string; name: string; mediaType: string; url: string };

const MAX_CHAT_FILE_BYTES = 8 * 1024 * 1024;

const CHAT_ACCEPTED =
  ".txt,.md,.csv,.json,.pdf,.png,.jpg,.jpeg,.webp,text/plain,text/markdown,text/csv,application/json,application/pdf,image/*";

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function Chat() {
  const { tone, chatDraft, setChatDraft } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<ChatFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setError(null);
    const next: ChatFile[] = [];
    for (const file of Array.from(list)) {
      if (file.size > MAX_CHAT_FILE_BYTES) {
        setError(`${file.name} is larger than 8 MB and was skipped.`);
        continue;
      }
      next.push({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        mediaType: file.type || "application/octet-stream",
        url: await fileToDataUrl(file),
      });
    }
    if (next.length) setFiles((prev) => [...prev, ...next]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const voice = useVoiceInput((text) =>
    setChatDraft(chatDraft.trim() ? `${chatDraft.trim()} ${text}` : text),
  );

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (chatError) => setError(chatError.message),
  });

  const isBusy = status === "submitted" || status === "streaming";

  const send = (text: string) => {
    if ((!text.trim() && files.length === 0) || isBusy) return;
    setError(null);
    void sendMessage(
      {
        text: text.trim(),
        files: files.map((file) => ({
          type: "file" as const,
          mediaType: file.mediaType,
          filename: file.name,
          url: file.url,
        })),
      },
      { body: { tone } },
    );
    setChatDraft("");
    setFiles([]);
  };

  return (
    <AppShell title="AI Chatbot" description="A workplace assistant for everyday thinking">
      <div className="flex h-[calc(100vh-11rem)] min-h-[30rem] flex-col gap-4">
        <div className="flex-1 overflow-hidden rounded-xl border border-border bg-card">
          <Conversation className="h-full">
            <ConversationContent className="mx-auto max-w-3xl">
              {messages.length === 0 ? (
                <ConversationEmptyState
                  title="What are you working on?"
                  description="Start with a suggestion below or ask anything about your work."
                />
              ) : (
                messages.map((message) => (
                  <Message key={message.id} from={message.role}>
                    <MessageContent>
                      {message.parts.map((part, index) =>
                        part.type === "text" ? (
                          <MessageResponse key={index}>{part.text}</MessageResponse>
                        ) : part.type === "file" ? (
                          <p key={index} className="text-xs text-muted-foreground">
                            📎 {part.filename ?? part.mediaType}
                          </p>
                        ) : null,
                      )}
                    </MessageContent>
                  </Message>
                ))
              )}
              {status === "submitted" ? <Shimmer>Thinking…</Shimmer> : null}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        </div>

        {error || voice.error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error ?? voice.error}
          </p>
        ) : null}

        <div className="mx-auto w-full max-w-3xl space-y-3">
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                className="h-auto whitespace-normal py-1.5 text-left text-xs font-normal"
                onClick={() => send(suggestion)}
                disabled={isBusy}
              >
                {suggestion}
              </Button>
            ))}
          </div>

          <PromptInput
            onSubmit={(_message, event) => {
              event.preventDefault();
              send(chatDraft);
            }}
          >
            <PromptInputTextarea
              value={chatDraft}
              onChange={(event) => setChatDraft(event.target.value)}
              placeholder="Ask about planning, writing, research or decisions…"
            />
            {files.length ? (
              <ul className="flex flex-wrap gap-2 px-3 pt-2">
                {files.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs"
                  >
                    <span className="max-w-40 truncate">{file.name}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${file.name}`}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                      onClick={() => setFiles((prev) => prev.filter((item) => item.id !== file.id))}
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <PromptInputFooter className="justify-between">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={CHAT_ACCEPTED}
                  className="sr-only"
                  aria-label="Attach files"
                  onChange={(event) => void addFiles(event.target.files)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Attach files"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip />
                </Button>
                <VoiceInputButton state={voice.state} onToggle={voice.toggle} />
                <span className="text-xs text-muted-foreground">
                  {voice.state === "recording"
                    ? "Recording…"
                    : voice.state === "transcribing"
                      ? "Transcribing…"
                      : "Speak or attach files"}
                </span>
              </div>
              <PromptInputSubmit
                status={status}
                disabled={!chatDraft.trim() && files.length === 0 && !isBusy}
              />
            </PromptInputFooter>
          </PromptInput>

          <AiDisclaimer />
        </div>
      </div>
    </AppShell>
  );
}
