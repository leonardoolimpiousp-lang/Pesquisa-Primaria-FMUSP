"use client";

import type { Question } from "@/lib/survey-types";
import { ContinueButton } from "./_shared";

/**
 * Nó de reflexão (insight) — exibe um texto e avança SEM gravar resposta
 * (CLAUDE.md / survey-types: o tipo `insight` não produz `answers`).
 */
export function InsightCard({
  question,
  onContinue,
}: {
  question: Question;
  onContinue: () => void;
}) {
  return (
    <div className="animate-question-enter flex w-full flex-col gap-6">
      <div className="flex flex-col gap-3">
        <span
          aria-hidden
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-2xl text-primary"
        >
          ✦
        </span>
        <p className="text-xl font-semibold leading-relaxed text-foreground">
          {question.text}
        </p>
        {question.helpText && (
          <p className="text-base leading-relaxed text-muted-foreground">
            {question.helpText}
          </p>
        )}
      </div>

      <ContinueButton onClick={onContinue} />
    </div>
  );
}
