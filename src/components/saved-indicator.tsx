import { Cloud } from "lucide-react";

import { cn } from "@/lib/utils";

/** Formata um timestamp como HH:MM (pt-BR). */
export function formatSavedTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface SavedIndicatorProps {
  /** Timestamp do último autosave; `null` esconde o indicador. */
  savedAt: number | null;
  className?: string;
}

/**
 * Indicador discreto de rascunho salvo automaticamente ("salvo 11:02").
 * Usado no cabeçalho das telas de preenchimento longo.
 */
export function SavedIndicator({ savedAt, className }: SavedIndicatorProps) {
  if (!savedAt) return null;
  const hora = formatSavedTime(savedAt);

  return (
    <span
      role="status"
      aria-live="polite"
      title={`Rascunho salvo às ${hora}`}
      className={cn(
        "hidden md:flex items-center gap-1.5 text-xs text-muted-foreground mr-1",
        className,
      )}
    >
      <Cloud className="h-3.5 w-3.5" aria-hidden />
      salvo {hora}
    </span>
  );
}
