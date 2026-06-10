"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "../actions";

const initial: LoginState = {};

/** Login do painel admin: senha única (ADMIN_PASSWORD). Sem OAuth. */
export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-5 py-10">
      <header className="flex flex-col gap-1">
        <p className="font-serif text-xs uppercase tracking-[0.2em] text-primary">
          Medicina · USP
        </p>
        <h1 className="text-2xl font-bold text-foreground">Painel da pesquisa</h1>
        <p className="text-sm text-muted-foreground">
          Acesso restrito à equipe. Informe a senha de administrador.
        </p>
      </header>

      <form action={formAction} className="flex flex-col gap-3">
        <input
          type="password"
          name="password"
          autoFocus
          required
          placeholder="Senha de administrador"
          className="h-14 w-full rounded-2xl border border-border bg-muted px-5 text-lg text-foreground outline-none focus:border-primary"
        />
        {state.error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-primary px-6 text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary-900 disabled:opacity-40"
        >
          {pending ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
