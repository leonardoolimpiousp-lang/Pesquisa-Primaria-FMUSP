"use client";

import { useEffect, useRef, useState } from "react";
import type { Question } from "@/lib/survey-types";
import { QuestionShell } from "./_shared";

/**
 * Escolha única — pills de largura total. AUTO-AVANÇA ao selecionar
 * (DESIGN_SYSTEM §5), com um breve destaque (~200ms) para o usuário PERCEBER a
 * escolha antes da transição. Também atende `yes_no` (Sim/Não no schema).
 */
export function SingleChoice({
  question,
  value,
  error,
  onSubmit,
}: {
  question: Question;
  value?: string;
  error?: string | null;
  onSubmit: (value: string) => void;
}) {
  const options = [...(question.options ?? [])].sort((a, b) => a.order - b.order);
  const isChips = question.metadata?.display === "chips";

  // Destaque transitório da opção tocada antes de avançar.
  const [picked, setPicked] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const choose = (optValue: string) => {
    if (picked) return; // evita duplo toque durante a transição
    setPicked(optValue);
    timer.current = setTimeout(() => onSubmit(optValue), 200);
  };

  const stateOf = (optValue: string) => picked === optValue || (!picked && value === optValue);

  if (isChips) {
    return (
      <QuestionShell question={question} error={error}>
        <div role="radiogroup" className="flex flex-wrap gap-2.5">
          {options.map((opt) => {
            const optValue = opt.value ?? opt.label;
            const selected = stateOf(optValue);
            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => choose(optValue)}
                className={`flex min-h-[3rem] items-center gap-2 rounded-full border px-5 py-2.5 text-base font-semibold transition-all active:scale-[0.97] ${
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted text-foreground hover:border-primary-300"
                }`}
              >
                {opt.emoji && <span className="text-lg">{opt.emoji}</span>}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </QuestionShell>
    );
  }

  return (
    <QuestionShell question={question} error={error}>
      <div role="radiogroup" className="flex flex-col gap-3">
        {options.map((opt) => {
          const optValue = opt.value ?? opt.label;
          const selected = stateOf(optValue);
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => choose(optValue)}
              className={`flex min-h-[3.25rem] w-full items-center gap-3 rounded-2xl border px-5 py-4 text-left text-lg font-semibold transition-all active:scale-[0.98] ${
                selected
                  ? "border-primary bg-primary-100 text-primary-900 shadow-sm"
                  : "border-border bg-muted text-foreground hover:border-primary-300"
              }`}
            >
              <span
                aria-hidden
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  selected ? "border-primary" : "border-muted-foreground"
                }`}
              >
                {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
              </span>
              {opt.emoji && <span className="text-xl">{opt.emoji}</span>}
              <span className="flex-1">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </QuestionShell>
  );
}
