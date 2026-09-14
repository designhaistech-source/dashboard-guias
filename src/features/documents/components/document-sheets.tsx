import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import letterheadLogoAsset from "@/assets/haistech-logo.png.asset.json";
import watermarkAsset from "@/assets/haistech-marca-agua.png.asset.json";
import type { DocumentPdfPage } from "../data/document-pdf";
import {
  LETTERHEAD_BAR,
  LETTERHEAD_INSTITUTION,
  LETTERHEAD_LAYOUT,
  LETTERHEAD_PAGE,
  PDF_LAYOUT,
  PDF_SIGNATURE,
  pageSizeFor,
} from "../data/document-pdf";

/** Escala de exibição: pixels por milímetro da folha A4. */
const PX_PER_MM = 2.7;
/** Conversão de pontos tipográficos para milímetros. */
const PT_TO_MM = 0.3528;

const mm = (value: number) => `${value * PX_PER_MM}px`;

/** Linha de texto posicionada na folha, na mesma coordenada usada no PDF. */
function PageLine({
  text,
  y,
  size,
  margin,
}: {
  text: string;
  y: number;
  size: number;
  margin: number;
}) {
  const heightMm = size * PT_TO_MM;
  return (
    <span
      className="absolute whitespace-pre text-foreground"
      style={{
        left: mm(margin),
        top: mm(y - heightMm * 0.8),
        fontFamily: "Helvetica, Arial, sans-serif",
        fontSize: mm(heightMm),
        lineHeight: 1.1,
      }}
    >
      {text}
    </span>
  );
}

/** Papel timbrado HaisTech (A5) na pré-visualização da folha. */
function LetterheadFrame() {
  const m = LETTERHEAD_LAYOUT.margin;
  const barTop = LETTERHEAD_LAYOUT.footerBarY;
  const columnWidth = `calc(50% - ${mm(m)})`;
  const { watermarkWidth, watermarkHeight, watermarkBottom } = LETTERHEAD_LAYOUT;
  return (
    <>
      <img
        src={watermarkAsset.url}
        alt=""
        aria-hidden
        className="absolute"
        style={{
          right: 0,
          top: mm(LETTERHEAD_PAGE.pageHeight - watermarkHeight - watermarkBottom),
          width: mm(watermarkWidth),
          height: mm(watermarkHeight),
        }}
      />
      <img
        src={letterheadLogoAsset.url}
        alt="HaisTech"
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: mm(14), height: mm(LETTERHEAD_LAYOUT.logoHeight) }}
      />
      <span className="absolute flex" style={{ left: 0, right: 0, top: mm(barTop) }}>
        {LETTERHEAD_BAR.map(([r, g, b], index) => (
          <span
            key={index}
            className="flex-1"
            style={{ height: mm(1.4), backgroundColor: `rgb(${r} ${g} ${b})` }}
          />
        ))}
      </span>
      <div
        className="absolute flex flex-col items-center gap-[1px] text-center text-foreground"
        style={{ left: mm(m), top: mm(barTop + 4), width: columnWidth, fontSize: mm(6.5 * PT_TO_MM) }}
      >
        {LETTERHEAD_INSTITUTION.addressLines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </div>
      <div
        className="absolute flex flex-col items-center gap-[1px] text-center text-foreground"
        style={{ right: mm(m), top: mm(barTop + 4), width: columnWidth, fontSize: mm(6.5 * PT_TO_MM) }}
      >
        {LETTERHEAD_INSTITUTION.contactLines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </div>
    </>
  );
}

/** Calcula as páginas A4 do documento (mesmo layout do PDF gerado). */
export function useDocumentPages(
  html: string,
  enabled = true,
  variant: "default" | "letterhead" = "default",
): DocumentPdfPage[] | null {
  const [pages, setPages] = useState<DocumentPdfPage[] | null>(null);

  useEffect(() => {
    if (!enabled) {
      setPages(null);
      return;
    }
    let active = true;
    void import("../data/document-pdf").then(({ layoutDocumentPdf }) => {
      if (active) setPages(layoutDocumentPdf(html, variant));
    });
    return () => {
      active = false;
    };
  }, [enabled, html, variant]);

  return pages;
}

/**
 * Folhas A4 do documento, com as mesmas quebras de página do PDF.
 * Somente leitura: serve para conferir o resultado impresso.
 */
export function DocumentSheets({
  pages,
  title,
  paciente,
  ariaLabel,
  variant = "default",
}: {
  pages: DocumentPdfPage[] | null;
  title: string;
  paciente: string;
  ariaLabel?: string;
  /** "letterhead": papel timbrado, sem título nem identificação no topo. */
  variant?: "default" | "letterhead";
}) {
  if (!pages) {
    return (
      <div
        className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"
        role="status"
      >
        <Loader2 className="icon-optical h-4 w-4 animate-spin" aria-hidden />
        Calculando as quebras de página…
      </div>
    );
  }

  const total = pages.length;
  const letterhead = variant === "letterhead";
  const margin = letterhead ? LETTERHEAD_LAYOUT.margin : PDF_LAYOUT.margin;
  const signatureName = letterhead
    ? `Dr(a). ${PDF_SIGNATURE.name.replace(/^Dr\.?a?\.?\s*/i, "")}`
    : PDF_SIGNATURE.name;
  // A folha da Solicitação é A5 real (148 × 210 mm); os demais documentos, A4.
  const sheet = pageSizeFor(variant);


  return (
    <div
      className="flex flex-col items-center gap-6 overflow-x-auto py-2"
      aria-label={ariaLabel}
      aria-readonly="true"
    >
      {pages.map((page, index) => (
        <figure key={index} className="m-0 flex flex-col items-center gap-2">
          <div
            className="relative shrink-0 overflow-hidden rounded-sm border border-border bg-card shadow-sm"
            style={{
              width: mm(sheet.pageWidth),
              height: mm(sheet.pageHeight),
            }}
          >
            {letterhead && <LetterheadFrame />}

            {!letterhead && index === 0 && (
              <>
                <span
                  className="absolute w-full text-center font-semibold uppercase text-foreground"
                  style={{
                    top: mm(PDF_LAYOUT.titleY - 14 * PT_TO_MM * 0.8),
                    fontFamily: "Helvetica, Arial, sans-serif",
                    fontSize: mm(14 * PT_TO_MM),
                  }}
                >
                  {title}
                </span>
                <span
                  className="absolute w-full text-center text-muted-foreground"
                  style={{
                    top: mm(PDF_LAYOUT.patientY - 10 * PT_TO_MM * 0.8),
                    fontFamily: "Helvetica, Arial, sans-serif",
                    fontSize: mm(10 * PT_TO_MM),
                  }}
                >
                  Paciente: {paciente || "—"}
                </span>
              </>
            )}

            {page.lines.map((line, lineIndex) => (
              <PageLine
                key={`${index}-${lineIndex}`}
                text={line.text}
                y={line.y}
                size={11}
                margin={margin}
              />
            ))}

            {page.signatureY !== undefined && (
              <div className="absolute w-full text-center" style={{ top: mm(page.signatureY) }}>
                <span
                  className="mx-auto block border-t border-foreground"
                  style={{ width: mm(70) }}
                />
                <span
                  className="block text-foreground"
                  style={{
                    fontFamily: "Helvetica, Arial, sans-serif",
                    fontSize: mm(10 * PT_TO_MM),
                    marginTop: mm(1.5),
                  }}
                >
                  {signatureName}
                </span>
                <span
                  className="block text-foreground"
                  style={{
                    fontFamily: "Helvetica, Arial, sans-serif",
                    fontSize: mm(10 * PT_TO_MM),
                    marginTop: mm(1),
                  }}
                >
                  {PDF_SIGNATURE.council}
                </span>
                <span
                  className="block text-muted-foreground"
                  style={{
                    fontFamily: "Helvetica, Arial, sans-serif",
                    fontSize: mm(9 * PT_TO_MM),
                    marginTop: mm(1.5),
                  }}
                >
                  {PDF_SIGNATURE.caption}
                </span>
              </div>
            )}
          </div>
          <figcaption className="font-mono text-xs text-muted-foreground">
            Página {index + 1} de {total}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
