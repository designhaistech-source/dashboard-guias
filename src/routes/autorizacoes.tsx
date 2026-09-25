import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { AppSidebar } from "@/components/app-sidebar";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { SurfaceCard } from "@/components/surface-card";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import {
  AUTHORIZATION_REQUESTS,
  AUTHORIZATION_STATUS_LABEL,
  AUTHORIZATION_STATUS_ORDER,
  formatElapsed,
  type AuthorizationStatus,
} from "@/features/authorizations/data/authorization-requests";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableDesktop,
  DataTableHead,
  DataTableHeader,
  DataTableRoot,
  DataTableRow,
  DataTableEmptyRow,
} from "@/components/data-table";

const searchSchema = z.object({ status: fallback(z.string(), "").default("") });

export const Route = createFileRoute("/autorizacoes")({
  validateSearch: zodValidator(searchSchema),
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
  const active = (AUTHORIZATION_STATUS_ORDER as string[]).includes(status)
    ? (status as AuthorizationStatus)
    : undefined;
  const rows = AUTHORIZATION_REQUESTS.filter((r) => !active || r.status === active);

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
          <div className="flex flex-wrap gap-2" aria-label="Filtrar por situação">
            <Chip asChild selected={!active}>
              <Link to="/autorizacoes" search={{ status: "" }}>Todas</Link>
            </Chip>
            {AUTHORIZATION_STATUS_ORDER.map((s) => (
              <Chip key={s} asChild selected={active === s}>
                <Link to="/autorizacoes" search={{ status: s }}>{AUTHORIZATION_STATUS_LABEL[s]}</Link>
              </Chip>
            ))}
          </div>
          <SurfaceCard title="Solicitações" description={`${rows.length} solicitações`}>
            <DataTable>
              <DataTableDesktop breakpoint="sm">
                <DataTableRoot className="min-w-200">
                  <DataTableHeader>
                    <DataTableRow>
                      <DataTableHead>Paciente</DataTableHead>
                      <DataTableHead>Procedimento</DataTableHead>
                      <DataTableHead>Médico solicitante</DataTableHead>
                      <DataTableHead>Operadora</DataTableHead>
                      <DataTableHead>Situação</DataTableHead>
                      <DataTableHead>Tempo</DataTableHead>
                    </DataTableRow>
                  </DataTableHeader>
                  <DataTableBody>
                    {rows.length === 0 ? (
                      <DataTableEmptyRow colSpan={6}>Nenhuma solicitação nesta situação.</DataTableEmptyRow>
                    ) : (
                      rows.map((r) => (
                        <DataTableRow key={r.id}>
                          <DataTableCell>{r.patient}</DataTableCell>
                          <DataTableCell>{r.procedure}</DataTableCell>
                          <DataTableCell>{r.doctor}</DataTableCell>
                          <DataTableCell>{r.operadora}</DataTableCell>
                          <DataTableCell>
                            <Badge variant="outline" size="sm" className="whitespace-nowrap">
                              {AUTHORIZATION_STATUS_LABEL[r.status]}
                            </Badge>
                          </DataTableCell>
                          <DataTableCell className="tabular-nums">{formatElapsed(r.statusSince)}</DataTableCell>
                        </DataTableRow>
                      ))
                    )}
                  </DataTableBody>
                </DataTableRoot>
              </DataTableDesktop>
            </DataTable>
          </SurfaceCard>
        </div>
        <SiteFooter />
      </main>
    </div>
  );
}
