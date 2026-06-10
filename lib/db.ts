import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

/**
 * Cliente postgres-js + Drizzle, inicializado de forma LAZY.
 *
 * A conexão só é criada no primeiro uso real (runtime), não na importação do
 * módulo — assim o `next build` e páginas que não tocam o banco não quebram se
 * `DATABASE_URL` ainda não estiver definida.
 *
 * `prepare: false` é necessário com o connection pooler do Supabase em modo
 * transaction (porta 6543); também funciona na conexão direta (5432).
 * Reutiliza a instância em dev para não estourar conexões no hot-reload.
 */
const globalForDb = globalThis as unknown as {
  client?: ReturnType<typeof postgres>;
  db?: PostgresJsDatabase<typeof schema>;
};

function getDb(): PostgresJsDatabase<typeof schema> {
  if (globalForDb.db) return globalForDb.db;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não definida. Veja .env.example.");
  }

  const client = globalForDb.client ?? postgres(connectionString, { prepare: false });
  const instance = drizzle(client, { schema });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.client = client;
    globalForDb.db = instance;
  }
  return instance;
}

/** Proxy lazy: encaminha qualquer acesso/método para a instância real. */
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    const real = getDb();
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
