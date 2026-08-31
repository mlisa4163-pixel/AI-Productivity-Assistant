import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import {
  createLovableAiGatewayProvider,
  getLovableAiGatewayResponseHeaders,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai-gateway.server";

type ChatRequestBody = { messages?: unknown; tone?: unknown };

const toneGuidance: Record<string, string> = {
  Concise: "Keep answers tight: short paragraphs and bullet points only.",
  Balanced: "Keep answers clear and moderately detailed.",
  Detailed: "Give thorough answers with structure, examples and caveats.",
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, tone } = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) {
          return new Response("AI is not configured for this app.", { status: 500 });
        }

        const initialRunId = getLovableAiGatewayRunId(request);
        const gateway = createLovableAiGatewayProvider(key, initialRunId);

        const result = streamText({
          model: gateway("google/gemini-3.7-flash"),
          system: [
            "You are a professional workplace productivity assistant used inside a company.",
            "Help with planning, prioritisation, meetings, email drafting, research and problem solving.",
            "Be practical and structured. Use markdown headings and bullet lists where useful.",
            "Never invent facts, figures or citations; say clearly when something needs verification.",
            typeof tone === "string" ? (toneGuidance[tone] ?? toneGuidance["Balanced"]) : "",
          ]
            .filter(Boolean)
            .join(" "),
          messages: await convertToModelMessages(messages as UIMessage[]),
          abortSignal: request.signal,
        });

        const response = result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
          headers: getLovableAiGatewayResponseHeaders(undefined, {
            ...(initialRunId ? { "X-Lovable-AIG-Run-ID": initialRunId } : {}),
          }),
        });

        return withLovableAiGatewayRunIdHeader(response, gateway);
      },
    },
  },
});
