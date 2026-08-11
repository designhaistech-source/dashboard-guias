/**
 * Imprime (ou salva em PDF, via diálogo do navegador) um trecho de markup já
 * renderizado, reaproveitando as folhas de estilo da aplicação para que a guia
 * saia idêntica à pré-visualização preenchida.
 */

/** Largura fixa da folha da guia (modelo oficial), usada para escalar em A4. */
const SHEET_WIDTH_PX = 1100;
const MM_TO_PX = 96 / 25.4;
/** Área útil de uma folha A4 paisagem com margens de 6mm, em pixels CSS. */
const A4_LANDSCAPE_CONTENT_WIDTH_PX = (297 - 12) * MM_TO_PX;
const A4_LANDSCAPE_CONTENT_HEIGHT_PX = (210 - 12) * MM_TO_PX;

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

export async function printGuideMarkup(markup: string, title: string) {
  const css = await collectCssText();

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    iframe.remove();
    return false;
  }

  doc.open();
  doc.write(`<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>${css}</style>
    <style>
      @page { size: A4 landscape; margin: 6mm; }
      html, body { margin: 0; padding: 0; background: #fff; }
      /* `zoom` reflui o layout (Chrome e Safari), então a folha reduzida não
         gera uma segunda página em branco como aconteceria com `transform`. */
      .print-scale { width: ${SHEET_WIDTH_PX}px; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    </style>
  </head>
  <body><div class="print-scale">${markup}</div></body>
</html>`);
  doc.close();

  await waitForImages(doc);

  // Escala considerando também a altura: em paisagem a folha da guia é mais
  // alta que a área útil e, sem isso, o PDF sairia em duas páginas.
  const sheet = doc.querySelector<HTMLElement>(".print-scale");
  if (sheet) {
    const naturalHeight = sheet.scrollHeight || 1;
    const scale = Math.min(
      1,
      A4_LANDSCAPE_CONTENT_WIDTH_PX / SHEET_WIDTH_PX,
      A4_LANDSCAPE_CONTENT_HEIGHT_PX / naturalHeight,
    );
    sheet.style.zoom = String(scale);
    await new Promise((resolve) => window.setTimeout(resolve, 100));
  }

  iframe.contentWindow?.focus();
  iframe.contentWindow?.print();
  window.setTimeout(() => iframe.remove(), 1500);
  return true;
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
