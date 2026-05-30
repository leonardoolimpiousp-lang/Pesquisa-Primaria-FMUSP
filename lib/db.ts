import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não definida. Veja .env.example.");
}

/**
 * Cliente postgres-js.
 *
 * `prepare: false` é necessário ao usar o connection pooler do Supabase em modo
 * transaction (porta 6543). Para conexão direta (porta 5432) também funciona.
 *
 * Reutiliza a instância em dev para não estourar conexões no hot-reload.
 */
const globalForDb = globalThis as unknown as {
  client?: ReturnType<typeof postgres>;
};

const client = globalForDb.client ?? postgres(connectionString, { prepare: false });
if (process.env.NODE_ENV !== "production") globalForDb.client = client;

export const db = drizzle(client, { schema });
