import { useCallback, useEffect, useRef, useState } from "react";

import type { Task } from "@/lib/session-store";

type Permission = "unsupported" | "default" | "granted" | "denied";

export function taskStartAt(task: Task) {
  if (!task.deadline || !task.time) return null;
  const start = new Date(`${task.deadline}T${task.time}`);
  return Number.isNaN(start.getTime()) ? null : start;
}

export function reminderAt(task: Task) {
  const start = taskStartAt(task);
  if (!start || !task.reminder) return null;
  return new Date(start.getTime() - task.reminder * 60_000);
}

/**
 * Schedules in-browser reminder notifications for tasks that have a date, a
 * start time and a reminder lead time. Nothing is stored — reminders only live
 * for as long as the page stays open.
 */
export function useTaskReminders(tasks: Task[]) {
  const [permission, setPermission] = useState<Permission>("default");
  const [lastFired, setLastFired] = useState<string | null>(null);
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as Permission);
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result as Permission);
  }, []);

  useEffect(() => {
    if (permission !== "granted") return;

    const timers = tasks.flatMap((task) => {
      const due = reminderAt(task);
      if (!due) return [];
      const delay = due.getTime() - Date.now();
      const key = `${task.id}-${due.getTime()}`;
      if (delay <= 0 || delay > 24 * 60 * 60 * 1000 || firedRef.current.has(key)) return [];

      const timer = window.setTimeout(() => {
        firedRef.current.add(key);
        const start = taskStartAt(task);
        const when = start
          ? start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "";
        const body = `Starts ${when} · ${task.duration} min · ${task.mode}`;
        try {
          new Notification(task.title, { body });
        } catch {
          /* notification could not be shown */
        }
        setLastFired(`${task.title} — ${body}`);
      }, delay);

      return [timer];
    });

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [tasks, permission]);

  const scheduledCount = tasks.filter((task) => {
    const due = reminderAt(task);
    return Boolean(due && due.getTime() > Date.now());
  }).length;

  return { permission, requestPermission, scheduledCount, lastFired };
}
