import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Priority = "High" | "Medium" | "Low";

export type MeetingMode = "Online" | "Face to face";

export type Task = {
  id: string;
  title: string;
  priority: Priority;
  deadline: string;
  /** Start time, "HH:MM". */
  time: string;
  /** Duration in minutes. */
  duration: number;
  mode: MeetingMode;
  /** Minutes before the start time to remind, or 0 for no reminder. */
  reminder: number;
};

export type ScheduleBlock = {
  id: string;
  time: string;
  activity: string;
  priority: Priority;
  duration: number;
  mode: MeetingMode;
  notes: string;
};

export type ResponseTone = "Concise" | "Balanced" | "Detailed";

export const newId = () => Math.random().toString(36).slice(2, 10);

type SessionValue = {
  tasks: Task[];
  setTasks: (next: Task[] | ((prev: Task[]) => Task[])) => void;
  schedule: ScheduleBlock[];
  setSchedule: (next: ScheduleBlock[] | ((prev: ScheduleBlock[]) => ScheduleBlock[])) => void;
  scheduleTitle: string;
  setScheduleTitle: (value: string) => void;
  tone: ResponseTone;
  setTone: (value: ResponseTone) => void;
  chatDraft: string;
  setChatDraft: (value: string) => void;
  researchCount: number;
  bumpResearchCount: () => void;
  clearSession: () => void;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedule, setSchedule] = useState<ScheduleBlock[]>([]);
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [tone, setTone] = useState<ResponseTone>("Balanced");
  const [chatDraft, setChatDraft] = useState("");
  const [researchCount, setResearchCount] = useState(0);

  const value = useMemo<SessionValue>(
    () => ({
      tasks,
      setTasks,
      schedule,
      setSchedule,
      scheduleTitle,
      setScheduleTitle,
      tone,
      setTone,
      chatDraft,
      setChatDraft,
      researchCount,
      bumpResearchCount: () => setResearchCount((count) => count + 1),
      clearSession: () => {
        setTasks([]);
        setSchedule([]);
        setScheduleTitle("");
        setChatDraft("");
        setResearchCount(0);
      },
    }),
    [tasks, schedule, scheduleTitle, tone, chatDraft, researchCount],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside SessionProvider");
  return context;
}
