import {
  ISSUED_DOCUMENTS,
  type IssuedDocument,
  type IssuedDocumentType,
} from "./issued-documents";

/**
 * Armazena localmente (protótipo) os documentos emitidos pela página
 * "Relatórios e documentos", combinando-os com o histórico sintético.
 */
const STORAGE_KEY = "hg:documentos:emitidos";
const CHANGE_EVENT = "hg:documentos:emitidos:change";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readLocal(): IssuedDocument[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as IssuedDocument[]).filter(
      (doc) => doc && typeof doc.id === "string" && typeof doc.body === "string",
    );
  } catch {
    return [];
  }
}

function persist(docs: IssuedDocument[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  } catch {
    // Armazenamento indisponível: mantém apenas a sessão atual.
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

/** Documentos emitidos (locais primeiro) + histórico sintético. */
export function listIssuedDocuments(): IssuedDocument[] {
  return [...readLocal(), ...ISSUED_DOCUMENTS];
}

function nextId(existing: IssuedDocument[]): string {
  const year = new Date().getFullYear();
  const numbers = existing
    .map((doc) => Number(doc.id.split("-").at(-1)))
    .filter((n) => Number.isFinite(n)) as number[];
  const next = (numbers.length > 0 ? Math.max(...numbers) : 0) + 1;
  return `DOC-${year}-${String(next).padStart(4, "0")}`;
}

/** Registra um novo documento emitido e devolve o registro criado. */
export function addIssuedDocument(input: {
  type: IssuedDocumentType;
  patient: string;
  body: string;
}): IssuedDocument {
  const all = listIssuedDocuments();
  const doc: IssuedDocument = {
    id: nextId(all),
    type: input.type,
    patient: input.patient,
    issuedAt: new Date().toISOString(),
    // Protótipo: a assinatura é manual, feita após a impressão.
    signed: false,
    body: input.body,
  };
  persist([doc, ...readLocal()]);
  return doc;
}

/** Assina mudanças na lista de documentos emitidos (mesma aba e outras abas). */
export function subscribeIssuedDocuments(onChange: () => void): () => void {
  if (!isBrowser()) return () => {};
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", handleStorage);
  };
}
