import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarClock, ListChecks, MessagesSquare, Microscope } from "lucide-react";

import { AiDisclaimer } from "@/components/ai-disclaimer";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/lib/session-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "A workplace AI dashboard for planning your day, researching topics and chatting with an assistant built for professional work.",
      },
      { property: "og:title", content: "AI Workplace Productivity Assistant" },
      {
        property: "og:description",
        content: "Plan tasks, research topics and chat with a workplace AI assistant.",
      },
    ],
  }),
  component: Dashboard,
});

const TOOLS = [
  {
    to: "/planner" as const,
    label: "AI Task Planner",
    icon: CalendarClock,
    copy: "Turn your task list into a realistic daily or weekly schedule you can edit.",
  },
  {
    to: "/research" as const,
    label: "AI Research Assistant",
    icon: Microscope,
    copy: "Summarise a topic or article into insights, risks and recommended actions.",
  },
  {
    to: "/chat" as const,
    label: "AI Chatbot",
    icon: MessagesSquare,
    copy: "Ask workplace questions, draft emails and think through problems.",
  },
];

function Dashboard() {
  const { tasks, schedule, researchCount } = useSession();
  const counts = {
    High: tasks.filter((task) => task.priority === "High").length,
    Medium: tasks.filter((task) => task.priority === "Medium").length,
    Low: tasks.filter((task) => task.priority === "Low").length,
  };

  return (
    <AppShell title="Dashboard" description="Your workspace at a glance">
      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-xl font-semibold sm:text-2xl">
            Let&apos;s make today manageable
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Three focused AI tools for professional work: plan your tasks, research a topic properly,
            and think out loud with an assistant. Nothing is stored — this session resets on refresh.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Tasks in session</CardDescription>
              <CardTitle className="font-display text-3xl">{tasks.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="destructive">High {counts.High}</Badge>
                <Badge variant="secondary">Medium {counts.Medium}</Badge>
                <Badge variant="outline">Low {counts.Low}</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Schedule blocks</CardDescription>
              <CardTitle className="font-display text-3xl">{schedule.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {schedule.length
                  ? "Generated schedule ready to review and edit."
                  : "Generate a schedule in the Task Planner."}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Research runs</CardDescription>
              <CardTitle className="font-display text-3xl">{researchCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Summaries, insights, risks and recommendations.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {TOOLS.map(({ to, label, icon: Icon, copy }) => (
            <Link
              key={to}
              to={to}
              className="group rounded-xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <h3 className="mt-3 text-sm font-semibold">{label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{copy}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Open
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </section>

        {tasks.length > 0 ? (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <ListChecks className="size-4" aria-hidden="true" /> Current tasks
            </h2>
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
              {tasks.slice(0, 6).map((task) => (
                <li key={task.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <span className="min-w-0 flex-1 truncate">{task.title}</span>
                  <span className="text-xs text-muted-foreground">{task.deadline || "No date"}</span>
                  <PriorityDot priority={task.priority} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <AiDisclaimer />
      </div>
    </AppShell>
  );
}

function PriorityDot({ priority }: { priority: "High" | "Medium" | "Low" }) {
  const tone =
    priority === "High" ? "bg-destructive" : priority === "Medium" ? "bg-warning" : "bg-success";
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`size-2 rounded-full ${tone}`} aria-hidden="true" />
      {priority}
    </span>
  );
}
