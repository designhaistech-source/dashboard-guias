import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { SurfaceCard } from "@/components/surface-card";
import { FilterCard } from "@/components/filter-card";
import { SearchInput } from "@/components/form-field";
import { Combobox } from "@/components/ui/combobox";
import { useCurrentProfile } from "@/lib/current-profile";
import {
  AUTHORIZATION_STATUS_ORDER,
  TRACKING_STATUS_LABEL,
  TrackingTable,
  useExamRequests,
} from "@/features/authorizations";

export const Route = createFileRoute("/solicitacoes/")({
  head: () => ({
    meta: [
      { title: "Solicitações de exames | Guias+" },
      { name: "description", content: "Acompanhe o andamento das suas solicitações de exame junto à Recepção." },
      { property: "og:title", content: "Solicitações de exames | Guias+" },
      { property: "og:description", content: "Acompanhamento das solicitações de exame no Guias+." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RequestsTrackingPage,
});

function RequestsTrackingPage() {
  const me = useCurrentProfile().name;
  const all = useExamRequests();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const term = q.trim().toLowerCase();
  const rows = all
    .filter((r) => r.doctor === me)
    .filter((r) => !status || r.status === status)
    .filter((r) => !term || r.patient.toLowerCase().includes(term) || r.procedure.toLowerCase().includes(term))
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
  const activeCount = [q, status].filter(Boolean).length;

  return (
    <div className="flex min-h-dvh w-full bg-background text-foreground">
      <AppSidebar activeKey="solicitacoes" />
      <main className="min-w-0 flex-1 flex flex-col min-h-dvh">
        <div className="w-full flex-1 space-y-6 px-4 py-6 pb-16 pt-20 sm:px-6 sm:py-8 md:pt-8 lg:px-10">
          <AppBreadcrumb />
          <PageHeader
            title="Solicitações de exames"
            description="Acompanhe a autorização das solicitações enviadas pela página Extrair dados da guia. A Recepção atualiza o andamento."
          />
          <FilterCard
            id="tracking-filters"
            activeCount={activeCount}
            onClear={() => {
              setQ("");
              setStatus("");
            }}
            clearDisabled={activeCount === 0}
          >
            <div className="w-full min-w-0 sm:col-span-2 lg:w-auto lg:flex-1 lg:min-w-60">
              <SearchInput
                placeholder="Buscar por paciente ou procedimento"
                aria-label="Buscar solicitações"
                value={q}
                clearable
                onChange={(e) => setQ(e.target.value)}
                onClear={() => setQ("")}
              />
            </div>
            <div className="w-full min-w-0 lg:w-52">
              <Combobox
                aria-label="Status"
                options={AUTHORIZATION_STATUS_ORDER.map((s) => ({ value: s, label: TRACKING_STATUS_LABEL[s] }))}
                value={status}
                onChange={setStatus}
                placeholder="Todos os status"
                searchPlaceholder="Buscar status..."
                allOptionLabel="Todos os status"
                clearable
              />
            </div>
          </FilterCard>
          <SurfaceCard title="Solicitações" description={rows.length === 1 ? "1 solicitação" : `${rows.length} solicitações`}>
            <TrackingTable
              rows={rows}
              emptyLabel="Nenhuma solicitação encontrada."
              onView={(r) => navigate({ to: "/solicitacoes/$id", params: { id: r.id } })}
            />
          </SurfaceCard>
        </div>
        <SiteFooter />
      </main>
    </div>
  );
}
