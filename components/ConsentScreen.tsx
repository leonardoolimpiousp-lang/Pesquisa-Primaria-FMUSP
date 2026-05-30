"use client";

import { useState } from "react";
import { useSurveyStore } from "@/lib/survey-store";

/**
 * Tela de consentimento LGPD — OPT-IN OBRIGATÓRIO antes de coletar qualquer
 * resposta (CLAUDE.md §6). Sem o aceite explícito, `giveConsent()` não roda e
 * nada é gravado.
 *
 * Textos podem ser sobrepostos por versão via `schema.meta.consent` (o roteiro
 * definitivo virá depois); há defaults pt-BR seguros aqui.
 */

interface ConsentMeta {
  title?: string;
  intro?: string;
  purpose?: string;
  anonymity?: string;
  dataUse?: string;
  privacyUrl?: string;
  acceptLabel?: string;
  buttonLabel?: string;
}

const DEFAULTS: Required<Omit<ConsentMeta, "privacyUrl">> & { privacyUrl?: string } = {
  title: "Antes de começar",
  intro:
    "Esta é uma pesquisa acadêmica conduzida pela Faculdade de Medicina da USP (FMUSP). Sua participação é voluntária e leva poucos minutos.",
  purpose:
    "Finalidade: os dados coletados serão usados exclusivamente para pesquisa científica primária da FMUSP — análise estatística agregada, sem fins comerciais.",
  anonymity:
    "Você pode permanecer anônimo. E-mail, WhatsApp e LinkedIn são opcionais e só serão solicitados ao final, com seu consentimento específico.",
  dataUse:
    "Seus dados são tratados conforme a LGPD (Lei nº 13.709/2018). Você pode interromper a qualquer momento.",
  acceptLabel:
    "Li e concordo em participar desta pesquisa e com o tratamento dos meus dados para fins acadêmicos.",
  buttonLabel: "Começar",
  privacyUrl: undefined,
};

export function ConsentScreen() {
  const schema = useSurveyStore((s) => s.schema);
  const giveConsent = useSurveyStore((s) => s.giveConsent);
  const [accepted, setAccepted] = useState(false);

  const meta = {
    ...DEFAULTS,
    ...((schema?.meta?.consent as ConsentMeta | undefined) ?? {}),
  };

  return (
    <div className="animate-question-enter flex w-full flex-col overflow-hidden rounded-3xl border border-border bg-background">
      {/* Header: branco sobre verde (DESIGN_SYSTEM §2). */}
      <div className="bg-primary px-6 py-8 text-primary-foreground">
        <p className="font-serif text-sm uppercase tracking-[0.2em] opacity-90">
          Medicina · USP
        </p>
        <h1 className="mt-2 text-2xl font-bold leading-tight">{meta.title}</h1>
      </div>

      <div className="flex flex-col gap-4 px-6 py-6">
        <p className="text-base leading-relaxed text-foreground">{meta.intro}</p>

        <ul className="flex flex-col gap-3">
          {[meta.purpose, meta.anonymity, meta.dataUse].map((text, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
              <span aria-hidden className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-300" />
              <span>{text}</span>
            </li>
          ))}
        </ul>

        {meta.privacyUrl && (
          <a
            href={meta.privacyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary underline underline-offset-2"
          >
            Ler a política de privacidade
          </a>
        )}

        <label className="mt-2 flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-muted p-4">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-primary"
          />
          <span className="text-sm leading-relaxed text-foreground">{meta.acceptLabel}</span>
        </label>

        <button
          type="button"
          disabled={!accepted}
          onClick={() => accepted && giveConsent()}
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-primary px-6 text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {meta.buttonLabel}
        </button>
      </div>
    </div>
  );
}
