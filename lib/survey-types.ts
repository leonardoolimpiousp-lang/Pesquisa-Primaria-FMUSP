/**
 * Tipos da DEFINIÇÃO do survey.
 *
 * Esta é a forma do `survey_versions.schema_json` (JSONB) — a fonte da verdade
 * do fluxo, perguntas, opções e branching. O frontend renderiza dinamicamente a
 * partir daqui (nunca hardcode telas). As RESPOSTAS vivem no schema relacional
 * (`responses` + `answers`), ver `db/schema.ts`.
 */

export type QuestionType =
  | "single_choice"
  | "multi_choice"
  | "text"
  | "scale"
  | "yes_no"
  | "email"
  | "whatsapp"
  /**
   * (C) Insight Reflection — nó de reflexão/texto, NÃO produz resposta.
   * Renderizado como InsightCard (texto + "Continuar"); ignora
   * `required`/`options`/`scale`. Exibição condicional via `personas`/`branching`
   * (ex.: revelado por `if_answer_includes.show_questions` de uma resposta
   * anterior). O runtime avança sem gravar `answers` nem disparar autosave.
   */
  | "insight"
  /**
   * Ranking por drag-and-drop. Usa `options` como os itens a ordenar; a
   * resposta é a lista de `value`s na ordem escolhida (`AnswerValue = string[]`).
   */
  | "ranking"
  /**
   * Slider emocional — valor único com feedback de emoji. Usa `scale`
   * (min/max/step/labels) e `metadata.emojis` (lista de emojis mapeados por
   * faixa, do min ao max). `AnswerValue = number`.
   */
  | "emotional_slider"
  /**
   * Grade emocional (heatmap check-in) — multi-seleção de emoções renderizada
   * como grid de chips com emoji. Usa `options` (com `emoji`).
   * `AnswerValue = string[]` (array JSON, nunca CSV).
   */
  | "emotional_grid";

/** Opção de uma pergunta de escolha (single/multi). */
export interface QuestionOption {
  /** id estável da opção (usado em branching e analytics). */
  id: string;
  /** texto exibido ao usuário. */
  label: string;
  /** valor canônico salvo na resposta (default: igual ao label). */
  value?: string;
  order: number;
  /** emoji/ilustração opcional para o card (ver DESIGN_SYSTEM.md). */
  emoji?: string;
}

/** Configuração extra para perguntas do tipo `scale`. */
export interface ScaleConfig {
  min: number;
  max: number;
  /** rótulos das extremidades, ex.: { min: "Discordo", max: "Concordo" }. */
  labels?: { min?: string; max?: string };
  step?: number;
}

/**
 * Regras de branching. Avaliadas por `lib/branching-engine.ts::getNextQuestion()`.
 * Toda decisão de "próxima pergunta" passa por lá — sem if/else espalhado.
 */
export type BranchingRule =
  | {
      if_answer_equals: string;
      /** salto de fluxo (opcional: a regra pode só inferir, sem pular). */
      go_to_question?: string;
      /**
       * (D) Memory-based Flow — respostas inferidas a partir desta. Quando a
       * regra casa, o runtime grava estes valores em `answers` (marcados como
       * `_inferred` em `answer_json`) para evitar reperguntar o já sabido sem
       * perder o dado na análise.
       */
      set_answers?: Record<string, AnswerValue>;
    }
  | { if_answer_includes: string[]; show_questions: string[] };

export interface Question {
  /** id estável (ex.: "q_15"). Referenciado por branching e por `answers.question_id`. */
  id: string;
  /** seção a que pertence (espelha Section.id). */
  sectionId: string;
  type: QuestionType;
  text: string;
  helpText?: string;
  required: boolean;
  order: number;
  /** apenas para single_choice / multi_choice / yes_no. */
  options?: QuestionOption[];
  /** apenas para scale. */
  scale?: ScaleConfig;
  /**
   * Personas (slugs) que enxergam esta pergunta. Vazio/ausente = todas.
   * Permite individualizar o fluxo por persona declarada no início.
   */
  personas?: string[];
  /** regras condicionais de fluxo. */
  branching?: BranchingRule[];
  /** próxima pergunta padrão quando nenhuma regra de branching casa. */
  defaultNext?: string;
  /**
   * (B) Rótulo descritivo de profundidade — apenas para curadoria do roteiro e
   * análise. A engine NÃO usa isto para gateamento (profundidade é fixa,
   * definida por `personas`/branching). Evita dados *missing not at random*.
   */
  depth?: "core" | "deep";
  /**
   * (A) Quando true, o `value` da opção escolhida é mapeado para um slug de
   * persona via `setPersona()` ao responder — alimenta o Personalization Header.
   */
  derivesPersona?: boolean;
  /**
   * Chaves livres. Convenções consumidas pela UI:
   *  - `display: "chips" | "cards"` — layout de `single_choice`/`multi_choice`
   *    (chips compactos em vez de pills de largura total).
   *  - `emojis: string[]` — para `emotional_slider`, emojis do min ao max.
   */
  metadata?: Record<string, unknown>;
}

export interface Section {
  id: string;
  title: string;
  order: number;
  questions: Question[];
}

/**
 * (A) Templates do Personalization Header. Tokens `{{q_id}}` resolvidos a partir
 * de respostas CATEGÓRICAS (nunca PII: e-mail/WhatsApp/texto livre identificável).
 */
export interface PersonalizationMeta {
  /** template padrão quando não há persona ou não há override. */
  default?: string;
  /** override por slug de persona. */
  byPersona?: Record<string, string>;
}

/** Metadados livres da versão (`survey_versions.schema_json.meta`). */
export interface SurveyMeta {
  /** textos da tela de consentimento LGPD (ver components/ConsentScreen.tsx). */
  consent?: Record<string, unknown>;
  /** (A) templates do header personalizado. */
  personalization?: PersonalizationMeta;
  /** locale e demais chaves livres, retrocompatível. */
  [key: string]: unknown;
}

/** Conteúdo completo de `survey_versions.schema_json`. */
export interface SurveySchema {
  /** id da primeira pergunta do fluxo (entrada). */
  startQuestionId?: string;
  sections: Section[];
  /** metadados livres da versão (ex.: textos de consentimento, header, locale). */
  meta?: SurveyMeta;
}

/** Valor de uma resposta, conforme o tipo da pergunta. */
export type AnswerValue =
  | string // single_choice, text, yes_no, email, whatsapp
  | number // scale
  | string[]; // multi_choice -> SEMPRE array JSON, nunca CSV
