import { jsPDF } from "jspdf";

const PAGE_MARGIN = 20; // mm
const LINE_HEIGHT = 6.4; // mm

/** Dimensões (mm) usadas pelo PDF e pela pré-visualização paginada. */
export const PDF_LAYOUT = {
  pageWidth: 210,
  pageHeight: 297,
  margin: PAGE_MARGIN,
  lineHeight: LINE_HEIGHT,
  titleY: PAGE_MARGIN + 4,
  patientY: PAGE_MARGIN + 12,
  bodyStartY: PAGE_MARGIN + 26,
} as const;

/** Assinatura mockada exibida no fim do documento. */
export const PDF_SIGNATURE = {
  name: "Dr. Fulano de Tal — CRM 47231/RN",
  note: "Documento sem assinatura digital — imprima para assinar manualmente.",
} as const;

/** Uma linha posicionada dentro de uma página A4. */
export interface DocumentPdfLine {
  text: string;
  /** Posição vertical em mm, a partir do topo da página. */
  y: number;
}

/** Página resultante da paginação — mesma quebra usada no PDF. */
export interface DocumentPdfPage {
  lines: DocumentPdfLine[];
  /** Posição da linha de assinatura (mm) quando ela cai nesta página. */
  signatureY?: number;
}

/** Converte o HTML do editor em parágrafos de texto simples. */
function htmlToParagraphs(html: string): string[] {
  if (typeof window === "undefined") return [];

  const doc = new DOMParser().parseFromString(
    `<div>${html.replace(/<br\s*\/?>/gi, "\n")}</div>`,
    "text/html",
  );

  const blocks = doc.querySelectorAll("p, div, li, h1, h2, h3");
  const raw = blocks.length
    ? Array.from(blocks).map((el) => el.textContent ?? "")
    : [(doc.body.textContent ?? "")];

  return raw
    .flatMap((text) => text.split("\n"))
    .map((text) => text.replace(/\s+/g, " ").trim())
    .filter((text) => text.length > 0);
}

/** Nome de arquivo seguro derivado do título e do paciente. */
function buildFileName(title: string, paciente: string): string {
  const slug = `${title}-${paciente || "documento"}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `${slug || "documento"}.pdf`;
}

/**
 * Calcula a paginação real do documento (mesma medição de texto do PDF),
 * para que a pré-visualização mostre as quebras exatas de página.
 */
export function layoutDocumentPdf(bodyHtml: string): DocumentPdfPage[] {
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const { pageHeight, pageWidth } = PDF_LAYOUT;
  const contentWidth = pageWidth - PAGE_MARGIN * 2;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);

  const pages: DocumentPdfPage[] = [{ lines: [] }];
  let cursorY = PDF_LAYOUT.bodyStartY;

  for (const paragraph of htmlToParagraphs(bodyHtml)) {
    const lines = pdf.splitTextToSize(paragraph, contentWidth) as string[];
    for (const line of lines) {
      if (cursorY > pageHeight - PAGE_MARGIN - 30) {
        pages.push({ lines: [] });
        cursorY = PAGE_MARGIN;
      }
      pages[pages.length - 1].lines.push({ text: line, y: cursorY });
      cursorY += LINE_HEIGHT;
    }
    cursorY += LINE_HEIGHT * 0.6;
  }

  pages[pages.length - 1].signatureY = Math.min(
    cursorY + 26,
    pageHeight - PAGE_MARGIN - 10,
  );

  return pages;
}

/**
 * Gera e baixa o PDF do documento (A4 retrato) com cabeçalho,
 * corpo do texto e área de assinatura manual.
 * Retorna o nome do arquivo salvo.
 */
export function downloadDocumentPdf(
  title: string,
  paciente: string,
  bodyHtml: string,
): string {
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pages = layoutDocumentPdf(bodyHtml);

  pages.forEach((page, index) => {
    if (index > 0) pdf.addPage();

    if (index === 0) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text(title.toUpperCase(), pageWidth / 2, PDF_LAYOUT.titleY, {
        align: "center",
      });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(90);
      pdf.text(`Paciente: ${paciente || "—"}`, pageWidth / 2, PDF_LAYOUT.patientY, {
        align: "center",
      });
    }

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(20);
    pdf.setFontSize(11);
    for (const line of page.lines) {
      pdf.text(line.text, PAGE_MARGIN, line.y);
    }

    if (page.signatureY !== undefined) {
      const signatureY = page.signatureY;
      pdf.setTextColor(20);
      pdf.line(pageWidth / 2 - 35, signatureY, pageWidth / 2 + 35, signatureY);
      pdf.setFontSize(10);
      pdf.text(PDF_SIGNATURE.name, pageWidth / 2, signatureY + 6, {
        align: "center",
      });
      pdf.setTextColor(120);
      pdf.setFontSize(8);
      pdf.text(PDF_SIGNATURE.note, pageWidth / 2, signatureY + 13, {
        align: "center",
      });
    }
  });

  const fileName = buildFileName(title, paciente);
  pdf.save(fileName);
  return fileName;
}
