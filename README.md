# Pesquisa Primária — Research Engine (FMUSP)

Plataforma de survey para coleta de dados de entrevistas/questionários da
**pesquisa primária** de um projeto da **Faculdade de Medicina da USP (FMUSP)**.

Não é um formulário estático: é um **form engine** com ramificação condicional
por persona, multiselect, autosave/retomada de sessão e backend analítico
pensado para análise estatística extensa.

- **Volume esperado:** 500–1000 respostas.
- **Objetivo de dados:** cruzar respostas, segmentar, exportar
  (CSV/SPSS/R/Python), gerar dashboards/heatmaps e permitir análise
  longitudinal.

> Guia operacional para devs/agentes: [`CLAUDE.md`](./CLAUDE.md).
> Sistema visual e componentes: [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md).

---

## Personas

O participante declara sua persona no início; a árvore de decisão do
questionário se individualiza a partir disso.

1. **Aluno de graduação**
2. **Ex-aluno FMUSP recém-formado** (não residente)
3. **Residente** do HCFMUSP
4. **Preceptor** do HCFMUSP
5. **Assistente** do HCFMUSP

---

## Seções (comuns a todas as personas)

1. **Experiência pessoal na instituição**
2. **Produção acadêmica** dentro do complexo HCFMUSP
3. **Empreendedorismo, soft skills e saúde digital**
4. **Uso de IA** (vida pessoal, acadêmica e assistencial) + familiaridade com
   *vibecoding*
5. **Familiaridade com ciência da computação e ciência de dados**

O conteúdo final das perguntas será estruturado em etapa seguinte e versionado
em `survey_versions.schema_json`.

---

## Modelo de branching (árvore de decisão)

- A persona escolhida carrega a árvore específica: `const flow = surveyFlows[persona]`.
- Perguntas condicionais: responder **"não"** pula o bloco/seção inteiro;
  **"sim"** segue nas próximas perguntas da mesma seção.
- **Escolha única:** ao selecionar, **avança automaticamente** para a próxima
  pergunta.
- **Multiselect:** seleção múltipla + botão **"Continuar"**.

### Tipos de pergunta

```ts
type QuestionType =
  | "single_choice"
  | "multi_choice"
  | "text"
  | "scale"
  | "yes_no"
  | "email"
  | "whatsapp"
```

### Regras de branching (JSON)

Vão dentro do `schema_json` de cada pergunta:

```json
{ "if_answer_equals": "sim", "go_to_question": "q_15" }
```

```json
{ "if_answer_includes": ["Uso IA diariamente"], "show_questions": ["q_31", "q_32"] }
```

### Multiselect — formato de armazenamento

**Nunca CSV.** Salve um array JSON em `answers.answer_json`:

```json
["ChatGPT", "Claude", "Cursor"]
```

---

## Arquitetura

Separação entre **definição** (como o survey é definido) e **resposta** (como os
dados são armazenados):

```
survey_versions.schema_json (jsonb)   ← fonte da verdade do fluxo/branching
            │
            ▼
        API  → Frontend renderiza dinamicamente
            │
            ▼
   responses → answers (relacional normalizado)
```

Por quê híbrido (JSONB + relacional):

| Necessidade | Resolvido por |
| --- | --- |
| branching complexo / render dinâmico | JSON |
| versionamento e edição sem deploy | JSON |
| analytics, joins, agregações, export | SQL relacional |
| performance de consulta | SQL relacional |

**`responses.survey_version_id` é obrigatório** — rastreia qual versão do
questionário gerou cada resposta (reprodutibilidade científica).

---

## Schema (DDL conceitual)

> A implementação real vive nas migrations Drizzle (`/db`). Abaixo, o modelo
> conceitual.

```sql
-- Survey e versões (definição)
surveys (
  id, slug, title, active_version_id
)

survey_versions (
  id, survey_id, version,
  schema_json   jsonb,   -- seções, perguntas, opções, branching
  published     boolean,
  created_at    timestamptz
)

personas (
  id, name              -- graduando, ex-aluno, residente, preceptor, assistente
)

-- Respostas (relacional)
responses (
  id,
  survey_version_id,    -- OBRIGATÓRIO: rastreabilidade da versão
  persona_id,
  started_at, completed_at,
  is_anonymous  boolean,
  contact_email, whatsapp,
  metadata_json jsonb
)

answers (
  id,
  response_id,
  question_id,
  answer_text,          -- respostas simples / texto livre
  answer_json   jsonb,  -- multiselect, escalas estruturadas
  created_at    timestamptz
)
```

A definição de **sections / questions / options** vive dentro de `schema_json`.
Tabelas-espelho relacionais para essas entidades são opcionais e só se forem
necessárias para analytics específicos.

---

## Estrutura de pastas alvo

```
/app
  /survey/[slug]/page.tsx
/components
  QuestionRenderer.tsx
  ProgressBar.tsx
  MultiSelect.tsx
  SingleChoice.tsx
  /question-types
/lib
  branching-engine.ts      # getNextQuestion()
  survey-parser.ts         # schema_json → estrutura renderizável
/db
  schema.ts                # Drizzle
```

---

## Frontend e sessão

- **Estado:** React Hook Form + Zod (tela atual) + Zustand com `persist`
  (engine global: pergunta atual, respostas acumuladas, branching, progresso,
  navegação).
- **Sessão:** ID anônimo no cliente + `localStorage` para retomada; linha
  `responses` criada no servidor; **autosave a cada resposta**.
- **UX:** uma pergunta por tela, barra de progresso com sumário e seções
  navegáveis, avanço automático em escolha única. Mobile-first (navegador in-app
  do Instagram). Detalhes em [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md).

### Tela final

```
Deseja permanecer anônimo?
( ) Sim   → is_anonymous = true
( ) Não   → coleta opcional: e-mail · WhatsApp · LinkedIn (opcional)
```

---

## Analytics e exportação

- **PostHog:** abandono por pergunta, tempo por seção, funil, completion rate,
  quais perguntas cansam o usuário. **Sem PII** (ver LGPD).
- **Exportação científica:** CSV / SPSS / R / Python a partir do Postgres.
- **Visualização:** dashboards e heatmaps; análise longitudinal por versão.

---

## LGPD

Requisitos mínimos obrigatórios (detalhe em [`CLAUDE.md`](./CLAUDE.md) §6):

- **Consentimento explícito** antes de coletar qualquer resposta.
- **Política de privacidade** acessível.
- **Finalidade informada** (pesquisa acadêmica primária da FMUSP).
- **Anonimização informada** — contato é opcional, coletado só no final.
- Nenhuma PII em analytics/telemetria.

---

## Roadmap

1. **Documentação fundadora** — `CLAUDE.md`, `README.md`, `DESIGN_SYSTEM.md` *(atual)*
2. Schema Drizzle + scaffold Next.js/Supabase
3. Conteúdo da landing (justificativa/objetivos) + perguntas e branching por persona
4. Admin panel (edição de surveys sem deploy) + dashboards
