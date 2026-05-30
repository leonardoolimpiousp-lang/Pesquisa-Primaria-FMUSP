# DESIGN_SYSTEM.md — Sistema visual e de componentes

Marca **FMUSP / MEDICINA · USP** aplicada a um survey mobile-first, no estilo de
onboarding moderno (Typeform / Tally / Perspective): uma pergunta por tela,
cartões grandes, barra de progresso.

> Referência de UX: prints do quiz `medcoding.com.br`.
> **Anti-padrão:** o exemplo usa um verde "emerald" genérico. **Não use.** A cor
> da marca é o verde institucional FMUSP `#006747`.

---

## 1. Cor

### Marca

| Token | Valor | Origem |
| --- | --- | --- |
| **Primária (verde FMUSP)** | `#006747` | Pantone 342 C · CMYK C93 M10 Y75 K43 · RGB 0/103/71 |

### Escala derivada (sugestão)

| Token | Hex | Uso |
| --- | --- | --- |
| `primary-900` | `#00422E` | hover/pressed, texto sobre claro |
| `primary-700` | `#005A3E` | bordas, ênfase |
| `primary` | `#006747` | botões, destaques, header |
| `primary-300` | `#4FA587` | estados sutis |
| `primary-100` | `#E5F0EC` | fundos suaves, seleção |

### Neutros

| Token | Hex | Uso |
| --- | --- | --- |
| `background` | `#FFFFFF` | fundo padrão |
| `foreground` | `#0E1512` | texto principal |
| `muted` | `#F4F5F4` | cartões/superfícies |
| `muted-foreground` | `#6B726E` | texto secundário |
| `border` | `#E3E6E4` | divisórias |
| `card-dark` | `#1A1C1B` | pill de escolha única (estilo referência) |

### Tokens semânticos (mapear para shadcn/Tailwind)

Mapeie em `globals.css` / `tailwind.config` via CSS variables do shadcn:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 156 21% 7%;
  --primary: 162 100% 20%;          /* #006747 */
  --primary-foreground: 0 0% 100%;
  --muted: 120 5% 96%;
  --muted-foreground: 150 4% 43%;
  --border: 150 6% 90%;
  --accent: 162 36% 92%;            /* primary-100 */
  --destructive: 0 72% 51%;
  --radius: 1rem;                    /* cartões bem arredondados */
}
```

---

## 2. Logo

Duas versões oficiais ("MEDICINA / USP"):

- **Verde sobre branco** (`#006747` sobre fundo claro) — uso padrão.
- **Branco sobre verde** (`#006747` de fundo) — headers, telas de capa,
  consentimento.

Regras:

- **Área de proteção:** margem livre ≥ altura da palavra "USP" ao redor do logo.
- **Fundos permitidos:** branco, `muted`, ou o verde da marca. Evite fundos com
  baixo contraste ou imagens carregadas atrás do logo.
- Não distorça, não recolora, não aplique sombra.

---

## 3. Tipografia

| Papel | Família | Uso |
| --- | --- | --- |
| **Display / marca** | Serif (estilo do logo "MEDICINA") | títulos de capa, ênfase de marca |
| **UI** | Sans-serif (ex.: Geist / Inter) | enunciados, opções, botões, corpo |

Escala mobile-first (rem):

| Estilo | Tamanho | Peso |
| --- | --- | --- |
| Pergunta (h1) | 1.75–2rem | 700 |
| Subtítulo/auxiliar | 1rem | 400 |
| Opção (cartão) | 1.125rem | 600 |
| Legenda/progresso | 0.875rem | 500 |

Destaque em verde: palavras-chave do enunciado podem usar `primary` (#006747),
como no exemplo de referência — mas com o verde da marca.

---

## 4. Componentes do survey

| Componente | Descrição |
| --- | --- |
| `QuestionCard` | Container da pergunta atual: enunciado + área de opções. Uma por tela. |
| `SingleChoice` | Opções em **pill** (cartão arredondado); **auto-avança** ao selecionar. |
| `MultiSelect` | Cartões selecionáveis (estado marcado) + botão **"Continuar"**. |
| `ScaleQuestion` | Escala (ex.: 1–5 / Likert) em botões/segmentos. |
| `TextQuestion` | Campo de texto livre (RHF + Zod). |
| `ProgressBar` | Barra no topo; clique abre **sumário com seções navegáveis**. |
| `ConsentScreen` | Tela inicial de consentimento LGPD (opt-in obrigatório). |
| `FinalScreen` | "Permanecer anônimo? Sim/Não" → contato opcional (e-mail/WhatsApp/LinkedIn). |

Padrões visuais (do exemplo de referência, recolorido para FMUSP):

- **Escolha única:** lista vertical de pills escuras (`card-dark`) com radio à
  esquerda; ou pills claras com borda. Largura total, alto toque.
- **Grade 2×2 / 3 cartões:** cartões claros com ilustração/emoji no topo e
  rótulo embaixo (ex.: "App pra meus pacientes", "Mais de 5h").
- **Barra de progresso:** trilho cinza com preenchimento `primary`.

---

## 5. Padrões de UX

- **Uma pergunta por tela** — renderize apenas a pergunta atual.
- **Avanço automático** em escolha única; **"Continuar"** em multiselect.
- **Transições** suaves entre perguntas (slide/fade curto).
- **Autosave** a cada resposta; indicar estado de salvamento de forma discreta.
- **Retomada de sessão:** ao reabrir, continuar de onde parou (ID anônimo +
  `localStorage`).
- **Acessibilidade:** navegação por teclado, foco visível, alvos de toque
  ≥ 44px, contraste AA. Radios/checkboxes com `label` associada.
- **Estados:** loading, salvando, erro de rede (com retry), pergunta obrigatória
  não respondida.
- **Mobile-first:** otimizar para o navegador in-app do Instagram (iPhone);
  evitar elementos que dependam de hover.

---

## 6. Anti-padrões

- ❌ Verde "emerald" genérico do exemplo. ✅ Use `#006747`.
- ❌ Telas de perguntas hardcoded. ✅ Renderização dinâmica via `QuestionRenderer`.
- ❌ Várias perguntas na mesma tela. ✅ Uma por tela.
- ❌ Multiselect salvo como CSV. ✅ Array JSON.
- ❌ Coletar contato no início ou exibir PII em analytics. ✅ Contato só no final,
  opcional; analytics sem PII.
