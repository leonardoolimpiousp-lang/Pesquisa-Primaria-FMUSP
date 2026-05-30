import { notFound } from "next/navigation";
import { getSurveyBySlug } from "@/lib/surveys";
import { SurveyRunner } from "@/components/SurveyRunner";

/**
 * Rota do questionário. Resolve o roteiro pelo slug (registro estático em
 * `lib/surveys`) e entrega a definição já carregada ao `SurveyRunner`, que liga
 * schema -> store -> telas. Renderização 100% dinâmica.
 */
export default async function SurveyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const survey = getSurveyBySlug(slug);
  if (!survey) notFound();

  return (
    <SurveyRunner
      schema={survey.schema}
      surveyVersionId={survey.surveyVersionId}
    />
  );
}
