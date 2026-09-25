import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Hourglass,
  Inbox,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { SurfaceCard } from "@/components/surface-card";
import { AppModal } from "@/components/app-modal";
import { Field } from "@/components/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Badge } from "@/components/ui/badge";
import { Combobox, MultiSelect } from "@/components/ui/combobox";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableDesktop,
  DataTableHead,
  DataTableHeader,
  DataTableRoot,
  DataTableRow,
  DataTableCardList,
  DataTableCard,
  DataTableCardHeader,
  DataTableCardFields,
} from "@/components/data-table";
import { useIsMobile } from "@/hooks/use-mobile";
import { toLocalIsoDate, todayLocalIsoDate, formatIsoToBr } from "@/lib/date";
import { cn } from "@/lib/utils";
import {
  ATTENTION_STATUSES,
  AUTHORIZATION_REQUESTS,
  AUTHORIZATION_STATUS_LABEL,
  AUTHORIZATION_STATUS_ORDER,
  DOCTORS,
  OPERADORAS,
  PROCEDURES,
  formatElapsed,
  type AuthorizationRequest,
  type AuthorizationStatus,
} from "../data/authorization-requests";
import { RequestsTable, StatusLabel } from "./requests-table";

interface Filters {
  from: string;
  to: string;
  operadora: string;
  doctor: string;
  procedures: string[];
}
const EMPTY: Filters = { from: "", to: "", operadora: "", doctor: "", procedures: [] };
const DAY = 86_400_000;

function inRange(r: AuthorizationRequest, from: string, to: string) {
  const d = toLocalIsoDate(new Date(r.receivedAt));
  return (!from || d >= from) && (!to || d <= to);
}

function applyDimensions(rows: AuthorizationRequest[], f: Filters) {
  return rows.filter(
    (r) =>
      (!f.operadora || r.operadora === f.operadora) &&
      (!f.doctor || r.doctor === f.doctor) &&
      (f.procedures.length === 0 || f.procedures.includes(r.procedureCode)),
  );
}

function countBy(rows: AuthorizationRequest[], status: AuthorizationStatus) {
  return rows.filter((r) => r.status === status).length;
}

const statusChartConfig = {
  total: { label: "Solicitações", color: "var(--primary)" },
} satisfies ChartConfig;

export function ReceptionDashboard() {
  const isMobile = useIsMobile();
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [viewing, setViewing] = useState<AuthorizationRequest | null>(null);
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setFilters((p) => ({ ...p, [k]: v }));

  const dateInvalid = Boolean(filters.from && filters.to && filters.from > filters.to);
  const hasFilters =
    Boolean(filters.from || filters.to || filters.operadora || filters.doctor) ||
    filters.procedures.length > 0;

  const applyPreset = (id: "hoje" | "7d" | "30d") => {
    const today = todayLocalIsoDate();
    const days = id === "hoje" ? 0 : id === "7d" ? 6 : 29;
    const from = toLocalIsoDate(new Date(Date.now() - days * DAY));
    setFilters((p) => ({ ...p, from, to: today }));
  };

  const scoped = useMemo(() => applyDimensions(AUTHORIZATION_REQUESTS, filters), [filters]);
  const rows = useMemo(
    () => (dateInvalid ? [] : scoped.filter((r) => inRange(r, filters.from, filters.to))),
    [scoped, filters.from, filters.to, dateInvalid],
  );

  // Período anterior de mesma duração, só quando as duas datas estão definidas.
  const previous = useMemo(() => {
    if (!filters.from || !filters.to || dateInvalid) return null;
    const start = new Date(`${filters.from}T00:00:00`).getTime();
    const end = new Date(`${filters.to}T00:00:00`).getTime();
    const len = Math.round((end - start) / DAY) + 1;
    const pFrom = toLocalIsoDate(new Date(start - len * DAY));
    const pTo = toLocalIsoDate(new Date(start - DAY));
    return scoped.filter((r) => inRange(r, pFrom, pTo));
  }, [scoped, filters.from, filters.to, dateInvalid]);

  const kpis = [
    {
      label: "Solicitações recebidas",
      icon: Inbox,
      value: rows.length,
      prev: previous?.length,
      context: "Enviadas pelos médicos no período",
      tone: "bg-primary/10 text-primary",
    },
    {
      label: "Pendentes de autorização",
      icon: Clock,
      value: countBy(rows, "pendente"),
      prev: previous ? countBy(previous, "pendente") : undefined,
      context: "Autorização ainda não solicitada",
      tone: "bg-warning-muted text-warning-strong",
      status: "pendente" as const,
    },
    {
      label: "Aguardando operadora",
      icon: Hourglass,
      value: countBy(rows, "aguardando"),
      prev: previous ? countBy(previous, "aguardando") : undefined,
      context: "Solicitadas, sem retorno da operadora",
      tone: "bg-info/15 text-info",
      status: "aguardando" as const,
    },
    {
      label: "Autorizadas",
      icon: ShieldCheck,
      value: countBy(rows, "autorizada"),
      prev: previous ? countBy(previous, "autorizada") : undefined,
      context: "Com autorização da operadora",
      tone: "bg-success/15 text-success",
      status: "autorizada" as const,
    },
  ];

  const attention = useMemo(
    () =>
      rows
        .filter((r) => ATTENTION_STATUSES.includes(r.status))
        .sort((a, b) => a.statusSince.localeCompare(b.statusSince)),
    [rows],
  );

  const statusData = AUTHORIZATION_STATUS_ORDER.map((s) => ({
    status: AUTHORIZATION_STATUS_LABEL[s],
    total: countBy(rows, s),
  }));

  const byOperadora = OPERADORAS.map((op) => {
    const list = rows.filter((r) => r.operadora === op);
    return {
      operadora: op,
      total: list.length,
      autorizadas: list.filter((r) => r.status === "autorizada" || r.status === "realizada").length,
      negadas: countBy(list, "negada"),
      aguardando: countBy(list, "aguardando"),
    };
  }).filter((o) => o.total > 0);

  const periodLabel =
    filters.from || filters.to
      ? `${filters.from ? formatIsoToBr(filters.from) : "início"} a ${filters.to ? formatIsoToBr(filters.to) : "hoje"}`
      : "Todo o período disponível";

  return (
    <div className="flex min-h-dvh w-full bg-background text-foreground">
      <AppSidebar activeKey="dashboard" />
      <main className="min-w-0 flex-1 flex flex-col min-h-dvh">
        <div className="w-full flex-1 space-y-6 px-4 py-6 pb-16 pt-20 sm:px-6 sm:py-8 md:pt-8 lg:px-10">
          <AppBreadcrumb />
          <PageHeader
            title="Visão geral"
            description="Acompanhe as solicitações de exame e as autorizações junto às operadoras."
          />

          <p className="text-sm text-muted-foreground">
            Período: <span className="font-medium text-foreground">{periodLabel}</span>
          </p>

          <section aria-label="Filtros" className="rounded-2xl border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="icon-optical h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <h2 className="font-display text-base font-semibold tracking-tight text-foreground">Filtros</h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFiltersOpen((o) => !o)}
                aria-expanded={filtersOpen}
                aria-controls="reception-filters-panel"
              >
                {filtersOpen ? "Recolher" : "Expandir"}
                <ChevronDown className={cn("h-4 w-4 transition-transform", filtersOpen && "rotate-180")} aria-hidden="true" />
              </Button>
            </div>
            {filtersOpen && (
              <div id="reception-filters-panel" className="space-y-4 border-t border-border px-4 py-4 sm:px-5 sm:py-5">
                <div className="space-y-1.5">
                  <span className="block text-xs font-medium leading-snug text-muted-foreground">
                    Períodos predefinidos
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {([
                      { id: "hoje", label: "Hoje" },
                      { id: "7d", label: "Últimos 7 dias" },
                      { id: "30d", label: "Últimos 30 dias" },
                    ] as const).map((p) => (
                      <Chip
                        key={p.id}
                        onClick={() => applyPreset(p.id)}
                        className="text-foreground hover:border-primary hover:bg-primary/5 hover:text-primary"
                      >
                        {p.label}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-[10rem_10rem_minmax(0,1fr)_minmax(0,1fr)]">
                  <Field label="Data inicial">
                    <Input type="date" value={filters.from} aria-invalid={dateInvalid || undefined} onChange={(e) => set("from", e.target.value)} className="h-9" />
                  </Field>
                  <Field label="Data final">
                    <Input type="date" value={filters.to} aria-invalid={dateInvalid || undefined} onChange={(e) => set("to", e.target.value)} className="h-9" />
                  </Field>
                  <Field label="Operadora">
                    <Combobox
                      value={filters.operadora}
                      onChange={(v) => set("operadora", v)}
                      options={OPERADORAS.map((o) => ({ value: o, label: o }))}
                      placeholder="Todas"
                      searchPlaceholder="Buscar..."
                      clearable
                    />
                  </Field>
                  <Field label="Médico solicitante">
                    <Combobox
                      value={filters.doctor}
                      onChange={(v) => set("doctor", v)}
                      options={DOCTORS.map((o) => ({ value: o, label: o }))}
                      placeholder="Todos"
                      searchPlaceholder="Buscar..."
                      clearable
                    />
                  </Field>
                  <div className="min-w-0 sm:col-span-2 lg:col-span-4">
                    <Field label="Procedimento">
                      <MultiSelect
                        options={PROCEDURES.map((p) => ({ value: p.code, label: p.name, description: p.code, searchText: `${p.code} ${p.name}` }))}
                        values={filters.procedures}
                        onChange={(v) => set("procedures", v)}
                        placeholder="Selecione um ou mais procedimentos"
                        emptyLabel="Selecione um ou mais procedimentos"
                        allLabel="Todos os procedimentos"
                        searchPlaceholder="Buscar por código TUSS ou descrição"
                        chips
                        maxChips={2}
                        className="w-full"
                      />
                    </Field>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFilters(EMPTY)}
                    disabled={!hasFilters}
                    className="h-10 w-full justify-center sm:col-span-2 sm:h-9 lg:col-span-4 lg:w-auto lg:justify-self-start"
                  >
                    Limpar filtros
                  </Button>
                </div>
                {dateInvalid && (
                  <p className="text-xs text-destructive">A data inicial deve ser anterior ou igual à data final.</p>
                )}
              </div>
            )}
          </section>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4" data-testid="kpi-grid">
            {kpis.map((k) => {
              const diff = k.prev === undefined ? undefined : k.value - k.prev;
              const body = (
                <>
                  <div className="flex w-full min-h-11 items-start justify-between gap-2">
                    <span className="metric-label text-left">{k.label}</span>
                    <span className={`grid place-items-center h-8 w-8 shrink-0 rounded-lg ${k.tone}`}>
                      <k.icon className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="mt-3 metric-value text-foreground">{k.value}</div>
                  <div className="mt-1 metric-hint text-muted-foreground">{k.context}</div>
                  {diff !== undefined && (
                    <div
                      className={cn(
                        "mt-1 metric-hint flex items-center icon-optical gap-1",
                        diff > 0 ? "text-success" : diff < 0 ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {diff > 0 && <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />}
                      {diff < 0 && <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />}
                      {diff > 0 ? `+${diff}` : diff} vs. período anterior
                    </div>
                  )}
                  {k.status && (
                    <span className="mt-3 flex items-center gap-1 text-xs font-medium text-primary">
                      Ver em Autorizações
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  )}
                </>
              );
              const cardClass =
                "flex h-full flex-col items-start rounded-2xl border border-border bg-card p-5 text-left shadow-xs transition-shadow hover:shadow-sm";
              return k.status ? (
                <Link
                  key={k.label}
                  to="/autorizacoes"
                  search={{ status: k.status }}
                  className={cn(cardClass, "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}
                >
                  {body}
                </Link>
              ) : (
                <div key={k.label} className={cardClass}>{body}</div>
              );
            })}
          </div>

          <SurfaceCard
            title="Pendências que exigem atenção"
            description="Solicitações que ainda dependem de alguma ação ou retorno."
            actions={<Badge variant="secondary" size="sm">{attention.length}</Badge>}
          >
            <RequestsTable
              rows={attention.slice(0, 8)}
              emptyLabel="Nenhuma pendência no período filtrado."
              onView={setViewing}
            />
            {attention.length > 8 && (
              <div className="mt-4">
                <Button asChild variant="outline" size="sm">
                  <Link to="/autorizacoes">Ver todas as {attention.length} pendências</Link>
                </Button>
              </div>
            )}
          </SurfaceCard>

          <div className="grid gap-4 grid-cols-1 xl:grid-cols-2 items-stretch">
            <SurfaceCard
              className="min-w-0"
              title="Solicitações por status"
              description="Distribuição das solicitações de exame por situação no período filtrado."
            >
              {rows.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma solicitação no período filtrado.</p>
              ) : (
                <ChartContainer config={statusChartConfig} className="aspect-auto h-72 w-full">
                  <BarChart data={statusData} layout="vertical" margin={{ left: 8, right: 32 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} hide />
                    <YAxis
                      type="category"
                      dataKey="status"
                      width={isMobile ? 120 : 170}
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="total" fill="var(--color-total)" radius={4} maxBarSize={22} isAnimationActive={false}>
                      <LabelList dataKey="total" position="right" className="fill-foreground" fontSize={12} />
                    </Bar>
                  </BarChart>
                </ChartContainer>
              )}
            </SurfaceCard>

            <SurfaceCard
              className="min-w-0"
              title="Autorizações por operadora"
              description="Volume e situação das solicitações por operadora no período filtrado."
            >
              <DataTable>
                <DataTableDesktop breakpoint="md">
                  <DataTableRoot className="min-w-120">
                    <DataTableHeader>
                      <DataTableRow>
                        <DataTableHead>Operadora</DataTableHead>
                        <DataTableHead className="text-right">Total</DataTableHead>
                        <DataTableHead className="text-right">Autorizadas</DataTableHead>
                        <DataTableHead className="text-right">Não autorizadas</DataTableHead>
                        <DataTableHead className="text-right">Aguardando retorno</DataTableHead>
                      </DataTableRow>
                    </DataTableHeader>
                    <DataTableBody>
                      {byOperadora.map((o) => (
                        <DataTableRow key={o.operadora}>
                          <DataTableCell className="font-medium">{o.operadora}</DataTableCell>
                          <DataTableCell className="text-right font-mono tabular-nums">{o.total}</DataTableCell>
                          <DataTableCell className="text-right tabular-nums">{o.autorizadas}</DataTableCell>
                          <DataTableCell className="text-right tabular-nums">{o.negadas}</DataTableCell>
                          <DataTableCell className="text-right tabular-nums">{o.aguardando}</DataTableCell>
                        </DataTableRow>
                      ))}
                    </DataTableBody>
                  </DataTableRoot>
                </DataTableDesktop>
                <DataTableCardList breakpoint="md" divided>
                  {byOperadora.map((o) => (
                    <DataTableCard key={o.operadora} flat>
                      <DataTableCardHeader title={o.operadora} trailing={<span className="font-mono text-sm">{o.total}</span>} />
                      <DataTableCardFields
                        fields={[
                          { label: "Autorizadas", value: o.autorizadas },
                          { label: "Não autorizadas", value: o.negadas },
                          { label: "Aguardando retorno", value: o.aguardando },
                        ]}
                      />
                    </DataTableCard>
                  ))}
                </DataTableCardList>
              </DataTable>
              {byOperadora.length === 0 && (
                <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma solicitação no período filtrado.</p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">Autorizadas inclui exames já realizados.</p>
            </SurfaceCard>
          </div>
        </div>
        <SiteFooter />
      </main>

      <AppModal
        open={viewing !== null}
        onOpenChange={(o) => !o && setViewing(null)}
        title="Solicitação de exame"
        description={viewing?.id}
        icon={FileText}
        size="sm"
      >
        {viewing && (
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            {[
              ["Paciente", viewing.patient],
              ["Procedimento", `${viewing.procedureCode} · ${viewing.procedure}`],
              ["Médico solicitante", viewing.doctor],
              ["Operadora", viewing.operadora],
              ["Recebida em", formatIsoToBr(toLocalIsoDate(new Date(viewing.receivedAt)))],
              ["Tempo na situação", formatElapsed(viewing.statusSince)],
            ].map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-xs font-medium text-muted-foreground">{k}</dt>
                <dd className="mt-0.5 break-words text-foreground">{v}</dd>
              </div>
            ))}
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Situação</dt>
              <dd className="mt-1"><StatusLabel request={viewing} /></dd>
            </div>
          </dl>
        )}
      </AppModal>
    </div>
  );
}
