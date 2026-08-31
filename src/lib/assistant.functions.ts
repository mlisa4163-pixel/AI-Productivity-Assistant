import { createServerFn } from "@tanstack/react-start";
import { NoObjectGeneratedError, Output, streamText } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const MODEL = "google/gemini-3.7-flash";

const toneGuidance: Record<string, string> = {
  Concise: "Be brief: short phrases, no filler.",
  Balanced: "Be clear and moderately detailed.",
  Detailed: "Be thorough, with useful nuance and caveats.",
};

const PlannerInput = z.object({
  range: z.enum(["daily", "weekly"]),
  tone: z.string(),
  tasks: z.array(
    z.object({
      title: z.string(),
      priority: z.string(),
      deadline: z.string(),
    }),
  ),
});

const scheduleSchema = z.object({
  title: z.string(),
  blocks: z.array(
    z.object({
      time: z.string(),
      activity: z.string(),
      priority: z.string(),
      notes: z.string(),
    }),
  ),
});

const ResearchInput = z.object({
  topic: z.string(),
  tone: z.string(),
});

const researchSchema = z.object({
  summary: z.string(),
  insights: z.array(z.string()),
  risks: z.array(z.string()),
  recommendations: z.array(z.string()),
});

function getGateway() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured for this app.");
  return createLovableAiGatewayProvider(key);
}

function gatewayError(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  if (/402|credit/i.test(message)) {
    throw new Error("AI credits are exhausted for this workspace. Please add credits to continue.");
  }
  if (/429|rate limit/i.test(message)) {
    throw new Error("The AI service is rate limited right now. Please try again in a moment.");
  }
  if (/403/.test(message)) {
    throw new Error("AI access is blocked by workspace policy.");
  }
  throw new Error(message || "The AI request failed. Please try again.");
}

export const generateSchedule = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PlannerInput.parse(input))
  .handler(async ({ data }) => {
    const gateway = getGateway();
    const taskList = data.tasks
      .map((task) => `- ${task.title} (priority: ${task.priority}, due: ${task.deadline || "n/a"})`)
      .join("\n");

    try {
      const result = streamText({
        model: gateway(MODEL),
        output: Output.object({ schema: scheduleSchema }),
        system:
          "You are a workplace planning assistant. Build realistic, focused work schedules. " +
          "Front-load High priority work, respect deadlines, include short breaks and a review block. " +
          (toneGuidance[data.tone] ?? ""),
        prompt: [
          `Create a ${data.range} work schedule from these tasks:`,
          taskList,
          "",
          data.range === "daily"
            ? "Use clock time ranges within a normal workday, e.g. '09:00 - 10:30'. Aim for 6-9 blocks."
            : "Use day labels with a time hint, e.g. 'Monday morning'. Aim for 8-12 blocks across Monday to Friday.",
          "priority must be exactly one of: High, Medium, Low.",
          "notes: one short sentence of guidance. Keep every field plain text with no markdown.",
        ].join("\n"),
      });

      return await result.output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("The AI response could not be read as a schedule. Please try again.");
      }
      gatewayError(error);
    }
  });

export const generateResearch = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ResearchInput.parse(input))
  .handler(async ({ data }) => {
    const gateway = getGateway();

    try {
      const result = streamText({
        model: gateway(MODEL),
        output: Output.object({ schema: researchSchema }),
        system:
          "You are a workplace research assistant. Analyse the input and respond in clear business English. " +
          "Never fabricate statistics, sources or quotes; flag where verification is needed. " +
          (toneGuidance[data.tone] ?? ""),
        prompt: [
          "Analyse the following topic, question or article text.",
          "Return: a summary paragraph, key insights, risks or limitations, and recommended next actions.",
          "Aim for 3-6 items in each list. Plain text only, no markdown bullets or numbering.",
          "",
          data.topic,
        ].join("\n"),
      });

      return await result.output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("The AI response could not be read as research output. Please try again.");
      }
      gatewayError(error);
    }
  });
