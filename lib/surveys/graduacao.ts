/**
 * Roteiro — persona "Aluno da Graduação" (FMUSP).
 *
 * Fonte da verdade da DEFINIÇÃO (`survey_versions.schema_json`) nesta fase de
 * prototipagem: módulo TS tipado, servido estaticamente pela rota
 * `app/survey/[slug]`. Pode ser semeado no Supabase depois.
 *
 * Convenções de fluxo (ver lib/branching-engine.ts):
 *  - Encadeamento sequencial = ordem canônica (section.order, depois
 *    question.order). NÃO usamos `defaultNext` para o fluxo normal.
 *  - Sub-perguntas condicionais são "gated": entram em `show_questions` de uma
 *    regra `if_answer_includes` e ficam logo APÓS o gatilho na ordem. Ocultas
 *    até serem reveladas (progressive disclosure).
 *  - `if_answer_equals` + `go_to_question` só para SALTO (stub de persona).
 *  - Perguntas de graduação levam `personas: ["graduacao"]`.
 */

import type { Question, Section, SurveySchema } from "@/lib/survey-types";

const GRAD = ["graduacao"] as const;

/** Atalho para montar opções (id derivado do value). */
function opts(
  list: Array<[value: string, label: string, emoji?: string]>,
): Question["options"] {
  return list.map(([value, label, emoji], i) => ({
    id: value,
    value,
    label,
    order: i + 1,
    ...(emoji ? { emoji } : {}),
  }));
}

/* -------------------------------------------------------------------------- */
/* 0. Seletor de persona                                                      */
/* -------------------------------------------------------------------------- */

const secPersona: Section = {
  id: "persona",
  title: "Seu perfil",
  order: 0,
  questions: [
    {
      id: "q_persona",
      sectionId: "persona",
      type: "single_choice",
      text: "Qual é o seu vínculo com a FMUSP?",
      helpText: "Isso personaliza as próximas perguntas para a sua realidade.",
      required: true,
      order: 1,
      derivesPersona: true,
      metadata: { display: "cards" },
      options: opts([
        ["graduacao", "Aluno da Graduação", "🎓"],
        ["ex_aluno", "Ex-aluno recém-formado (não residente)", "🩺"],
        ["residente", "Residente", "🏥"],
        ["preceptor", "Preceptor", "👨‍🏫"],
        ["assistente", "Assistente", "⚕️"],
      ]),
      branching: [
        { if_answer_equals: "ex_aluno", go_to_question: "q_em_breve" },
        { if_answer_equals: "residente", go_to_question: "q_em_breve" },
        { if_answer_equals: "preceptor", go_to_question: "q_em_breve" },
        { if_answer_equals: "assistente", go_to_question: "q_em_breve" },
      ],
    },
    {
      id: "q_em_breve",
      sectionId: "persona",
      type: "insight",
      text: "Estamos finalizando o roteiro para este perfil.",
      helpText:
        "Por enquanto, o questionário completo está disponível para alunos da graduação. Obrigado pelo interesse — em breve abriremos a sua trilha.",
      required: false,
      order: 99,
      // Visível só para os perfis ainda não cobertos (nunca para graduação).
      personas: ["ex_aluno", "residente", "preceptor", "assistente"],
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* 1. Identidade                                                              */
/* -------------------------------------------------------------------------- */

const secIdentidade: Section = {
  id: "identidade",
  title: "Identidade",
  order: 1,
  questions: [
    {
      id: "q_intro_identidade",
      sectionId: "identidade",
      type: "insight",
      text: "Primeiro, vamos te conhecer um pouco melhor.",
      helpText: "⏱ Tempo estimado: ~1 min",
      required: false,
      order: 1,
      personas: [...GRAD],
    },
    {
      id: "q_ano",
      sectionId: "identidade",
      type: "single_choice",
      text: "Em qual ano da graduação você está?",
      required: true,
      order: 2,
      personas: [...GRAD],
      metadata: { display: "chips" },
      options: opts([
        ["1", "1º ano"],
        ["2", "2º ano"],
        ["3", "3º ano"],
        ["4", "4º ano"],
        ["5", "5º ano"],
        ["6", "6º ano"],
      ]),
      // 5º/6º ano destrava o bloco de Formação (seção formacao).
      branching: [
        {
          if_answer_includes: ["5", "6"],
          show_questions: [
            "q_form_ubs",
            "q_form_ps",
            "q_form_emergencia",
            "q_form_uti",
            "q_form_trabalho",
          ],
        },
      ],
    },
    {
      id: "q_genero",
      sectionId: "identidade",
      type: "single_choice",
      text: "Com qual gênero você se identifica?",
      helpText: "Opcional — pode pular se preferir.",
      required: false,
      order: 3,
      personas: [...GRAD],
      metadata: { display: "chips" },
      options: opts([
        ["feminino", "Feminino"],
        ["masculino", "Masculino"],
        ["nao_binario", "Não-binário"],
        ["prefiro_nao_dizer", "Prefiro não dizer"],
      ]),
    },
    {
      id: "q_idade",
      sectionId: "identidade",
      type: "single_choice",
      text: "Qual a sua faixa de idade?",
      required: true,
      order: 4,
      personas: [...GRAD],
      metadata: { display: "chips" },
      options: opts([
        ["ate_20", "Até 20"],
        ["21_23", "21–23"],
        ["24_26", "24–26"],
        ["27_mais", "27+"],
      ]),
    },
    {
      id: "q_primeira_grad",
      sectionId: "identidade",
      type: "yes_no",
      text: "A Medicina é a sua primeira graduação?",
      required: true,
      order: 5,
      personas: [...GRAD],
      options: opts([
        ["sim", "Sim"],
        ["nao", "Não"],
      ]),
      branching: [
        { if_answer_includes: ["nao"], show_questions: ["q_primeiro_curso"] },
      ],
    },
    {
      id: "q_primeiro_curso",
      sectionId: "identidade",
      type: "text",
      text: "Qual foi a sua primeira graduação?",
      required: false,
      order: 6,
      personas: [...GRAD],
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* 2. Experiência pessoal — plano de carreira + extensões                     */
/* -------------------------------------------------------------------------- */

const secCarreira: Section = {
  id: "carreira",
  title: "Experiência pessoal na instituição",
  order: 2,
  questions: [
    {
      id: "q_intro_experiencia",
      sectionId: "carreira",
      type: "insight",
      text: "Sua experiência durante a graduação.",
      helpText:
        "Queremos entender se, ainda na graduação, você consegue enxergar como se vê daqui a 10 anos e que acesso tem às ferramentas para trilhar esse caminho. ⏱ ~4 min",
      required: false,
      order: 1,
      personas: [...GRAD],
    },
    {
      id: "q_plano",
      sectionId: "carreira",
      type: "single_choice",
      text: "Qual é o seu plano de carreira após formado?",
      required: true,
      order: 2,
      personas: [...GRAD],
      metadata: { display: "cards" },
      options: opts([
        ["residencia_direto", "Prestar residência direto"],
        ["trabalhar_primeiro", "Trabalhar primeiro"],
        ["steps", "Realizar os Steps (USMLE)"],
        ["md_phd", "MD/PhD e carreira acadêmica"],
        ["ciencias_moleculares", "Ciências Moleculares primeiro"],
        ["empreender", "Não pretendo fazer residência / empreender"],
        ["indefinido", "Ainda não defini um plano"],
      ]),
      branching: [
        { if_answer_includes: ["residencia_direto"], show_questions: ["q_cursinho"] },
        { if_answer_includes: ["trabalhar_primeiro"], show_questions: ["q_motivo_trabalhar"] },
        {
          if_answer_includes: ["steps"],
          show_questions: ["q_steps_prep", "q_grupo_estudos", "q_pesquisa_obs"],
        },
      ],
    },
    {
      id: "q_cursinho",
      sectionId: "carreira",
      type: "single_choice",
      text: "Pretende / está fazendo cursinho para a residência?",
      required: true,
      order: 3,
      personas: [...GRAD],
      options: opts([
        ["antes_5ano", "Sim, antes do 5º ano"],
        ["a_partir_internato", "Sim, a partir do internato"],
        ["so_banco", "Não, vou me preparar só com banco de questões"],
      ]),
    },
    {
      id: "q_motivo_trabalhar",
      sectionId: "carreira",
      type: "single_choice",
      text: "Por qual motivo pretende trabalhar primeiro?",
      required: true,
      order: 4,
      personas: [...GRAD],
      metadata: { display: "cards" },
      options: opts([
        ["nao_preparar", "Não vou conseguir me preparar direito durante a graduação"],
        ["nao_definir", "Não vou conseguir definir a tempo qual especialidade seguir"],
        ["financeiro", "Preciso me organizar financeiramente primeiro"],
        ["descansar", "Preciso de um ano para descansar"],
      ]),
    },
    {
      id: "q_steps_prep",
      sectionId: "carreira",
      type: "single_choice",
      text: "Como você está se preparando para os Steps?",
      required: true,
      order: 5,
      personas: [...GRAD],
      options: opts([
        ["curso_prep", "Curso preparatório específico"],
        ["por_conta", "Estudo por conta na internet + banco de questões"],
      ]),
      branching: [
        { if_answer_includes: ["curso_prep"], show_questions: ["q_steps_qual"] },
      ],
    },
    {
      id: "q_steps_qual",
      sectionId: "carreira",
      type: "text",
      text: "Qual curso preparatório? (se quiser, conte)",
      required: false,
      order: 6,
      personas: [...GRAD],
    },
    {
      id: "q_grupo_estudos",
      sectionId: "carreira",
      type: "single_choice",
      text: "Você participa de algum grupo de estudos?",
      required: true,
      order: 7,
      personas: [...GRAD],
      options: opts([
        ["online", "Já participo, online"],
        ["presencial", "Já participo, presencial"],
        ["nenhum", "Não participo de nenhum"],
      ]),
    },
    {
      id: "q_pesquisa_obs",
      sectionId: "carreira",
      type: "text",
      text: "Como você tem se organizado para conseguir oportunidades de pesquisa e observerships/clerkships?",
      required: false,
      order: 8,
      personas: [...GRAD],
    },
    {
      id: "q_orientacao",
      sectionId: "carreira",
      type: "single_choice",
      text: "Você sente que a faculdade orienta adequadamente sobre caminhos de carreira?",
      required: true,
      order: 9,
      personas: [...GRAD],
      metadata: { display: "cards" },
      options: opts([
        ["sim", "Sim, tenho uma direção clara de como me vejo daqui a 10 anos"],
        ["parcialmente", "Parcialmente, ainda estou explorando"],
        ["nao", "Não — há muitas oportunidades, mas me sinto perdido"],
      ]),
    },
    {
      id: "q_extensoes",
      sectionId: "carreira",
      type: "multi_choice",
      text: "Você participa de extensões da faculdade?",
      helpText: "Pode marcar mais de uma.",
      required: true,
      order: 10,
      personas: [...GRAD],
      metadata: { display: "chips" },
      options: opts([
        ["ligas", "Ligas"],
        ["aaaoc", "AAAOC"],
        ["caoc", "CAOC"],
        ["dc", "DC"],
        ["medensina", "MedEnsina"],
        ["bandeira", "Bandeira Científica"],
        ["expedicao", "Expedição Cirúrgica"],
        ["medjr", "MedJr / DevJr"],
        ["fmusp_solidaria", "FMUSP Solidária"],
        ["outra", "Outra"],
        ["nenhuma", "Não participo de nenhuma"],
      ]),
      branching: [
        { if_answer_includes: ["outra"], show_questions: ["q_extensoes_qual"] },
        {
          if_answer_includes: [
            "ligas",
            "aaaoc",
            "caoc",
            "dc",
            "medensina",
            "bandeira",
            "expedicao",
            "medjr",
            "fmusp_solidaria",
            "outra",
          ],
          show_questions: ["q_extensoes_satisf", "q_extensoes_ranking"],
        },
      ],
    },
    {
      id: "q_extensoes_qual",
      sectionId: "carreira",
      type: "text",
      text: "Qual(is) outra(s) extensão(ões)?",
      required: false,
      order: 11,
      personas: [...GRAD],
    },
    {
      id: "q_extensoes_satisf",
      sectionId: "carreira",
      type: "single_choice",
      text: "Você está satisfeito em fazer parte delas?",
      required: true,
      order: 12,
      personas: [...GRAD],
      metadata: { display: "cards" },
      options: opts([
        ["totalmente", "Totalmente — são minhas principais fontes de motivação"],
        ["parcialmente", "Parcialmente"],
        ["nao", "Não — tenho mais frustrações que motivação para permanecer"],
      ]),
    },
    {
      id: "q_extensoes_ranking",
      sectionId: "carreira",
      type: "ranking",
      text: "O que mais influencia sua participação nas extensões?",
      helpText: "Arraste para ordenar — do mais importante (topo) ao menos.",
      required: true,
      order: 13,
      personas: [...GRAD],
      options: opts([
        ["interesse", "Interesse genuíno", "💡"],
        ["soft_skills", "Desenvolvimento de soft skills", "🧩"],
        ["pressao_social", "Pressão social / amizades", "👥"],
        ["networking", "Networking futuro", "🤝"],
        ["curriculo", "Currículo / residência", "📄"],
        ["especialidade", "Contato com especialidade", "🩺"],
        ["habilidades", "Habilidades práticas", "🛠️"],
        ["saude_mental", "Saúde mental / qualidade de vida", "🌱"],
      ]),
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* 3. Exposição às especialidades                                             */
/* -------------------------------------------------------------------------- */

const secEspecialidades: Section = {
  id: "especialidades",
  title: "Exposição às especialidades",
  order: 3,
  questions: [
    {
      id: "q_conhece_rotina",
      sectionId: "especialidades",
      type: "single_choice",
      text: "Você sente que conhece a rotina real das especialidades médicas?",
      required: true,
      order: 1,
      personas: [...GRAD],
      metadata: { display: "cards" },
      options: opts([
        ["sim", "Sim"],
        ["parcialmente", "Parcialmente"],
        ["superficial", "Muito superficialmente"],
        ["nao", "Não"],
      ]),
      branching: [
        { if_answer_includes: ["sim"], show_questions: ["q_como_adquiriu"] },
      ],
    },
    {
      id: "q_como_adquiriu",
      sectionId: "especialidades",
      type: "multi_choice",
      text: "Como você adquiriu esse conhecimento?",
      required: true,
      order: 2,
      personas: [...GRAD],
      metadata: { display: "chips" },
      options: opts([
        ["mentoria", "Programa de mentoria da FMUSP"],
        ["estagio", "Experiência no estágio"],
        ["residentes", "Conversa com residentes"],
        ["chefes", "Conversa com chefes / assistentes"],
        ["conhecidos", "Conversa com conhecidos médicos"],
        ["internet", "Análises e depoimentos na internet"],
        ["vlogs", "Vlogs no Instagram / TikTok"],
      ]),
    },
    {
      id: "q_considera_esp",
      sectionId: "especialidades",
      type: "single_choice",
      text: "Hoje, você já considera fazer alguma especialidade?",
      required: true,
      order: 3,
      personas: [...GRAD],
      metadata: { display: "cards" },
      options: opts([
        ["sim", "Sim"],
        ["indeciso", "Ainda não decidi qual"],
        ["sem_residencia", "No momento não pretendo fazer residência"],
      ]),
      branching: [
        { if_answer_includes: ["sim"], show_questions: ["q_qual_esp"] },
      ],
    },
    {
      id: "q_qual_esp",
      sectionId: "especialidades",
      type: "text",
      text: "Qual especialidade?",
      required: false,
      order: 4,
      personas: [...GRAD],
    },
    {
      id: "q_dificuldade_area",
      sectionId: "especialidades",
      type: "multi_choice",
      text: "O que mais dificulta descobrir qual área seguir?",
      required: true,
      order: 5,
      personas: [...GRAD],
      metadata: { display: "chips" },
      options: opts([
        ["pouco_contato", "Pouco contato real com a rotina e o mercado"],
        ["falta_mentoria", "Falta de mentoria"],
        ["autoconhecimento", "Falta de autoconhecimento"],
        ["excesso_opcoes", "Excesso de opções consideráveis"],
        ["medo_errar", "Medo de escolher errado"],
        ["financeiro", "Pressão financeira"],
      ]),
    },
    {
      id: "q_mudou_esp",
      sectionId: "especialidades",
      type: "yes_no",
      text: "Você já mudou drasticamente de especialidade de interesse?",
      required: true,
      order: 6,
      personas: [...GRAD],
      options: opts([
        ["sim", "Sim"],
        ["nao", "Não"],
      ]),
      branching: [
        { if_answer_includes: ["sim"], show_questions: ["q_mudou_motivo"] },
      ],
    },
    {
      id: "q_mudou_motivo",
      sectionId: "especialidades",
      type: "single_choice",
      text: "O que te fez mudar?",
      required: true,
      order: 7,
      personas: [...GRAD],
      metadata: { display: "cards" },
      options: opts([
        ["conhec_mercado", "Maior conhecimento da rotina e do mercado"],
        ["conhec_proprio", "Maior conhecimento das próprias habilidades e limitações"],
        ["exp_boa", "Experiência boa com estágio"],
        ["exp_ruim", "Experiência ruim com estágio"],
      ]),
      branching: [
        { if_answer_includes: ["exp_boa"], show_questions: ["q_estagio_bom_qual"] },
        { if_answer_includes: ["exp_ruim"], show_questions: ["q_estagio_ruim_qual"] },
      ],
    },
    {
      id: "q_estagio_bom_qual",
      sectionId: "especialidades",
      type: "text",
      text: "Qual estágio te marcou positivamente?",
      required: false,
      order: 8,
      personas: [...GRAD],
    },
    {
      id: "q_estagio_ruim_qual",
      sectionId: "especialidades",
      type: "text",
      text: "Qual estágio te marcou negativamente?",
      required: false,
      order: 9,
      personas: [...GRAD],
    },
    {
      id: "q_dificuldade_contato",
      sectionId: "especialidades",
      type: "text",
      text: "Você sente dificuldade em ter contato com as especialidades médicas para descobrir qual área seguir? Conte um pouco.",
      required: false,
      order: 10,
      personas: [...GRAD],
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* 4. Satisfação com a grade                                                  */
/* -------------------------------------------------------------------------- */

const secGrade: Section = {
  id: "grade",
  title: "Satisfação com a grade",
  order: 4,
  questions: [
    {
      id: "q_inadequacao",
      sectionId: "grade",
      type: "multi_choice",
      text: "O que mais gera sensação de inadequação na graduação?",
      helpText: "Pode marcar mais de uma.",
      required: true,
      order: 1,
      personas: [...GRAD],
      metadata: { display: "chips" },
      options: opts([
        ["ciclo_basico", "Matérias do ciclo básico"],
        ["tempo_livre", "Falta de tempo livre"],
        ["mentoria", "Falta de mentoria para traçar plano de carreira"],
        ["soft_skills", "Falta de capacitações em soft skills abertas a todos"],
        ["provas", "Formato das provas e dificuldade em atingir notas mínimas"],
        ["ordem_estagios", "Início e ordem de estágios no ciclo clínico / internato"],
        ["carga_pratica", "Diminuição da carga horária em campos de prática"],
        ["procedimentos", "Falta de oportunidade para realizar procedimentos"],
        ["osce", "Falta de simulações tipo OSCE e provas práticas"],
        ["revisao", "Insuficiência das aulas de revisão para a residência"],
      ]),
    },
    {
      id: "q_insatisfacoes",
      sectionId: "grade",
      type: "text",
      text: "Fique à vontade para descrever suas principais preocupações ou insatisfações com o curso.",
      helpText: "Opcional.",
      required: false,
      order: 2,
      personas: [...GRAD],
    },
    {
      id: "q_satisfacoes",
      sectionId: "grade",
      type: "text",
      text: "E suas principais satisfações e motivos de gratidão oferecidos pelo curso?",
      helpText: "Opcional.",
      required: false,
      order: 3,
      personas: [...GRAD],
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* 5. Formação — só revelada para 5º/6º ano (gated por q_ano)                 */
/* -------------------------------------------------------------------------- */

const FORMACAO_OPTS = opts([
  ["seguro", "Seguro"],
  ["funcional_inseguro", "Funcional, mas inseguro"],
  ["despreparado", "Despreparado"],
]);

const secFormacao: Section = {
  id: "formacao",
  title: "Formação",
  order: 5,
  questions: [
    {
      id: "q_form_ubs",
      sectionId: "formacao",
      type: "single_choice",
      text: "Ao se formar, como você se sentiria atendendo sozinho em uma UBS?",
      required: true,
      order: 1,
      personas: [...GRAD],
      metadata: { display: "cards" },
      options: FORMACAO_OPTS,
    },
    {
      id: "q_form_ps",
      sectionId: "formacao",
      type: "single_choice",
      text: "E em um Pronto-Socorro (PS)?",
      required: true,
      order: 2,
      personas: [...GRAD],
      metadata: { display: "cards" },
      options: FORMACAO_OPTS,
    },
    {
      id: "q_form_emergencia",
      sectionId: "formacao",
      type: "single_choice",
      text: "E em uma sala de emergência?",
      required: true,
      order: 3,
      personas: [...GRAD],
      metadata: { display: "cards" },
      options: FORMACAO_OPTS,
    },
    {
      id: "q_form_uti",
      sectionId: "formacao",
      type: "single_choice",
      text: "E em uma UTI?",
      required: true,
      order: 4,
      personas: [...GRAD],
      metadata: { display: "cards" },
      options: FORMACAO_OPTS,
    },
    {
      id: "q_form_trabalho",
      sectionId: "formacao",
      type: "single_choice",
      text: "Como você está buscando se informar sobre oportunidades de trabalho?",
      required: true,
      order: 5,
      personas: [...GRAD],
      metadata: { display: "cards" },
      options: opts([
        ["nao_pensei", "Ainda não pensei nisso"],
        ["contatos", "Já tenho contatos com veteranos da faculdade"],
        ["cidade_natal", "Vou retornar para minha cidade natal para trabalhar"],
      ]),
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* 6. Narrativa aberta e peso emocional                                       */
/* -------------------------------------------------------------------------- */

const secEmocional: Section = {
  id: "emocional",
  title: "Peso emocional",
  order: 6,
  questions: [
    {
      id: "q_comparacao",
      sectionId: "emocional",
      type: "single_choice",
      text: "Você sente que existe comparação excessiva entre alunos?",
      required: true,
      order: 1,
      personas: [...GRAD],
      metadata: { display: "chips" },
      options: opts([
        ["frequentemente", "Frequentemente"],
        ["as_vezes", "Às vezes"],
        ["pouco", "Pouco"],
        ["nunca", "Nunca"],
      ]),
    },
    {
      id: "q_saude_mental",
      sectionId: "emocional",
      type: "single_choice",
      text: "Como a graduação tem afetado sua saúde mental / autoestima?",
      required: true,
      order: 2,
      personas: [...GRAD],
      metadata: { display: "cards" },
      options: opts([
        ["positivamente", "Positivamente", "🙂"],
        ["neutro", "Neutro", "😐"],
        ["negativamente", "Negativamente", "😟"],
        ["muito_negativamente", "Muito negativamente", "😣"],
      ]),
    },
    {
      id: "q_performar",
      sectionId: "emocional",
      type: "emotional_slider",
      text: "O quanto você sente que precisa performar acima da média constantemente?",
      required: true,
      order: 3,
      personas: [...GRAD],
      scale: {
        min: 0,
        max: 10,
        step: 1,
        labels: { min: "Nada", max: "O tempo todo" },
      },
      metadata: { emojis: ["😌", "🙂", "😐", "😟", "😰", "🥵"] },
    },
    {
      id: "q_sentimentos",
      sectionId: "emocional",
      type: "emotional_grid",
      text: "Quais sentimentos mais descrevem sua relação atual com o curso?",
      helpText: "Toque em todos que se aplicam.",
      required: true,
      order: 4,
      personas: [...GRAD],
      options: opts([
        ["orgulho", "Orgulho", "😌"],
        ["gratidao", "Gratidão", "🙏"],
        ["proposito", "Propósito", "🎯"],
        ["confusao", "Confusão", "🌀"],
        ["ansiedade", "Ansiedade", "😰"],
        ["exaustao", "Exaustão", "🥵"],
      ]),
    },
    {
      id: "q_antes_fmusp",
      sectionId: "emocional",
      type: "text",
      text: "O que você gostaria que tivessem te contado antes de entrar na FMUSP?",
      helpText: "Opcional.",
      required: false,
      order: 5,
      personas: [...GRAD],
    },
    {
      id: "q_decepcao",
      sectionId: "emocional",
      type: "text",
      text: "O que mais te decepcionou na graduação?",
      helpText: "Opcional.",
      required: false,
      order: 6,
      personas: [...GRAD],
    },
    {
      id: "q_marcou",
      sectionId: "emocional",
      type: "text",
      text: "Qual experiência mais marcou positivamente sua trajetória?",
      helpText: "Opcional.",
      required: false,
      order: 7,
      personas: [...GRAD],
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* 7. Internacionalização                                                     */
/* -------------------------------------------------------------------------- */

const secIntl: Section = {
  id: "intl",
  title: "Internacionalização",
  order: 7,
  questions: [
    {
      id: "q_intro_intl",
      sectionId: "intl",
      type: "insight",
      text: "Quase no fim: oportunidades internacionais.",
      helpText: "⏱ ~2 min",
      required: false,
      order: 1,
      personas: [...GRAD],
    },
    {
      id: "q_intl_descoberta",
      sectionId: "intl",
      type: "single_choice",
      text: "Quando você descobriu que existiam oportunidades internacionais estruturadas na FMUSP?",
      required: true,
      order: 2,
      personas: [...GRAD],
      metadata: { display: "chips" },
      options: opts([
        ["1ano", "Já no 1º ano"],
        ["depois_1ano", "Depois do 1º ano"],
      ]),
    },
    {
      id: "q_intl_interesse",
      sectionId: "intl",
      type: "yes_no",
      text: "Depois de descobrir, sentiu que gostaria de participar dessa experiência?",
      required: true,
      order: 3,
      personas: [...GRAD],
      options: opts([
        ["sim", "Sim"],
        ["nao", "Não"],
      ]),
    },
    {
      id: "q_intl_editais",
      sectionId: "intl",
      type: "single_choice",
      text: "Conseguiu encontrar informações claras dos editais da FMUSP/AUCANI, prazos e exames de proficiência?",
      required: true,
      order: 4,
      personas: [...GRAD],
      metadata: { display: "cards" },
      options: opts([
        ["sim", "Sim, totalmente"],
        ["parcial", "Parcialmente — tentei, mas tive dificuldade em reunir as informações"],
        ["nao_procurei", "Não cheguei a procurar ainda"],
      ]),
    },
    {
      id: "q_intl_financiamento_usp",
      sectionId: "intl",
      type: "single_choice",
      text: "Você conhece as formas de financiamento oferecidas pela faculdade e pela USP?",
      required: true,
      order: 5,
      personas: [...GRAD],
      metadata: { display: "cards" },
      options: opts([
        ["sim", "Sim, totalmente"],
        ["parcial", "Parcialmente"],
        ["nao_sei", "Não sei onde encontrar essas informações"],
      ]),
    },
    {
      id: "q_intl_financiamento_externo",
      sectionId: "intl",
      type: "yes_no",
      text: "Conhece outras formas de financiamento (bolsas externas, fundações, vaquinha, etc.)?",
      required: true,
      order: 6,
      personas: [...GRAD],
      options: opts([
        ["sim", "Sim"],
        ["nao", "Não"],
      ]),
    },
    {
      id: "q_intl_momento",
      sectionId: "intl",
      type: "single_choice",
      text: "Você sabe determinar o melhor momento da graduação para um intercâmbio, ponderando prós e contras?",
      required: true,
      order: 7,
      personas: [...GRAD],
      metadata: { display: "cards" },
      options: opts([
        ["sim", "Sim, sei exatamente o melhor momento para o intercâmbio que quero"],
        ["parcial", "Parcialmente — preciso saber o período de duração antes"],
        ["nao", "Não tenho ideia de qual seria esse momento"],
      ]),
    },
    {
      id: "q_intl_obstaculos",
      sectionId: "intl",
      type: "multi_choice",
      text: "Quais os principais obstáculos para sua internacionalização hoje?",
      helpText: "Pode marcar mais de uma.",
      required: true,
      order: 8,
      personas: [...GRAD],
      metadata: { display: "chips" },
      options: opts([
        ["financeiro", "Financeiro"],
        ["burocracias", "Burocracias"],
        ["medo_atrapalhar", "Medo de atrapalhar a graduação"],
        ["ingles", "Inglês"],
        ["curriculo", "Notas / currículo competitivo"],
        ["por_onde_comecar", "Não sei por onde começar"],
      ]),
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* schema                                                                     */
/* -------------------------------------------------------------------------- */

export const graduacaoSchema: SurveySchema = {
  startQuestionId: "q_persona",
  sections: [
    secPersona,
    secIdentidade,
    secCarreira,
    secEspecialidades,
    secGrade,
    secFormacao,
    secEmocional,
    secIntl,
  ],
  meta: {
    locale: "pt-BR",
    consent: {
      title: "Antes de começar",
      intro:
        "Esta é uma pesquisa primária da Faculdade de Medicina da USP (FMUSP) sobre a trajetória, a formação e o acesso a oportunidades de alunos e profissionais da casa.",
      purpose:
        "Finalidade: os dados serão usados exclusivamente para pesquisa acadêmica primária da FMUSP — análise estatística agregada, sem fins comerciais.",
      anonymity:
        "Você pode permanecer anônimo. E-mail, WhatsApp e LinkedIn são opcionais e só serão solicitados ao final, com seu consentimento específico.",
      dataUse:
        "Seus dados são tratados conforme a LGPD (Lei nº 13.709/2018). Você pode interromper a qualquer momento.",
      buttonLabel: "Começar",
    },
  },
};
