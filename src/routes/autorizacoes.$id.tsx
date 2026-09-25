import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { SurfaceCard } from "@/components/surface-card";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentProfile } from "@/lib/current-profile";
import {
  AUTHORIZATION_STATUS_LABEL,
  AUTHORIZATION_STATUS_ORDER,
  NEXT_ACTION,
  RequestTimeline,
  StatusLabel,
  assignRequest,
  formatElapsed,
  updateRequestStatus,
  useExamRequest,
  type AuthorizationStatus,
  type TrackedRequest,
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
  if (!r) {
    return (
      <Shell>
        <PageHeader title="Solicitação não encontrada" description="Ela pode ter sido removida ou o endereço está incorreto." actions={<BackButton />} />
      </Shell>
    );
  }
  const fields: [string, string][] = [
    ["Paciente", r.patient],
    ["Procedimento", `${r.procedureCode} · ${r.procedure}`],
    ["Profissional solicitante", r.doctor],
    ["Operadora", r.operadora],
    ["Responsável pela autorização", r.assignee ?? "—"],
    ["Tempo na situação", formatElapsed(r.statusSince)],
    ["Próxima ação", NEXT_ACTION[r.status]],
  ];
  return (
    <Shell>
      <PageHeader title="Solicitação de exame" description={r.id} actions={<BackButton />} />
      <SurfaceCard title="Resumo">
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Situação</dt>
            <dd className="mt-1"><StatusLabel request={r} /></dd>
          </div>
          {fields.map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-xs font-medium text-muted-foreground">{k}</dt>
              <dd className="mt-0.5 break-words text-foreground" suppressHydrationWarning>{v}</dd>
            </div>
          ))}
        </dl>
      </SurfaceCard>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ManageCard request={r} />
        <SurfaceCard title="Histórico do andamento">
          <RequestTimeline history={r.history} />
        </SurfaceCard>
      </div>
    </Shell>
  );
}

function ManageCard({ request: r }: { request: TrackedRequest }) {
  const me = useCurrentProfile().name;
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const mine = r.assignee === me;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) return;
    updateRequestStatus(r.id, status as AuthorizationStatus, me, note);
    toast.success(`Andamento atualizado: ${AUTHORIZATION_STATUS_LABEL[status as AuthorizationStatus]}`, {
      description: "O profissional solicitante já vê a atualização.",
    });
    setStatus("");
    setNote("");
  };

  return (
    <SurfaceCard title="Gerenciar autorização" description={mine ? "Você é responsável por esta solicitação." : undefined}>
      {!mine ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {r.assignee
              ? `Esta solicitação está com ${r.assignee}. Assuma para atualizar o andamento.`
              : "Nenhum funcionário da Recepção assumiu esta solicitação ainda."}
          </p>
          <Button
            onClick={() => {
              assignRequest(r.id, me);
              toast.success("Solicitação assumida");
            }}
          >
            <UserCheck className="h-4 w-4" aria-hidden="true" />
            Assumir solicitação
          </Button>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="request-status">
              Nova situação<span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Combobox
              id="request-status"
              aria-label="Nova situação"
              options={AUTHORIZATION_STATUS_ORDER.filter((s) => s !== r.status).map((s) => ({
                value: s,
                label: AUTHORIZATION_STATUS_LABEL[s],
              }))}
              value={status}
              onChange={setStatus}
              placeholder="Selecione a situação"
              searchPlaceholder="Buscar situação..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="request-note">Observação</Label>
            <Textarea
              id="request-note"
              value={note}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex.: protocolo da operadora, documento pendente..."
            />
          </div>
          <Button type="submit" disabled={!status}>
            Atualizar andamento
          </Button>
        </form>
      )}
    </SurfaceCard>
  );
}
