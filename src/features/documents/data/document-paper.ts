import type { IssuedDocumentType } from "@/features/issued-documents/data/issued-documents";

import type { DocumentPdfVariant } from "./document-pdf";

/**
 * Fonte única de verdade do template por tipo de documento.
 *
 * "Solicitação" usa o papel timbrado da HaisTech em A5 retrato real
 * (148 × 210 mm). Relatórios, Atestados e Comparecimento seguem no template
 * padrão A4, sem alteração.
 */
export const DOCUMENT_TEMPLATE_BY_TYPE: Record<IssuedDocumentType, DocumentPdfVariant> = {
  Relatório: "default",
  Atestado: "default",
  Comparecimento: "default",
  Solicitação: "letterhead",
};

/** Template (e, portanto, o tamanho da folha) usado por um tipo de documento. */
export function documentTemplateFor(type: IssuedDocumentType): DocumentPdfVariant {
  return DOCUMENT_TEMPLATE_BY_TYPE[type] ?? "default";
}

/** Rótulo do tamanho de papel exibido na interface. */
export function paperFormatLabel(variant: DocumentPdfVariant): "A4" | "A5" {
  return variant === "letterhead" ? "A5" : "A4";
}
