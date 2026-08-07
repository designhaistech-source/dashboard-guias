import { useSyncExternalStore } from "react";

import {
  ISSUED_GUIDES,
  formatCurrency,
  formatIssuedAt,
  type IssuedGuide,
} from "./issued-guides";

const STORAGE_KEY = "guias-plus:issued-guides";

/**
 * Store de protótipo para as guias emitidas. Persistida no navegador para que
 * a guia gerada em "Emitir guia" continue disponível em "Guias emitidas".
 */
let guides: IssuedGuide[] = ISSUED_GUIDES;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(guides));
  } catch {
    // Armazenamento indisponível (modo privado): mantém apenas em memória.
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as IssuedGuide[];
    if (Array.isArray(parsed) && parsed.length) guides = parsed;
  } catch {
    // Dados corrompidos: mantém os dados sintéticos iniciais.
  }
}

function subscribe(listener: () => void) {
  hydrate();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  hydrate();
  return guides;
}

function getServerSnapshot() {
  return ISSUED_GUIDES;
}

/** Lista reativa de guias emitidas (mais recentes primeiro). */
export function useIssuedGuides() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Salva automaticamente a guia como emitida e a publica na listagem. */
export function addIssuedGuide(guide: IssuedGuide) {
  hydrate();
  guides = [guide, ...guides.filter((item) => item.numero !== guide.numero)];
  persist();
  emit();
  return guide;
}

/**
 * Monta o documento completo da guia no formato definido pelo sistema
 * (HTML imprimível), usado tanto no download quanto na visualização.
 */
export function buildIssuedGuideDocument(guide: IssuedGuide) {
  const sections = (guide.sections ?? [])
    .map(
      (section) => `
      <section>
        <h2>${escapeHtml(section.title)}</h2>
        <dl>
          ${section.items
            .map(
              (item) =>
                `<div><dt>${escapeHtml(item.label)}</dt><dd>${escapeHtml(
                  item.value || "—",
                )}</dd></div>`,
            )
            .join("")}
        </dl>
      </section>`,
    )
    .join("");

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Guia ${escapeHtml(guide.numero)} — Guias+</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: "Helvetica Neue", Arial, sans-serif; margin: 32px; color: #111827; }
      header { border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 20px; }
      h1 { font-size: 18px; margin: 0 0 4px; }
      .meta { font-size: 12px; color: #4b5563; }
      section { margin-bottom: 18px; page-break-inside: avoid; }
      h2 { font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: #374151;
           border-bottom: 1px solid #d1d5db; padding-bottom: 4px; margin: 0 0 8px; }
      dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 16px; margin: 0; }
      dt { font-size: 10px; text-transform: uppercase; color: #6b7280; }
      dd { font-size: 13px; margin: 2px 0 0; }
      footer { margin-top: 28px; font-size: 11px; color: #6b7280; border-top: 1px solid #d1d5db; padding-top: 10px; }
    </style>
  </head>
  <body>
    <header>
      <h1>Guia ${escapeHtml(guide.type)} — Nº ${escapeHtml(guide.numero)}</h1>
      <p class="meta">
        ${escapeHtml(guide.operadora)} · emitida em ${escapeHtml(formatIssuedAt(guide.issuedAt))}
        · status ${escapeHtml(guide.status)}
      </p>
    </header>
    <section>
      <h2>Resumo</h2>
      <dl>
        <div><dt>Paciente</dt><dd>${escapeHtml(guide.patient)}</dd></div>
        <div><dt>Profissional solicitante</dt><dd>${escapeHtml(guide.professional)}</dd></div>
        <div><dt>Procedimento principal</dt><dd>${escapeHtml(guide.procedure)}</dd></div>
        <div><dt>Valor total</dt><dd>${escapeHtml(formatCurrency(guide.total))}</dd></div>
      </dl>
    </section>
    ${sections}
    <footer>Documento gerado automaticamente pelo Guias+ — dados de protótipo.</footer>
  </body>
</html>`;
}

/** Disponibiliza a guia gerada para download no navegador. */
export function downloadIssuedGuide(guide: IssuedGuide) {
  const blob = new Blob([buildIssuedGuideDocument(guide)], {
    type: "text/html;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `guia-${guide.numero.replace(/[^\w-]+/g, "-")}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Abre a guia completa gerada em uma nova aba para consulta/impressão. */
export function openIssuedGuideDocument(guide: IssuedGuide) {
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) return false;
  win.document.write(buildIssuedGuideDocument(guide));
  win.document.close();
  return true;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
