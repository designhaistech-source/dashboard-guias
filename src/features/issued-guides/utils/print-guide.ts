/**
 * Imprime (ou salva em PDF, via diálogo do navegador) um trecho de markup já
 * renderizado, reaproveitando as folhas de estilo da aplicação para que a guia
 * saia idêntica à pré-visualização preenchida.
 */

/** Largura fixa da folha da guia (modelo oficial), usada para escalar. */
const SHEET_WIDTH_PX = 1100;
const MM_TO_PX = 96 / 25.4;
/** Margem física da página, em mm (ajuste fino contra corte de borda). */
const PAGE_MARGIN_MM = 8;
/** Folga extra, em px CSS, para a borda de 1px da guia nunca tocar o limite. */
const EDGE_GUARD_PX = 4;
/* Menor área útil entre A4 paisagem (297x210mm) e Letter paisagem
   (279,4x215,9mm): escalando pela interseção, a guia nunca corta a lateral
   nem quebra em duas páginas, qualquer que seja o papel escolhido no diálogo.
   Fator de folga contra arredondamento do navegador. */
const SAFETY = 0.97;
const PRINT_CONTENT_WIDTH_PX =
  (279.4 - PAGE_MARGIN_MM * 2) * MM_TO_PX * SAFETY - EDGE_GUARD_PX * 2;
const PRINT_CONTENT_HEIGHT_PX =
  (210 - PAGE_MARGIN_MM * 2) * MM_TO_PX * SAFETY - EDGE_GUARD_PX * 2;

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
      @page { size: landscape; margin: ${PAGE_MARGIN_MM}mm; }
      html, body { margin: 0; padding: 0; background: #fff; }
      .print-guard { padding: ${EDGE_GUARD_PX}px; overflow: hidden; }
      .print-scale { width: ${SHEET_WIDTH_PX}px; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    </style>
  </head>
  <body><div class="print-guard"><div class="print-scale">${markup}</div></div></body>
</html>`);
  doc.close();

  await waitForImages(doc);

  // Escala considerando também a altura: em paisagem a folha da guia é mais
  // alta que a área útil e, sem isso, o PDF sairia em duas páginas.
  const sheet = doc.querySelector<HTMLElement>(".print-scale");
  if (sheet) {
    // scrollWidth/Height capturam bordas e conteúdo que estouram a largura
    // nominal da folha, evitando corte nas laterais.
    const rect = sheet.getBoundingClientRect();
    const naturalWidth = Math.ceil(
      Math.max(sheet.scrollWidth, rect.width, SHEET_WIDTH_PX),
    );
    const naturalHeight = Math.ceil(Math.max(sheet.scrollHeight, rect.height)) || 1;
    const scale = Math.min(
      1,
      PRINT_CONTENT_WIDTH_PX / naturalWidth,
      PRINT_CONTENT_HEIGHT_PX / naturalHeight,
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
