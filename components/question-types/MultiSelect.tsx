"use client";

import { useState } from "react";
import type { Question } from "@/lib/survey-types";
import { ContinueButton, QuestionShell } from "./_shared";

/**
 * Múltipla escolha — cartões marcáveis + botão "Continuar" (NÃO auto-avança).
 * Salva SEMPRE como array JSON, nunca CSV (CLAUDE.md §5).
 */
export function MultiSelect({
  question,
  value,
  error,
  onSubmit,
}: {
  question: Question;
  value?: string[];
  error?: string | null;
  onSubmit: (value: string[]) => void;
}) {
  const options = [...(question.options ?? [])].sort((a, b) => a.order - b.order);
  const isChips = question.metadata?.display === "chips";
  const [selected, setSelected] = useState<string[]>(value ?? []);

  const toggle = (optValue: string) =>
    setSelected((prev) =>
      prev.includes(optValue)
        ? prev.filter((v) => v !== optValue)
        : [...prev, optValue],
    );

  if (isChips) {
    return (
      <QuestionShell question={question} error={error}>
        <div className="flex flex-wrap gap-2.5">
          {options.map((opt) => {
            const optValue = opt.value ?? opt.label;
            const isOn = selected.includes(optValue);
            return (
              <button
                key={opt.id}
                type="button"
                role="checkbox"
                aria-checked={isOn}
                onClick={() => toggle(optValue)}
                className={`flex min-h-[3rem] items-center gap-2 rounded-full border px-5 py-2.5 text-base font-semibold transition-all active:scale-[0.97] ${
                  isOn
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

        <ContinueButton
          disabled={question.required && selected.length === 0}
          onClick={() => onSubmit(selected)}
        />
      </QuestionShell>
    );
  }

  return (
    <QuestionShell question={question} error={error}>
      <div className="flex flex-col gap-3">
        {options.map((opt) => {
          const optValue = opt.value ?? opt.label;
          const isOn = selected.includes(optValue);
          return (
            <button
              key={opt.id}
              type="button"
              role="checkbox"
              aria-checked={isOn}
              onClick={() => toggle(optValue)}
              className={`flex min-h-[3.25rem] w-full items-center gap-3 rounded-2xl border px-5 py-4 text-left text-lg font-semibold transition-all active:scale-[0.98] ${
                isOn
                  ? "border-primary bg-primary-100 text-primary-900 shadow-sm"
                  : "border-border bg-muted text-foreground hover:border-primary-300"
              }`}
            >
              <span
                aria-hidden
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                  isOn ? "border-primary bg-primary" : "border-muted-foreground"
                }`}
              >
                {isOn && (
                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-white" fill="none">
                    <path
                      d="M4 10l4 4 8-8"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              {opt.emoji && <span className="text-xl">{opt.emoji}</span>}
              <span className="flex-1">{opt.label}</span>
            </button>
          );
        })}
      </div>

      <ContinueButton
        disabled={question.required && selected.length === 0}
        onClick={() => onSubmit(selected)}
      />
    </QuestionShell>
  );
}
