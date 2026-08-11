/**
 * Imprime (ou salva em PDF, via diálogo do navegador) um trecho de markup já
 * renderizado, reaproveitando as folhas de estilo da aplicação e as mesmas
 * constantes do modal de pré-visualização (`ScaledGuideSheet`), para que a guia
 * saia idêntica ao que o usuário vê na tela.
 */
import {
  GUIDE_SHEET_WIDTH_PX,
  PRINT_SHEET_CSS,
  getGuideSheetScale,
} from "@/lib/guide-sheet";


/**
 * Coleta todo o CSS da aplicação já resolvido em texto. Copiar apenas as tags
 * `<link>` não funciona: o diálogo de impressão abre antes de a folha externa
 * carregar no iframe e a guia sai sem estilo algum.
 */
async function collectCssText(): Promise<string> {
  const chunks: string[] = [];

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = Array.from(sheet.cssRules).map((rule) => rule.cssText);
      if (rules.length > 0) {
        chunks.push(rules.join("\n"));
        continue;
      }
    } catch {
      // Folha de outra origem: cai para o fetch abaixo.
    }

    const href = sheet.href;
    if (!href) continue;
    try {
      const response = await fetch(href);
      if (response.ok) chunks.push(await response.text());
    } catch {
      // Ignora folhas inacessíveis.
    }
  }

  return chunks.join("\n");
}

/** Motivos possíveis de falha, usados para escolher a mensagem ao usuário. */
export type PrintFailureReason =
  | "empty-markup"
  | "iframe-blocked"
  | "print-blocked"
  | "unknown";

export type PrintGuideResult =
  | { ok: true }
  | { ok: false; reason: PrintFailureReason };

export const PRINT_FAILURE_MESSAGES: Record<PrintFailureReason, string> = {
  "empty-markup":
    "Não foi possível montar a guia completa. Abra a visualização da guia e tente novamente.",
  "iframe-blocked":
    "O navegador bloqueou a geração do PDF. Verifique as permissões do site e tente novamente.",
  "print-blocked":
    "O navegador impediu a abertura do diálogo de impressão. Permita janelas e diálogos para este site e tente novamente.",
  unknown:
    "Falha inesperada ao gerar o PDF da guia. Tente novamente em alguns instantes.",
};

export async function printGuideMarkup(
  markup: string,
  title: string,
): Promise<PrintGuideResult> {
  if (!markup.trim()) return { ok: false, reason: "empty-markup" };

  let iframe: HTMLIFrameElement | null = null;

  try {
    const css = await collectCssText();

    iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText =
      "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument;
    if (!doc) {
      iframe.remove();
      return { ok: false, reason: "iframe-blocked" };
    }

    doc.open();
    doc.write(`<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>${css}</style>
    <style>${PRINT_SHEET_CSS}</style>
  </head>
  <body><div class="print-guard"><div class="print-scale">${markup}</div></div></body>
</html>`);
    doc.close();

    await waitForImages(doc);

    // Escala considerando também a altura: em paisagem a folha da guia é mais
    // alta que a área útil e, sem isso, o PDF sairia em duas páginas.
    const sheet = doc.querySelector<HTMLElement>(".print-scale");
    if (!sheet) {
      iframe.remove();
      return { ok: false, reason: "empty-markup" };
    }

    // scrollWidth/Height capturam bordas e conteúdo que estouram a largura
    // nominal da folha, evitando corte nas laterais.
    const rect = sheet.getBoundingClientRect();
    const naturalWidth = Math.ceil(
      Math.max(sheet.scrollWidth, rect.width, GUIDE_SHEET_WIDTH_PX),
    );
    const naturalHeight = Math.ceil(Math.max(sheet.scrollHeight, rect.height)) || 1;
    sheet.style.zoom = String(getGuideSheetScale(naturalWidth, naturalHeight));
    await new Promise((resolve) => window.setTimeout(resolve, 100));

    const frameWindow = iframe.contentWindow;
    if (!frameWindow || typeof frameWindow.print !== "function") {
      iframe.remove();
      return { ok: false, reason: "print-blocked" };
    }

    try {
      frameWindow.focus();
      frameWindow.print();
    } catch {
      iframe.remove();
      return { ok: false, reason: "print-blocked" };
    }

    const frameToRemove = iframe;
    window.setTimeout(() => frameToRemove.remove(), 1500);
    return { ok: true };
  } catch {
    iframe?.remove();
    return { ok: false, reason: "unknown" };
  }
}


/** Evita imprimir antes de logos/imagens da guia terminarem de carregar. */
async function waitForImages(doc: Document) {
  const images = Array.from(doc.images);
  await Promise.all(
    images.map(
      (image) =>
        image.complete ||
        new Promise<void>((resolve) => {
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  );
  await new Promise((resolve) => window.setTimeout(resolve, 250));
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
