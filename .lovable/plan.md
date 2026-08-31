# AI Workplace Productivity Assistant

A frontend-only SaaS-style dashboard with three real AI features, powered by Lovable AI. No database, no accounts, no persistence — state lives in memory and resets on refresh.

## First step after approval

I'll generate 3 rendered design directions (light, minimal, professional SaaS) for you to pick from, then build the whole app in the chosen direction.

## Layout

Persistent sidebar (collapsible drawer on mobile) with: Dashboard, AI Task Planner, AI Research Assistant, AI Chatbot, Prompt Library, Settings. Each is its own page/route so links are shareable and each gets its own title/description.

## Pages

**Dashboard** — welcome header, quick-stat cards (tasks added, priority breakdown), quick-action cards linking into the three AI tools, and the Responsible AI disclaimer.

**AI Task Planner**
- Form: task title, priority (High / Medium / Low), deadline.
- Task list with edit/delete, priority badges.
- "Generate schedule" with Daily / Weekly toggle → AI returns a time-blocked schedule.
- Generated schedule is fully editable inline (edit block text/time, remove blocks, add a block).

**AI Research Assistant**
- Input: topic, question, or pasted article text.
- AI returns four labelled sections: Summary, Key Insights, Risks, Recommendations.
- Each section is editable in place, with copy-to-clipboard.

**AI Chatbot**
- Professional chat transcript with streaming responses and a "Thinking…" state.
- Suggested prompt chips on the empty state (workplace-oriented).
- Markdown-rendered assistant replies; conversation held in memory for the session.

**Prompt Library**
- Cards grouped by category: Daily planning, Meeting preparation, Email improvement, Research, Problem solving, Weekly review.
- Each prompt has Copy and "Use in Chatbot" (prefills the composer).

**Settings** — appearance/theme toggle, response tone/length preference applied to prompts, "Clear session data" button, and the Responsible AI notice. All in-memory only.

## Responsible AI disclaimer

Short, consistent notice near every AI output and on the Dashboard/Settings: AI outputs may contain errors and should be reviewed before use in important workplace decisions.

## Technical notes

- AI calls run through small server-side endpoints so the API key is never exposed: a streaming chat route for the chatbot, and server functions for the planner and research assistant. These are stateless — no database, no auth, no stored data.
- Model: Gemini 3.7 Flash via Lovable AI, streaming; planner and research return structured sections that map onto editable UI fields.
- Chat UI built from AI Elements primitives (conversation, message, prompt input) for correct streaming/scroll behaviour.
- All app state is React state; refresh clears everything, as requested.
- Design tokens from the chosen direction go into the project's theme (semantic tokens only, no hardcoded colors), responsive from 320px up, keyboard-accessible controls and labelled inputs.
- Gateway errors (rate limit, credits) surface as clear inline messages rather than fake AI replies.
