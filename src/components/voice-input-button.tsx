import { Loader2, Mic, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  state: "idle" | "recording" | "transcribing";
  onToggle: () => void;
  className?: string;
  disabled?: boolean;
};

export function VoiceInputButton({ state, onToggle, className, disabled }: Props) {
  const label =
    state === "recording"
      ? "Stop recording"
      : state === "transcribing"
        ? "Transcribing recording"
        : "Record with microphone";

  return (
    <Button
      type="button"
      variant={state === "recording" ? "destructive" : "outline"}
      size="icon-sm"
      aria-label={label}
      title={label}
      onClick={onToggle}
      disabled={disabled || state === "transcribing"}
      className={cn(state === "recording" && "animate-pulse", className)}
    >
      {state === "recording" ? (
        <Square />
      ) : state === "transcribing" ? (
        <Loader2 className="animate-spin" />
      ) : (
        <Mic />
      )}
    </Button>
  );
}
