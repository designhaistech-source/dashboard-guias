import type { ReportTemplate } from "./documents";

/** Tipos de documento que podem ter modelos salvos pelo usuário. */
export type DocumentTemplateKind = "relatorio" | "atestado" | "comparecimento";

export interface SavedDocumentTemplate extends ReportTemplate {
  /** ISO da criação, usada para ordenar do mais recente para o mais antigo. */
  createdAt: string;
}

const STORAGE_PREFIX = "hg:documentos:modelos:";
const CHANGE_EVENT = "hg:documentos:modelos:change";

function storageKey(kind: DocumentTemplateKind): string {
  return `${STORAGE_PREFIX}${kind}`;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function slugify(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "modelo"
  );
}

/** Lê os modelos salvos de um tipo de documento. Retorna [] fora do browser. */
export function listSavedTemplates(kind: DocumentTemplateKind): SavedDocumentTemplate[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(storageKey(kind));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as SavedDocumentTemplate[])
      .filter((t) => t && typeof t.value === "string" && typeof t.content === "string")
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  } catch {
    return [];
  }
}

function persist(kind: DocumentTemplateKind, templates: SavedDocumentTemplate[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(storageKey(kind), JSON.stringify(templates));
  } catch {
    // Armazenamento indisponível (modo privado/cota): mantém apenas em memória.
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: kind }));
}

export interface SaveTemplateResult {
  template: SavedDocumentTemplate;
  /** true quando um modelo de mesmo nome foi sobrescrito. */
  overwritten: boolean;
}

/** Cria ou sobrescreve (mesmo nome) um modelo do usuário. */
export function saveTemplate(
  kind: DocumentTemplateKind,
  name: string,
  content: string,
): SaveTemplateResult {
  const label = name.trim();
  const value = `custom-${slugify(label)}`;
  const template: SavedDocumentTemplate = {
    value,
    label,
    content,
    createdAt: new Date().toISOString(),
  };
  const current = listSavedTemplates(kind);
  const overwritten = current.some((t) => t.value === value);
  persist(kind, [template, ...current.filter((t) => t.value !== value)]);
  return { template, overwritten };
}

/** Remove um modelo salvo pelo seu value. */
export function removeTemplate(kind: DocumentTemplateKind, value: string): void {
  persist(
    kind,
    listSavedTemplates(kind).filter((t) => t.value !== value),
  );
}

/** Assina mudanças na lista de modelos (mesma aba e outras abas). */
export function subscribeTemplates(kind: DocumentTemplateKind, onChange: () => void): () => void {
  if (!isBrowser()) return () => {};
  const handleCustom = (event: Event) => {
    if ((event as CustomEvent<DocumentTemplateKind>).detail === kind) onChange();
  };
  const handleStorage = (event: StorageEvent) => {
    if (event.key === storageKey(kind)) onChange();
  };
  window.addEventListener(CHANGE_EVENT, handleCustom);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handleCustom);
    window.removeEventListener("storage", handleStorage);
  };
}

/**
 * Renomeia um modelo salvo mantendo o mesmo `value`, para não invalidar a
 * seleção atual do select "Modelos disponíveis".
 * Retorna false quando já existe outro modelo com o mesmo nome.
 */
export function renameTemplate(
  kind: DocumentTemplateKind,
  value: string,
  name: string,
): boolean {
  const label = name.trim();
  if (!label) return false;
  const current = listSavedTemplates(kind);
  const key = label.toLocaleLowerCase("pt-BR");
  if (current.some((t) => t.value !== value && t.label.toLocaleLowerCase("pt-BR") === key)) {
    return false;
  }
  persist(
    kind,
    current.map((t) => (t.value === value ? { ...t, label } : t)),
  );
  return true;
}

/**
 * Atualiza nome e conteúdo de um modelo salvo mantendo o mesmo `value`,
 * para não criar um novo modelo nem invalidar a seleção atual.
 * Retorna false quando já existe outro modelo com o mesmo nome.
 */
export function updateTemplate(
  kind: DocumentTemplateKind,
  value: string,
  name: string,
  content: string,
): boolean {
  const label = name.trim();
  if (!label) return false;
  const current = listSavedTemplates(kind);
  const key = label.toLocaleLowerCase("pt-BR");
  if (current.some((t) => t.value !== value && t.label.toLocaleLowerCase("pt-BR") === key)) {
    return false;
  }
  persist(
    kind,
    current.map((t) => (t.value === value ? { ...t, label, content } : t)),
  );
  return true;
}
