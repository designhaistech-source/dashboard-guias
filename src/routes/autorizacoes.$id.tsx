import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { SurfaceCard } from "@/components/surface-card";
import { Button } from "@/components/ui/button";
import { formatIsoToBr } from "@/lib/date";
import {
  AUTHORIZATION_STATUS_LABEL,
  ACTION_BY_STATUS,
  FactList,
  OriginalDocumentButton,
  RequestActionDialog,
  RequestTimeline,
  StatusLabel,
  formatDateTime,
  formatElapsed,
  useExamRequest,
} from "@/features/authorizations";

export const Route = createFileRoute("/autorizacoes/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Solicitação ${params.id} | Guias+` },
      { name: "description", content: "Detalhes da solicitação de exame e da autorização junto à operadora." },
      { property: "og:title", content: "Solicitação de exame | Guias+" },
      { property: "og:description", content: "Detalhes da solicitação de exame no Guias+." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RequestDetailPage,
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
  const { id } = Route.useParams();
  const r = useExamRequest(id);
  const [open, setOpen] = useState(false);
  if (!r) {
    return (
      <Shell>
        <PageHeader title="Solicitação não encontrada" description="Ela pode ter sido removida ou o endereço está incorreto." actions={<BackButton />} />
      </Shell>
    );
  }
  const action = ACTION_BY_STATUS[r.status];
  const fields: [string, string][] = [
    ["Paciente", r.patient],
    ["Procedimento", `${r.procedureCode} · ${r.procedure}`],
    ["Profissional solicitante", r.doctor],
    ["Operadora", r.operadora],
    ["Data da solicitação", formatDateTime(r.receivedAt)],
    ["Responsável", r.assignee ?? "—"],
    ["Tempo na situação", formatElapsed(r.statusSince)],
  ];
  const resp = r.response;
  return (
    <Shell>
      <PageHeader title="Solicitação de exame" description={r.id} actions={<BackButton />} />
      <SurfaceCard title="Situação atual">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <StatusLabel request={r} />
            <p className="text-sm text-muted-foreground">Próxima ação: {action ? action.label : "somente consulta"}</p>
          </div>
          {action && (
            <Button onClick={() => setOpen(true)}>
              <action.icon className="h-4 w-4" aria-hidden="true" />
              {action.label}
            </Button>
          )}
        </div>
      </SurfaceCard>
      <SurfaceCard title="Dados da solicitação" actions={<OriginalDocumentButton request={r} />}>
        <FactList facts={fields} />
      </SurfaceCard>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {r.authorization && (
            <SurfaceCard title="Dados da autorização">
              <FactList
                facts={[
                  ["Solicitada à operadora em", formatIsoToBr(r.authorization.requestedAt)],
                  ["Protocolo", r.authorization.protocol ?? ""],
                  ["Observações", r.authorization.notes ?? ""],
                  ...(resp
                    ? ([
                        ["Retorno da operadora", AUTHORIZATION_STATUS_LABEL[resp.result]],
                        ...(resp.result === "autorizada"
                          ? [
                              ["Número da autorização", resp.number ?? ""],
                              ["Data da autorização", formatIsoToBr(resp.date)],
                              ["Validade", formatIsoToBr(resp.validity) || "Não informada"],
                            ]
                          : [[resp.result === "pendencia" ? "Motivo da pendência" : "Motivo", resp.reason ?? ""]]),
                        ["Observações do retorno", resp.notes ?? ""],
                        ["Registrado por", resp.registeredBy],
                      ] as [string, string][])
                    : []),
                ]}
              />
            </SurfaceCard>
          )}
          {r.execution && (
            <SurfaceCard title="Dados da realização">
              <FactList
                facts={[
                  ["Data da realização", formatIsoToBr(r.execution.date)],
                  ["Observações", r.execution.notes ?? ""],
                  ["Registrado por", r.execution.registeredBy],
                ]}
              />
            </SurfaceCard>
          )}
          {!r.authorization && (
            <SurfaceCard title="Dados da autorização">
              <p className="text-sm text-muted-foreground">A autorização ainda não foi solicitada à operadora.</p>
            </SurfaceCard>
          )}
        </div>
        <SurfaceCard title="Histórico do andamento">
          <RequestTimeline history={r.history} />
        </SurfaceCard>
      </div>
      <RequestActionDialog request={r} open={open} onOpenChange={setOpen} />
    </Shell>
  );
}
