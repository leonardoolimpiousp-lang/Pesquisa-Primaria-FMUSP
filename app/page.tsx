import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Landing pública da pesquisa primária FMUSP.
 *
 * Server component estático, mobile-first. Cada tópico abre/fecha via `<details>`
 * nativo (acessível, sem JS, colapsado por padrão); corpo justificado.
 * Conteúdo é estático (não são perguntas do survey) — hardcode é OK aqui.
 *
 * O CTA aponta para a rota futura do questionário (montada com o roteiro).
 */

const SURVEY_HREF = "/survey/pesquisa-saude-digital";

/* -------------------------------------------------------------------------- */
/* primitivos de conteúdo                                                     */
/* -------------------------------------------------------------------------- */

/** Marcador de citação sobrescrito (não-semântico, só visual). */
function Cite({ children }: { children: ReactNode }) {
  return (
    <sup className="ml-0.5 align-super text-[0.65em] font-medium text-primary-700">
      {children}
    </sup>
  );
}

function P({ children }: { children: ReactNode }) {
  return (
    <p className="text-justify text-[0.95rem] leading-relaxed text-muted-foreground">
      {children}
    </p>
  );
}

/** Tópico colapsável: título sempre visível, corpo justificado escondido. */
function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group border-b border-border last:border-b-0"
    >
      <summary className="flex min-h-[3.25rem] cursor-pointer list-none items-center justify-between gap-3 py-4 text-left [&::-webkit-details-marker]:hidden">
        <h2 className="text-lg font-bold leading-snug text-foreground">{title}</h2>
        <span
          aria-hidden
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary transition-transform duration-200 group-open:rotate-180"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
            <path
              d="M5 7.5l5 5 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </summary>
      <div className="flex flex-col gap-4 pb-6">{children}</div>
    </details>
  );
}

/* -------------------------------------------------------------------------- */
/* página                                                                     */
/* -------------------------------------------------------------------------- */

export default function LandingPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
      {/* Hero — branco sobre verde (DESIGN_SYSTEM §2). */}
      <header className="bg-primary px-6 pb-10 pt-12 text-primary-foreground">
        <p className="font-serif text-sm uppercase tracking-[0.25em] opacity-90">
          Medicina · USP
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight">
          Saúde Digital &amp; Inovação na FMUSP
        </h1>
        <p className="mt-4 max-w-prose text-base leading-relaxed text-primary-100">
          Uma pesquisa primária para mapear problemas reais, identificar personas
          e conectar talentos do ecossistema de inovação em saúde — vibecoding,
          IA aplicada e empreendedorismo na prática médica.
        </p>

        <Link
          href={SURVEY_HREF}
          className="mt-7 inline-flex h-14 w-full items-center justify-center rounded-2xl bg-background px-6 text-lg font-semibold text-primary transition-colors hover:bg-primary-100 sm:w-auto"
        >
          Participar da pesquisa
        </Link>
      </header>

      {/* Tópicos colapsáveis. */}
      <main className="flex flex-col px-6 py-4">
        <p className="py-4 text-sm font-medium text-muted-foreground">
          Toque em cada tópico para expandir o contexto da pesquisa.
        </p>

        <Section title="Tendências em Saúde Digital (Medicina 4.0)">
          <P>
            A “Medicina 4.0” incorpora tecnologias avançadas para tornar a saúde
            mais preditiva, personalizada e eficiente. Destacam-se iniciativas de
            medicina preditiva e gêmeos digitais que combinam inteligência
            artificial com dados multimodais (radiômica, patômica, genômica,
            biomarcadores) para antecipar diagnósticos e orientar tratamentos,
            além de iniciativas como <strong>data lakes nacionais</strong> para
            vigilância epidemiológica e integração de bases populacionais.
            <Cite>1</Cite> Contudo, aumentar a interoperabilidade dos sistemas de
            saúde, com a unificação de dados clínicos e <em>enterprise imaging</em>,
            é considerado fundamental para avançar nessas áreas.<Cite>2</Cite> Para
            tanto, muitos dos esforços nacionais em saúde caminham para que,
            futuramente, todas as informações do paciente sejam direcionadas a um
            “prontuário único do cidadão”, estando disponíveis onde quer que o
            paciente seja atendido.<Cite>2</Cite> Além disso, destacam-se sistemas
            inteligentes de apoio clínico, como plataformas de triagem
            automatizadas, geração de pré-laudos, avanços em visão computacional
            no intra-operatório, transcrição de voz em consultas, gestão
            automatizada de escalas médicas e uso de leitos, bem como a produção
            de materiais educativos e simuladores para estudantes e pacientes,
            todos visando ampliar a eficiência operacional e a qualidade da
            assistência.<Cite>3 4 5</Cite>
          </P>
        </Section>

        <Section title="Vibecoding: a mudança de paradigma">
          <P>
            Um fator recente de transformação desse cenário é a popularização do
            chamado <em>vibe coding</em>, bem como das ferramentas <em>low-code</em>{" "}
            e <em>no-code</em>. Hoje, indivíduos sem formação técnica formal em
            ciência da computação conseguem criar aplicações, automações e
            produtos digitais complexos em questão de dias ou semanas,
            frequentemente utilizando ferramentas acessíveis ou gratuitas.
            <Cite>6 7 8</Cite> A redução das barreiras técnicas e financeiras para
            desenvolvimento de software inaugura uma nova fase de democratização
            da inovação tecnológica, especialmente relevante em setores intensivos
            em problemas operacionais, como a saúde.
          </P>
          <P>
            Nesse contexto, o letramento digital e tecnológico entre profissionais
            da saúde torna-se ainda mais relevante. Diferentemente de outros
            setores, médicos e demais profissionais frequentemente possuem contato
            direto e contínuo com problemas reais da assistência, da gestão
            hospitalar, da educação médica e da pesquisa clínica. Além disso,
            muitos desses profissionais conseguem explorar iniciativas
            empreendedoras sem depender inicialmente do sucesso financeiro
            imediato de suas soluções para subsistência, o que amplia o potencial
            de experimentação e desenvolvimento incremental de produtos.
            Historicamente, uma parcela significativa das soluções em saúde falha
            não necessariamente por limitações tecnológicas, mas pela ausência de
            integração entre quem desenvolve a tecnologia e quem vivencia os
            problemas na prática cotidiana. Ferramentas criadas sem participação
            ativa dos usuários finais tendem a apresentar baixa aderência, pouco
            impacto operacional e dificuldades de implementação.<Cite>9</Cite> A
            aproximação entre profissionais da saúde, pesquisadores, designers,
            desenvolvedores e empreendedores passa, portanto, a ser um elemento
            central para a construção de soluções mais úteis, sustentáveis e
            escaláveis.
          </P>
          <P>
            Dessa forma, ampliar o acesso ao conhecimento em saúde digital,
            inteligência artificial aplicada, automação, desenvolvimento de
            produtos digitais e empreendedorismo torna-se fundamental para
            fortalecer a capacidade de inovação em saúde no país. Mais do que
            formar programadores, o objetivo é capacitar indivíduos capazes de
            identificar problemas relevantes, compreender possibilidades
            tecnológicas e participar ativamente da construção de soluções
            alinhadas às necessidades reais do sistema de saúde.
          </P>
        </Section>

        <Section title="Ecossistema de Inovação no Brasil">
          <h3 className="text-base font-semibold text-foreground">
            São Paulo e as universidades públicas
          </h3>
          <P>
            O ecossistema brasileiro de inovação vem se consolidando
            progressivamente nas últimas décadas. São Paulo, por sua vez,
            destaca-se como o principal polo de inovação do país e da América
            Latina. Conforme estudo da WIPO, o estado concentra “mais da metade
            dos investimentos em startups e de unicórnios” brasileiros.
            <Cite>11</Cite> Dados de 2021 apontam que 65% dos aportes de capital de
            risco no setor tech foram destinados a empresas sediadas em São Paulo.
            <Cite>10 12</Cite> Grande parte desse protagonismo relaciona-se
            diretamente à articulação entre universidades públicas, agências de
            fomento, parques tecnológicos, aceleradoras e iniciativas
            público-privadas, responsáveis pela formação de talentos, produção
            científica e transferência tecnológica. Conforme Alessandro Machado,
            da Cedro Capital, “um fator importante de São Paulo é que o estado atrai
            talentos. Em suas universidades, encontramos pessoas brilhantes das
            mais diversas regiões do país, e delas virão várias das startups que
            receberão grandes investimentos”.<Cite>13</Cite>
          </P>
          <p className="text-sm font-medium text-foreground">
            Nesse contexto, destacam-se iniciativas como:
          </p>
          <ul className="flex flex-col gap-3 text-[0.95rem] text-muted-foreground">
            <li>
              <span className="font-semibold text-foreground">
                Redes de inovação, parques tecnológicos e incubadoras
              </span>
              <ul className="mt-1 list-disc pl-5">
                <li>SPAI (Sistema Paulista de Ambientes de Inovação)<Cite>14</Cite></li>
                <li>RPITec (Rede Paulista de Incubadoras de Empresas de Base Tecnológica)</li>
                <li>RPCITec (Rede Paulista de Centros de Inovação Tecnológica)</li>
                <li>Cubo Itaú</li>
                <li>Eretz.bio (Hospital Israelita Albert Einstein)</li>
                <li>CIT ENIAC Guarulhos</li>
                <li>SP Global Tech</li>
              </ul>
            </li>
            <li>
              <span className="font-semibold text-foreground">
                Agências de fomento e programas públicos
              </span>
              <ul className="mt-1 list-disc pl-5">
                <li>FAPESP PIPE</li>
                <li>FINEP</li>
                <li>EMBRAPII</li>
                <li>IdeiaGov</li>
                <li>Sebrae Startups (Scale-Up e Capital Empreendedor)</li>
                <li>Programa Nacional de Inovação Radical em Saúde</li>
                <li>InovaSUS Digital</li>
                <li>Jornada Tecnológica</li>
              </ul>
            </li>
            <li>
              <span className="font-semibold text-foreground">
                Associações, articulação setorial e eventos
              </span>
              <ul className="mt-1 list-disc pl-5">
                <li>ANAHP</li>
                <li>ABIIS</li>
                <li>Founder Institute</li>
                <li>NVIDIA Inception</li>
                <li>NTT Data Health Initiatives</li>
                <li>Brazil Conference</li>
                <li>Brazil Summit</li>
                <li>Brazil Project</li>
                <li>Hackathons em saúde e GovTech/SUS</li>
              </ul>
            </li>
          </ul>
        </Section>

        <Section title="As Healthtechs, São Paulo e as universidades públicas">
          <P>
            O setor brasileiro de saúde digital conta com centenas de startups
            (“healthtechs”), sendo que aproximadamente 40,9% dessas empresas estão
            concentradas em São Paulo.<Cite>15</Cite> Além disso, hubs de inovação
            atuam como parceiros estratégicos de mais da metade das healthtechs
            brasileiras.<Cite>16</Cite> Ao mesmo tempo, mais de 60% das healthtechs
            do país nunca receberam aporte externo,<Cite>17</Cite> ressaltando a
            importância dos ambientes institucionais de apoio, universidades e
            programas de inovação para viabilizar experimentação e desenvolvimento
            inicial dessas soluções.
          </P>
          <P>
            Além disso, setores como saúde e educação requerem validação em
            ambientes reais de uso — hospitais, clínicas, laboratórios e
            instituições de ensino — para testar e ajustar soluções junto aos
            usuários finais. Esses espaços proporcionam interação direta com
            pacientes, profissionais e alunos, permitindo que protótipos sejam
            refinados com base em feedback concreto.
          </P>
        </Section>

        <Section title="A oportunidade: inovação em saúde no HCFMUSP e na USP">
          <P>
            O Complexo Hospitalar da Faculdade de Medicina da USP (HCFMUSP) e a
            Cidade Universitária reúnem múltiplas iniciativas de inovação em saúde.
            No âmbito do HCFMUSP, somam-se aos tradicionais hubs do InovaHC e
            InovaInCor os recentes anúncios do Centro de IA/FMUSP, da unidade
            EMBRAPII-HCFMUSP e do Instituto Tecnológico de Medicina Inteligente
            (ITMI-Brasil), anunciado como o primeiro hospital público inteligente
            do país, que prevê integração entre inteligência artificial,
            telessaúde, ambulâncias conectadas em 5G, regulação inteligente de
            leitos e suporte à decisão clínica em tempo real.<Cite>18 19 20 21</Cite>
          </P>
          <P>
            Na Cidade Universitária, o cenário é ainda mais prolífico, concentrando
            iniciativas como o InovaUSP, a SamsungOcean, o{" "}
            <em>Centro de Inteligência Artificial e Aprendizado de Máquina da USP
            (CIAAM)</em>, o Centro de Engenharia de Inteligência Artificial
            (C4AI/USP), e mais recentemente, o Centro de engenharia de IA do
            Google, no <strong>Instituto de Pesquisas Tecnológicas (IPT)</strong>,
            além de diversas incubadoras, programas de residência e parcerias
            público-privadas voltadas à inovação e transformação digital.
          </P>
          <p className="text-sm font-medium text-foreground">
            Apesar da densidade institucional e científica, ainda existem gargalos
            importantes:
          </p>
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-[0.95rem] text-muted-foreground">
            <li>
              Maior integração e colaboração entre as iniciativas governamentais,
              os hubs USP e profissionais/estudantes de cada instituto
              (MED/Quadrilátero, Poli, IME, FEA, FAU, etc.);
            </li>
            <li>
              Maior letramento em empreendedorismo, saúde digital, segurança da
              informação e proteção de dados, resultando na maior capacidade dos
              profissionais da saúde em identificar processos invisíveis e
              problemas operacionais antes mesmo da implementação de soluções
              tecnologicamente sofisticadas.
            </li>
          </ol>
          <P>
            Em muitos casos, grupos distintos acabam desenvolvendo soluções
            semelhantes sem comunicação entre si, enquanto equipes complementares
            permanecem desconectadas. Por isso, fortalecer a integração entre
            profissionais da saúde, pesquisadores, cientistas de dados,
            desenvolvedores e empreendedores torna-se fundamental para ampliar a
            capacidade de inovação em saúde no país.
          </P>
        </Section>

        <Section title="Objetivos da Pesquisa">
          <p className="text-sm font-medium text-foreground">
            Os principais objetivos desta pesquisa de campo são:
          </p>
          <ol className="flex list-decimal flex-col gap-3 pl-5 text-[0.95rem] text-muted-foreground">
            <li>
              <span className="font-semibold text-foreground">
                Mapear problemas e necessidades:
              </span>{" "}
              levantar dificuldades reais na rotina acadêmica e hospitalar —
              técnicas ou administrativas. Avaliar a literacia em saúde digital dos
              participantes, suas habilidades em computação (incluindo uso de
              ferramentas low-code), o perfil empreendedor e envolvimento em
              pesquisa, bem como a satisfação atual com a formação acadêmica.
            </li>
            <li>
              <span className="font-semibold text-foreground">
                Identificar personas:
              </span>{" "}
              “personas” representativas dos participantes elegíveis (alunos da
              graduação da FMUSP, ex-alunos recém-formados não residentes,
              residentes, preceptores e assistentes).
            </li>
            <li>
              <span className="font-semibold text-foreground">
                Conectar talentos:
              </span>{" "}
              captar estudantes, pesquisadores e profissionais interessados e
              conectá-los a investidores e mentores do setor, promovendo uma
              comunidade cada vez mais engajada em Saúde Digital. A médio prazo,
              espera-se reunir os problemas, as pessoas, os investimentos e os
              cenários de validação para desenvolver soluções cada vez mais maduras.
            </li>
            <li>
              <span className="font-semibold text-foreground">
                Literacia em IA e saúde digital:
              </span>{" "}
              dado o recente advento dessas tecnologias, as primeiras iniciativas
              devem se concentrar em promover a alfabetização digital de forma
              didática e acessível a todos os médicos e estudantes desta casa.
              Quanto mais bem informados sobre aplicações tecnológicas em saúde,
              mais aptos estarão a reconhecer — nas próprias rotinas e na vida dos
              pacientes — os pontos de dor que podem ser aliviados com inovação.
            </li>
          </ol>
          <P>
            <span className="font-semibold text-foreground">Conclusão:</span> nós,
            médicos e estudantes de medicina, precisamos aprender a ir dormir
            pensando: quais problemas (simples ou complexos) merecem minha
            dedicação máxima? Conheço bem a realidade desses problemas? Tenho
            empatia por essas personas? Como vou conseguir entrevistá-las? Estou
            preso a uma solução imaginária e precoce ou consigo mapear as
            alternativas e pivotar sem culpa? Descobriu que o problema é bom?
            Então, para fazer o benchmarking, analisar os dados, identificar os
            gaps e moats, prototipar o PRD/MVP, pensar no marketing e em como
            escalar… nisso tudo os agentes de IA dão uma mãozinha. Eu mesmo, que
            aprendi “Hello, World.” esses dias, idealizei e subi esta pesquisa em
            uma tarde.
          </P>
        </Section>

        <Section title="Como esta pesquisa foi construída">
          <P>
            Transparência sobre a construção: a plataforma foi idealizada e
            desenvolvida com ferramentas de IA e vibecoding. Segue a stack e a
            arquitetura.
          </P>

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-foreground">
                <tr>
                  <th className="px-4 py-2 font-semibold">Camada</th>
                  <th className="px-4 py-2 font-semibold">Tecnologia</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground [&_td]:border-t [&_td]:border-border [&_td]:px-4 [&_td]:py-2">
                <tr><td>Framework</td><td>Next.js App Router + TypeScript (16.2 / React 19.2)</td></tr>
                <tr><td>UI</td><td>Tailwind CSS v4 (+ shadcn/ui planejado)</td></tr>
                <tr><td>Form da tela</td><td>React Hook Form + Zod</td></tr>
                <tr><td>Estado global</td><td>Zustand + persist (localStorage)</td></tr>
                <tr><td>Banco</td><td>PostgreSQL</td></tr>
                <tr><td>ORM / Driver</td><td>Drizzle ORM · postgres.js</td></tr>
                <tr><td>Analytics</td><td>PostHog</td></tr>
                <tr><td>Deploy</td><td>Vercel</td></tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-base font-semibold text-foreground">
            Arquitetura nuclear: definição ≠ resposta
          </h3>
          <P>
            O coração é a separação entre o que o survey <em>é</em> e o que os
            participantes <em>respondem</em>. A <strong>camada de definição</strong>{" "}
            (<em>schema_json</em>, JSONB) é a fonte única do fluxo — seções,
            perguntas, opções e branching —, e o frontend renderiza dinamicamente
            (nenhuma tela de pergunta é hardcoded). A{" "}
            <strong>camada de resposta</strong> é relacional normalizada
            (responses + answers), feita para joins, agregações e exportação. Cada
            resposta carrega obrigatoriamente a versão exata do questionário que a
            gerou, garantindo reprodutibilidade científica. Multiselect é salvo
            como array JSON (nunca CSV), e o autosave é um upsert por pergunta.
          </P>

          <h3 className="text-base font-semibold text-foreground">
            Branching engine (decisão de fluxo centralizada)
          </h3>
          <P>
            Toda navegação passa por uma única função de “próxima pergunta” — zero{" "}
            <em>if/else</em> de fluxo espalhado pelos componentes. Há dois tipos de
            regra: <strong>salto</strong> (muda o destino imediato) e{" "}
            <strong>revelação</strong> (destrava perguntas condicionais sem mudar o
            destino). A filtragem por <strong>persona</strong> individualiza a
            árvore por tipo de participante (graduando, residente, preceptor,
            etc.), e a sessão anônima é persistida no navegador para retomar de
            onde parou.
          </P>

          <h3 className="text-base font-semibold text-foreground">
            Recursos avançados já tipados
          </h3>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-[0.95rem] text-muted-foreground">
            <li>
              <strong>Personalization Header</strong> por persona (só dados
              categóricos, nunca dados pessoais identificáveis).
            </li>
            <li>
              <strong>Profundidade fixa</strong> por persona — evita viés de
              seleção (<em>missing-not-at-random</em>).
            </li>
            <li>
              <strong>Insights</strong> — nós de reflexão que não gravam resposta.
            </li>
            <li>
              <strong>Memory-based flow</strong> — infere e registra respostas para
              não reperguntar o já sabido.
            </li>
          </ul>

          <h3 className="text-base font-semibold text-foreground">
            Possibilidades de análise habilitadas
          </h3>
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-[0.95rem] text-muted-foreground">
            <li>Telemetria comportamental (sem PII): abandono, tempo por seção, funil de conclusão.</li>
            <li>Análise estatística relacional via SQL: crosstabs, segmentação por persona, agregações.</li>
            <li>Análise longitudinal por versão do questionário, sem misturar definições.</li>
            <li>Exportação científica: CSV / SPSS / R / Python direto do Postgres.</li>
            <li>Dados de qualidade: profundidade fixa + respostas inferidas rastreáveis.</li>
            <li>Dashboards/heatmaps (roadmap) sobre o mesmo schema relacional.</li>
          </ol>
        </Section>

        <Section title="Referências">
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-muted-foreground">
            <li>HealthManagement.org. <em>Scaling Digital Health Through Connected Data Ecosystems</em>.</li>
            <li>Futuro da Saúde. <em>Unificação de dados dos prontuários eletrônicos pode facilitar interoperabilidade</em>.</li>
            <li>Ministério da Saúde. <em>Ministério da Saúde anuncia criação do primeiro hospital público inteligente do Brasil</em>.</li>
            <li>HealthManagement.org. <em>Justice and Inclusion in Digital Health</em>.</li>
            <li>Halle Tecco. <em>The Tech-Enablement Playbook for Healthcare Services Startups</em>.</li>
            <li>Ubistart. <em>Low-code e no-code democratizam o desenvolvimento de software</em>.</li>
            <li>Ubistart. <em>Projetos que antes levavam meses agora podem ser concluídos em semanas ou dias</em>.</li>
            <li>Ubistart. <em>Democratização do desenvolvimento de software por plataformas no-code</em>.</li>
            <li>HealthManagement.org. <em>Justice and Inclusion in Digital Health</em>.</li>
            <li>ABMES. <em>O papel da universidade no ecossistema de inovação</em>.</li>
            <li>WIPO. <em>São Paulo is Brazil’s Innovation Powerhouse</em>.</li>
            <li>Distrito. <em>Polos tecnológicos: o que são e quais são os maiores no Brasil e no mundo</em>.</li>
            <li>Distrito. <em>O papel das universidades no ecossistema paulista de inovação</em>.</li>
            <li>Governo do Estado de São Paulo. <em>Sistema Paulista de Ambientes de Inovação (SPAI)</em>.</li>
            <li>Distrito HealthTech Report. <em>Panorama das Healthtechs no Brasil</em>.</li>
            <li>Liga Ventures; PwC Brasil. <em>Startup HealthTech Report Brasil</em>.</li>
            <li>Saúde Digital News. <em>Mais de 60% das healthtechs no Brasil nunca receberam investimento</em>.</li>
            <li>Ministério da Saúde. <em>Criação do primeiro hospital público inteligente do Brasil</em>.</li>
            <li>Ministério da Saúde. <em>ITMI-Brasil e integração de IA, 5G e telessaúde</em>.</li>
            <li>Ministério da Saúde. <em>Regulação inteligente de leitos e apoio à decisão clínica</em>.</li>
            <li>Ministério da Saúde. <em>Rede nacional de UTIs inteligentes conectadas ao HC-USP</em>.</li>
            <li>Ministério da Saúde. <em>ITMI-Brasil como centro de pesquisa e formação em saúde digital</em>.</li>
          </ol>
        </Section>

        {/* CTA de rodapé. */}
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-base font-semibold text-foreground">
            Pronto para contribuir?
          </p>
          <Link
            href={SURVEY_HREF}
            className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-primary px-6 text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary-900"
          >
            Participar da pesquisa
          </Link>
          <p className="max-w-prose text-xs text-muted-foreground">
            Participação voluntária e anônima. Pesquisa acadêmica da FMUSP,
            conforme a LGPD.
          </p>
        </div>
      </main>
    </div>
  );
}
