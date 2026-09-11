import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import logoAsset from "@/assets/haisguias-logo.png.asset.json";
import type { DocumentPdfPage } from "../data/document-pdf";
import { LETTERHEAD_LAYOUT, PDF_LAYOUT, PDF_SIGNATURE } from "../data/document-pdf";

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

/** Timbre discreto da HaisTech na pré-visualização da folha. */
function LetterheadFrame() {
  const m = LETTERHEAD_LAYOUT.margin;
  return (
    <>
      <span className="absolute inset-y-0 left-0 bg-primary/15" style={{ width: mm(3) }} />
      <span
        className="absolute left-0 bg-primary"
        style={{ width: mm(3), top: mm(28), height: mm(44) }}
      />
      <span
        className="absolute rounded-full bg-primary/5"
        style={{ width: mm(24), height: mm(24), right: mm(2), bottom: mm(22) }}
      />
      <span
        className="absolute rounded-full bg-primary/5"
        style={{ width: mm(14), height: mm(14), right: mm(19), bottom: mm(19) }}
      />
      <img
        src={logoAsset.url}
        alt="HaisGuias"
        className="absolute"
        style={{ left: mm(m), top: mm(20), height: mm(LETTERHEAD_LAYOUT.logoHeight) }}
      />
      <span
        className="absolute text-muted-foreground"
        style={{ left: mm(m), top: mm(31), fontSize: mm(8 * PT_TO_MM) }}
      >
        HaisTech · Saúde digital
      </span>
      <span
        className="absolute text-muted-foreground"
        style={{ right: mm(m), top: mm(24), fontSize: mm(9 * PT_TO_MM) }}
      >
        Solicitação
      </span>
      <span
        className="absolute bg-border"
        style={{ left: mm(m), right: mm(m), top: mm(LETTERHEAD_LAYOUT.headerRuleY), height: "1px" }}
      />
      <span
        className="absolute bg-border"
        style={{ left: mm(m), right: mm(m), bottom: mm(19), height: "1px" }}
      />
      <span
        className="absolute text-muted-foreground"
        style={{ left: mm(m), bottom: mm(13), fontSize: mm(7.5 * PT_TO_MM) }}
      >
        HaisTech · HaisGuias
      </span>
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
                    marginTop: mm(1.5),
                  }}
                >
                  {PDF_SIGNATURE.name}
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
