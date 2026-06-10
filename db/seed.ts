/**
 * Seed idempotente da DEFINIÇÃO do survey.
 *
 * Insere `surveys` + `survey_versions` com os MESMOS UUIDs referenciados em
 * `lib/surveys/index.ts` — assim `responses.survey_version_id` (UUID FK) tem
 * destino válido.
 *
 * Autossuficiente (imports relativos + cliente próprio) para rodar via Node
 * nativo (`node --env-file=.env db/seed.ts`), sem tsx nem aliases `@/`.
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema.ts";
import { surveys, surveyVersions } from "./schema.ts";
import { graduacaoSchema } from "../lib/surveys/graduacao.ts";

// UUIDs em sincronia com lib/surveys/index.ts (evita importar módulo com
// imports sem extensão, incompatível com o loader ESM nativo do Node).
const GRADUACAO_SURVEY_ID = "02783906-ee6d-4ce1-b5bd-64d6a8280de3";
const GRADUACAO_VERSION_ID = "cd264788-a5b1-448c-98df-efaf722bb79c";
const GRADUACAO_SLUG = "pesquisa-saude-digital";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não definida.");

  const client = postgres(url, { prepare: false });
  const db = drizzle(client, { schema });

  await db
    .insert(surveys)
    .values({
      id: GRADUACAO_SURVEY_ID,
      slug: GRADUACAO_SLUG,
      title: "Pesquisa primária FMUSP",
      activeVersionId: GRADUACAO_VERSION_ID,
    })
    .onConflictDoUpdate({
      target: surveys.id,
      set: { activeVersionId: GRADUACAO_VERSION_ID, slug: GRADUACAO_SLUG },
    });

  await db
    .insert(surveyVersions)
    .values({
      id: GRADUACAO_VERSION_ID,
      surveyId: GRADUACAO_SURVEY_ID,
      version: 1,
      schemaJson: graduacaoSchema,
      published: true,
    })
    .onConflictDoUpdate({
      target: surveyVersions.id,
      set: { schemaJson: graduacaoSchema, published: true },
    });

  await client.end();
  console.log("✓ Seed concluído:", GRADUACAO_SURVEY_ID, GRADUACAO_VERSION_ID);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed falhou:", err);
    process.exit(1);
  });
