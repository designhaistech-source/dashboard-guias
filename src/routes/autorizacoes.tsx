import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { SurfaceCard } from "@/components/surface-card";
import { Chip } from "@/components/ui/chip";
import {
  AUTHORIZATION_REQUESTS,
  AUTHORIZATION_STATUS_LABEL,
  AUTHORIZATION_STATUS_ORDER,
  RequestsTable,
  type AuthorizationStatus,
} from "@/features/authorizations";

export const Route = createFileRoute("/autorizacoes")({
  validateSearch: (search: Record<string, unknown>) => ({
    status: typeof search.status === "string" ? search.status : "",
  }),
  head: () => ({
    meta: [
      { title: "Autorizações | Guias+" },
      { name: "description", content: "Acompanhe as solicitações de exame e as autorizações junto às operadoras." },
      { property: "og:title", content: "Autorizações | Guias+" },
      { property: "og:description", content: "Solicitações de exame e autorizações no Guias+." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthorizationsPage,
});

function AuthorizationsPage() {
  const { status } = Route.useSearch();
  const navigate = useNavigate({ from: "/autorizacoes" });
  const active = (AUTHORIZATION_STATUS_ORDER as string[]).includes(status)
    ? (status as AuthorizationStatus)
    : undefined;
  const rows = AUTHORIZATION_REQUESTS.filter((r) => !active || r.status === active);
  const setStatus = (s: string) => navigate({ to: ".", search: { status: s } });

  return (
    <div className="flex min-h-dvh w-full bg-background text-foreground">
      <AppSidebar activeKey="dashboard" />
      <main className="min-w-0 flex-1 flex flex-col min-h-dvh">
        <div className="w-full flex-1 space-y-6 px-4 py-6 pb-16 pt-20 sm:px-6 sm:py-8 md:pt-8 lg:px-10">
          <AppBreadcrumb />
          <PageHeader
            title="Autorizações"
            description="Solicitações de exame enviadas pelos médicos e sua situação junto às operadoras."
          />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por situação">
            <Chip variant={active ? "default" : "selected"} aria-pressed={!active} onClick={() => setStatus("")}>
              Todas
            </Chip>
            {AUTHORIZATION_STATUS_ORDER.map((s) => (
              <Chip
                key={s}
                variant={active === s ? "selected" : "default"}
                aria-pressed={active === s}
                onClick={() => setStatus(s)}
              >
                {AUTHORIZATION_STATUS_LABEL[s]}
              </Chip>
            ))}
          </div>
          <SurfaceCard title="Solicitações" description={`${rows.length} solicitações`}>
            <RequestsTable rows={rows} emptyLabel="Nenhuma solicitação nesta situação." />
          </SurfaceCard>
        </div>
        <SiteFooter />
      </main>
    </div>
  );
}
