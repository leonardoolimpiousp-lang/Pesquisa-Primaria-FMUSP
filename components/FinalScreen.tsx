"use client";

import { useState } from "react";
import { useSurveyStore } from "@/lib/survey-store";

/**
 * Tela final — coleta de contato é OPCIONAL e só aqui (CLAUDE.md §6).
 * Default anônimo; vira identificado apenas com opt-in explícito.
 */
export function FinalScreen() {
  const setContact = useSurveyStore((s) => s.setContact);
  const completeSurvey = useSurveyStore((s) => s.completeSurvey);

  const [wantsContact, setWantsContact] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [linkedin, setLinkedin] = useState("");

  const finish = () => {
    if (wantsContact) {
      setContact({
        isAnonymous: false,
        email: email.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        linkedin: linkedin.trim() || undefined,
      });
    } else {
      setContact({ isAnonymous: true });
    }
    completeSurvey();
  };

  return (
    <div className="animate-question-enter flex w-full flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-[1.75rem] font-bold leading-tight text-foreground">
          Quase lá!
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          Quer deixar um contato para receber os resultados da pesquisa? É
          totalmente opcional — você pode permanecer anônimo.
        </p>
      </header>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setWantsContact(false)}
          aria-pressed={wantsContact === false}
          className={`h-14 flex-1 rounded-2xl border text-lg font-semibold transition-colors ${
            wantsContact === false
              ? "border-primary bg-primary-100 text-primary-900"
              : "border-border bg-muted text-foreground hover:border-primary-300"
          }`}
        >
          Permanecer anônimo
        </button>
        <button
          type="button"
          onClick={() => setWantsContact(true)}
          aria-pressed={wantsContact === true}
          className={`h-14 flex-1 rounded-2xl border text-lg font-semibold transition-colors ${
            wantsContact === true
              ? "border-primary bg-primary-100 text-primary-900"
              : "border-border bg-muted text-foreground hover:border-primary-300"
          }`}
        >
          Deixar contato
        </button>
      </div>

      {wantsContact && (
        <div className="flex flex-col gap-3">
          <input
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail (opcional)"
            className="h-14 w-full rounded-2xl border border-border bg-muted px-5 text-lg text-foreground outline-none focus:border-primary"
          />
          <input
            type="tel"
            inputMode="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="WhatsApp (opcional)"
            className="h-14 w-full rounded-2xl border border-border bg-muted px-5 text-lg text-foreground outline-none focus:border-primary"
          />
          <input
            type="url"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            placeholder="LinkedIn (opcional)"
            className="h-14 w-full rounded-2xl border border-border bg-muted px-5 text-lg text-foreground outline-none focus:border-primary"
          />
        </div>
      )}

      <button
        type="button"
        disabled={wantsContact === null}
        onClick={finish}
        className="flex h-14 w-full items-center justify-center rounded-2xl bg-primary px-6 text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary-900 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Concluir
      </button>
    </div>
  );
}
