/**
 * Helpers de leitura/validação da DEFINIÇÃO do survey (`SurveySchema`).
 *
 * Responsabilidades:
 *  - achatar e ordenar perguntas (seções por `order`, perguntas por `order`);
 *  - resolver visibilidade por persona e por "gating" de branching;
 *  - validar uma resposta contra o tipo/required da pergunta.
 *
 * A decisão de "qual é a próxima pergunta" NÃO mora aqui — isso é exclusivo de
 * `lib/branching-engine.ts` (ver CLAUDE.md §3). Este módulo só descreve o estado.
 */

import type {
  AnswerValue,
  Question,
  SurveySchema,
} from "@/lib/survey-types";

/* -------------------------------------------------------------------------- */
/* ordenação e indexação                                                      */
/* -------------------------------------------------------------------------- */

/** Lista plana de perguntas na ordem canônica do fluxo. */
export function flattenQuestions(schema: SurveySchema): Question[] {
  return [...schema.sections]
    .sort((a, b) => a.order - b.order)
    .flatMap((section) =>
      [...section.questions].sort((a, b) => a.order - b.order),
    );
}

/** Mapa id -> pergunta, para lookups O(1) no engine e nos componentes. */
export function getQuestionMap(schema: SurveySchema): Map<string, Question> {
  const map = new Map<string, Question>();
  for (const q of flattenQuestions(schema)) map.set(q.id, q);
  return map;
}

/** Pergunta de entrada do fluxo: `startQuestionId` ou a primeira ordenada. */
export function getStartQuestion(schema: SurveySchema): Question | null {
  if (schema.startQuestionId) {
    const start = getQuestionMap(schema).get(schema.startQuestionId);
    if (start) return start;
  }
  return flattenQuestions(schema)[0] ?? null;
}

/* -------------------------------------------------------------------------- */
/* visibilidade                                                               */
/* -------------------------------------------------------------------------- */

/** `personas` vazio/ausente = visível para todas; caso contrário, precisa casar. */
export function questionVisibleForPersona(
  question: Question,
  persona: string | null,
): boolean {
  if (!question.personas || question.personas.length === 0) return true;
  if (!persona) return false;
  return question.personas.includes(persona);
}

/**
 * Conjunto de ids que só aparecem quando "revelados" por uma regra
 * `if_answer_includes.show_questions`. Ficam ocultos até o gatilho.
 */
export function getGatedQuestionIds(schema: SurveySchema): Set<string> {
  const gated = new Set<string>();
  for (const q of flattenQuestions(schema)) {
    for (const rule of q.branching ?? []) {
      if ("show_questions" in rule) {
        for (const id of rule.show_questions) gated.add(id);
      }
    }
  }
  return gated;
}

/* -------------------------------------------------------------------------- */
/* validação de resposta                                                      */
/* -------------------------------------------------------------------------- */

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmpty(value: AnswerValue | undefined | null): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false; // number (inclui 0, que é resposta válida em escala)
}

/** Valida uma resposta contra o tipo e o `required` da pergunta. */
export function validateAnswer(
  question: Question,
  value: AnswerValue | undefined | null,
): ValidationResult {
  if (isEmpty(value)) {
    return question.required
      ? { ok: false, error: "Esta pergunta é obrigatória." }
      : { ok: true };
  }

  switch (question.type) {
    case "multi_choice":
    case "emotional_grid":
    case "ranking":
      if (!Array.isArray(value)) {
        return { ok: false, error: "Resposta inválida (esperado lista)." };
      }
      return { ok: true };

    case "email":
      if (typeof value !== "string" || !EMAIL_RE.test(value.trim())) {
        return { ok: false, error: "Informe um e-mail válido." };
      }
      return { ok: true };

    case "whatsapp": {
      const digits = String(value).replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 13) {
        return { ok: false, error: "Informe um WhatsApp válido com DDD." };
      }
      return { ok: true };
    }

    case "scale":
    case "emotional_slider": {
      const n = Number(value);
      const { min, max } = question.scale ?? { min: 0, max: 0 };
      if (Number.isNaN(n) || n < min || n > max) {
        return { ok: false, error: `Selecione um valor entre ${min} e ${max}.` };
      }
      return { ok: true };
    }

    case "single_choice":
    case "yes_no":
      if (typeof value !== "string") {
        return { ok: false, error: "Selecione uma opção." };
      }
      return { ok: true };

    case "text":
      return { ok: true };

    default:
      return { ok: true };
  }
}
