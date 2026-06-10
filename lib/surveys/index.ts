/**
 * Registro de roteiros estáticos (fase de prototipagem). Mapeia o slug da URL
 * para a definição + um `surveyVersionId` estável. Quando o backend Supabase
 * entrar, esta função passa a ler a versão ativa de `survey_versions`.
 */

import type { SurveySchema } from "@/lib/survey-types";
import { graduacaoSchema } from "./graduacao";

interface SurveyEntry {
  /** UUID real da linha em `surveys` (FK lógica de `survey_versions`). */
  surveyId: string;
  slug: string;
  title: string;
  version: number;
  /** UUID real da linha em `survey_versions` (FK de `responses`). */
  surveyVersionId: string;
  schema: SurveySchema;
}

/**
 * IDs estáveis (UUID) que TAMBÉM são semeados no banco (ver `lib/seed-survey.ts`).
 * `responses.survey_version_id` é UUID FK — por isso o id precisa existir em
 * `survey_versions`. Mantemos os literais sincronizados entre registro e seed.
 */
export const GRADUACAO_SURVEY_ID = "02783906-ee6d-4ce1-b5bd-64d6a8280de3";
export const GRADUACAO_VERSION_ID = "cd264788-a5b1-448c-98df-efaf722bb79c";
export const GRADUACAO_SLUG = "pesquisa-saude-digital";

const REGISTRY: Record<string, SurveyEntry> = {
  [GRADUACAO_SLUG]: {
    surveyId: GRADUACAO_SURVEY_ID,
    slug: GRADUACAO_SLUG,
    title: "Pesquisa primária FMUSP",
    version: 1,
    surveyVersionId: GRADUACAO_VERSION_ID,
    schema: graduacaoSchema,
  },
};

export function getSurveyBySlug(slug: string): SurveyEntry | null {
  return REGISTRY[slug] ?? null;
}

export function listSurveys(): SurveyEntry[] {
  return Object.values(REGISTRY);
}

export function getSurveyByVersionId(versionId: string): SurveyEntry | null {
  return listSurveys().find((s) => s.surveyVersionId === versionId) ?? null;
}
