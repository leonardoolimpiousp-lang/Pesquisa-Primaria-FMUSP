"use client";

import type { ReactNode } from "react";
import type { Question } from "@/lib/survey-types";

/** Enunciado + texto de apoio + slot de erro. Uma pergunta por tela. */
export function QuestionShell({
  question,
  error,
  children,
}: {
  question: Question;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="animate-question-enter flex w-full flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight text-foreground">
          {question.text}
          {question.required && (
            <span className="ml-1 align-super text-base text-primary">*</span>
          )}
        </h1>
        {question.helpText && (
          <p className="text-base leading-relaxed text-muted-foreground">
            {question.helpText}
          </p>
        )}
      </header>

      {children}

      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** Botão primário (Continuar / Enviar). Alvo de toque ≥ 44px. */
export function ContinueButton({
  children = "Continuar",
  disabled,
  onClick,
  type = "button",
}: {
  children?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="flex h-14 w-full items-center justify-center rounded-2xl bg-primary px-6 text-lg font-semibold text-primary-foreground transition-all hover:bg-primary-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
    >
      {children}
    </button>
  );
}
