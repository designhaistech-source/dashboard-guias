/**
 * Geração automática do campo TISS "2 - Nº Guia no Prestador".
 *
 * O número nunca é informado pelo usuário: o sistema o gera no momento em que a
 * guia é criada/salva, mantendo uma sequência única e independente por operadora.
 * A sequência é persistida localmente (protótipo) e o valor gerado acompanha a
 * guia para exibição na guia emitida (PDF/visualização) e na listagem.
 */

/** Operadoras atendidas e o prefixo usado na numeração de cada uma. */
export const GUIA_OPERADORA_PREFIX: Readonly<Record<string, string>> = {
  Humanas: "HUM",
  Unimed: "UNI",
  CAURN: "CAU",
};

const FALLBACK_PREFIX = "GUI";
const STORAGE_KEY = "haisguias:guia-sequence";
const SEQUENCE_PADDING = 6;

function prefixFor(operadora: string): string {
  return GUIA_OPERADORA_PREFIX[operadora] ?? FALLBACK_PREFIX;
}

function readSequences(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(
        (entry): entry is [string, number] => typeof entry[1] === "number",
      ),
    );
  } catch {
    return {};
  }
}

function writeSequences(sequences: Record<string, number>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sequences));
  } catch {
    // Armazenamento indisponível: a sequência apenas reinicia na próxima sessão.
  }
}

/** Formata um número de sequência já conhecido, ex.: `HUM-000042`. */
export function formatGuiaNumber(operadora: string, sequence: number): string {
  return `${prefixFor(operadora)}-${String(sequence).padStart(SEQUENCE_PADDING, "0")}`;
}

/**
 * Consome o próximo número da sequência da operadora e o devolve formatado.
 * Deve ser chamado uma única vez, no instante em que a guia é criada/salva.
 */
export function nextGuiaNumber(operadora: string): string {
  const prefix = prefixFor(operadora);
  const sequences = readSequences();
  const next = (sequences[prefix] ?? 0) + 1;
  writeSequences({ ...sequences, [prefix]: next });
  return formatGuiaNumber(operadora, next);
}
