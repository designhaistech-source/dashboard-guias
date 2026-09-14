import letterheadLogoAsset from "@/assets/haistech-logo.png.asset.json";
import watermarkAsset from "@/assets/haistech-marca-agua.png.asset.json";

import {
  LETTERHEAD_BAR,
  LETTERHEAD_INSTITUTION,
  LETTERHEAD_LAYOUT,
  PDF_SIGNATURE,
  PT_TO_MM,
  layoutDocumentPdf,
  sheetGeometry,
  type DocumentPdfPage,
  type DocumentPdfVariant,
} from "./document-pdf";

/**
 * Monta o HTML de impressão a partir da MESMA geometria e paginação usadas
 * pelo PDF e pela pré-visualização (sheetGeometry + layoutDocumentPdf).
 * Cada linha é posicionada nas coordenadas exatas do PDF, para que imprimir,
 * baixar e pré-visualizar produzam folhas idênticas.
 */

const mm = (value: number) => `${value}mm`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Texto posicionado pela linha de base, como o jsPDF faz. */
function textAt(text: string, y: number, sizePt: number, style: string): string {
  const height = sizePt * PT_TO_MM;
  return `<span style="position:absolute;top:${mm(y - height * 0.8)};font-size:${sizePt}pt;line-height:1.1;white-space:pre;${style}">${escapeHtml(text)}</span>`;
}

/** Papel timbrado HaisTech (marca d'água, logo, faixa e rodapé institucional). */
function letterheadFrame(): string {
  const { margin, logoHeight, footerBarY, watermarkWidth, watermarkHeight, watermarkBottom } =
    LETTERHEAD_LAYOUT;
  const columnWidth = `calc(50% - ${mm(margin)})`;
  const bars = LETTERHEAD_BAR.map(
    ([r, g, b]) => `<i style="flex:1;background:rgb(${r},${g},${b})"></i>`,
  ).join("");
  const column = (lines: readonly string[], side: "left" | "right") =>
    `<div style="position:absolute;${side}:${mm(margin)};top:${mm(footerBarY + 4)};width:${columnWidth};text-align:center;font-size:6.5pt;line-height:1.5;color:#3c3c3c">${lines
      .map((line) => escapeHtml(line))
      .join("<br />")}</div>`;

  return `
    <img src="${watermarkAsset.url}" alt="" aria-hidden="true" style="position:absolute;right:0;top:${mm(
      sheetGeometry("letterhead").page.pageHeight - watermarkHeight - watermarkBottom,
    )};width:${mm(watermarkWidth)};height:${mm(watermarkHeight)}" />
    <img src="${letterheadLogoAsset.url}" alt="HaisTech" style="position:absolute;left:50%;transform:translateX(-50%);top:${mm(
      14,
    )};height:${mm(logoHeight)}" />
    <div style="position:absolute;left:0;right:0;top:${mm(footerBarY)};display:flex;height:${mm(1.4)}">${bars}</div>
    ${column(LETTERHEAD_INSTITUTION.addressLines, "left")}
    ${column(LETTERHEAD_INSTITUTION.contactLines, "right")}
  `;
}

/** Uma folha do documento, com cabeçalho, conteúdo e assinatura na posição do PDF. */
function sheet(
  page: DocumentPdfPage,
  index: number,
  title: string,
  paciente: string,
  variant: DocumentPdfVariant,
): string {
  const geometry = sheetGeometry(variant);
  const { pageWidth, pageHeight } = geometry.page;
  const letterhead = variant === "letterhead";
  const centered = "left:0;right:0;text-align:center;";

  const header =
    !letterhead && index === 0 && geometry.header
      ? textAt(
          title.toUpperCase(),
          geometry.header.titleY,
          geometry.header.titlePt,
          `${centered}font-weight:700;color:#141414`,
        ) +
        textAt(
          `Paciente: ${paciente || "—"}`,
          geometry.header.patientY,
          geometry.header.patientPt,
          `${centered}color:#5a5a5a`,
        )
      : "";

  const body = page.lines
    .map((line) =>
      textAt(line.text, line.y, geometry.bodyPt, `left:${mm(geometry.margin)};color:#141414`),
    )
    .join("");

  const s = geometry.signature;
  const signature =
    page.signatureY === undefined
      ? ""
      : `<div style="position:absolute;left:${mm(pageWidth / 2 - s.halfLine)};top:${mm(
          page.signatureY,
        )};width:${mm(s.halfLine * 2)};border-top:0.2mm solid #3c3c3c"></div>` +
        textAt(s.name, page.signatureY + s.nameDy, s.namePt, `${centered}color:#141414`) +
        textAt(
          PDF_SIGNATURE.council,
          page.signatureY + s.councilDy,
          s.namePt,
          `${centered}color:#141414`,
        ) +
        (s.caption
          ? textAt(
              PDF_SIGNATURE.caption,
              page.signatureY + s.captionDy,
              s.captionPt,
              `${centered}color:#5a5a5a`,
            )
          : "");

  return `<div class="folha" style="width:${mm(pageWidth)};height:${mm(pageHeight)}">
    ${letterhead ? letterheadFrame() : ""}
    ${header}
    ${body}
    ${signature}
  </div>`;
}

/** Documento HTML completo pronto para impressão, no tamanho físico da variante. */
export function buildPrintDocument(
  title: string,
  paciente: string,
  bodyHtml: string,
  variant: DocumentPdfVariant = "default",
): string {
  const { pageWidth, pageHeight } = sheetGeometry(variant).page;
  const pages = layoutDocumentPdf(bodyHtml, variant);
  const size = `${pageWidth}mm ${pageHeight}mm`;

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  /* A página física é a mesma do PDF: nada é escalonado na impressão. */
  @page { size: ${size}; margin: 0; }
  html, body { margin: 0; padding: 0; width: ${mm(pageWidth)}; }
  body { font-family: Helvetica, Arial, sans-serif; color: #141414; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .folha { position: relative; box-sizing: border-box; overflow: hidden; page-break-after: always; break-after: page; }
  .folha:last-child { page-break-after: auto; break-after: auto; }
  @media print {
    html, body { width: ${mm(pageWidth)}; height: ${mm(pageHeight)}; }
  }
</style></head><body>${pages.map((page, index) => sheet(page, index, title, paciente, variant)).join("")}</body></html>`;
}
