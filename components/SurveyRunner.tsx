"use client";

import { useEffect } from "react";
import type { SurveySchema } from "@/lib/survey-types";
import { useSurveyStore } from "@/lib/survey-store";
import { ConsentScreen } from "./ConsentScreen";
import { QuestionRenderer } from "./QuestionRenderer";
import { ProgressBar } from "./ProgressBar";
import { FinalScreen } from "./FinalScreen";
import { PersistenceProvider } from "./PersistenceProvider";
import { SaveIndicator } from "./SaveIndicator";

/**
 * Orquestrador da experiência: liga schema -> store -> telas conforme `status`.
 * Recebe a definição já carregada (a página `survey/[slug]` busca do banco a
 * versão ativa). Renderização 100% dinâmica — nenhuma pergunta hardcoded.
 */
export function SurveyRunner({
  schema,
  surveyVersionId,
}: {
  schema: SurveySchema;
  surveyVersionId: string;
}) {
  const initSurvey = useSurveyStore((s) => s.initSurvey);
  const reset = useSurveyStore((s) => s.reset);
  const hasHydrated = useSurveyStore((s) => s._hasHydrated);
  const status = useSurveyStore((s) => s.status);
  const current = useSurveyStore((s) => s.getCurrentQuestion());
  const goBack = useSurveyStore((s) => s.goBack);
  const canGoBack = useSurveyStore((s) => s.history.length > 0);

  // Inicializa só após a rehidratação do localStorage (retomada de sessão).
  // `?test=1` (link do admin) começa uma sessão limpa para navegação de teste.
  useEffect(() => {
    if (!hasHydrated) return;
    initSurvey({ schema, surveyVersionId });
    const isTest =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("test") === "1";
    if (isTest) reset();
  }, [hasHydrated, schema, surveyVersionId, initSurvey, reset]);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        Carregando…
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-6">
      <PersistenceProvider />
      {status === "in_progress" && (
        <div className="mb-8 flex items-center gap-3">
          {canGoBack && (
            <button
              type="button"
              onClick={goBack}
              aria-label="Voltar"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted"
            >
              ←
            </button>
          )}
          <div className="flex-1">
            <ProgressBar />
          </div>
        </div>
      )}

      {status === "in_progress" && (
        <div className="mb-3 flex justify-end">
          <SaveIndicator />
        </div>
      )}

      <div className="flex flex-1 flex-col justify-center">
        {status === "consent" && <ConsentScreen />}

        {status === "in_progress" &&
          (current ? (
            <QuestionRenderer key={current.id} question={current} />
          ) : (
            <p className="text-muted-foreground">Nenhuma pergunta disponível.</p>
          ))}

        {status === "final" && <FinalScreen />}

        {status === "completed" && (
          <div className="animate-question-enter flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-3xl text-primary">
              ✓
            </div>
            <h1 className="text-2xl font-bold text-foreground">Obrigado!</h1>
            <p className="text-muted-foreground">
              Sua participação foi registrada. Os dados serão usados na pesquisa
              acadêmica da FMUSP.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
