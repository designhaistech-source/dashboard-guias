import { jsPDF } from "jspdf";

import logoAsset from "@/assets/haisguias-logo.png.asset.json";
import { CURRENT_USER } from "@/lib/current-user";

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

/**
 * Variantes de folha:
 * - "default": documento com título e identificação do paciente no topo.
 * - "letterhead": papel timbrado de consultório — marca discreta no cabeçalho,
 *   grande área livre para o texto e rodapé leve com a identidade HaisTech.
 */
export type DocumentPdfVariant = "default" | "letterhead";

/** Papel timbrado: margens mais generosas e área de conteúdo ampla. */
export const LETTERHEAD_LAYOUT = {
  margin: 24,
  /** Início do corpo, abaixo da faixa da marca. */
  bodyStartY: 54,
  /** Altura reservada ao rodapé timbrado. */
  footerReserve: 26,
  /** Linha fina sob o cabeçalho. */
  headerRuleY: 40,
  logoHeight: 9,
  logoWidth: 30,
} as const;

/** Dados do profissional usados no bloco de assinatura manual. */
export const PDF_SIGNATURE = {
  name: CURRENT_USER.name,
  council: CURRENT_USER.crm,
  caption: "Assinatura e carimbo do profissional",
} as const;

/** Espaço reservado (mm) entre o fim do conteúdo e a linha de assinatura. */
const SIGNATURE_GAP = 18;
/** Altura total (mm) do bloco de assinatura: linha + nome + CRM + legenda. */
const SIGNATURE_BLOCK_HEIGHT = 20;

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

  // Apenas blocos "folha": um container que envolve outros blocos repetiria
  // o mesmo texto e faria o conteúdo aparecer duas vezes no documento.
  const blocks = Array.from(doc.querySelectorAll("p, div, li, h1, h2, h3")).filter(
    (el) => !el.querySelector("p, div, li, h1, h2, h3"),
  );
  const raw = blocks.length
    ? blocks.map((el) => el.textContent ?? "")
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

/** Métricas de página conforme a variante escolhida. */
function metricsFor(variant: DocumentPdfVariant) {
  if (variant === "letterhead") {
    return {
      margin: LETTERHEAD_LAYOUT.margin,
      bodyStartY: LETTERHEAD_LAYOUT.bodyStartY,
      bottomLimit: PDF_LAYOUT.pageHeight - LETTERHEAD_LAYOUT.footerReserve - 12,
      topY: LETTERHEAD_LAYOUT.bodyStartY - 12,
    };
  }
  return {
    margin: PAGE_MARGIN,
    bodyStartY: PDF_LAYOUT.bodyStartY,
    bottomLimit: PDF_LAYOUT.pageHeight - PAGE_MARGIN,
    topY: PAGE_MARGIN,
  };
}

/**
 * Calcula a paginação real do documento (mesma medição de texto do PDF),
 * para que a pré-visualização mostre as quebras exatas de página.
 */
export function layoutDocumentPdf(
  bodyHtml: string,
  variant: DocumentPdfVariant = "default",
): DocumentPdfPage[] {
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const { pageHeight, pageWidth } = PDF_LAYOUT;
  const m = metricsFor(variant);
  const contentWidth = pageWidth - m.margin * 2;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);

  const pages: DocumentPdfPage[] = [{ lines: [] }];
  let cursorY = m.bodyStartY;

  for (const paragraph of htmlToParagraphs(bodyHtml)) {
    const lines = pdf.splitTextToSize(paragraph, contentWidth) as string[];
    for (const line of lines) {
      if (cursorY > m.bottomLimit) {
        pages.push({ lines: [] });
        cursorY = m.topY;
      }
      pages[pages.length - 1].lines.push({ text: line, y: cursorY });
      cursorY += LINE_HEIGHT;
    }
    cursorY += LINE_HEIGHT * 0.6;
  }

  // A assinatura segue o fluxo do conteúdo: apenas o espaço da assinatura
  // manuscrita a separa do texto/data. Se o bloco não couber inteiro na
  // página, ele vai completo para a próxima (sem páginas em branco extras).
  const signatureY = cursorY + SIGNATURE_GAP;
  const signatureLimit =
    variant === "letterhead" ? pageHeight - LETTERHEAD_LAYOUT.footerReserve : pageHeight - PAGE_MARGIN;
  if (signatureY + SIGNATURE_BLOCK_HEIGHT > signatureLimit) {
    pages.push({ lines: [], signatureY: m.topY + SIGNATURE_GAP });
  } else {
    pages[pages.length - 1].signatureY = signatureY;
  }

  return pages;
}

/** Carrega a logo como data URL para embutir no PDF (falha silenciosa). */
async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const response = await fetch(logoAsset.url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Desenha o timbre HaisTech: marca no topo, filete lateral e rodapé leve. */
function drawLetterhead(pdf: jsPDF, logo: string | null, pageIndex: number) {
  const { pageWidth, pageHeight } = PDF_LAYOUT;
  const m = LETTERHEAD_LAYOUT.margin;

  // Filete vertical discreto na borda esquerda (elemento gráfico da marca).
  pdf.setFillColor(214, 228, 240);
  pdf.rect(0, 0, 3, pageHeight, "F");
  pdf.setFillColor(37, 99, 172);
  pdf.rect(0, 28, 3, 44, "F");

  if (logo) {
    pdf.addImage(logo, "PNG", m, 20, LETTERHEAD_LAYOUT.logoWidth, LETTERHEAD_LAYOUT.logoHeight);
  } else {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(37, 99, 172);
    pdf.text("HaisGuias", m, 27);
  }

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(130);
  pdf.text("HaisTech · Saúde digital", m, 34);

  // Rótulo discreto do tipo de documento, alinhado à direita.
  pdf.setFontSize(9);
  pdf.setTextColor(120);
  pdf.text("Solicitação", pageWidth - m, 27, { align: "right" });

  pdf.setDrawColor(219, 226, 234);
  pdf.setLineWidth(0.3);
  pdf.line(m, LETTERHEAD_LAYOUT.headerRuleY, pageWidth - m, LETTERHEAD_LAYOUT.headerRuleY);

  // Rodapé timbrado.
  const footerY = pageHeight - 16;
  pdf.setDrawColor(228, 234, 240);
  pdf.line(m, footerY - 6, pageWidth - m, footerY - 6);
  pdf.setFontSize(7.5);
  pdf.setTextColor(150);
  pdf.text("HaisTech · HaisGuias", m, footerY);
  pdf.text(`Página ${pageIndex + 1}`, pageWidth - m, footerY, { align: "right" });

  // Marca gráfica suave no canto inferior direito (não centralizada).
  pdf.setFillColor(238, 244, 250);
  pdf.circle(pageWidth - 14, pageHeight - 34, 12, "F");
  pdf.setFillColor(246, 250, 253);
  pdf.circle(pageWidth - 26, pageHeight - 26, 7, "F");
}

/**
 * Gera e baixa o PDF do documento (A4 retrato). Na variante "letterhead" o
 * arquivo sai como papel timbrado de consultório, com o texto do editor como
 * elemento principal da página.
 * Retorna o nome do arquivo salvo.
 */
export async function downloadDocumentPdf(
  title: string,
  paciente: string,
  bodyHtml: string,
  variant: DocumentPdfVariant = "default",
): Promise<string> {
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pages = layoutDocumentPdf(bodyHtml, variant);
  const letterhead = variant === "letterhead";
  const margin = letterhead ? LETTERHEAD_LAYOUT.margin : PAGE_MARGIN;
  const logo = letterhead ? await loadLogoDataUrl() : null;

  pages.forEach((page, index) => {
    if (index > 0) pdf.addPage();

    if (letterhead) {
      drawLetterhead(pdf, logo, index);
    } else if (index === 0) {
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
      pdf.text(line.text, margin, line.y);
    }

    if (page.signatureY !== undefined) {
      const signatureY = page.signatureY;
      pdf.setTextColor(20);
      pdf.setDrawColor(60);
      pdf.setLineWidth(0.2);
      pdf.line(pageWidth / 2 - 35, signatureY, pageWidth / 2 + 35, signatureY);
      pdf.setFontSize(10);
      pdf.text(
        letterhead ? `Dr(a). ${PDF_SIGNATURE.name.replace(/^Dr\.?a?\.?\s*/i, "")}` : PDF_SIGNATURE.name,
        pageWidth / 2,
        signatureY + 5,
        { align: "center" },
      );
      pdf.text(PDF_SIGNATURE.council, pageWidth / 2, signatureY + 10, {
        align: "center",
      });
      pdf.setFontSize(9);
      pdf.setTextColor(90);
      pdf.text(PDF_SIGNATURE.caption, pageWidth / 2, signatureY + 16, {
        align: "center",
      });
    }
  });

  const fileName = buildFileName(title, paciente);
  pdf.save(fileName);
  return fileName;
}
