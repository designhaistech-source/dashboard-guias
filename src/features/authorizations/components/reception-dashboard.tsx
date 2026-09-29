import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, Hourglass, Send, ShieldCheck, type LucideIcon } from "lucide-react";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { SurfaceCard } from "@/components/surface-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type AuthorizationStatus } from "../data/authorization-requests";
import { type ReceptionTask } from "../data/reception-tasks";
import { useExamRequests } from "../data/requests-store";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const ACTIONS: { task: ReceptionTask; label: string; hint: string; status: AuthorizationStatus; icon: LucideIcon; tone: string }[] = [
  { task: "solicitar", label: "Solicitar autorização", hint: "Pendentes de autorização", status: "pendente", icon: Send, tone: "bg-warning-muted text-warning-strong" },
  { task: "retorno", label: "Registrar retorno", hint: "Aguardando operadora", status: "aguardando", icon: Hourglass, tone: "bg-info/15 text-info" },
  { task: "realizacao", label: "Registrar realização", hint: "Autorizadas", status: "autorizada", icon: ShieldCheck, tone: "bg-success/15 text-success" },
];

const FLOW: { label: string; status: AuthorizationStatus }[] = [
  { label: "Pendente de autorização", status: "pendente" },
  { label: "Aguardando operadora", status: "aguardando" },
  { label: "Autorizados", status: "autorizada" },
  { label: "Realizados", status: "realizada" },
];

export function ReceptionDashboard() {
  const all = useExamRequests();
  const count = (s: AuthorizationStatus) => all.filter((r) => r.status === s).length;
  const issues = count("pendencia");

  return (
    <div className="flex min-h-dvh w-full bg-background text-foreground">
      <AppSidebar activeKey="dashboard" />
      <main className="min-w-0 flex-1 flex flex-col min-h-dvh">
        <div className="w-full flex-1 space-y-6 px-4 py-6 pb-16 pt-20 sm:px-6 sm:py-8 md:pt-8 lg:px-10">
          <AppBreadcrumb />
          <PageHeader title="Visão geral" description="Central operacional das solicitações de exames." />

          <SurfaceCard title="Ações" description="O que precisa ser feito agora.">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {ACTIONS.map((a) => (
                <Link
                  key={a.status}
                  to="/tarefas/$tarefa"
                  params={{ tarefa: a.task }}
                  className={cn("flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted", focusRing)}
                >
                  <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", a.tone)}>
                    <a.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">{a.label}</span>
                    <span className="block text-xs text-muted-foreground">{a.hint}: {count(a.status)}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard title="Fluxo dos exames" description="Etapas das solicitações. Clique para ver em Controle de exames.">
            <ol className="flex flex-col gap-2 md:flex-row md:items-center">
              {FLOW.map((f, i) => (
                <li key={f.status} className="flex flex-col items-stretch gap-2 md:flex-1 md:flex-row md:items-center">
                  <Link
                    to="/autorizacoes"
                    search={{ status: f.status }}
                    className={cn("flex flex-1 items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-muted", focusRing)}
                  >
                    <span className="text-sm font-medium text-foreground">{f.label}</span>
                    <span className="font-mono text-lg font-semibold tabular-nums text-foreground">{count(f.status)}</span>
                  </Link>
                  {i < FLOW.length - 1 && (
                    <ArrowRight className="h-4 w-4 shrink-0 self-center rotate-90 text-muted-foreground md:rotate-0" aria-hidden="true" />
                  )}
                </li>
              ))}
            </ol>
          </SurfaceCard>

          <div
            role="status"
            className={cn(
              "flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between",
              issues > 0 ? "border-warning bg-warning-muted" : "border-border bg-card",
            )}
          >
            <div className="flex items-center gap-3">
              {issues > 0 ? (
                <AlertTriangle className="h-5 w-5 shrink-0 text-warning-strong" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-success-strong" aria-hidden="true" />
              )}
              <span className="text-sm font-semibold text-foreground">
                {issues === 0 ? "Nenhuma solicitação com pendência" : issues === 1 ? "1 solicitação com pendência" : `${issues} solicitações com pendência`}
              </span>
            </div>
            {issues > 0 && (
              <Button asChild variant="outline" size="sm">
                <Link to="/tarefas/$tarefa" params={{ tarefa: "pendencias" }}>Ver pendências</Link>
              </Button>
            )}
          </div>
        </div>
        <SiteFooter />
      </main>
    </div>
  );
}
