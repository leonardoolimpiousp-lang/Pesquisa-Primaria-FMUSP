"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Question } from "@/lib/survey-types";
import { ContinueButton, QuestionShell } from "./_shared";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Schema Zod derivado do tipo da pergunta (text | email | whatsapp). */
function buildSchema(question: Question) {
  // base com required primeiro (ZodString); refine (ZodEffects) vem por último.
  const base = question.required
    ? z.string().trim().min(1, { message: "Esta pergunta é obrigatória." })
    : z.string().trim();

  let field: z.ZodType<string> = base;

  if (question.type === "email") {
    field = base.refine((v) => v === "" || EMAIL_RE.test(v), {
      message: "Informe um e-mail válido.",
    });
  } else if (question.type === "whatsapp") {
    field = base.refine(
      (v) => {
        if (v === "") return true;
        const d = v.replace(/\D/g, "");
        return d.length >= 10 && d.length <= 13;
      },
      { message: "Informe um WhatsApp válido com DDD." },
    );
  }

  return z.object({ value: field });
}

type FormValues = { value: string };

const inputModeByType: Record<string, React.HTMLAttributes<HTMLInputElement>["inputMode"]> = {
  email: "email",
  whatsapp: "tel",
  text: "text",
};

/** Texto livre / e-mail / WhatsApp — React Hook Form + Zod. */
export function TextQuestion({
  question,
  value,
  onSubmit,
}: {
  question: Question;
  value?: string;
  onSubmit: (value: string) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(buildSchema(question)) as Resolver<FormValues>,
    defaultValues: { value: value ?? "" },
    mode: "onSubmit",
  });

  const isLongText = question.type === "text";

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data.value.trim()))}>
      <QuestionShell question={question} error={errors.value?.message}>
        {isLongText ? (
          <textarea
            {...register("value")}
            rows={4}
            autoFocus
            placeholder="Escreva aqui…"
            className="w-full resize-none rounded-2xl border border-border bg-muted px-5 py-4 text-lg text-foreground outline-none transition-colors focus:border-primary"
          />
        ) : (
          <input
            {...register("value")}
            type={question.type === "email" ? "email" : "text"}
            inputMode={inputModeByType[question.type] ?? "text"}
            autoFocus
            placeholder={question.type === "email" ? "voce@exemplo.com" : "(11) 99999-9999"}
            className="h-14 w-full rounded-2xl border border-border bg-muted px-5 text-lg text-foreground outline-none transition-colors focus:border-primary"
          />
        )}

        <ContinueButton type="submit" />
      </QuestionShell>
    </form>
  );
}
