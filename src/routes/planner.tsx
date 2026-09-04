import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Bell, BellOff, Plus, Sparkle, Trash2 } from "lucide-react";
import { useState } from "react";

import { AiDisclaimer } from "@/components/ai-disclaimer";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTaskReminders } from "@/hooks/use-task-reminders";
import { generateSchedule } from "@/lib/assistant.functions";
import { newId, useSession, type MeetingMode, type Priority } from "@/lib/session-store";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — Workplace AI" },
      {
        name: "description",
        content:
          "Add tasks with priorities and deadlines, then generate an editable daily or weekly work schedule with AI.",
      },
      { property: "og:title", content: "AI Task Planner — Workplace AI" },
      {
        property: "og:description",
        content: "Generate an editable daily or weekly work schedule from your task list.",
      },
    ],
  }),
  component: Planner,
});

const PRIORITIES: Priority[] = ["High", "Medium", "Low"];
const MODES: MeetingMode[] = ["Online", "Face to face"];
const DURATIONS = [15, 30, 45, 60, 90, 120];
const REMINDERS = [
  { value: 0, label: "No reminder" },
  { value: 5, label: "5 min before" },
  { value: 10, label: "10 min before" },
  { value: 15, label: "15 min before" },
  { value: 30, label: "30 min before" },
  { value: 60, label: "1 hour before" },
];

function priorityClasses(priority: Priority) {
  if (priority === "High") return "bg-destructive/10 text-destructive border-destructive/20";
  if (priority === "Medium") return "bg-warning/15 text-warning-foreground border-warning/30";
  return "bg-success/10 text-success border-success/25";
}

function Planner() {
  const { tasks, setTasks, schedule, setSchedule, scheduleTitle, setScheduleTitle, tone } =
    useSession();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [deadline, setDeadline] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [mode, setMode] = useState<MeetingMode>("Online");
  const [reminder, setReminder] = useState(15);
  const [range, setRange] = useState<"daily" | "weekly">("daily");

  const reminders = useTaskReminders(tasks);

  const runGenerate = useServerFn(generateSchedule);
  const mutation = useMutation({
    mutationFn: () =>
      runGenerate({
        data: {
          range,
          tone,
          tasks: tasks.map((task) => ({
            title: task.title,
            priority: task.priority,
            deadline: task.deadline,
            time: task.time,
            duration: task.duration,
            mode: task.mode,
          })),
        },
      }),
    onSuccess: (result) => {
      setScheduleTitle(result?.title ?? "");
      setSchedule(
        (result?.blocks ?? []).map((block) => ({
          id: newId(),
          time: block.time,
          activity: block.activity,
          priority: (PRIORITIES.includes(block.priority as Priority)
            ? block.priority
            : "Medium") as Priority,
          duration: Number.isFinite(block.duration) ? Math.round(block.duration) : 60,
          mode: (MODES.includes(block.mode as MeetingMode)
            ? block.mode
            : "Online") as MeetingMode,
          notes: block.notes,
        })),
      );
    },
  });

  const addTask = () => {
    if (!title.trim()) return;
    setTasks((prev) => [
      ...prev,
      { id: newId(), title: title.trim(), priority, deadline, time, duration, mode, reminder },
    ]);
    setTitle("");
    setDeadline("");
    setTime("");
    setPriority("Medium");
  };

  return (
    <AppShell title="AI Task Planner" description="Tasks in, editable schedule out">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add a task</CardTitle>
            <CardDescription>
              Title, priority, date and time, how long it takes, whether it is online or face to
              face, and when to be reminded.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
              onSubmit={(event) => {
                event.preventDefault();
                addTask();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="task-title">Task</Label>
                <Input
                  id="task-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Prepare Q3 board update"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-priority">Priority</Label>
                <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
                  <SelectTrigger id="task-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-deadline">Deadline</Label>
                <Input
                  id="task-deadline"
                  type="date"
                  value={deadline}
                  onChange={(event) => setDeadline(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-time">Start time</Label>
                <Input
                  id="task-time"
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-duration">Duration</Label>
                <Select
                  value={String(duration)}
                  onValueChange={(value) => setDuration(Number(value))}
                >
                  <SelectTrigger id="task-duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map((item) => (
                      <SelectItem key={item} value={String(item)}>
                        {item} min
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-mode">Format</Label>
                <Select value={mode} onValueChange={(value) => setMode(value as MeetingMode)}>
                  <SelectTrigger id="task-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-reminder">Reminder</Label>
                <Select
                  value={String(reminder)}
                  onValueChange={(value) => setReminder(Number(value))}
                >
                  <SelectTrigger id="task-reminder">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDERS.map((item) => (
                      <SelectItem key={item.value} value={String(item.value)}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end lg:col-span-4">
                <Button type="submit" className="w-full sm:w-auto">
                  <Plus /> Add task
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-base">Your tasks ({tasks.length})</CardTitle>
              <CardDescription>Edit inline or remove what no longer matters.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={range} onValueChange={(value) => setRange(value as "daily" | "weekly")}>
                <SelectTrigger className="w-[7.5rem]" aria-label="Schedule range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => mutation.mutate()}
                disabled={tasks.length === 0 || mutation.isPending}
              >
                <Sparkle /> {mutation.isPending ? "Generating…" : "Generate schedule"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-muted-foreground">
              {reminders.permission === "granted" ? (
                <>
                  <Bell className="size-4 text-success" />
                  <span>
                    Reminders on — {reminders.scheduledCount} upcoming. They only work while this
                    tab stays open.
                  </span>
                </>
              ) : reminders.permission === "unsupported" ? (
                <>
                  <BellOff className="size-4" />
                  <span>Reminders are not supported in this browser.</span>
                </>
              ) : reminders.permission === "denied" ? (
                <>
                  <BellOff className="size-4" />
                  <span>
                    Notifications are blocked. Allow them in your browser settings to get reminders.
                  </span>
                </>
              ) : (
                <>
                  <Bell className="size-4" />
                  <span>Turn on notifications to be reminded before a task starts.</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void reminders.requestPermission()}
                  >
                    Enable reminders
                  </Button>
                </>
              )}
            </div>
            {reminders.lastFired ? (
              <p className="rounded-lg border border-border bg-card px-3 py-2 text-xs">
                Latest reminder: {reminders.lastFired}
              </p>
            ) : null}
            {tasks.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                No tasks yet. Add a few above to generate a schedule.
              </p>
            ) : (
              <ul className="space-y-2">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="grid items-center gap-2 rounded-lg border border-border bg-surface p-2 sm:grid-cols-[1fr_8rem_9rem_auto]"
                  >
                    <Input
                      aria-label="Task title"
                      value={task.title}
                      onChange={(event) =>
                        setTasks((prev) =>
                          prev.map((item) =>
                            item.id === task.id ? { ...item, title: event.target.value } : item,
                          ),
                        )
                      }
                    />
                    <Select
                      value={task.priority}
                      onValueChange={(value) =>
                        setTasks((prev) =>
                          prev.map((item) =>
                            item.id === task.id ? { ...item, priority: value as Priority } : item,
                          ),
                        )
                      }
                    >
                      <SelectTrigger aria-label="Task priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      aria-label="Task deadline"
                      value={task.deadline}
                      onChange={(event) =>
                        setTasks((prev) =>
                          prev.map((item) =>
                            item.id === task.id ? { ...item, deadline: event.target.value } : item,
                          ),
                        )
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${task.title}`}
                      onClick={() => setTasks((prev) => prev.filter((item) => item.id !== task.id))}
                    >
                      <Trash2 />
                    </Button>
                    <div className="grid gap-2 sm:col-span-4 sm:grid-cols-4">
                      <Input
                        type="time"
                        aria-label="Task start time"
                        value={task.time}
                        onChange={(event) =>
                          setTasks((prev) =>
                            prev.map((item) =>
                              item.id === task.id ? { ...item, time: event.target.value } : item,
                            ),
                          )
                        }
                      />
                      <Select
                        value={String(task.duration)}
                        onValueChange={(value) =>
                          setTasks((prev) =>
                            prev.map((item) =>
                              item.id === task.id ? { ...item, duration: Number(value) } : item,
                            ),
                          )
                        }
                      >
                        <SelectTrigger aria-label="Task duration">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DURATIONS.map((item) => (
                            <SelectItem key={item} value={String(item)}>
                              {item} min
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={task.mode}
                        onValueChange={(value) =>
                          setTasks((prev) =>
                            prev.map((item) =>
                              item.id === task.id ? { ...item, mode: value as MeetingMode } : item,
                            ),
                          )
                        }
                      >
                        <SelectTrigger aria-label="Task format">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MODES.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={String(task.reminder)}
                        onValueChange={(value) =>
                          setTasks((prev) =>
                            prev.map((item) =>
                              item.id === task.id ? { ...item, reminder: Number(value) } : item,
                            ),
                          )
                        }
                      >
                        <SelectTrigger aria-label="Task reminder">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {REMINDERS.map((item) => (
                            <SelectItem key={item.value} value={String(item.value)}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {mutation.isError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {(mutation.error as Error).message}
          </p>
        ) : null}

        {schedule.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                <Input
                  aria-label="Schedule title"
                  value={scheduleTitle}
                  onChange={(event) => setScheduleTitle(event.target.value)}
                  className="h-9 border-transparent bg-transparent px-0 font-display text-base font-semibold shadow-none focus-visible:border-input focus-visible:px-3"
                />
              </CardTitle>
              <CardDescription>
                Every field is editable — adjust times, wording and priorities to suit your day.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {schedule.map((block) => (
                <div key={block.id} className="rounded-lg border border-border bg-surface p-3">
                  <div className="grid gap-2 sm:grid-cols-[9rem_1fr_7rem_7rem_9rem_auto]">
                    <Input
                      aria-label="Time"
                      value={block.time}
                      onChange={(event) =>
                        setSchedule((prev) =>
                          prev.map((item) =>
                            item.id === block.id ? { ...item, time: event.target.value } : item,
                          ),
                        )
                      }
                    />
                    <Input
                      aria-label="Activity"
                      value={block.activity}
                      onChange={(event) =>
                        setSchedule((prev) =>
                          prev.map((item) =>
                            item.id === block.id ? { ...item, activity: event.target.value } : item,
                          ),
                        )
                      }
                    />
                    <Select
                      value={block.priority}
                      onValueChange={(value) =>
                        setSchedule((prev) =>
                          prev.map((item) =>
                            item.id === block.id ? { ...item, priority: value as Priority } : item,
                          ),
                        )
                      }
                    >
                      <SelectTrigger
                        aria-label="Block priority"
                        className={priorityClasses(block.priority)}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={String(block.duration)}
                      onValueChange={(value) =>
                        setSchedule((prev) =>
                          prev.map((item) =>
                            item.id === block.id ? { ...item, duration: Number(value) } : item,
                          ),
                        )
                      }
                    >
                      <SelectTrigger aria-label="Block duration">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATIONS.map((item) => (
                          <SelectItem key={item} value={String(item)}>
                            {item} min
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={block.mode}
                      onValueChange={(value) =>
                        setSchedule((prev) =>
                          prev.map((item) =>
                            item.id === block.id ? { ...item, mode: value as MeetingMode } : item,
                          ),
                        )
                      }
                    >
                      <SelectTrigger aria-label="Block format">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MODES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove block"
                      onClick={() =>
                        setSchedule((prev) => prev.filter((item) => item.id !== block.id))
                      }
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  <Textarea
                    aria-label="Notes"
                    className="mt-2 min-h-[2.5rem] bg-card"
                    value={block.notes}
                    onChange={(event) =>
                      setSchedule((prev) =>
                        prev.map((item) =>
                          item.id === block.id ? { ...item, notes: event.target.value } : item,
                        ),
                      )
                    }
                  />
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() =>
                  setSchedule((prev) => [
                    ...prev,
                    {
                      id: newId(),
                      time: "",
                      activity: "",
                      priority: "Medium",
                      duration: 60,
                      mode: "Online",
                      notes: "",
                    },
                  ])
                }
              >
                <Plus /> Add block
              </Button>
              <AiDisclaimer />
            </CardContent>
          </Card>
        ) : (
          <AiDisclaimer />
        )}
      </div>
    </AppShell>
  );
}
