/**
 * Branching engine — fonte única de "qual é a próxima pergunta".
 *
 * Regra de ouro (CLAUDE.md §3): NENHUM if/else de fluxo espalhado pelos
 * componentes. Tudo passa por `getNextQuestion()`.
 *
 * Dois sabores de regra (ver `BranchingRule` em survey-types.ts):
 *   - `if_answer_equals` -> SALTO: muda o destino imediato da navegação.
 *   - `if_answer_includes` -> REVELAÇÃO: destrava perguntas "gated" que de
 *     outro modo ficariam ocultas (não muda o destino imediato por si só).
 */

import type {
  AnswerValue,
  Question,
  SurveySchema,
} from "@/lib/survey-types";
import {
  flattenQuestions,
  getGatedQuestionIds,
  getQuestionMap,
  questionVisibleForPersona,
} from "@/lib/survey-parser";

/** Contexto de navegação derivado do estado da sessão. */
export interface FlowContext {
  /** persona declarada (slug) ou null se ainda não definida. */
  persona: string | null;
  /** ids revelados por regras `if_answer_includes` ao longo da sessão. */
  revealedIds: Set<string>;
}

export interface BranchingOutcome {
  /** destino de salto imediato, se alguma regra `if_answer_equals` casou. */
  goTo?: string;
  /** ids a revelar (acumular em `revealedIds`). */
  reveal: string[];
}

/* -------------------------------------------------------------------------- */
/* avaliação das regras de uma pergunta                                       */
/* -------------------------------------------------------------------------- */

function answerMatchesValue(answer: AnswerValue, target: string): boolean {
  if (Array.isArray(answer)) return answer.includes(target);
  return String(answer) === target;
}

function answerIncludesAny(answer: AnswerValue, targets: string[]): boolean {
  const values = Array.isArray(answer) ? answer.map(String) : [String(answer)];
  return targets.some((t) => values.includes(t));
}

/**
 * Avalia as regras de branching da pergunta contra a resposta dada.
 * Primeira regra `if_answer_equals` que casa define o salto; regras
 * `if_answer_includes` que casam acumulam ids a revelar.
 */
export function evaluateBranching(
  question: Question,
  answer: AnswerValue,
): BranchingOutcome {
  const outcome: BranchingOutcome = { reveal: [] };

  for (const rule of question.branching ?? []) {
    if ("if_answer_equals" in rule) {
      if (outcome.goTo === undefined && answerMatchesValue(answer, rule.if_answer_equals)) {
        outcome.goTo = rule.go_to_question;
      }
    } else if (answerIncludesAny(answer, rule.if_answer_includes)) {
      outcome.reveal.push(...rule.show_questions);
    }
  }

  return outcome;
}

/* -------------------------------------------------------------------------- */
/* perguntas visíveis (ordenadas) dado o contexto                             */
/* -------------------------------------------------------------------------- */

/**
 * Lista ordenada das perguntas atualmente visíveis: passa no filtro de persona
 * e, se for "gated", já foi revelada.
 */
export function getVisibleQuestions(
  schema: SurveySchema,
  ctx: FlowContext,
): Question[] {
  const gated = getGatedQuestionIds(schema);
  return flattenQuestions(schema).filter((q) => {
    if (!questionVisibleForPersona(q, ctx.persona)) return false;
    if (gated.has(q.id) && !ctx.revealedIds.has(q.id)) return false;
    return true;
  });
}

/* -------------------------------------------------------------------------- */
/* próxima / anterior pergunta                                                */
/* -------------------------------------------------------------------------- */

export interface NextQuestionArgs {
  schema: SurveySchema;
  currentId: string;
  answer: AnswerValue;
  ctx: FlowContext;
}

/**
 * Decide a próxima pergunta a exibir após responder `currentId`.
 *
 * 1. Aplica branching da pergunta atual. Se houver `goTo` para um destino
 *    visível, ele vence.
 * 2. Caso contrário, usa `defaultNext` (se visível).
 * 3. Caso contrário, a próxima pergunta visível na ordem canônica.
 *
 * IMPORTANTE: o chamador deve mesclar `evaluateBranching().reveal` em
 * `ctx.revealedIds` ANTES de chamar (a revelação afeta a lista visível). O
 * store faz isso em `submitAnswer`.
 *
 * Retorna `null` quando não há próxima — sinal de fim de fluxo (tela final).
 */
export function getNextQuestion({
  schema,
  currentId,
  answer,
  ctx,
}: NextQuestionArgs): Question | null {
  const map = getQuestionMap(schema);
  const current = map.get(currentId);
  if (!current) return null;

  const visible = getVisibleQuestions(schema, ctx);
  const isVisible = (id: string) => visible.some((q) => q.id === id);

  const { goTo } = evaluateBranching(current, answer);
  if (goTo && isVisible(goTo)) return map.get(goTo) ?? null;

  if (current.defaultNext && isVisible(current.defaultNext)) {
    return map.get(current.defaultNext) ?? null;
  }

  const idx = visible.findIndex((q) => q.id === currentId);
  if (idx === -1) return null;
  return visible[idx + 1] ?? null;
}

/* -------------------------------------------------------------------------- */
/* progresso                                                                  */
/* -------------------------------------------------------------------------- */

export interface Progress {
  /** índice (0-based) da pergunta atual entre as visíveis. */
  index: number;
  /** total de perguntas visíveis no fluxo atual. */
  total: number;
  /** fração 0..1 para a barra de progresso. */
  ratio: number;
}

/** Progresso do participante no fluxo visível atual. */
export function computeProgress(
  schema: SurveySchema,
  currentId: string | null,
  ctx: FlowContext,
): Progress {
  const visible = getVisibleQuestions(schema, ctx);
  const total = visible.length;
  const index = currentId ? visible.findIndex((q) => q.id === currentId) : 0;
  const safeIndex = index < 0 ? 0 : index;
  const ratio = total === 0 ? 0 : Math.min(1, (safeIndex + 1) / total);
  return { index: safeIndex, total, ratio };
}
