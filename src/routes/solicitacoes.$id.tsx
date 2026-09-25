import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { SurfaceCard } from "@/components/surface-card";
import { Button } from "@/components/ui/button";
import { RequestTimeline, TrackingStatus, formatDateTime, useExamRequest } from "@/features/authorizations";

export const Route = createFileRoute("/solicitacoes/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Solicitação ${params.id} | Guias+` },
      { name: "description", content: "Andamento da solicitação de exame e histórico da autorização." },
      { property: "og:title", content: "Acompanhamento da solicitação | Guias+" },
      { property: "og:description", content: "Histórico do andamento da solicitação de exame no Guias+." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TrackingDetailPage,
});

function BackButton() {
  return (
    <Button asChild variant="outline" size="sm">
      <Link to="/solicitacoes">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Voltar para Solicitações
      </Link>
    </Button>
  );
}

function TrackingDetailPage() {
  const { id } = Route.useParams();
  const r = useExamRequest(id);
  return (
    <div className="flex min-h-dvh w-full bg-background text-foreground">
      <AppSidebar activeKey="solicitacoes" />
      <main className="min-w-0 flex-1 flex flex-col min-h-dvh">
        <div className="w-full flex-1 space-y-6 px-4 py-6 pb-16 pt-20 sm:px-6 sm:py-8 md:pt-8 lg:px-10">
          <AppBreadcrumb />
          {!r ? (
            <PageHeader title="Solicitação não encontrada" description="Ela pode ter sido removida ou o endereço está incorreto." actions={<BackButton />} />
          ) : (
            <>
              <PageHeader title="Solicitação de exame" description={r.id} actions={<BackButton />} />
              <SurfaceCard title="Resumo" description="A Recepção gerencia a autorização; aqui você acompanha o andamento.">
                <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Status</dt>
                    <dd className="mt-1"><TrackingStatus request={r} /></dd>
                  </div>
                  {([
                    ["Paciente", r.patient],
                    ["Procedimento", `${r.procedureCode} · ${r.procedure}`],
                    ["Data da solicitação", formatDateTime(r.receivedAt)],
                    ["Operadora", r.operadora],
                    ["Responsável pela autorização", r.assignee ?? "—"],
                  ] as const).map(([k, v]) => (
                    <div key={k} className="min-w-0">
                      <dt className="text-xs font-medium text-muted-foreground">{k}</dt>
                      <dd className="mt-0.5 break-words text-foreground" suppressHydrationWarning>{v}</dd>
                    </div>
                  ))}
                </dl>
              </SurfaceCard>
              <SurfaceCard title="Histórico do andamento">
                <RequestTimeline history={r.history} />
              </SurfaceCard>
            </>
          )}
        </div>
        <SiteFooter />
      </main>
    </div>
  );
}
