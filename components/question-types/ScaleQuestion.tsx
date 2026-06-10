"use client";

import { useState } from "react";
import type { Question } from "@/lib/survey-types";
import { ContinueButton, QuestionShell } from "./_shared";

/** Escala (Likert / numérica) — segmentos. Seleção + "Continuar". */
export function ScaleQuestion({
  question,
  value,
  error,
  onSubmit,
}: {
  question: Question;
  value?: number;
  error?: string | null;
  onSubmit: (value: number) => void;
}) {
  const cfg = question.scale ?? { min: 1, max: 5 };
  const step = cfg.step && cfg.step > 0 ? cfg.step : 1;
  const points: number[] = [];
  for (let v = cfg.min; v <= cfg.max; v += step) points.push(v);

  const [selected, setSelected] = useState<number | null>(value ?? null);

  return (
    <QuestionShell question={question} error={error}>
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          {points.map((p) => {
            const on = selected === p;
            return (
              <button
                key={p}
                type="button"
                aria-pressed={on}
                onClick={() => setSelected(p)}
                className={`flex h-14 flex-1 items-center justify-center rounded-2xl border text-lg font-semibold transition-all active:scale-[0.96] ${
                  on
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted text-foreground hover:border-primary-300"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
        {(cfg.labels?.min || cfg.labels?.max) && (
          <div className="flex justify-between text-sm font-medium text-muted-foreground">
            <span>{cfg.labels?.min}</span>
            <span>{cfg.labels?.max}</span>
          </div>
        )}
      </div>

      <ContinueButton
        disabled={question.required && selected === null}
        onClick={() => selected !== null && onSubmit(selected)}
      />
    </QuestionShell>
  );
}
