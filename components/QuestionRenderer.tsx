"use client";

import type { AnswerValue, Question } from "@/lib/survey-types";
import { useSurveyStore } from "@/lib/survey-store";
import { SingleChoice } from "./question-types/SingleChoice";
import { MultiSelect } from "./question-types/MultiSelect";
import { ScaleQuestion } from "./question-types/ScaleQuestion";
import { TextQuestion } from "./question-types/TextQuestion";
import { Ranking } from "./question-types/Ranking";
import { EmotionalSlider } from "./question-types/EmotionalSlider";
import { EmotionalGrid } from "./question-types/EmotionalGrid";
import { InsightCard } from "./question-types/InsightCard";

/**
 * Dispatcher de renderização dinâmica. SEMPRE renderiza apenas a pergunta atual
 * a partir do schema — nunca telas hardcoded (CLAUDE.md §3, DESIGN_SYSTEM §6).
 *
 * O wiring de navegação/autosave fica no store (`submitAnswer`). Single choice e
 * yes_no auto-avançam; multi/scale/texto exigem confirmação.
 */
export function QuestionRenderer({ question }: { question: Question }) {
  const submitAnswer = useSurveyStore((s) => s.submitAnswer);
  const answers = useSurveyStore((s) => s.answers);
  const lastError = useSurveyStore((s) => s.lastError);
  const current = answers[question.id];

  const handle = (value: AnswerValue) => submitAnswer(question.id, value);

  switch (question.type) {
    case "single_choice":
    case "yes_no":
      return (
        <SingleChoice
          question={question}
          value={typeof current === "string" ? current : undefined}
          error={lastError}
          onSubmit={handle}
        />
      );

    case "multi_choice":
      return (
        <MultiSelect
          question={question}
          value={Array.isArray(current) ? current : undefined}
          error={lastError}
          onSubmit={handle}
        />
      );

    case "scale":
      return (
        <ScaleQuestion
          question={question}
          value={typeof current === "number" ? current : undefined}
          error={lastError}
          onSubmit={handle}
        />
      );

    case "emotional_slider":
      return (
        <EmotionalSlider
          question={question}
          value={typeof current === "number" ? current : undefined}
          error={lastError}
          onSubmit={handle}
        />
      );

    case "ranking":
      return (
        <Ranking
          question={question}
          value={Array.isArray(current) ? current : undefined}
          error={lastError}
          onSubmit={handle}
        />
      );

    case "emotional_grid":
      return (
        <EmotionalGrid
          question={question}
          value={Array.isArray(current) ? current : undefined}
          error={lastError}
          onSubmit={handle}
        />
      );

    case "insight":
      return <InsightCard question={question} onContinue={() => handle("")} />;

    case "text":
    case "email":
    case "whatsapp":
      return (
        <TextQuestion
          question={question}
          value={typeof current === "string" ? current : undefined}
          onSubmit={handle}
        />
      );

    default:
      return null;
  }
}
