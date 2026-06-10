"use client";

import { useEffect } from "react";
import { configureFinalize, configurePersistence } from "@/lib/survey-store";
import { finalizeResponseAction, persistAnswerAction } from "@/lib/persistence";

/**
 * Liga o store (autosave) às Server Actions de banco. Sem este wiring o store
 * roda isolado (no-op) — útil em testes, mas não grava nada (CLAUDE.md §5).
 *
 * Montado uma vez na árvore do survey; não renderiza nada.
 */
export function PersistenceProvider() {
  useEffect(() => {
    configurePersistence((payload) => persistAnswerAction(payload));
    configureFinalize((payload) => finalizeResponseAction(payload));
  }, []);

  return null;
}
