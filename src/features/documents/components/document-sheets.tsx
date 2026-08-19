import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import type { DocumentPdfPage } from "../data/document-pdf";
import { PDF_LAYOUT, PDF_SIGNATURE } from "../data/document-pdf";

/** Escala de exibição: pixels por milímetro da folha A4. */
const PX_PER_MM = 2.7;
/** Conversão de pontos tipográficos para milímetros. */
const PT_TO_MM = 0.3528;

const mm = (value: number) => `${value * PX_PER_MM}px`;

/** Linha de texto posicionada na folha, na mesma coordenada usada no PDF. */
function PageLine({ text, y, size }: { text: string; y: number; size: number }) {
  const heightMm = size * PT_TO_MM;
  return (
    <span
      className="absolute whitespace-pre text-foreground"
      style={{
        left: mm(PDF_LAYOUT.margin),
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

/** Calcula as páginas A4 do documento (mesmo layout do PDF gerado). */
export function useDocumentPages(html: string, enabled = true): DocumentPdfPage[] | null {
  const [pages, setPages] = useState<DocumentPdfPage[] | null>(null);

  useEffect(() => {
    if (!enabled) {
      setPages(null);
      return;
    }
    let active = true;
    void import("../data/document-pdf").then(({ layoutDocumentPdf }) => {
      if (active) setPages(layoutDocumentPdf(html));
    });
    return () => {
      active = false;
    };
  }, [enabled, html]);

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
}: {
  pages: DocumentPdfPage[] | null;
  title: string;
  paciente: string;
  ariaLabel?: string;
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
              width: mm(PDF_LAYOUT.pageWidth),
              height: mm(PDF_LAYOUT.pageHeight),
            }}
          >
            {index === 0 && (
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
              <PageLine key={`${index}-${lineIndex}`} text={line.text} y={line.y} size={11} />
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
                    marginTop: mm(2),
                  }}
                >
                  {PDF_SIGNATURE.name}
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
