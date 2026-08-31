import { useChat } from "@ai-sdk/react";
import { createFileRoute } from "@tanstack/react-router";
import { DefaultChatTransport } from "ai";
import { useState } from "react";

import { AiDisclaimer } from "@/components/ai-disclaimer";
import { AppShell } from "@/components/app-shell";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session-store";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Chatbot — Workplace AI" },
      {
        name: "description",
        content:
          "A professional workplace chat assistant with suggested prompts for planning, writing and decision support.",
      },
      { property: "og:title", content: "AI Chatbot — Workplace AI" },
      {
        property: "og:description",
        content: "Ask work questions and get practical, professional answers.",
      },
    ],
  }),
  component: Chat,
});

const SUGGESTIONS = [
  "Help me plan a focused morning around two deadlines",
  "Draft an agenda for a 30-minute project kickoff",
  "Rewrite this update to be shorter and clearer",
  "What questions should I ask before agreeing to this deadline?",
];

function Chat() {
  const { tone, chatDraft, setChatDraft } = useSession();
  const [error, setError] = useState<string | null>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (chatError) => setError(chatError.message),
  });

  const isBusy = status === "submitted" || status === "streaming";

  const send = (text: string) => {
    if (!text.trim() || isBusy) return;
    setError(null);
    void sendMessage({ text: text.trim() }, { body: { tone } });
    setChatDraft("");
  };

  return (
    <AppShell title="AI Chatbot" description="A workplace assistant for everyday thinking">
      <div className="flex h-[calc(100vh-11rem)] min-h-[30rem] flex-col gap-4">
        <div className="flex-1 overflow-hidden rounded-xl border border-border bg-card">
          <Conversation className="h-full">
            <ConversationContent className="mx-auto max-w-3xl">
              {messages.length === 0 ? (
                <ConversationEmptyState
                  title="What are you working on?"
                  description="Start with a suggestion below or ask anything about your work."
                />
              ) : (
                messages.map((message) => (
                  <Message key={message.id} from={message.role}>
                    <MessageContent>
                      {message.parts.map((part, index) =>
                        part.type === "text" ? (
                          <MessageResponse key={index}>{part.text}</MessageResponse>
                        ) : null,
                      )}
                    </MessageContent>
                  </Message>
                ))
              )}
              {status === "submitted" ? <Shimmer>Thinking…</Shimmer> : null}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        </div>

        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="mx-auto w-full max-w-3xl space-y-3">
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                className="h-auto whitespace-normal py-1.5 text-left text-xs font-normal"
                onClick={() => send(suggestion)}
                disabled={isBusy}
              >
                {suggestion}
              </Button>
            ))}
          </div>

          <PromptInput
            onSubmit={(_message, event) => {
              event.preventDefault();
              send(chatDraft);
            }}
          >
            <PromptInputTextarea
              value={chatDraft}
              onChange={(event) => setChatDraft(event.target.value)}
              placeholder="Ask about planning, writing, research or decisions…"
            />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit status={status} disabled={!chatDraft.trim() && !isBusy} />
            </PromptInputFooter>
          </PromptInput>

          <AiDisclaimer />
        </div>
      </div>
    </AppShell>
  );
}
