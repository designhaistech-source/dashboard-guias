import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { appTabsLabelClass, appTabsListClass, appTabsTriggerClass } from "@/components/app-tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCurrentProfile } from "@/lib/current-profile";
import { AppSidebar } from "@/components/app-sidebar";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { SurfaceCard } from "@/components/surface-card";
import { FilterCard } from "@/components/filter-card";
import { SearchInput } from "@/components/form-field";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { toLocalIsoDate } from "@/lib/date";
import {
  useExamRequests,
  ACTION_BY_STATUS,
  DOCTORS,
  OPERADORAS,
  RequestActionDialog,
  chargeOperator,
  RequestsTable,
  ReceptionSummary,
  byLongestWaiting,
  type AuthorizationStatus,
} from "@/features/authorizations";

// Queue tabs; "" = Todos. Uses the existing `status` search param so dashboard links keep working.
const QUEUES: { value: "" | AuthorizationStatus; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "pendente", label: "Para autorizar" },
  { value: "aguardando", label: "Aguardando operadora" },
  { value: "autorizada", label: "Autorizados" },
  { value: "pendencia", label: "Pendências" },
  { value: "realizada", label: "Realizados" },
];

// Prototype-only sample threshold for "waiting longer"; not a system rule.
const SAMPLE_OVERDUE_MS = 3 * 24 * 60 * 60 * 1000;

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);

export const Route = createFileRoute("/autorizacoes/")({
  validateSearch: (search: Record<string, unknown>): Partial<Record<SearchKey, string>> => ({
    status: str(search.status),
    q: str(search.q),
    operadora: str(search.operadora),
    medico: str(search.medico),
    de: str(search.de),
    ate: str(search.ate),
  }),
  head: () => ({
    meta: [
      { title: "Exames | Guias+" },
      { name: "description", content: "Fila de solicitações de exame e autorizações junto às operadoras." },
      { property: "og:title", content: "Exames | Guias+" },
      { property: "og:description", content: "Solicitações de exame e autorizações no Guias+." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthorizationsPage,
});

type SearchKey = "status" | "q" | "operadora" | "medico" | "de" | "ate";
const EMPTY = { status: "", q: "", operadora: "", medico: "", de: "", ate: "" };

function AuthorizationsPage() {
  const raw = Route.useSearch();
  const search = { ...EMPTY, ...Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined)) };
  const navigate = useNavigate({ from: "/autorizacoes/" });
  const set = (key: SearchKey, value: string) =>
    navigate({ to: ".", search: (prev) => ({ ...prev, [key]: value || undefined }), replace: true });

  const q = search.q.trim().toLowerCase();
  const all = useExamRequests();
  const profile = useCurrentProfile();
  const [openId, setOpenId] = useState<string | null>(null);
  const selected = all.find((r) => r.id === openId) ?? null;
  const tab = QUEUES.some((t) => t.value === search.status) ? search.status : "";
  const secondary = all.filter((r) => {
    const d = toLocalIsoDate(new Date(r.receivedAt));
    return (
      (!search.operadora || r.operadora === search.operadora) &&
      (!search.medico || r.doctor === search.medico) &&
      (!search.de || d >= search.de) &&
      (!search.ate || d <= search.ate) &&
      (!q || r.patient.toLowerCase().includes(q) || r.procedure.toLowerCase().includes(q) || r.procedureCode.includes(q))
    );
  });
  const rows = secondary.filter((r) => !tab || r.status === tab).sort(byLongestWaiting);
  const countOf = (v: string) => (v ? secondary.filter((r) => r.status === v).length : secondary.length);

  const { status: _tab, ...filters } = search;
  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="flex min-h-dvh w-full bg-background text-foreground">
      <AppSidebar activeKey="autorizacoes" />
      <main className="min-w-0 flex-1 flex flex-col min-h-dvh">
        <div className="w-full flex-1 space-y-6 px-4 py-6 pb-16 pt-20 sm:px-6 sm:py-8 md:pt-8 lg:px-10">
          <AppBreadcrumb />
          <PageHeader
            title="Exames"
            description="Acompanhe e gerencie as solicitações de exames."
          />

          <ReceptionSummary />

          <Tabs value={tab || "todos"} onValueChange={(v) => set("status", v === "todos" ? "" : v)}>
            <div className="overflow-x-auto">
              <TabsList aria-label="Filas de exames" className={cn(appTabsListClass, "min-w-max auto-cols-auto lg:min-w-0")}>
                {QUEUES.map((t) => (
                  <TabsTrigger key={t.label} value={t.value || "todos"} className={cn(appTabsTriggerClass, "px-3 lg:px-3")}>
                    <span className={"whitespace-nowrap text-xs lg:text-sm"}>{t.label}</span>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">{countOf(t.value)}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>

          <FilterCard
            id="authorizations-filters"
            activeCount={activeCount}
            onClear={() => navigate({ to: ".", search: { status: tab || undefined }, replace: true })}
            clearDisabled={activeCount === 0}
          >
            <div className="w-full min-w-0 sm:col-span-2 lg:w-auto lg:flex-1 lg:min-w-60">
              <SearchInput
                placeholder="Buscar por paciente ou procedimento"
                aria-label="Buscar solicitações"
                value={search.q}
                clearable
                onChange={(e) => set("q", e.target.value)}
                onClear={() => set("q", "")}
              />
            </div>
            <div className="w-full min-w-0 lg:w-48">
              <Combobox
                aria-label="Operadora"
                options={OPERADORAS.map((o) => ({ value: o, label: o }))}
                value={search.operadora}
                onChange={(v) => set("operadora", v)}
                placeholder="Todas as operadoras"
                searchPlaceholder="Buscar operadora..."
                allOptionLabel="Todas as operadoras"
                clearable
              />
            </div>
            <div className="w-full min-w-0 lg:w-48">
              <Combobox
                aria-label="Profissional solicitante"
                options={DOCTORS.map((d) => ({ value: d, label: d }))}
                value={search.medico}
                onChange={(v) => set("medico", v)}
                placeholder="Todos os profissionais"
                searchPlaceholder="Buscar profissional..."
                allOptionLabel="Todos os profissionais"
                clearable
              />
            </div>
            <div className="flex w-full min-w-0 items-center gap-2 lg:w-50">
              <label htmlFor="authorizations-from" className="shrink-0 text-xs font-medium text-muted-foreground">
                De
              </label>
              <Input
                id="authorizations-from"
                type="date"
                aria-label="Data inicial"
                max={search.ate || undefined}
                value={search.de}
                onChange={(e) => set("de", e.target.value)}
              />
            </div>
            <div className="flex w-full min-w-0 items-center gap-2 lg:w-50">
              <label htmlFor="authorizations-to" className="shrink-0 text-xs font-medium text-muted-foreground">
                Até
              </label>
              <Input
                id="authorizations-to"
                type="date"
                aria-label="Data final"
                min={search.de || undefined}
                value={search.ate}
                onChange={(e) => set("ate", e.target.value)}
              />
            </div>
          </FilterCard>

          <SurfaceCard
            title="Solicitações"
            description={rows.length === 1 ? "1 solicitação" : `${rows.length} solicitações`}
          >
            <RequestsTable
              rows={rows}
              emptyLabel="Nenhuma solicitação encontrada com os filtros aplicados."
              showStatus={!tab}
              getSecondaryAction={(r) =>
                tab && r.status === "aguardando" && Date.now() - new Date(r.statusSince).getTime() > SAMPLE_OVERDUE_MS
                  ? {
                      label: "Cobrar operadora",
                      onClick: () => {
                        if (chargeOperator(r.id, { name: profile.name, roleLabel: profile.roleLabel }))
                          toast.success("Cobrança registrada", { description: `Registrado no histórico de ${r.patient}.` });
                      },
                    }
                  : null
              }
              // "Todos" mixes stages, so one neutral label keeps the column uniform; the panel title names the task.
              getActionLabel={(r) => (tab ? (ACTION_BY_STATUS[r.status]?.label ?? "Visualizar") : "Abrir")}
              onOpenDetails={(r) => navigate({ to: "/autorizacoes/$id", params: { id: r.id } })}
              onView={(r) =>
                ACTION_BY_STATUS[r.status]
                  ? setOpenId(r.id)
                  : navigate({ to: "/autorizacoes/$id", params: { id: r.id } })
              }
            />
          </SurfaceCard>
          <RequestActionDialog request={selected} open={!!openId} onOpenChange={(o) => !o && setOpenId(null)} />
        </div>
        <SiteFooter />
      </main>
    </div>
  );
}
