import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Download, Eye, FileSpreadsheet, Printer } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { AppModal } from "@/components/app-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { EmptyState } from "@/components/data-state";
import { FilterCard } from "@/components/filter-card";
import { SearchInput } from "@/components/form-field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { SiteFooter } from "@/components/site-footer";
import {
  DataTableBody,
  DataTableCard,
  DataTableCardActions,
  DataTableCardFields,
  DataTableCardHeader,
  DataTableCardList,
  DataTableCell,
  DataTableDesktop,
  DataTableHead,
  DataTableHeader,
  DataTableRoot,
  DataTableRow,
} from "@/components/data-table";
import { printDocumentHtml } from "@/features/documents";
import {
  ISSUED_DOCUMENTS,
  ISSUED_DOCUMENT_TYPES,
  formatIssuedDocumentDate,
  type IssuedDocument,
} from "../data/issued-documents";

const EMPTY_FILTERS = {
  query: "",
  type: "",
  from: "",
  to: "",
};

/**
 * Histórico dos documentos clínicos emitidos (relatórios, atestados e
 * declarações de comparecimento) — espelha o padrão de "Guias emitidas".
 */
export function IssuedDocumentsPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [detail, setDetail] = useState<IssuedDocument | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const activeCount = Object.values(filters).filter(Boolean).length;

  const setFilter = (key: keyof typeof EMPTY_FILTERS, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const rows = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return ISSUED_DOCUMENTS.filter((doc) => {
      if (query && !doc.patient.toLowerCase().includes(query)) return false;
      if (filters.type && doc.type !== filters.type) return false;

      const day = doc.issuedAt.slice(0, 10);
      if (filters.from && day < filters.from) return false;
      if (filters.to && day > filters.to) return false;
      return true;
    }).sort((a, b) => {
      const diff = new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime();
      return sortDirection === "desc" ? -diff : diff;
    });
  }, [filters, sortDirection]);

  const handlePrint = (doc: IssuedDocument) => {
    printDocumentHtml(doc.type, doc.patient, doc.body);
    toast.success(`${doc.type} enviado para impressão.`);
  };

  const handleDownload = (doc: IssuedDocument) => {
    printDocumentHtml(doc.type, doc.patient, doc.body);
    toast.success(`${doc.type} pronto para salvar em PDF.`, {
      description: doc.signed
        ? "O arquivo salvo não contém a assinatura digital."
        : "Documento sem assinatura digital.",
    });
  };

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <AppSidebar activeKey="documentos-emitidos" />

      <main className="flex min-h-screen min-w-0 flex-1 flex-col">
        <div className="w-full min-w-0 flex-1 space-y-6 px-4 py-6 pb-16 pt-20 sm:px-6 sm:py-8 md:pt-6 lg:px-10">
          <AppBreadcrumb />
          <PageHeader
            title="Documentos emitidos"
            description="Consulte o histórico dos relatórios, atestados e declarações de comparecimento emitidos no Guias+."
            actions={
              <Button asChild size="sm">
                <Link to="/documentos">
                  <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
                  Emitir documento
                </Link>
              </Button>
            }
          />

          <FilterCard
            id="issued-documents-filters"
            activeCount={activeCount}
            onClear={() => setFilters(EMPTY_FILTERS)}
            clearDisabled={activeCount === 0}
          >
            <div className="w-full min-w-0 sm:col-span-2 lg:w-auto lg:flex-1 lg:min-w-[240px]">
              <SearchInput
                placeholder="Buscar por paciente"
                aria-label="Buscar documentos emitidos por paciente"
                value={filters.query}
                clearable
                onChange={(event) => setFilter("query", event.target.value)}
                onClear={() => setFilter("query", "")}
              />
            </div>
            <div className="w-full min-w-0 lg:w-[250px]">
              <Combobox
                aria-label="Tipo de documento"
                options={[
                  { value: "", label: "Todos os tipos de documento" },
                  ...ISSUED_DOCUMENT_TYPES.map((type) => ({
                    value: type,
                    label: type,
                  })),
                ]}
                value={filters.type}
                onChange={(value) => setFilter("type", value)}
                placeholder="Todos os tipos de documento"
                searchPlaceholder="Buscar tipo..."
                clearable
              />
            </div>
            <div className="flex w-full min-w-0 items-center gap-2 lg:w-[200px]">
              <label
                htmlFor="issued-documents-from"
                className="shrink-0 text-xs font-medium text-muted-foreground"
              >
                De
              </label>
              <Input
                id="issued-documents-from"
                type="date"
                placeholder="dd/mm/aaaa"
                aria-label="Data de emissão inicial"
                max={filters.to || undefined}
                value={filters.from}
                onChange={(event) => setFilter("from", event.target.value)}
              />
            </div>
            <div className="flex w-full min-w-0 items-center gap-2 lg:w-[200px]">
              <label
                htmlFor="issued-documents-to"
                className="shrink-0 text-xs font-medium text-muted-foreground"
              >
                Até
              </label>
              <Input
                id="issued-documents-to"
                type="date"
                placeholder="dd/mm/aaaa"
                aria-label="Data de emissão final"
                min={filters.from || undefined}
                value={filters.to}
                onChange={(event) => setFilter("to", event.target.value)}
              />
            </div>
          </FilterCard>

          <p className="text-sm text-muted-foreground" aria-live="polite">
            {rows.length === 1 ? "1 documento encontrado" : `${rows.length} documentos encontrados`}
          </p>

          {rows.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card shadow-xs">
              <EmptyState
                title="Nenhum documento emitido encontrado"
                description="Ajuste a busca por paciente ou os filtros de tipo e período para ver outras emissões."
              />
            </div>
          ) : (
            <>
              {/* Mobile: cards empilhados (mesmo primitivo das outras listagens). */}
              <DataTableCardList>
                {rows.map((doc) => (
                  <DataTableCard key={doc.id}>
                    <DataTableCardHeader
                      title={<span className="truncate">{doc.type}</span>}
                      subtitle={doc.patient}
                    />
                    <DataTableCardFields
                      fields={[
                        {
                          label: "Data de emissão",
                          value: formatIssuedDocumentDate(doc.issuedAt),
                        },
                      ]}
                    />
                    <DataTableCardActions>
                      <Button variant="secondary" size="sm" onClick={() => setDetail(doc)}>
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        Visualizar
                      </Button>
                      <RowActions doc={doc} onDownload={handleDownload} onPrint={handlePrint} />
                    </DataTableCardActions>
                  </DataTableCard>
                ))}
              </DataTableCardList>

              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <DataTableDesktop>
                  <DataTableRoot className="w-full min-w-[720px] table-fixed">
                    <DataTableHeader>
                      <DataTableRow className="hover:bg-transparent">
                        <DataTableHead className="w-[26%]">Tipo de documento</DataTableHead>
                        <DataTableHead className="w-[26%]">Paciente</DataTableHead>
                        <DataTableHead className="w-[19%]">
                          <button /* ds-allow: cabeçalho de ordenação da tabela */
                            type="button"
                            onClick={() =>
                              setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"))
                            }
                            aria-label={
                              sortDirection === "desc"
                                ? "Ordenar por data de emissão: mais antigos primeiro"
                                : "Ordenar por data de emissão: mais recentes primeiro"
                            }
                            className="inline-flex items-center gap-1 whitespace-nowrap rounded-sm text-left text-inherit font-medium uppercase tracking-wide transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            Data de emissão
                            {sortDirection === "desc" ? (
                              <ArrowDown className="size-3.5 shrink-0" aria-hidden="true" />
                            ) : (
                              <ArrowUp className="size-3.5 shrink-0" aria-hidden="true" />
                            )}
                          </button>
                        </DataTableHead>
                        <DataTableHead className="w-[29%] whitespace-nowrap text-right">
                          Ações
                        </DataTableHead>
                      </DataTableRow>
                    </DataTableHeader>
                    <DataTableBody>
                      {rows.map((doc) => (
                        <DataTableRow key={doc.id}>
                          <DataTableCell className="truncate">
                            <Badge variant="info-soft" size="sm">
                              {doc.type}
                            </Badge>
                          </DataTableCell>
                          <DataTableCell className="truncate">{doc.patient}</DataTableCell>
                          <DataTableCell className="whitespace-nowrap text-muted-foreground">
                            {formatIssuedDocumentDate(doc.issuedAt)}
                          </DataTableCell>
                          <DataTableCell className="whitespace-nowrap text-right">
                            <div className="inline-flex items-center gap-0.5 icon-optical text-muted-foreground">
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Visualizar ${doc.type} de ${doc.patient}`}
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() => setDetail(doc)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <RowActions
                                doc={doc}
                                onDownload={handleDownload}
                                onPrint={handlePrint}
                              />
                            </div>
                          </DataTableCell>
                        </DataTableRow>
                      ))}
                    </DataTableBody>
                  </DataTableRoot>
                </DataTableDesktop>
              </div>
            </>
          )}
        </div>

        <SiteFooter />
      </main>

      <IssuedDocumentModal
        doc={detail}
        onClose={() => setDetail(null)}
        onDownload={handleDownload}
        onPrint={handlePrint}
      />
    </div>
  );
}

interface DocumentActions {
  onDownload: (doc: IssuedDocument) => void;
  onPrint: (doc: IssuedDocument) => void;
}

function RowActions({ doc, onDownload, onPrint }: { doc: IssuedDocument } & DocumentActions) {
  return (
    <div className="inline-flex items-center gap-0.5 icon-optical">
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Baixar PDF do documento de ${doc.patient}`}
        className="h-7 w-7 text-muted-foreground hover:text-foreground"
        onClick={() => onDownload(doc)}
      >
        <Download className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Imprimir documento de ${doc.patient}`}
        className="h-7 w-7 text-muted-foreground hover:text-foreground"
        onClick={() => onPrint(doc)}
      >
        <Printer className="h-4 w-4" />
      </Button>
    </div>
  );
}

function IssuedDocumentModal({
  doc,
  onClose,
  onDownload,
  onPrint,
}: { doc: IssuedDocument | null; onClose: () => void } & DocumentActions) {
  return (
    <AppModal
      open={doc !== null}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      icon={<FileSpreadsheet className="h-4 w-4" aria-hidden="true" />}
      title={doc ? doc.type : "Documento emitido"}
      description={
        doc ? `${doc.patient} · emitido em ${formatIssuedDocumentDate(doc.issuedAt)}` : undefined
      }
      size="lg"
      footer={
        doc ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => onPrint(doc)}>
              <Printer className="h-4 w-4" aria-hidden="true" />
              Imprimir
            </Button>
            <Button onClick={() => onDownload(doc)}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Baixar PDF
            </Button>
          </div>
        ) : undefined
      }
    >
      {doc && (
        <section aria-label={`Pré-visualização do documento de ${doc.patient}`}>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge variant="info-soft" size="sm">
              {doc.type}
            </Badge>
          </div>
          <article
            className="space-y-3 rounded-xl border border-border bg-muted/20 p-5 text-sm leading-relaxed text-foreground [&_p]:mb-3"
            dangerouslySetInnerHTML={{ __html: doc.body }}
          />
          <p className="mt-4 text-xs text-muted-foreground">
            {doc.signed
              ? "Documento assinado digitalmente com certificado ICP-Brasil."
              : "Documento sem assinatura digital — imprima para assinar manualmente."}
          </p>
        </section>
      )}
    </AppModal>
  );
}
