import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";
import { getQuestionMap } from "@/lib/survey-parser";
import { getSurveyByVersionId, GRADUACAO_SLUG } from "@/lib/surveys";
import { logoutAction } from "./actions";

export const dynamic = "force-dynamic";

function fmtDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtValue(answerText: string | null, answerJson: unknown): string {
  if (Array.isArray(answerJson)) return answerJson.join(", ");
  if (typeof answerJson === "number") return String(answerJson);
  if (answerText) return answerText;
  if (answerJson == null) return "—";
  return JSON.stringify(answerJson);
}

/** Cache de mapas questionId->texto por versão (evita reconstruir por resposta). */
const qmapCache = new Map<string, Map<string, { text: string }>>();
function questionText(versionId: string, questionId: string): string {
  let map = qmapCache.get(versionId);
  if (!map) {
    const survey = getSurveyByVersionId(versionId);
    map = survey ? getQuestionMap(survey.schema) : new Map();
    qmapCache.set(versionId, map);
  }
  return map.get(questionId)?.text ?? questionId;
}

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  const rows = await db.query.responses.findMany({
    with: { answers: true },
    orderBy: (r, { desc }) => [desc(r.startedAt)],
  });

  const total = rows.length;
  const completed = rows.filter((r) => r.completedAt).length;
  const identified = rows.filter((r) => !r.isAnonymous).length;

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="font-serif text-xs uppercase tracking-[0.2em] text-primary">
            Medicina · USP
          </p>
          <h1 className="text-2xl font-bold text-foreground">Respostas da pesquisa</h1>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            Sair
          </button>
        </form>
      </header>

      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: "Respostas", value: total },
          { label: "Concluídas", value: completed },
          { label: "Identificadas", value: identified },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-muted p-4">
            <div className="text-2xl font-bold text-foreground tabular-nums">{s.value}</div>
            <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <Link
          href={`/survey/${GRADUACAO_SLUG}?test=1`}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-900"
        >
          ▶ Navegar como usuário teste
        </Link>
      </div>

      {total === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
          Nenhuma resposta registrada ainda. Responda o questionário em{" "}
          <span className="font-medium">/survey/{GRADUACAO_SLUG}</span> para testar.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-background p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`rounded-full px-2.5 py-1 font-semibold ${
                    r.completedAt
                      ? "bg-primary-100 text-primary-900"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {r.completedAt ? "Concluída" : "Em andamento"}
                </span>
                <span className="text-muted-foreground">
                  Início {fmtDate(r.startedAt)}
                </span>
                {r.completedAt && (
                  <span className="text-muted-foreground">· Fim {fmtDate(r.completedAt)}</span>
                )}
                <span className="text-muted-foreground">· {r.answers.length} respostas</span>
                {!r.isAnonymous && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-900">
                    Identificada
                  </span>
                )}
              </div>

              {!r.isAnonymous && (r.contactEmail || r.whatsapp || r.contactLinkedin) && (
                <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground">
                  {r.contactEmail && <span>✉ {r.contactEmail}</span>}
                  {r.whatsapp && <span>📱 {r.whatsapp}</span>}
                  {r.contactLinkedin && <span>in/ {r.contactLinkedin}</span>}
                </div>
              )}

              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-primary">
                  Ver respostas
                </summary>
                <dl className="mt-2 flex flex-col gap-2">
                  {[...r.answers]
                    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
                    .map((a) => (
                      <div key={a.id} className="rounded-xl bg-muted px-3 py-2">
                        <dt className="text-xs text-muted-foreground">
                          {questionText(r.surveyVersionId, a.questionId)}
                        </dt>
                        <dd className="text-sm font-medium text-foreground">
                          {fmtValue(a.answerText, a.answerJson)}
                        </dd>
                      </div>
                    ))}
                </dl>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
