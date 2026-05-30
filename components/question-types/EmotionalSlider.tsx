"use client";

import { useState } from "react";
import type { Question } from "@/lib/survey-types";
import { ContinueButton, QuestionShell } from "./_shared";

/**
 * Slider emocional — valor único com feedback de emoji. Usa `scale`
 * (min/max/step/labels) e `metadata.emojis` (emojis do min ao max).
 */
export function EmotionalSlider({
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
  const cfg = question.scale ?? { min: 0, max: 10 };
  const step = cfg.step && cfg.step > 0 ? cfg.step : 1;
  const mid = Math.round((cfg.min + cfg.max) / 2);

  const [current, setCurrent] = useState<number>(value ?? mid);

  const emojis = Array.isArray(question.metadata?.emojis)
    ? (question.metadata.emojis as string[])
    : [];
  const ratio = cfg.max === cfg.min ? 0 : (current - cfg.min) / (cfg.max - cfg.min);
  const emoji = emojis.length
    ? emojis[Math.min(emojis.length - 1, Math.round(ratio * (emojis.length - 1)))]
    : null;

  return (
    <QuestionShell question={question} error={error}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2">
          {emoji && <span className="text-6xl leading-none">{emoji}</span>}
          <span className="text-3xl font-bold text-primary">{current}</span>
        </div>

        <input
          type="range"
          min={cfg.min}
          max={cfg.max}
          step={step}
          value={current}
          onChange={(e) => setCurrent(Number(e.target.value))}
          className="h-3 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
          style={{
            background: `linear-gradient(to right, var(--primary, #006747) ${
              ratio * 100
            }%, var(--muted, #e5e7eb) ${ratio * 100}%)`,
          }}
        />

        {(cfg.labels?.min || cfg.labels?.max) && (
          <div className="flex justify-between text-sm font-medium text-muted-foreground">
            <span>{cfg.labels?.min}</span>
            <span>{cfg.labels?.max}</span>
          </div>
        )}
      </div>

      <ContinueButton onClick={() => onSubmit(current)} />
    </QuestionShell>
  );
}
