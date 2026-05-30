"use client";

import { useState } from "react";
import type { Question } from "@/lib/survey-types";
import { ContinueButton, QuestionShell } from "./_shared";

/**
 * Grade emocional (check-in) — multi-seleção de emoções em grid de chips com
 * emoji. Salva SEMPRE como array JSON, nunca CSV (CLAUDE.md §5).
 */
export function EmotionalGrid({
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
  const [selected, setSelected] = useState<string[]>(value ?? []);

  const toggle = (optValue: string) =>
    setSelected((prev) =>
      prev.includes(optValue)
        ? prev.filter((v) => v !== optValue)
        : [...prev, optValue],
    );

  return (
    <QuestionShell question={question} error={error}>
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => {
          const optValue = opt.value ?? opt.label;
          const isOn = selected.includes(optValue);
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={isOn}
              onClick={() => toggle(optValue)}
              className={`flex min-h-[5rem] flex-col items-center justify-center gap-1.5 rounded-2xl border px-3 py-4 text-center text-base font-semibold transition-colors ${
                isOn
                  ? "border-primary bg-primary-100 text-primary-900"
                  : "border-border bg-muted text-foreground hover:border-primary-300"
              }`}
            >
              {opt.emoji && <span className="text-2xl leading-none">{opt.emoji}</span>}
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
