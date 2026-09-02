import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, Paperclip, Sparkle, X } from "lucide-react";
import { useRef, useState } from "react";

import { AiDisclaimer } from "@/components/ai-disclaimer";
import { AppShell } from "@/components/app-shell";
import { VoiceInputButton } from "@/components/voice-input-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { generateResearch } from "@/lib/assistant.functions";
import { useSession } from "@/lib/session-store";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant — Workplace AI" },
      {
        name: "description",
        content:
          "Paste a topic, question or article and get an editable summary with key insights, risks and recommendations.",
      },
      { property: "og:title", content: "AI Research Assistant — Workplace AI" },
      {
        property: "og:description",
        content: "Summaries, insights, risks and recommendations you can edit before sharing.",
      },
    ],
  }),
  component: Research,
});

type ResearchOutput = {
  summary: string;
  insights: string;
  risks: string;
  recommendations: string;
};

const EMPTY: ResearchOutput = { summary: "", insights: "", risks: "", recommendations: "" };

const SECTIONS: { key: keyof ResearchOutput; label: string; hint: string }[] = [
  { key: "summary", label: "Summary", hint: "The short version" },
  { key: "insights", label: "Key insights", hint: "What matters most" },
  { key: "risks", label: "Risks & limitations", hint: "What to watch for" },
  { key: "recommendations", label: "Recommendations", hint: "Suggested next actions" },
];

type Attachment = { id: string; name: string; mediaType: string; data: string };

const MAX_FILE_BYTES = 8 * 1024 * 1024;

const ACCEPTED =
  ".txt,.md,.csv,.json,.pdf,.png,.jpg,.jpeg,.webp,text/plain,text/markdown,text/csv,application/json,application/pdf,image/*";

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function Research() {
  const { tone, bumpResearchCount } = useSession();
  const [topic, setTopic] = useState("");
  const [output, setOutput] = useState<ResearchOutput>(EMPTY);
  const [copied, setCopied] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const voice = useVoiceInput((text) =>
    setTopic((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text)),
  );

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setFileError(null);
    const next: Attachment[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_BYTES) {
        setFileError(`${file.name} is larger than 8 MB and was skipped.`);
        continue;
      }
      next.push({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        mediaType: file.type || "application/octet-stream",
        data: await fileToBase64(file),
      });
    }
    if (next.length) setAttachments((prev) => [...prev, ...next]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const runResearch = useServerFn(generateResearch);
  const mutation = useMutation({
    mutationFn: () =>
      runResearch({
        data: {
          topic: topic.trim(),
          tone,
          attachments: attachments.map(({ name, mediaType, data }) => ({ name, mediaType, data })),
        },
      }),

    onSuccess: (result) => {
      setOutput({
        summary: result?.summary ?? "",
        insights: (result?.insights ?? []).map((item) => `• ${item}`).join("\n"),
        risks: (result?.risks ?? []).map((item) => `• ${item}`).join("\n"),
        recommendations: (result?.recommendations ?? []).map((item) => `• ${item}`).join("\n"),
      });
      bumpResearchCount();
    },
  });

  const hasOutput = Object.values(output).some(Boolean);

  const copy = async (key: keyof ResearchOutput) => {
    await navigator.clipboard.writeText(output[key]);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <AppShell title="AI Research Assistant" description="Summary, insights, risks, recommendations">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What should I look into?</CardTitle>
            <CardDescription>
              Type or dictate a topic, paste article text, or attach documents and images.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="research-input">Topic, question or article text</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {voice.state === "recording"
                      ? "Recording…"
                      : voice.state === "transcribing"
                        ? "Transcribing…"
                        : "Dictate"}
                  </span>
                  <VoiceInputButton state={voice.state} onToggle={voice.toggle} />
                </div>
              </div>
              <Textarea
                id="research-input"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="e.g. What should we consider before moving our support team to a four-day week?"
                className="min-h-40"
              />
              {voice.error ? (
                <p className="text-xs text-destructive">{voice.error}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED}
                className="sr-only"
                aria-label="Attach files"
                onChange={(event) => void addFiles(event.target.files)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip /> Attach files
              </Button>
              <p className="text-xs text-muted-foreground">
                Text, Markdown, CSV, JSON, PDF or images, up to 8 MB each. Files are sent only for
                this analysis and are never stored.
              </p>
              {fileError ? <p className="text-xs text-destructive">{fileError}</p> : null}
              {attachments.length ? (
                <ul className="flex flex-wrap gap-2">
                  {attachments.map((file) => (
                    <li
                      key={file.id}
                      className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs"
                    >
                      <span className="max-w-48 truncate">{file.name}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${file.name}`}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                        onClick={() =>
                          setAttachments((prev) => prev.filter((item) => item.id !== file.id))
                        }
                      >
                        <X className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => mutation.mutate()}
                disabled={(!topic.trim() && attachments.length === 0) || mutation.isPending}
              >
                <Sparkle /> {mutation.isPending ? "Analysing…" : "Analyse"}
              </Button>
              <span className="text-xs text-muted-foreground">
                Responses are generated fresh each time and are not saved.
              </span>
            </div>
          </CardContent>
        </Card>

        {mutation.isError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {(mutation.error as Error).message}
          </p>
        ) : null}

        {hasOutput ? (
          <div className="grid gap-4 md:grid-cols-2">
            {SECTIONS.map(({ key, label, hint }) => (
              <Card key={key}>
                <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
                  <div>
                    <CardTitle className="text-sm">{label}</CardTitle>
                    <CardDescription className="text-xs">{hint}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Copy ${label}`}
                    onClick={() => copy(key)}
                  >
                    {copied === key ? <Check /> : <Copy />}
                  </Button>
                </CardHeader>
                <CardContent>
                  <Textarea
                    aria-label={`${label} (editable)`}
                    className="min-h-40 bg-surface text-sm"
                    value={output[key]}
                    onChange={(event) =>
                      setOutput((prev) => ({ ...prev, [key]: event.target.value }))
                    }
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}

        <AiDisclaimer />
      </div>
    </AppShell>
  );
}
