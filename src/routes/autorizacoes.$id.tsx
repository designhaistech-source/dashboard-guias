import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { SurfaceCard } from "@/components/surface-card";
import { Button } from "@/components/ui/button";
import {
  AUTHORIZATION_REQUESTS,
  NEXT_ACTION,
  StatusLabel,
  formatElapsed,
} from "@/features/authorizations";

export const Route = createFileRoute("/autorizacoes/$id")({
  loader: ({ params }) => {
    const request = AUTHORIZATION_REQUESTS.find((r) => r.id === params.id);
    if (!request) throw notFound();
    return { id: request.id };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `Solicitação ${loaderData.id} | Guias+` : "Solicitação não encontrada | Guias+" },
      { name: "description", content: "Detalhes da solicitação de exame e da autorização junto à operadora." },
      { property: "og:title", content: "Solicitação de exame | Guias+" },
      { property: "og:description", content: "Detalhes da solicitação de exame no Guias+." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RequestDetailPage,
  notFoundComponent: RequestNotFound,
  errorComponent: RequestNotFound,
});

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full bg-background text-foreground">
      <AppSidebar activeKey="autorizacoes" />
      <main className="min-w-0 flex-1 flex flex-col min-h-dvh">
        <div className="w-full flex-1 space-y-6 px-4 py-6 pb-16 pt-20 sm:px-6 sm:py-8 md:pt-8 lg:px-10">
          <AppBreadcrumb />
          {children}
        </div>
        <SiteFooter />
      </main>
    </div>
  );
}

function BackButton() {
  return (
    <Button asChild variant="outline" size="sm">
      <Link to="/autorizacoes">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Voltar para Autorizações
      </Link>
    </Button>
  );
}

function RequestDetailPage() {
  const { id } = Route.useLoaderData();
  const r = AUTHORIZATION_REQUESTS.find((x) => x.id === id)!;
  const fields: [string, string][] = [
    ["Paciente", r.patient],
    ["Procedimento", `${r.procedureCode} · ${r.procedure}`],
    ["Profissional solicitante", r.doctor],
    ["Operadora", r.operadora],
    ["Tempo na situação", formatElapsed(r.statusSince)],
    ["Próxima ação", NEXT_ACTION[r.status]],
  ];
  return (
    <Shell>
      <PageHeader title="Solicitação de exame" description={r.id} actions={<BackButton />} />
      <SurfaceCard title="Resumo" description="O fluxo completo da autorização será disponibilizado nesta página.">
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Situação</dt>
            <dd className="mt-1"><StatusLabel request={r} /></dd>
          </div>
          {fields.map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-xs font-medium text-muted-foreground">{k}</dt>
              <dd className="mt-0.5 break-words text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      </SurfaceCard>
    </Shell>
  );
}

function RequestNotFound() {
  return (
    <Shell>
      <PageHeader title="Solicitação não encontrada" description="Ela pode ter sido removida ou o endereço está incorreto." actions={<BackButton />} />
    </Shell>
  );
}
