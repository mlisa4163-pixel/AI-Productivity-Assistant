import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";

import { AiDisclaimer } from "@/components/ai-disclaimer";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession, type ResponseTone } from "@/lib/session-store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Workplace AI" },
      {
        name: "description",
        content:
          "Set the assistant's response tone and reset your session data in this frontend-only prototype.",
      },
      { property: "og:title", content: "Settings — Workplace AI" },
      {
        property: "og:description",
        content: "Tune response style and clear session data at any time.",
      },
    ],
  }),
  component: Settings,
});

const TONES: { value: ResponseTone; hint: string }[] = [
  { value: "Concise", hint: "Short answers, minimal explanation" },
  { value: "Balanced", hint: "Clear answers with useful context" },
  { value: "Detailed", hint: "Thorough answers with reasoning" },
];

function Settings() {
  const { tone, setTone, tasks, schedule, researchCount, clearSession } = useSession();

  return (
    <AppShell title="Settings" description="Preferences for this browser session">
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Response tone</CardTitle>
            <CardDescription>
              Applies to the planner, research assistant and chatbot.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="tone">Tone</Label>
            <Select value={tone} onValueChange={(value) => setTone(value as ResponseTone)}>
              <SelectTrigger id="tone" className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {TONES.find((item) => item.value === tone)?.hint}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Session data</CardTitle>
            <CardDescription>
              This prototype stores nothing. Everything lives in memory and resets when you refresh
              the page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg border border-border bg-surface p-3">
                <dt className="text-xs text-muted-foreground">Tasks</dt>
                <dd className="font-display text-xl font-semibold">{tasks.length}</dd>
              </div>
              <div className="rounded-lg border border-border bg-surface p-3">
                <dt className="text-xs text-muted-foreground">Schedule blocks</dt>
                <dd className="font-display text-xl font-semibold">{schedule.length}</dd>
              </div>
              <div className="rounded-lg border border-border bg-surface p-3">
                <dt className="text-xs text-muted-foreground">Research runs</dt>
                <dd className="font-display text-xl font-semibold">{researchCount}</dd>
              </div>
            </dl>
            <Button variant="outline" onClick={clearSession}>
              <RotateCcw /> Reset session data
            </Button>
          </CardContent>
        </Card>

        <AiDisclaimer />
      </div>
    </AppShell>
  );
}
