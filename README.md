# Pesquisa Primária — Research Engine

Plataforma de survey para coleta de dados de pesquisa primária desenvolvida para a **FMUSP (Faculdade de Medicina da USP)**. Engine de questionários reutilizável com branching dinâmico por persona, persistência autossave e exportação para análise estatística.

---

## Visão geral

**É:** um form engine orientado a pesquisa científica — definição de survey separada da renderização, com branching logic centralizado e backend analítico normalizado.

**Não é:** Google Forms customizado nem telas de perguntas hardcoded. As perguntas são renderizadas dinamicamente a partir de um schema JSON.

**Volume esperado:** 500–1000 respostas. Prioriza qualidade de dados, rastreabilidade de versão e exportação científica (CSV/SPSS/R/Python).

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript strict |
| UI | shadcn/ui + Tailwind CSS v4 |
| Form state | React Hook Form + Zod |
| Estado global | Zustand (com `persist`) |
| Banco | PostgreSQL via Supabase |
| ORM | Drizzle ORM |
| Branching | JSON-based flow engine (`lib/branching-engine.ts`) |
| Analytics | PostHog (comportamento, sem PII) |
| Deploy | Vercel (CI/CD via GitHub Actions) |

---

## Arquitetura

A separação entre **definição** e **resposta** é o princípio central:

```
Definition Layer (JSONB)            Response Layer (relacional)
─────────────────────────           ───────────────────────────
survey_versions.schema_json   →     responses + answers
(seções, perguntas, opções,         (uma linha por participante,
 branching, personas)                uma linha por resposta)
```

- **Definição = JSONB no banco.** `survey_versions.schema_json` é a fonte da verdade do fluxo. A API entrega o JSON ao frontend, que renderiza dinamicamente.
- **Respostas = relacional normalizado.** Tabelas `responses` e `answers` para joins, agregações e exportação.
- **Versionamento obrigatório.** `responses.survey_version_id` aponta para a versão exata que gerou cada dado — requisito de reprodutibilidade científica.
- **Branching centralizado.** Toda decisão de "próxima pergunta" passa por `getNextQuestion()` em `lib/branching-engine.ts`. Nenhum `if/else` de fluxo nos componentes.

### Schema do banco

```
surveys
  └── survey_versions  (schema_json: seções + perguntas + branching)
        └── responses  (uma por participante + session_id anônimo)
              └── answers  (uma por pergunta respondida)
personas  ──→  responses  (classificação por perfil)
```

### Tipos de pergunta suportados

`single_choice` · `multi_choice` · `text` · `scale` · `yes_no` · `email` · `whatsapp` · `insight` · `ranking` · `emotional_slider` · `emotional_grid`

---

## Estrutura de pastas

```
app/
  survey/[slug]/       # rota pública do survey
  admin/               # painel de leitura de respostas (senha única)
components/
  QuestionRenderer.tsx
  SurveyRunner.tsx
  ConsentScreen.tsx
  FinalScreen.tsx
  question-types/      # um componente por tipo de pergunta
lib/
  branching-engine.ts  # getNextQuestion(), computeProgress()
  survey-parser.ts     # flattenQuestions(), getQuestionMap()
  survey-store.ts      # Zustand store (estado da sessão)
  survey-types.ts      # tipos TypeScript do schema JSON
  surveys/             # definições dos surveys (graduacao.ts, …)
db/
  schema.ts            # Drizzle schema (fonte de verdade do banco)
  migrations/          # SQL gerado pelo Drizzle
  seed.ts              # seed para desenvolvimento
```

---

## Configuração local

### Pré-requisitos

- Node.js 20+
- [corepack](https://nodejs.org/api/corepack.html) habilitado (`corepack enable`)
- Projeto Supabase criado

### Instalação

```bash
corepack pnpm install
```

### Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL do Supabase |
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon do Supabase |
| `ADMIN_PASSWORD` | Senha de acesso ao painel `/admin` |
| `NEXT_PUBLIC_POSTHOG_KEY` | Chave do PostHog (analytics comportamental) |

### Banco de dados

```bash
# Gerar migrations a partir do schema (offline)
corepack pnpm db:generate

# Aplicar schema no Supabase (dev)
corepack pnpm db:push

# Aplicar migrations versionadas
corepack pnpm db:migrate

# Seed inicial
corepack pnpm db:seed

# Drizzle Studio (browser GUI)
corepack pnpm db:studio
```

---

## Comandos

```bash
corepack pnpm dev        # servidor de desenvolvimento (Next + Turbopack)
corepack pnpm build      # build de produção
corepack pnpm start      # servir build de produção
corepack pnpm lint       # ESLint
```

---

## Decisões de design

### Uma pergunta por tela

Estilo Typeform/Tally — uma pergunta visível por vez. Melhora taxa de conclusão e qualidade das respostas (participante não "pulou adiante").

### Sessão anônima com autossave

ID gerado no cliente + `localStorage`. A linha `responses` é criada no servidor; cada resposta aciona um upsert em `answers`. Se o participante fechar o navegador (incluindo o browser do Instagram), retoma de onde parou.

### Multiselect = JSON array

Respostas multi-escolha salvas como `["a","b","c"]` em `answer_json`. Nunca como string CSV — evita ambiguidade na análise.

### Escolha única auto-avança

Ao selecionar uma opção em `single_choice`, avança automaticamente. `multi_choice` exige botão "Continuar".

---

## LGPD

Pesquisa com seres humanos sob LGPD. Requisitos inegociáveis:

1. **Consentimento explícito** antes de qualquer coleta. Tela opt-in no início; sem consentimento, nada é gravado.
2. **Finalidade informada** — pesquisa acadêmica primária da FMUSP.
3. **Anonimização informada** — e-mail, WhatsApp e LinkedIn são opcionais, coletados só no final com opt-in explícito (`is_anonymous = false`).
4. **Zero PII em analytics** — PostHog rastreia comportamento (abandono, tempo, funil), nunca identidade.

---

## Design

Cor institucional FMUSP: **`#006747`** (Pantone 342 C). Ver `DESIGN_SYSTEM.md` para tokens completos, escala derivada e mapeamento shadcn/Tailwind.

---

## CI/CD

Deploy automático na Vercel via GitHub Actions (`.github/workflows/deploy.yml`). Push na branch `main` dispara o pipeline.
