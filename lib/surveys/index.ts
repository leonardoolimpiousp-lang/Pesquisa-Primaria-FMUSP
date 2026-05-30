/**
 * Registro de roteiros estáticos (fase de prototipagem). Mapeia o slug da URL
 * para a definição + um `surveyVersionId` estável. Quando o backend Supabase
 * entrar, esta função passa a ler a versão ativa de `survey_versions`.
 */

import type { SurveySchema } from "@/lib/survey-types";
import { graduacaoSchema } from "./graduacao";

interface SurveyEntry {
  title: string;
  surveyVersionId: string;
  schema: SurveySchema;
}

const REGISTRY: Record<string, SurveyEntry> = {
  "pesquisa-saude-digital": {
    title: "Pesquisa primária FMUSP",
    surveyVersionId: "graduacao-v1",
    schema: graduacaoSchema,
  },
};

export function getSurveyBySlug(slug: string): SurveyEntry | null {
  return REGISTRY[slug] ?? null;
}
