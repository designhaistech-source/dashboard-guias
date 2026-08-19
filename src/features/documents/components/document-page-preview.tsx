import { FileText } from "lucide-react";

import { AppModal } from "@/components/app-modal";
import { Button } from "@/components/ui/button";
import { DocumentSheets, useDocumentPages } from "./document-sheets";

/**
 * Pré-visualização paginada do documento: mostra as folhas A4 com as
 * quebras de página reais que o PDF vai gerar. Serve apenas para conferência,
 * por isso a única ação é fechar.
 */
export function DocumentPagePreview({
  open,
  onOpenChange,
  title,
  paciente,
  html,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  paciente: string;
  html: string;
}) {
  const pages = useDocumentPages(html, open);
  const total = pages?.length ?? 0;

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      icon={<FileText className="icon-optical h-5 w-5" aria-hidden />}
      title="Pré-visualizar documento"
      description={
        total > 0
          ? `${total} ${total === 1 ? "página" : "páginas"} A4 — quebras iguais às do PDF.`
          : "Calculando as quebras de página…"
      }
      footer={
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Fechar
        </Button>
      }
    >
      <DocumentSheets
        pages={pages}
        title={title}
        paciente={paciente}
        ariaLabel="Pré-visualização paginada do documento"
      />
    </AppModal>
  );
}
