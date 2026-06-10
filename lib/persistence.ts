"use server";

/**
 * Camada de persistência das RESPOSTAS (Response Layer).
 *
 * Server Actions chamadas pelo store via `configurePersistence` /
 * `configureFinalize` (wiring em `components/PersistenceProvider.tsx`).
 *
 * Regras (CLAUDE.md §3/§5):
 *  - autosave por pergunta -> upsert em `answers` (uma linha por pergunta).
 *  - `responses` criado/atualizado por `session_id` (retomada de sessão).
 *  - multiselect/scale/estruturado -> `answer_json` (array JSON, nunca CSV);
 *    string simples também espelhada em `answer_text` para leitura fácil.
 *  - PII (e-mail/whatsapp/linkedin) só na finalização, com opt-in (LGPD §6).
 */

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { answers, responses } from "@/db/schema";

type AnswerValue = string | number | string[];

export interface PersistAnswerInput {
  sessionId: string;
  surveyVersionId: string;
  personaId: string | null;
  questionId: string;
  value: AnswerValue;
}

export interface FinalizeInput {
  sessionId: string;
  surveyVersionId: string;
  isAnonymous: boolean;
  email?: string;
  whatsapp?: string;
  linkedin?: string;
}

/** Garante a linha `responses` da sessão e retorna seu id. */
async function ensureResponse(
  sessionId: string,
  surveyVersionId: string,
  personaId: string | null,
): Promise<string> {
  const [row] = await db
    .insert(responses)
    .values({ sessionId, surveyVersionId, personaId })
    .onConflictDoUpdate({
      target: responses.sessionId,
      set: { surveyVersionId },
    })
    .returning({ id: responses.id });
  return row.id;
}

/** Upsert de uma resposta individual (autosave por pergunta). */
export async function persistAnswerAction(input: PersistAnswerInput): Promise<void> {
  const responseId = await ensureResponse(
    input.sessionId,
    input.surveyVersionId,
    input.personaId,
  );

  const answerText = typeof input.value === "string" ? input.value : null;

  await db
    .insert(answers)
    .values({
      responseId,
      questionId: input.questionId,
      answerText,
      answerJson: input.value,
    })
    .onConflictDoUpdate({
      target: [answers.responseId, answers.questionId],
      set: { answerText, answerJson: input.value, createdAt: new Date() },
    });
}

/** Finaliza a resposta: completed_at + anonimato/contato (opt-in LGPD). */
export async function finalizeResponseAction(input: FinalizeInput): Promise<void> {
  await ensureResponse(input.sessionId, input.surveyVersionId, null);

  await db
    .update(responses)
    .set({
      completedAt: new Date(),
      isAnonymous: input.isAnonymous,
      contactEmail: input.isAnonymous ? null : input.email ?? null,
      whatsapp: input.isAnonymous ? null : input.whatsapp ?? null,
      contactLinkedin: input.isAnonymous ? null : input.linkedin ?? null,
    })
    .where(eq(responses.sessionId, input.sessionId));
}
