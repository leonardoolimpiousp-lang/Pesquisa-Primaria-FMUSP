"use client";

import { useSurveyStore } from "@/lib/survey-store";

/**
 * Indicador discreto do autosave (DESIGN_SYSTEM §5). Mostra "salvando…",
 * "salvo" ou erro de rede com opção de... silêncio quando ocioso.
 */
export function SaveIndicator() {
  const saveStatus = useSurveyStore((s) => s.saveStatus);

  if (saveStatus === "idle") return null;

  const map = {
    saving: { label: "Salvando…", cls: "text-muted-foreground", dot: "bg-muted-foreground animate-pulse" },
    saved: { label: "Salvo", cls: "text-primary", dot: "bg-primary" },
    error: { label: "Sem conexão — tentando de novo", cls: "text-destructive", dot: "bg-destructive" },
  } as const;

  const s = map[saveStatus];

  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-medium ${s.cls}`}
      role="status"
      aria-live="polite"
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      <span>{s.label}</span>
    </div>
  );
}
