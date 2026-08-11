/**
 * Imprime (ou salva em PDF, via diálogo do navegador) um trecho de markup já
 * renderizado, reaproveitando as folhas de estilo da aplicação para que a guia
 * saia idêntica à pré-visualização preenchida.
 */
export function printGuideMarkup(markup: string, title: string) {
  const styles = Array.from(
    document.querySelectorAll<HTMLStyleElement | HTMLLinkElement>(
      'style, link[rel="stylesheet"]',
    ),
  )
    .map((node) =>
      node instanceof HTMLLinkElement
        ? `<link rel="stylesheet" href="${node.href}" />`
        : `<style>${node.textContent ?? ""}</style>`,
    )
    .join("\n");

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
    ${styles}
    <style>
      @page { size: A4 portrait; margin: 8mm; }
      html, body { margin: 0; padding: 0; background: #fff; }
    </style>
  </head>
  <body>${markup}</body>
</html>`);
  doc.close();

  const run = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    window.setTimeout(() => iframe.remove(), 1500);
  };

  window.setTimeout(run, 500);
  return true;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
