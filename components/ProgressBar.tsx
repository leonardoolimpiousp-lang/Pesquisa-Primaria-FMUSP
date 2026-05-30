"use client";

import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useSurveyStore } from "@/lib/survey-store";

/**
 * Barra de progresso no topo. Clique abre um sumário com as seções/perguntas
 * visíveis, navegáveis (DESIGN_SYSTEM §4). Trilho cinza, preenchimento primary.
 */
export function ProgressBar() {
  const [open, setOpen] = useState(false);
  const progress = useSurveyStore(useShallow((s) => s.getProgress()));
  const visible = useSurveyStore(useShallow((s) => s.getVisibleQuestions()));
  const currentId = useSurveyStore((s) => s.currentQuestionId);
  const answers = useSurveyStore((s) => s.answers);
  const goToQuestion = useSurveyStore((s) => s.goToQuestion);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir sumário do questionário"
        className="flex w-full flex-col gap-1.5"
      >
        <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
          <span>
            {progress.total > 0 ? `${progress.index + 1} de ${progress.total}` : "—"}
          </span>
          <span>{Math.round(progress.ratio * 100)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${progress.ratio * 100}%` }}
          />
        </div>
      </button>

      {open && (
        <ul className="mt-3 max-h-64 overflow-y-auto rounded-2xl border border-border bg-background p-2">
          {visible.map((q, i) => {
            const answered = q.id in answers;
            const isCurrent = q.id === currentId;
            // Só permite voltar a perguntas já respondidas ou à atual.
            const reachable = answered || isCurrent;
            return (
              <li key={q.id}>
                <button
                  type="button"
                  disabled={!reachable}
                  onClick={() => {
                    if (!reachable) return;
                    goToQuestion(q.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    isCurrent
                      ? "bg-primary-100 font-semibold text-primary-900"
                      : reachable
                        ? "text-foreground hover:bg-muted"
                        : "cursor-default text-muted-foreground/50"
                  }`}
                >
                  <span className="w-5 shrink-0 tabular-nums">{i + 1}.</span>
                  <span className="flex-1 truncate">{q.text}</span>
                  {answered && !isCurrent && <span className="text-primary">✓</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
