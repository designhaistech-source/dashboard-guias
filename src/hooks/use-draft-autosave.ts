import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { formatSavedTime } from "@/components/saved-indicator";

interface StoredDraft<T> {
  savedAt: number;
  data: T;
}

interface UseDraftAutosaveOptions<T> {
  /** Chave do localStorage (ex.: "hg:opme:rascunho"). */
  key: string;
  /** Snapshot serializável do formulário. */
  data: T;
  /** Retorna true quando não há nada relevante para salvar. */
  isEmpty: (data: T) => boolean;
  /** Aplica um rascunho recuperado ao estado do formulário. */
  onRestore?: (data: T) => void;
  /** Debounce do autosave em ms. */
  delay?: number;
}

/**
 * Autosave de rascunho em localStorage com indicador de horário.
 * Restaura o rascunho na montagem (com toast e opção de descartar)
 * e devolve o timestamp do último salvamento para o `SavedIndicator`.
 */
export function useDraftAutosave<T>({
  key,
  data,
  isEmpty,
  onRestore,
  delay = 800,
}: UseDraftAutosaveOptions<T>) {
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const hydrated = useRef(false);
  const restoreRef = useRef(onRestore);
  restoreRef.current = onRestore;

  const clear = () => {
    if (typeof window !== "undefined") window.localStorage.removeItem(key);
    setSavedAt(null);
  };
  const clearRef = useRef(clear);
  clearRef.current = clear;

  useEffect(() => {
    if (typeof window === "undefined") {
      hydrated.current = true;
      return;
    }
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredDraft<T>;
        if (parsed?.data && !isEmpty(parsed.data)) {
          restoreRef.current?.(parsed.data);
          const ts = parsed.savedAt || Date.now();
          setSavedAt(ts);
          toast(`Rascunho recuperado de ${formatSavedTime(ts)}`, {
            action: { label: "Descartar", onClick: () => clearRef.current() },
          });
        }
      }
    } catch {
      // rascunho corrompido: ignora
    }
    hydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!hydrated.current || typeof window === "undefined") return;
    const timer = window.setTimeout(() => {
      if (isEmpty(data)) {
        window.localStorage.removeItem(key);
        setSavedAt(null);
        return;
      }
      const ts = Date.now();
      try {
        window.localStorage.setItem(
          key,
          JSON.stringify({ savedAt: ts, data } satisfies StoredDraft<T>),
        );
        setSavedAt(ts);
      } catch {
        // quota excedida: mantém o formulário funcionando
      }
    }, delay);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, delay, JSON.stringify(data)]);

  return { savedAt, clearDraft: clear };
}
