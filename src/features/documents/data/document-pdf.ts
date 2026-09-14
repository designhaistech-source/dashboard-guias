import { jsPDF } from "jspdf";

import letterheadLogoAsset from "@/assets/haistech-logo.png.asset.json";
import watermarkAsset from "@/assets/haistech-marca-agua.png.asset.json";
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

/** Folha física do papel timbrado: A5 retrato real (148 × 210 mm). */
export const LETTERHEAD_PAGE = {
  pageWidth: 148,
  pageHeight: 210,
} as const;

/**
 * Formato exato passado ao jsPDF, em mm. Usar os números em vez do apelido
 * "a5" evita a diferença de arredondamento do alias (148,17 × 209,98), que
 * fazia o visualizador reescalar a folha ao imprimir.
 */
const LETTERHEAD_FORMAT: [number, number] = [
  LETTERHEAD_PAGE.pageWidth,
  LETTERHEAD_PAGE.pageHeight,
];
const A4_FORMAT: [number, number] = [PDF_LAYOUT.pageWidth, PDF_LAYOUT.pageHeight];

/** Cria o documento jsPDF já com a folha física correta da variante. */
function createPdf(variant: DocumentPdfVariant): jsPDF {
  return new jsPDF({
    unit: "mm",
    format: variant === "letterhead" ? LETTERHEAD_FORMAT : A4_FORMAT,
    orientation: "portrait",
    compress: true,
  });
}

/** Papel timbrado A5: composição proporcional ao A4 anterior. */
export const LETTERHEAD_LAYOUT = {
  margin: 14,
  /** Início do corpo, abaixo da marca centralizada. */
  bodyStartY: 44,
  /** Altura reservada ao rodapé timbrado. */
  footerReserve: 30,
  /** Faixa tricolor acima dos dados institucionais. */
  footerBarY: 184,
  logoHeight: 10,
  logoWidth: 34,
  /** Marca gráfica suave no canto inferior direito. */
  watermarkWidth: 55,
  watermarkHeight: 65,
  /** Fica acima da faixa tricolor: nada é cortado na borda da folha A5. */
  watermarkBottom: 28,
} as const;

/** Dimensões (mm) da folha conforme a variante. */
export function pageSizeFor(variant: DocumentPdfVariant) {
  return variant === "letterhead"
    ? { pageWidth: LETTERHEAD_PAGE.pageWidth, pageHeight: LETTERHEAD_PAGE.pageHeight }
    : { pageWidth: PDF_LAYOUT.pageWidth, pageHeight: PDF_LAYOUT.pageHeight };
}

/** Dados institucionais impressos no rodapé do papel timbrado. */
export const LETTERHEAD_INSTITUTION = {
  addressLines: [
    "Av. Senador Salgado Filho, 3000 - Bloco Reitoria",
    "59078-900 - Lagoa Nova - Natal/RN",
    "SALA - B418",
  ],
  contactLines: ["CNPJ: 54.128.652/0001-35", "haisolutionsbr@gmail.com", "(84) 99640-5345"],
} as const;

/** Cores da faixa tricolor do rodapé (identidade HaisTech). */
export const LETTERHEAD_BAR = [
  [18, 87, 148],
  [92, 170, 253],
  [148, 192, 143],
] as const;

/** Dados do profissional usados no bloco de assinatura manual. */
export const PDF_SIGNATURE = {
  name: CURRENT_USER.name,
  council: CURRENT_USER.crm,
  caption: "Assinatura e carimbo do profissional",
} as const;

/** Conversão de pontos tipográficos para milímetros. */
export const PT_TO_MM = 0.3528;

/**
 * Geometria única da folha, em mm, compartilhada pelo PDF, pela impressão e
 * pela pré-visualização. Todo desenho do documento deve sair daqui para que os
 * três caminhos produzam exatamente o mesmo layout.
 */
export function sheetGeometry(variant: DocumentPdfVariant) {
  const letterhead = variant === "letterhead";
  return {
    page: pageSizeFor(variant),
    margin: letterhead ? LETTERHEAD_LAYOUT.margin : PAGE_MARGIN,
    bodyPt: 11,
    signature: {
      halfLine: letterhead ? 26 : 35,
      namePt: letterhead ? 9 : 10,
      nameDy: letterhead ? 4 : 5,
      councilDy: letterhead ? 8 : 10,
      captionPt: letterhead ? 8 : 9,
      captionDy: letterhead ? 12.5 : 16,
      /** No timbrado não há legenda: apenas linha, nome e CRM. */
      caption: !letterhead,
      /** No timbrado o nome sai como "Dr(a). ..."; no A4, o nome cadastrado. */
      name: letterhead
        ? `Dr(a). ${PDF_SIGNATURE.name.replace(/^Dr\.?a?\.?\s*/i, "")}`
        : PDF_SIGNATURE.name,
    },
    /** Cabeçalho com título e paciente existe apenas na folha A4 padrão. */
    header: letterhead
      ? null
      : {
          titlePt: 14,
          titleY: PDF_LAYOUT.titleY,
          patientPt: 10,
          patientY: PDF_LAYOUT.patientY,
        },
  };
}

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
      bottomLimit: LETTERHEAD_PAGE.pageHeight - LETTERHEAD_LAYOUT.footerReserve - 8,
      topY: LETTERHEAD_LAYOUT.bodyStartY - 8,
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
  const letterhead = variant === "letterhead";
  const pdf = createPdf(variant);
  const { pageHeight, pageWidth } = pageSizeFor(variant);
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
  const gap = letterhead ? 24 : SIGNATURE_GAP;
  const block = letterhead ? 12 : SIGNATURE_BLOCK_HEIGHT;
  const signatureLimit = letterhead
    ? pageHeight - LETTERHEAD_LAYOUT.footerReserve
    : pageHeight - PAGE_MARGIN;

  // No timbrado a assinatura fica ancorada na região inferior da folha (logo
  // acima do rodapé), com espaço em branco livre acima da linha para assinar.
  if (letterhead) {
    const anchorY = signatureLimit - block;
    if (anchorY >= cursorY + gap) {
      pages[pages.length - 1].signatureY = anchorY;
    } else {
      pages.push({ lines: [], signatureY: anchorY });
    }
    return pages;
  }

  const signatureY = cursorY + gap;
  if (signatureY + block > signatureLimit) {
    pages.push({ lines: [], signatureY: m.topY + gap });
  } else {
    pages[pages.length - 1].signatureY = signatureY;
  }

  return pages;
}

/** Carrega uma imagem como data URL para embutir no PDF (falha silenciosa). */
async function loadImageDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
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

/**
 * Desenha o papel timbrado HaisTech: marca centralizada no topo, marca d'água
 * discreta no canto inferior direito e rodapé institucional com faixa tricolor.
 */
function drawLetterhead(pdf: jsPDF, logo: string | null, watermark: string | null) {
  const { pageWidth, pageHeight } = LETTERHEAD_PAGE;
  const m = LETTERHEAD_LAYOUT.margin;
  const {
    logoWidth,
    logoHeight,
    footerBarY,
    watermarkWidth,
    watermarkHeight,
    watermarkBottom,
  } = LETTERHEAD_LAYOUT;

  // Marca d'água atrás de tudo (proporção original 292x346).
  if (watermark) {
    pdf.addImage(
      watermark,
      "PNG",
      pageWidth - watermarkWidth,
      pageHeight - watermarkHeight - watermarkBottom,
      watermarkWidth,
      watermarkHeight,
    );
  }

  if (logo) {
    pdf.addImage(logo, "PNG", (pageWidth - logoWidth) / 2, 14, logoWidth, logoHeight);
  } else {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);
    pdf.setTextColor(18, 51, 82);
    pdf.text("HaisTech", pageWidth / 2, 22, { align: "center" });
  }

  // Faixa tricolor da identidade, dividida em três blocos.
  const barWidth = pageWidth / 3;
  LETTERHEAD_BAR.forEach(([r, g, b], index) => {
    pdf.setFillColor(r, g, b);
    pdf.rect(index * barWidth, footerBarY, barWidth + 0.2, 1.4, "F");
  });

  // Dados institucionais em duas colunas centralizadas.
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.5);
  pdf.setTextColor(60);
  const leftCenter = m + (pageWidth / 2 - m) / 2;
  const rightCenter = pageWidth / 2 + (pageWidth / 2 - m) / 2;
  LETTERHEAD_INSTITUTION.addressLines.forEach((line, index) => {
    pdf.text(line, leftCenter, footerBarY + 6 + index * 3.4, { align: "center" });
  });
  LETTERHEAD_INSTITUTION.contactLines.forEach((line, index) => {
    pdf.text(line, rightCenter, footerBarY + 6 + index * 3.4, { align: "center" });
  });
}

/**
 * Gera e baixa o PDF do documento. "default" sai em A4 retrato; "letterhead"
 * sai em A5 retrato real (148 × 210 mm), como papel timbrado de consultório,
 * com o texto do editor como elemento principal da página.
 * Retorna o nome do arquivo salvo.
 */
export async function downloadDocumentPdf(
  title: string,
  paciente: string,
  bodyHtml: string,
  variant: DocumentPdfVariant = "default",
): Promise<string> {
  const pdf = createPdf(variant);
  const geometry = sheetGeometry(variant);
  const pageWidth = geometry.page.pageWidth;
  const pages = layoutDocumentPdf(bodyHtml, variant);
  const letterhead = variant === "letterhead";
  const margin = geometry.margin;
  const [logo, watermark] = letterhead
    ? await Promise.all([
        loadImageDataUrl(letterheadLogoAsset.url),
        loadImageDataUrl(watermarkAsset.url),
      ])
    : [null, null];

  pages.forEach((page, index) => {
    if (index > 0) pdf.addPage();

    if (letterhead) {
      drawLetterhead(pdf, logo, watermark);
    } else if (index === 0 && geometry.header) {
      const header = geometry.header;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(header.titlePt);
      pdf.text(title.toUpperCase(), pageWidth / 2, header.titleY, { align: "center" });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(header.patientPt);
      pdf.setTextColor(90);
      pdf.text(`Paciente: ${paciente || "—"}`, pageWidth / 2, header.patientY, {
        align: "center",
      });
    }

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(20);
    pdf.setFontSize(geometry.bodyPt);
    for (const line of page.lines) {
      pdf.text(line.text, margin, line.y);
    }

    if (page.signatureY !== undefined) {
      const signatureY = page.signatureY;
      const s = geometry.signature;
      pdf.setTextColor(20);
      pdf.setDrawColor(60);
      pdf.setLineWidth(0.2);
      pdf.line(pageWidth / 2 - s.halfLine, signatureY, pageWidth / 2 + s.halfLine, signatureY);
      pdf.setFontSize(s.namePt);
      pdf.text(s.name, pageWidth / 2, signatureY + s.nameDy, { align: "center" });
      pdf.text(PDF_SIGNATURE.council, pageWidth / 2, signatureY + s.councilDy, {
        align: "center",
      });
      if (s.caption) {
        pdf.setFontSize(s.captionPt);
        pdf.setTextColor(90);
        pdf.text(PDF_SIGNATURE.caption, pageWidth / 2, signatureY + s.captionDy, {
          align: "center",
        });
      }
    }
  });

  const fileName = buildFileName(title, paciente);
  pdf.save(fileName);
  return fileName;
}
