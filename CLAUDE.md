# CLAUDE.md — Guia operacional do projeto

> Fonte da verdade para agentes e devs trabalhando neste repositório.
> Leia este arquivo antes de gerar ou editar qualquer código.

---

## 1. O que é este projeto

**Plataforma de survey** para a **pesquisa primária** de um projeto da
**FMUSP (Faculdade de Medicina da USP)**. Coleta respostas de entrevistas/
questionários estruturados, com ramificação (branching) por persona, e organiza
os dados para análise estatística posterior.

**É:** um *form engine* reutilizável — `definição de survey` separada da
`renderização` + `branching logic` + `backend analítico`.

**NÃO é:** um "Google Forms customizado" nem páginas de perguntas hardcoded. As
perguntas **nunca** são escritas direto no JSX; são renderizadas dinamicamente a
partir de um schema.

**Volume esperado:** 500–1000 respostas. As decisões de arquitetura priorizam
qualidade de dados, rastreabilidade e exportação científica (CSV/SPSS/R/Python).

---

## 2. Stack

| Camada | Tecnologia |
| --- | --- |
| Frontend | Next.js (App Router) + TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| Form state (tela atual) | React Hook Form + Zod |
| Estado global (survey engine) | Zustand (com `persist`) |
| Banco | PostgreSQL via Supabase |
| ORM | Drizzle ORM |
| Branching | JSON-based flow engine (`lib/branching-engine.ts`) |
| Analytics de produto | PostHog |
| Realtime/telemetria | Supabase Realtime |
| Deploy | Vercel |

- **Idioma da interface e conteúdo:** pt-BR.
- **Mobile-first:** o público abre majoritariamente pelo navegador in-app do
  Instagram (iPhone). Priorize layout vertical, toque e telas estreitas.
- **Sem OAuth.** Sessões são anônimas (ver §5). Admin panel é fase futura e
  separada.

---

## 3. Arquitetura nuclear (não negociável)

Separe **definição** de **resposta**:

```
Definition Layer (JSONB)            Response Layer (relacional)
─────────────────────────           ───────────────────────────
survey_versions.schema_json   →     responses + answers
(seções, perguntas, opções,         (uma linha por participante,
 branching)                          uma linha por resposta)
```

- **Definição do survey = JSONB no banco.** A fonte da verdade do fluxo
  (seções, perguntas, opções, branching) é `survey_versions.schema_json`. A API
  entrega esse JSON ao frontend, que renderiza dinamicamente.
- **Respostas = relacional normalizado** em `responses` e `answers` — para
  joins, agregações, segmentação e exportação estatística.
- **`responses.survey_version_id` é obrigatório.** Cada resposta aponta para a
  versão exata do questionário que a gerou. Isso é essencial em pesquisa
  científica: perguntas, opções e branching evoluem; precisamos saber qual
  versão produziu cada dado.
- **Renderização dinâmica:** sempre `<QuestionRenderer question={current} />`.
  Nunca hardcode telas de perguntas.
- **Branching centralizado:** toda decisão de "próxima pergunta" passa por
  `getNextQuestion()` em `lib/branching-engine.ts`. Sem `if/else` de fluxo
  espalhado pelos componentes.

---

## 4. Schema (resumo)

Detalhes e DDL conceitual estão no `README.md`; as migrations Drizzle são a
verdade de implementação.

- `surveys` — `id`, `slug`, `title`, `active_version_id`
- `survey_versions` — `id`, `survey_id`, `version`, `schema_json` (jsonb),
  `published`, `created_at`
- `personas` — `id`, `name`
- `responses` — `id`, `survey_version_id`, `persona_id`, `started_at`,
  `completed_at`, `is_anonymous`, `contact_email`, `whatsapp`, `metadata_json`
- `answers` — `id`, `response_id`, `question_id`, `answer_text`, `answer_json`,
  `created_at`

**Tipos de pergunta:**
`single_choice | multi_choice | text | scale | yes_no | email | whatsapp`.

---

## 5. Convenções

- **Multiselect → JSON array, nunca CSV.** Salve `["ChatGPT", "Claude",
  "Cursor"]` em `answer_json`. Não concatene strings.
- **Escolha única auto-avança:** ao selecionar, vai direto para a próxima
  pergunta. **Multiselect** exige botão "Continuar".
- **Uma pergunta por tela.** Renderize apenas a pergunta atual (performance e
  UX).
- **Sessão:** ID anônimo gerado no cliente + `localStorage` para retomada. A
  linha `responses` é criada no servidor; autosave a cada resposta. Se o
  usuário fechar a aba/recarregar/sair do navegador do Instagram, o
  questionário continua de onde parou.
- **Verde institucional FMUSP: `#006747`.** Nunca use o verde "emerald" genérico
  do exemplo de referência. Ver `DESIGN_SYSTEM.md`.

---

## 6. LGPD — regras inegociáveis

Pesquisa com seres humanos sob LGPD. Estes requisitos são obrigatórios:

1. **Consentimento explícito ANTES de coletar** qualquer resposta. Tela de
   consentimento opt-in no início; sem consentimento, nada é gravado.
2. **Finalidade informada** — explicitar que os dados são para pesquisa
   acadêmica primária da FMUSP.
3. **Anonimização informada** — o participante pode permanecer anônimo. E-mail,
   WhatsApp e LinkedIn são **opcionais** e coletados **somente no final**, com
   opt-in explícito (`is_anonymous = false`).
4. **Política de privacidade** acessível.
5. **Nunca logar PII** (e-mail, WhatsApp, nome, texto livre identificável) em
   PostHog ou em qualquer telemetria de produto. Analytics rastreiam
   comportamento (abandono, tempo, funil), não identidade.

---

## 7. Estrutura de pastas alvo

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
  branching-engine.ts
  survey-parser.ts
/db
  schema.ts        (Drizzle)
```

---

## 8. Comandos

```bash
pnpm dev            # servidor de desenvolvimento (Next + Turbopack)
pnpm build          # build de produção
pnpm start          # servir build de produção
pnpm lint           # eslint
pnpm db:generate    # gerar migrations Drizzle a partir de db/schema.ts
pnpm db:push        # aplicar schema direto no Supabase (dev)
pnpm db:migrate     # aplicar migrations versionadas
pnpm db:studio      # Drizzle Studio
```

> **pnpm via corepack:** o pnpm não está instalado globalmente neste ambiente.
> O `packageManager` está fixado em `package.json`, então use `corepack pnpm …`
> (ex.: `corepack pnpm dev`). `db:generate` funciona offline; `db:push`,
> `db:migrate` e `db:studio` exigem `DATABASE_URL` (ver `.env.example`).

---

## 9. Regras de trabalho

- Trabalhe **apenas dentro deste diretório**. Não acesse arquivos fora dele.
- Ambiente de **vibecoding/prototipagem** — priorize iteração rápida e clareza.
- Mantenha `README.md` e `DESIGN_SYSTEM.md` em sincronia com decisões tomadas
  aqui (mesmo schema, mesma stack, mesmos tokens visuais).
