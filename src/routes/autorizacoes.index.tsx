import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
  AUTHORIZATION_REQUESTS,
  AUTHORIZATION_STATUS_LABEL,
  AUTHORIZATION_STATUS_ORDER,
  DOCTORS,
  OPERADORAS,
  RequestsTable,
  byLongestWaiting,
} from "@/features/authorizations";

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
      { title: "Autorizações | Guias+" },
      { name: "description", content: "Fila de solicitações de exame e autorizações junto às operadoras." },
      { property: "og:title", content: "Autorizações | Guias+" },
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
  const rows = AUTHORIZATION_REQUESTS.filter((r) => {
    const d = toLocalIsoDate(new Date(r.receivedAt));
    return (
      (!search.status || r.status === search.status) &&
      (!search.operadora || r.operadora === search.operadora) &&
      (!search.medico || r.doctor === search.medico) &&
      (!search.de || d >= search.de) &&
      (!search.ate || d <= search.ate) &&
      (!q || r.patient.toLowerCase().includes(q) || r.procedure.toLowerCase().includes(q) || r.procedureCode.includes(q))
    );
  }).sort(byLongestWaiting);

  const activeCount = Object.values(search).filter(Boolean).length;

  return (
    <div className="flex min-h-dvh w-full bg-background text-foreground">
      <AppSidebar activeKey="autorizacoes" />
      <main className="min-w-0 flex-1 flex flex-col min-h-dvh">
        <div className="w-full flex-1 space-y-6 px-4 py-6 pb-16 pt-20 sm:px-6 sm:py-8 md:pt-8 lg:px-10">
          <AppBreadcrumb />
          <PageHeader
            title="Autorizações"
            description="Acompanhe as solicitações de exame e as autorizações junto às operadoras."
          />

          <FilterCard
            id="authorizations-filters"
            activeCount={activeCount}
            onClear={() => navigate({ to: ".", search: {}, replace: true })}
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
            <div className="w-full min-w-0 lg:w-52">
              <Combobox
                aria-label="Situação"
                options={AUTHORIZATION_STATUS_ORDER.map((s) => ({ value: s, label: AUTHORIZATION_STATUS_LABEL[s] }))}
                value={search.status}
                onChange={(v) => set("status", v)}
                placeholder="Todas as situações"
                searchPlaceholder="Buscar situação..."
                allOptionLabel="Todas as situações"
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
              onView={(r) => navigate({ to: "/autorizacoes/$id", params: { id: r.id } })}
            />
          </SurfaceCard>
        </div>
        <SiteFooter />
      </main>
    </div>
  );
}
