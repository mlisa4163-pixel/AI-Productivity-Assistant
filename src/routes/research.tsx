import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, Sparkle } from "lucide-react";
import { useState } from "react";

import { AiDisclaimer } from "@/components/ai-disclaimer";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

function Research() {
  const { tone, bumpResearchCount } = useSession();
  const [topic, setTopic] = useState("");
  const [output, setOutput] = useState<ResearchOutput>(EMPTY);
  const [copied, setCopied] = useState<string | null>(null);

  const runResearch = useServerFn(generateResearch);
  const mutation = useMutation({
    mutationFn: () => runResearch({ data: { topic: topic.trim(), tone } }),
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
              Enter a topic, a question, or paste article text to analyse.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="research-input">Topic, question or article text</Label>
              <Textarea
                id="research-input"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="e.g. What should we consider before moving our support team to a four-day week?"
                className="min-h-40"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => mutation.mutate()} disabled={!topic.trim() || mutation.isPending}>
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
