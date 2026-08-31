import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, Copy } from "lucide-react";
import { useState } from "react";

import { AiDisclaimer } from "@/components/ai-disclaimer";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PROMPT_LIBRARY } from "@/lib/prompt-library";
import { useSession } from "@/lib/session-store";

export const Route = createFileRoute("/prompts")({
  head: () => ({
    meta: [
      { title: "Prompt Library — Workplace AI" },
      {
        name: "description",
        content:
          "Ready-to-use workplace prompts for daily planning, meeting prep, email, research, problem solving and weekly reviews.",
      },
      { property: "og:title", content: "Prompt Library — Workplace AI" },
      {
        property: "og:description",
        content: "Copy a proven prompt or send it straight to the chatbot.",
      },
    ],
  }),
  component: Prompts,
});

function Prompts() {
  const navigate = useNavigate();
  const { setChatDraft } = useSession();
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (title: string, body: string) => {
    await navigator.clipboard.writeText(body);
    setCopied(title);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <AppShell title="Prompt Library" description="Proven starting points for everyday work">
      <div className="space-y-8">
        {PROMPT_LIBRARY.map((category) => (
          <section key={category.id} className="space-y-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                {category.name}
              </h2>
              <p className="text-sm text-muted-foreground">{category.blurb}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {category.prompts.map((prompt) => (
                <Card key={prompt.title} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-sm">{prompt.title}</CardTitle>
                    <CardDescription className="whitespace-pre-line text-xs leading-relaxed">
                      {prompt.body}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copy(prompt.title, prompt.body)}
                    >
                      {copied === prompt.title ? <Check /> : <Copy />}
                      {copied === prompt.title ? "Copied" : "Copy"}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setChatDraft(prompt.body);
                        void navigate({ to: "/chat" });
                      }}
                    >
                      Use in chatbot <ArrowRight />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
        <AiDisclaimer />
      </div>
    </AppShell>
  );
}
