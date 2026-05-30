/**
 * Schema relacional (Drizzle / PostgreSQL / Supabase).
 *
 * Arquitetura nuclear (ver CLAUDE.md §3):
 *   Definition Layer  -> survey_versions.schema_json (JSONB, fonte da verdade do fluxo)
 *   Response Layer     -> responses + answers (relacional normalizado, p/ analytics)
 *
 * `responses.survey_version_id` é OBRIGATÓRIO: rastreia qual versão do
 * questionário gerou cada resposta (reprodutibilidade científica).
 */

import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import type { SurveySchema } from "@/lib/survey-types";

/* -------------------------------------------------------------------------- */
/* surveys                                                                    */
/* -------------------------------------------------------------------------- */

export const surveys = pgTable("surveys", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  /** Versão atualmente servida ao público. FK lógica para survey_versions.id. */
  activeVersionId: uuid("active_version_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/* survey_versions  (Definition Layer)                                        */
/* -------------------------------------------------------------------------- */

export const surveyVersions = pgTable(
  "survey_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    surveyId: uuid("survey_id")
      .notNull()
      .references(() => surveys.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    /** Seções, perguntas, opções e branching. Fonte da verdade do fluxo. */
    schemaJson: jsonb("schema_json").$type<SurveySchema>().notNull(),
    published: boolean("published").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("survey_versions_survey_version_uq").on(t.surveyId, t.version)],
);

/* -------------------------------------------------------------------------- */
/* personas                                                                   */
/* -------------------------------------------------------------------------- */

export const personas = pgTable("personas", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** slug estável referenciado em Question.personas (ex.: "graduando"). */
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
});

/* -------------------------------------------------------------------------- */
/* responses  (Response Layer)                                                */
/* -------------------------------------------------------------------------- */

export const responses = pgTable("responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** OBRIGATÓRIO: versão exata do questionário que gerou esta resposta. */
  surveyVersionId: uuid("survey_version_id")
    .notNull()
    .references(() => surveyVersions.id),
  personaId: uuid("persona_id").references(() => personas.id),
  /** ID anônimo gerado no cliente; permite retomada de sessão (localStorage). */
  sessionId: text("session_id").notNull().unique(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  /** Default anônimo; vira false só com opt-in explícito no final (LGPD). */
  isAnonymous: boolean("is_anonymous").notNull().default(true),
  /* PII — coletado só no final, com consentimento. Nunca enviar a analytics. */
  contactEmail: text("contact_email"),
  whatsapp: text("whatsapp"),
  contactLinkedin: text("contact_linkedin"),
  metadataJson: jsonb("metadata_json").$type<Record<string, unknown>>(),
});

/* -------------------------------------------------------------------------- */
/* answers  (Response Layer)                                                  */
/* -------------------------------------------------------------------------- */

export const answers = pgTable(
  "answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    responseId: uuid("response_id")
      .notNull()
      .references(() => responses.id, { onDelete: "cascade" }),
    /** Casa com Question.id do schema_json (não é FK relacional). */
    questionId: text("question_id").notNull(),
    /** Respostas simples / texto livre. */
    answerText: text("answer_text"),
    /** Multiselect (array JSON, nunca CSV) e escalas/estruturados. */
    answerJson: jsonb("answer_json"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // Uma resposta por pergunta por participante -> upsert no autosave.
  (t) => [unique("answers_response_question_uq").on(t.responseId, t.questionId)],
);

/* -------------------------------------------------------------------------- */
/* relations                                                                  */
/* -------------------------------------------------------------------------- */

export const surveysRelations = relations(surveys, ({ many }) => ({
  versions: many(surveyVersions),
}));

export const surveyVersionsRelations = relations(surveyVersions, ({ one, many }) => ({
  survey: one(surveys, {
    fields: [surveyVersions.surveyId],
    references: [surveys.id],
  }),
  responses: many(responses),
}));

export const personasRelations = relations(personas, ({ many }) => ({
  responses: many(responses),
}));

export const responsesRelations = relations(responses, ({ one, many }) => ({
  surveyVersion: one(surveyVersions, {
    fields: [responses.surveyVersionId],
    references: [surveyVersions.id],
  }),
  persona: one(personas, {
    fields: [responses.personaId],
    references: [personas.id],
  }),
  answers: many(answers),
}));

export const answersRelations = relations(answers, ({ one }) => ({
  response: one(responses, {
    fields: [answers.responseId],
    references: [responses.id],
  }),
}));

/* -------------------------------------------------------------------------- */
/* tipos inferidos                                                            */
/* -------------------------------------------------------------------------- */

export type Survey = typeof surveys.$inferSelect;
export type NewSurvey = typeof surveys.$inferInsert;
export type SurveyVersion = typeof surveyVersions.$inferSelect;
export type NewSurveyVersion = typeof surveyVersions.$inferInsert;
export type Persona = typeof personas.$inferSelect;
export type NewPersona = typeof personas.$inferInsert;
export type Response = typeof responses.$inferSelect;
export type NewResponse = typeof responses.$inferInsert;
export type Answer = typeof answers.$inferSelect;
export type NewAnswer = typeof answers.$inferInsert;
