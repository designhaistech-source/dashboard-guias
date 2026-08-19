import { jsPDF } from "jspdf";

const PAGE_MARGIN = 20; // mm
const LINE_HEIGHT = 6.4; // mm

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
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text(title.toUpperCase(), pageWidth / 2, PAGE_MARGIN + 4, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(90);
  pdf.text(`Paciente: ${paciente || "—"}`, pageWidth / 2, PAGE_MARGIN + 12, {
    align: "center",
  });

  pdf.setTextColor(20);
  pdf.setFontSize(11);

  let cursorY = PAGE_MARGIN + 26;

  for (const paragraph of htmlToParagraphs(bodyHtml)) {
    const lines = pdf.splitTextToSize(paragraph, contentWidth) as string[];
    for (const line of lines) {
      if (cursorY > pageHeight - PAGE_MARGIN - 30) {
        pdf.addPage();
        cursorY = PAGE_MARGIN;
      }
      pdf.text(line, PAGE_MARGIN, cursorY);
      cursorY += LINE_HEIGHT;
    }
    cursorY += LINE_HEIGHT * 0.6;
  }

  const signatureY = Math.min(cursorY + 26, pageHeight - PAGE_MARGIN - 10);
  pdf.line(pageWidth / 2 - 35, signatureY, pageWidth / 2 + 35, signatureY);
  pdf.setFontSize(10);
  pdf.text("Dr. Fulano de Tal — CRM 47231/RN", pageWidth / 2, signatureY + 6, {
    align: "center",
  });
  pdf.setTextColor(120);
  pdf.setFontSize(8);
  pdf.text(
    "Documento sem assinatura digital — imprima para assinar manualmente.",
    pageWidth / 2,
    signatureY + 13,
    { align: "center" },
  );

  const fileName = buildFileName(title, paciente);
  pdf.save(fileName);
  return fileName;
}
