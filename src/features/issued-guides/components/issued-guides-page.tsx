import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Clock3, Download, Eye, FileText, XCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { AppModal } from "@/components/app-modal";
import { IssuedGuidePreview } from "./issued-guide-preview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/data-state";
import { FilterCard } from "@/components/filter-card";
import { SearchInput } from "@/components/form-field";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
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
import {
  ISSUED_GUIDE_OPERADORAS,
  ISSUED_GUIDE_TYPES,
  formatCurrency,
  formatIssuedAt,
  type IssuedGuide,
  type IssuedGuideStatus,
} from "../data/issued-guides";
import { useIssuedGuides } from "../data/issued-guides-store";
import { printGuideMarkup } from "../utils/print-guide";

const EMPTY_FILTERS = {
  query: "",
  from: "",
  to: "",
  operadora: "",
  type: "",
};

/**
 * Histórico de guias emitidas pelo sistema — distinto de "Extrair dados da
 * guia", que trata do processamento de guias digitalizadas.
 */
export function IssuedGuidesPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [detail, setDetail] = useState<IssuedGuide | null>(null);
  const guides = useIssuedGuides();

  const activeCount = Object.values(filters).filter(Boolean).length;

  const rows = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return guides.filter((guide) => {
      if (
        query &&
        !`${guide.numero} ${guide.patient} ${guide.procedure}`.toLowerCase().includes(query)
      ) {
        return false;
      }
      if (filters.operadora && guide.operadora !== filters.operadora) return false;
      if (filters.type && guide.type !== filters.type) return false;

      const day = guide.issuedAt.slice(0, 10);
      if (filters.from && day < filters.from) return false;
      if (filters.to && day > filters.to) return false;
      return true;
    });
  }, [filters, guides]);

  const setFilter = (key: keyof typeof EMPTY_FILTERS, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  // A guia baixada precisa ser o documento completo preenchido: renderizamos a
  // pré-visualização fora da tela e enviamos esse markup para o diálogo de
  // impressão/salvar em PDF do navegador.
  const [printTarget, setPrintTarget] = useState<IssuedGuide | null>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!printTarget) return;
    const frame = window.requestAnimationFrame(() => {
      const markup = printAreaRef.current?.innerHTML;
      if (markup) {
        printGuideMarkup(markup, `Guia ${printTarget.numero} — Guias+`);
        toast.success(`Guia ${printTarget.numero} pronta para salvar em PDF.`);
      } else {
        toast.error("Não foi possível gerar a guia completa.");
      }
      setPrintTarget(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [printTarget]);

  const handleDownload = (guide: IssuedGuide) => setPrintTarget(guide);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <AppSidebar activeKey="emitidas" />

      <main className="flex min-h-screen min-w-0 flex-1 flex-col">
        <div className="w-full min-w-0 flex-1 space-y-6 px-4 py-6 pb-16 pt-20 sm:px-6 sm:py-8 md:pt-6 lg:px-10">
          <AppBreadcrumb />
          <PageHeader
            title="Guias emitidas"
            description="Histórico de todas as guias geradas no Guias+. Consulte, baixe, reimprima ou duplique uma emissão."
            actions={
              <Button asChild size="sm">
                <Link to="/emitir">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  Emitir guia
                </Link>
              </Button>
            }
          />

          {/* Mesma estrutura de filtros da tela "Extrair dados da guia":
              campos em linha, sem labels acima, com placeholders. */}
          <FilterCard
            id="issued-guides-filters"
            activeCount={activeCount}
            onClear={() => setFilters(EMPTY_FILTERS)}
            clearDisabled={activeCount === 0}
          >
            <div className="w-full min-w-0 sm:col-span-2 lg:w-auto lg:flex-1 lg:min-w-[240px]">
              <SearchInput
                placeholder="Buscar por nº da guia, paciente ou procedimento"
                aria-label="Buscar guias emitidas"
                value={filters.query}
                clearable
                onChange={(event) => setFilter("query", event.target.value)}
                onClear={() => setFilter("query", "")}
              />
            </div>
            <div className="w-full min-w-0 lg:w-[200px]">
              <Combobox
                aria-label="Operadora"
                options={ISSUED_GUIDE_OPERADORAS.map((name) => ({
                  value: name,
                  label: name,
                }))}
                value={filters.operadora}
                onChange={(value) => setFilter("operadora", value)}
                placeholder="Todas as operadoras"
                searchPlaceholder="Buscar operadora..."
                clearable
              />
            </div>
            <div className="w-full min-w-0 lg:w-[190px]">
              <Combobox
                aria-label="Tipo de guia"
                options={ISSUED_GUIDE_TYPES.map((type) => ({ value: type, label: type }))}
                value={filters.type}
                onChange={(value) => setFilter("type", value)}
                placeholder="Todos os tipos de guia"
                searchPlaceholder="Buscar tipo..."
                clearable
              />
            </div>
            <div className="w-full min-w-0 lg:w-[160px]">
              <Input
                type="date"
                aria-label="Data início"
                value={filters.from}
                onChange={(event) => setFilter("from", event.target.value)}
              />
            </div>
            <div className="w-full min-w-0 lg:w-[160px]">
              <Input
                type="date"
                aria-label="Data fim"
                value={filters.to}
                onChange={(event) => setFilter("to", event.target.value)}
              />
            </div>
          </FilterCard>

          <p className="text-sm text-muted-foreground" aria-live="polite">
            {rows.length === 1 ? "1 guia encontrada" : `${rows.length} guias encontradas`}
          </p>

          {rows.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card shadow-xs">
              <EmptyState
                title="Nenhuma guia emitida encontrada"
                description="Ajuste a busca ou os filtros de período e operadora para ver outras emissões."
              />
            </div>
          ) : (
            <>
              {/* Mobile: cards empilhados (mesmo primitivo das outras listagens). */}
              <DataTableCardList>
                {rows.map((guide) => (
                  <DataTableCard key={guide.numero}>
                    <DataTableCardHeader
                      title={<span className="truncate font-mono">{guide.numero}</span>}
                      subtitle={guide.patient}
                    />
                    <DataTableCardFields
                      fields={[
                        { label: "Tipo de guia", value: guide.type },
                        { label: "Operadora", value: guide.operadora },
                        { label: "Data de emissão", value: formatIssuedAt(guide.issuedAt) },
                        { label: "Valor total", value: formatCurrency(guide.total) },
                      ]}
                    />
                    <DataTableCardActions>
                      <Button variant="secondary" size="sm" onClick={() => setDetail(guide)}>
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        Visualizar
                      </Button>
                      <RowActions guide={guide} onDownload={handleDownload} />
                    </DataTableCardActions>
                  </DataTableCard>
                ))}
              </DataTableCardList>

              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <DataTableDesktop>
                  <DataTableRoot className="w-full min-w-[720px] table-fixed">
                    <DataTableHeader>
                      <DataTableRow className="hover:bg-transparent">
                        <DataTableHead className="w-[15%]">Nº da guia</DataTableHead>
                        <DataTableHead className="w-[24%]">Paciente</DataTableHead>
                        <DataTableHead className="w-[14%]">Tipo de guia</DataTableHead>
                        <DataTableHead className="w-[18%]">Operadora</DataTableHead>
                        <DataTableHead className="w-[16%]">Data de emissão</DataTableHead>
                        <DataTableHead className="w-[13%] whitespace-nowrap text-right">
                          Ações
                        </DataTableHead>
                      </DataTableRow>
                    </DataTableHeader>
                    <DataTableBody>
                      {rows.map((guide) => (
                        <DataTableRow key={guide.numero}>
                          <DataTableCell className="whitespace-nowrap font-mono">
                            {guide.numero}
                          </DataTableCell>
                          <DataTableCell className="truncate">{guide.patient}</DataTableCell>
                          <DataTableCell>
                            <Badge variant="info-soft" size="sm">
                              {guide.type}
                            </Badge>
                          </DataTableCell>
                          <DataTableCell className="truncate text-muted-foreground">
                            {guide.operadora}
                          </DataTableCell>
                          <DataTableCell className="whitespace-nowrap text-muted-foreground">
                            {formatIssuedAt(guide.issuedAt)}
                          </DataTableCell>

                          <DataTableCell className="whitespace-nowrap text-right">
                            <div className="inline-flex items-center gap-0.5 icon-optical text-muted-foreground">
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Visualizar guia ${guide.numero}`}
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() => setDetail(guide)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <RowActions guide={guide} onDownload={handleDownload} />
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

      <IssuedGuideModal
        guide={detail}
        onClose={() => setDetail(null)}
        onDownload={handleDownload}
      />

      {printTarget && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed left-[-10000px] top-0 w-[820px]"
        >
          <div ref={printAreaRef}>
            <IssuedGuidePreview guide={printTarget} />
          </div>
        </div>
      )}
    </div>
  );
}

interface ActionProps {
  guide: IssuedGuide;
  onDownload: (guide: IssuedGuide) => void;
}

function RowActions({ guide, onDownload }: Pick<ActionProps, "guide" | "onDownload">) {
  return (
    <div className="inline-flex items-center gap-0.5 icon-optical">
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Baixar PDF da guia ${guide.numero}`}
        className="h-7 w-7 text-muted-foreground hover:text-foreground"
        onClick={() => onDownload(guide)}
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}

function StatusBadge({ status }: { status: IssuedGuideStatus }) {
  if (status === "Autorizada")
    return (
      <Badge variant="success-soft" size="sm">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Autorizada
      </Badge>
    );
  if (status === "Pendente")
    return (
      <Badge variant="warning-soft" size="sm">
        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" /> Pendente
      </Badge>
    );
  if (status === "Cancelada")
    return (
      <Badge variant="destructive-soft" size="sm">
        <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Cancelada
      </Badge>
    );
  return (
    <Badge variant="secondary" size="sm">
      <FileText className="h-3.5 w-3.5" aria-hidden="true" /> Emitida
    </Badge>
  );
}

function IssuedGuideModal({
  guide,
  onClose,
  onDownload,
}: {
  guide: IssuedGuide | null;
  onClose: () => void;
} & Omit<ActionProps, "guide">) {
  return (
    <AppModal
      open={guide !== null}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      icon={<FileText className="h-4 w-4" aria-hidden="true" />}
      title={guide ? `Guia ${guide.numero}` : "Guia emitida"}
      description={
        guide ? `${guide.type} · emitida em ${formatIssuedAt(guide.issuedAt)}` : undefined
      }
      size="xl"
      footer={
        guide ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button onClick={() => onDownload(guide)}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Baixar PDF
            </Button>
          </div>
        ) : undefined
      }
    >
      {guide && (
        <section
          aria-label={`Pré-visualização da guia ${guide.numero}`}
          className="overflow-hidden rounded-xl border border-border"
        >
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5">
            <p className="text-eyebrow">Guia preenchida · modelo {guide.type}</p>
            <span className="text-[10px] text-muted-foreground">Role para ver todos os campos</span>
          </div>
          <div className="max-h-[70dvh] overflow-auto">
            <IssuedGuidePreview guide={guide} />
          </div>
        </section>
      )}
    </AppModal>
  );
}

function DetailItem({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={`mt-1 text-sm text-foreground ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
