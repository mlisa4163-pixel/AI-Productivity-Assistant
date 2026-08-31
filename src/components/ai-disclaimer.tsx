import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function AiDisclaimer({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs leading-relaxed text-muted-foreground",
        className,
      )}
    >
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>
        <span className="font-medium text-foreground">Responsible AI:</span> AI outputs may contain
        errors or omissions. Review and verify them before using them for important workplace
        decisions.
      </span>
    </p>
  );
}
