/**
 * Auth mínima do painel admin (fase de prototipagem).
 *
 * Sem OAuth (CLAUDE.md §2): uma senha única em `ADMIN_PASSWORD` (env). No login,
 * grava um cookie httpOnly com o hash da senha; o guard compara. Suficiente para
 * proteger a leitura de respostas em ambiente de pesquisa — não é multiusuário.
 */

import { createHash } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "fmusp_admin";
const MAX_AGE = 60 * 60 * 8; // 8h

function tokenFor(pw: string): string {
  return createHash("sha256").update(pw).digest("hex");
}

function expectedToken(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  return pw ? tokenFor(pw) : null;
}

/** True se o cookie de sessão admin é válido. */
export async function isAdmin(): Promise<boolean> {
  const expected = expectedToken();
  if (!expected) return false;
  const store = await cookies();
  return store.get(COOKIE)?.value === expected;
}

/** Valida a senha e grava o cookie de sessão. Retorna sucesso. */
export async function signInAdmin(password: string): Promise<boolean> {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || password !== pw) return false;
  const store = await cookies();
  store.set(COOKIE, tokenFor(pw), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
  });
  return true;
}

export async function signOutAdmin(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}
