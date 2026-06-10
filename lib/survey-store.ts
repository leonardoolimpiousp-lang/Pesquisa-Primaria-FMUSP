/**
 * Estado global do survey engine (Zustand + persist).
 *
 * Persistência local (`localStorage`) habilita RETOMADA DE SESSÃO: se o usuário
 * fechar a aba / recarregar / sair do navegador in-app do Instagram, volta de
 * onde parou (CLAUDE.md §5).
 *
 * O fluxo NÃO decide a próxima pergunta aqui — delega a `branching-engine.ts`.
 * O store apenas: guarda respostas, acumula revelações, navega e dispara o
 * autosave (upsert por pergunta) no servidor.
 */

"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AnswerValue, Question, SurveySchema } from "@/lib/survey-types";
import {
  computeProgress,
  evaluateBranching,
  getNextQuestion,
  getVisibleQuestions,
  type FlowContext,
} from "@/lib/branching-engine";
import {
  getQuestionMap,
  getStartQuestion,
  validateAnswer,
} from "@/lib/survey-parser";

/* -------------------------------------------------------------------------- */
/* autosave configurável (desacoplado do servidor)                           */
/* -------------------------------------------------------------------------- */

/** Payload de um upsert de resposta. PII nunca trafega por aqui. */
export interface PersistAnswerPayload {
  sessionId: string;
  surveyVersionId: string;
  personaId: string | null;
  questionId: string;
  value: AnswerValue;
}

export type PersistAnswerHandler = (
  payload: PersistAnswerPayload,
) => Promise<void>;

/**
 * Handler de persistência. Default no-op para o store funcionar isolado
 * (prototipagem/testes). A camada de API o injeta via `configurePersistence`
 * quando o backend/rota estiver pronto (conteúdo e roteiro virão depois).
 */
let persistAnswerHandler: PersistAnswerHandler = async () => {};

export function configurePersistence(handler: PersistAnswerHandler): void {
  persistAnswerHandler = handler;
}

/** Payload de finalização (completed_at + anonimato/contato). PII só aqui. */
export interface FinalizePayload {
  sessionId: string;
  surveyVersionId: string;
  isAnonymous: boolean;
  email?: string;
  whatsapp?: string;
  linkedin?: string;
}

export type FinalizeHandler = (payload: FinalizePayload) => Promise<void>;

let finalizeHandler: FinalizeHandler = async () => {};

export function configureFinalize(handler: FinalizeHandler): void {
  finalizeHandler = handler;
}

/* -------------------------------------------------------------------------- */
/* tipos de estado                                                            */
/* -------------------------------------------------------------------------- */

export type SurveyStatus =
  | "consent" // tela de consentimento LGPD (opt-in obrigatório)
  | "in_progress" // respondendo perguntas
  | "final" // tela final: anonimato + contato opcional
  | "completed"; // concluído

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface ContactInfo {
  isAnonymous: boolean;
  email?: string;
  whatsapp?: string;
  linkedin?: string;
}

interface SurveyState {
  /* definição (NÃO persistida — reinjetada por initSurvey) */
  schema: SurveySchema | null;
  surveyVersionId: string | null;

  /* sessão (persistida) */
  sessionId: string | null;
  persona: string | null;
  personaId: string | null;
  answers: Record<string, AnswerValue>;
  revealedIds: string[];
  currentQuestionId: string | null;
  history: string[];
  status: SurveyStatus;
  contact: ContactInfo;
  startedAt: string | null;
  completedAt: string | null;

  /* efêmero (NÃO persistido) */
  saveStatus: SaveStatus;
  lastError: string | null;
  _hasHydrated: boolean;

  /* ações */
  initSurvey: (args: {
    schema: SurveySchema;
    surveyVersionId: string;
  }) => void;
  giveConsent: () => void;
  setPersona: (slug: string, personaId?: string | null) => void;
  submitAnswer: (questionId: string, value: AnswerValue) => boolean;
  goBack: () => void;
  goToQuestion: (questionId: string) => void;
  setContact: (contact: ContactInfo) => void;
  completeSurvey: () => void;
  reset: () => void;

  /* seletores derivados */
  getCurrentQuestion: () => Question | null;
  getFlowContext: () => FlowContext;
  getProgress: () => ReturnType<typeof computeProgress>;
  getVisibleQuestions: () => Question[];
}

function freshSessionId(): string {
  // randomUUID existe em browsers modernos (e no in-app do Instagram/iOS atual).
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

const INITIAL_CONTACT: ContactInfo = { isAnonymous: true };

/* -------------------------------------------------------------------------- */
/* store                                                                      */
/* -------------------------------------------------------------------------- */

export const useSurveyStore = create<SurveyState>()(
  persist(
    (set, get) => ({
      schema: null,
      surveyVersionId: null,

      sessionId: null,
      persona: null,
      personaId: null,
      answers: {},
      revealedIds: [],
      currentQuestionId: null,
      history: [],
      status: "consent",
      contact: INITIAL_CONTACT,
      startedAt: null,
      completedAt: null,

      saveStatus: "idle",
      lastError: null,
      _hasHydrated: false,

      initSurvey: ({ schema, surveyVersionId }) => {
        const prev = get();

        // Sessão de versão diferente -> recomeça (evita misturar definições).
        const versionChanged =
          prev.surveyVersionId !== null &&
          prev.surveyVersionId !== surveyVersionId;

        if (versionChanged) {
          set({
            schema,
            surveyVersionId,
            sessionId: freshSessionId(),
            persona: null,
            personaId: null,
            answers: {},
            revealedIds: [],
            currentQuestionId: null,
            history: [],
            status: "consent",
            contact: INITIAL_CONTACT,
            startedAt: null,
            completedAt: null,
            saveStatus: "idle",
            lastError: null,
          });
          return;
        }

        set({
          schema,
          surveyVersionId,
          sessionId: prev.sessionId ?? freshSessionId(),
        });
      },

      giveConsent: () => {
        const { schema, status } = get();
        if (!schema || status !== "consent") return;
        const start = getStartQuestion(schema);
        set({
          status: "in_progress",
          startedAt: new Date().toISOString(),
          currentQuestionId: start?.id ?? null,
        });
      },

      setPersona: (slug, personaId = null) => set({ persona: slug, personaId }),

      submitAnswer: (questionId, value) => {
        const state = get();
        const { schema } = state;
        if (!schema) return false;

        const question = getQuestionMap(schema).get(questionId);
        if (!question) return false;

        // Insight: nó de reflexão — avança SEM gravar resposta nem autosave.
        if (question.type === "insight") {
          const ctxI: FlowContext = {
            persona: state.persona,
            revealedIds: new Set(state.revealedIds),
          };
          const nextI = getNextQuestion({
            schema,
            currentId: questionId,
            answer: "",
            ctx: ctxI,
          });
          set({
            history: [...state.history, questionId],
            currentQuestionId: nextI ? nextI.id : null,
            status: nextI ? "in_progress" : "final",
            lastError: null,
          });
          return true;
        }

        const validation = validateAnswer(question, value);
        if (!validation.ok) {
          set({ saveStatus: "error", lastError: validation.error ?? "Resposta inválida." });
          return false;
        }

        // 1) acumula revelações de branching ANTES de calcular a próxima.
        const { reveal } = evaluateBranching(question, value);
        const revealedIds = reveal.length
          ? Array.from(new Set([...state.revealedIds, ...reveal]))
          : state.revealedIds;

        const answers = { ...state.answers, [questionId]: value };

        // 1.5) deriva persona ANTES de calcular a próxima — a visibilidade por
        // persona depende disto (o `value` da opção é o slug da persona).
        const derivedPersona =
          question.derivesPersona && typeof value === "string" ? value : null;
        const persona = derivedPersona ?? state.persona;
        const nextPersonaId = derivedPersona ? null : state.personaId;

        // 2) próxima pergunta com a lista visível já atualizada.
        const ctx: FlowContext = {
          persona,
          revealedIds: new Set(revealedIds),
        };
        const next = getNextQuestion({ schema, currentId: questionId, answer: value, ctx });

        set({
          answers,
          revealedIds,
          persona,
          personaId: nextPersonaId,
          history: [...state.history, questionId],
          currentQuestionId: next ? next.id : null,
          status: next ? "in_progress" : "final",
          saveStatus: "saving",
          lastError: null,
        });

        // 3) autosave best-effort (não bloqueia a navegação).
        const { sessionId, surveyVersionId, personaId } = get();
        if (sessionId && surveyVersionId) {
          void persistAnswerHandler({
            sessionId,
            surveyVersionId,
            personaId,
            questionId,
            value,
          })
            .then(() => {
              if (get().saveStatus === "saving") set({ saveStatus: "saved" });
            })
            .catch((err: unknown) => {
              set({
                saveStatus: "error",
                lastError: err instanceof Error ? err.message : "Falha ao salvar.",
              });
            });
        } else {
          set({ saveStatus: "saved" });
        }

        return true;
      },

      goBack: () => {
        const { history } = get();
        if (history.length === 0) return;
        const previous = history[history.length - 1];
        set({
          currentQuestionId: previous,
          history: history.slice(0, -1),
          status: "in_progress",
          lastError: null,
        });
      },

      goToQuestion: (questionId) => {
        const { schema, currentQuestionId, history } = get();
        if (!schema) return;
        if (!getQuestionMap(schema).has(questionId)) return;
        set({
          currentQuestionId: questionId,
          status: "in_progress",
          lastError: null,
          history:
            currentQuestionId && currentQuestionId !== questionId
              ? [...history, currentQuestionId]
              : history,
        });
      },

      setContact: (contact) => set({ contact }),

      completeSurvey: () => {
        set({ status: "completed", completedAt: new Date().toISOString() });

        const { sessionId, surveyVersionId, contact } = get();
        if (sessionId && surveyVersionId) {
          void finalizeHandler({
            sessionId,
            surveyVersionId,
            isAnonymous: contact.isAnonymous,
            email: contact.email,
            whatsapp: contact.whatsapp,
            linkedin: contact.linkedin,
          }).catch((err: unknown) => {
            set({
              lastError:
                err instanceof Error ? err.message : "Falha ao finalizar.",
            });
          });
        }
      },

      reset: () => {
        const { schema, surveyVersionId } = get();
        set({
          sessionId: freshSessionId(),
          persona: null,
          personaId: null,
          answers: {},
          revealedIds: [],
          currentQuestionId: null,
          history: [],
          status: "consent",
          contact: INITIAL_CONTACT,
          startedAt: null,
          completedAt: null,
          saveStatus: "idle",
          lastError: null,
          schema,
          surveyVersionId,
        });
      },

      getCurrentQuestion: () => {
        const { schema, currentQuestionId } = get();
        if (!schema || !currentQuestionId) return null;
        return getQuestionMap(schema).get(currentQuestionId) ?? null;
      },

      getFlowContext: () => {
        const { persona, revealedIds } = get();
        return { persona, revealedIds: new Set(revealedIds) };
      },

      getProgress: () => {
        const { schema, currentQuestionId } = get();
        if (!schema) return { index: 0, total: 0, ratio: 0 };
        return computeProgress(schema, currentQuestionId, get().getFlowContext());
      },

      getVisibleQuestions: () => {
        const { schema } = get();
        if (!schema) return [];
        return getVisibleQuestions(schema, get().getFlowContext());
      },
    }),
    {
      name: "fmusp-survey-session",
      storage: createJSONStorage(() => localStorage),
      // Não persistimos a definição nem o estado efêmero de salvamento.
      partialize: (s) => ({
        surveyVersionId: s.surveyVersionId,
        sessionId: s.sessionId,
        persona: s.persona,
        personaId: s.personaId,
        answers: s.answers,
        revealedIds: s.revealedIds,
        currentQuestionId: s.currentQuestionId,
        history: s.history,
        status: s.status,
        contact: s.contact,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
      }),
      onRehydrateStorage: () => () => {
        // localStorage é síncrono: o persist roda a re-hidratação DENTRO de
        // `create()`, então `useSurveyStore` ainda está na TDZ aqui. Adiar para
        // um microtask garante que a referência já exista ao marcar hidratado.
        queueMicrotask(() => useSurveyStore.setState({ _hasHydrated: true }));
      },
    },
  ),
);
