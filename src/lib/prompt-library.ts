export type PromptCategory = {
  id: string;
  name: string;
  blurb: string;
  prompts: { title: string; body: string }[];
};

export const PROMPT_LIBRARY: PromptCategory[] = [
  {
    id: "daily-planning",
    name: "Daily planning",
    blurb: "Start the day with a realistic plan",
    prompts: [
      {
        title: "Plan my working day",
        body: "Here are my tasks for today: [list tasks with priorities and deadlines]. Build a realistic schedule between 09:00 and 17:00, front-loading the highest-priority work, including short breaks and a 15-minute end-of-day review. Flag anything that will not fit.",
      },
      {
        title: "Triage an overloaded list",
        body: "I have more work than time today: [list tasks]. Sort them into Do now, Schedule, Delegate and Drop, and explain the reasoning for each in one sentence.",
      },
    ],
  },
  {
    id: "meeting-prep",
    name: "Meeting preparation",
    blurb: "Walk in prepared, leave with decisions",
    prompts: [
      {
        title: "Build a meeting agenda",
        body: "I have a [duration] meeting with [attendees] about [topic]. Draft a focused agenda with time boxes, the decisions we need to reach, and three questions I should be ready to answer.",
      },
      {
        title: "Prepare for a difficult conversation",
        body: "I need to discuss [issue] with [role]. Outline my key points, the likely objections, a neutral opening line, and a suggested outcome to aim for.",
      },
    ],
  },
  {
    id: "email",
    name: "Email improvement",
    blurb: "Clearer, shorter, more professional",
    prompts: [
      {
        title: "Improve a draft email",
        body: "Improve this email for a professional audience. Keep my meaning, make it shorter and clearer, and use a polite but direct tone. Return the revised email plus a one-line note on what you changed.\n\n[paste email]",
      },
      {
        title: "Reply to a difficult message",
        body: "Draft a calm, professional reply to this message. Acknowledge the concern, state what we will do next, and avoid over-apologising.\n\n[paste message]",
      },
    ],
  },
  {
    id: "research",
    name: "Research",
    blurb: "Understand a topic quickly and honestly",
    prompts: [
      {
        title: "Brief me on a topic",
        body: "Give me a working brief on [topic]: a short summary, the five things I most need to know, common misconceptions, and what I should verify with a primary source before relying on it.",
      },
      {
        title: "Summarise an article",
        body: "Summarise the text below in one paragraph, then list key insights, risks or limitations, and recommended next actions. Do not add facts that are not in the text.\n\n[paste article]",
      },
    ],
  },
  {
    id: "problem-solving",
    name: "Problem solving",
    blurb: "Structure the problem before solving it",
    prompts: [
      {
        title: "Break down a problem",
        body: "Help me structure this problem: [describe problem]. Restate it clearly, list the underlying causes you can infer, propose three options with trade-offs, and recommend one with the reasoning.",
      },
      {
        title: "Pressure-test my plan",
        body: "Here is my plan: [describe plan]. Challenge it. Identify the weakest assumptions, what could fail first, and the cheapest way to test the riskiest part.",
      },
    ],
  },
  {
    id: "weekly-review",
    name: "Weekly review",
    blurb: "Close the week and set up the next",
    prompts: [
      {
        title: "Run my weekly review",
        body: "Here is what I did this week: [list]. Here is what is outstanding: [list]. Summarise progress, highlight what slipped and why, and propose three priorities for next week.",
      },
      {
        title: "Write a status update",
        body: "Turn these notes into a concise weekly status update for my manager: progress, blockers, decisions needed, and next week's focus. Keep it under 200 words.\n\n[paste notes]",
      },
    ],
  },
];
