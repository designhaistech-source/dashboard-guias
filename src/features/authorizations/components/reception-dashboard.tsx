import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, Clock, Hourglass, Send, ShieldCheck, type LucideIcon } from "lucide-react";
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
  { task: "solicitar", label: "Solicitar autorização", hint: "Solicitações aguardando envio à operadora.", status: "pendente", icon: Send, tone: "bg-warning-muted text-warning-strong" },
  { task: "retorno", label: "Confirmar autorização", hint: "Solicitações aguardando retorno da operadora.", status: "aguardando", icon: Hourglass, tone: "bg-info/15 text-info" },
  { task: "realizacao", label: "Confirmar realização", hint: "Exames autorizados aguardando confirmação de realização.", status: "autorizada", icon: ShieldCheck, tone: "bg-success/15 text-success" },
];

// "faturamento" is a future stage with no status in the store yet.
const FLOW: { label: string; status: AuthorizationStatus | null }[] = [
  { label: "Pendente de autorização", status: "pendente" },
  { label: "Aguardando operadora", status: "aguardando" },
  { label: "Autorizado", status: "autorizada" },
  { label: "Realizado", status: "realizada" },
  { label: "Encaminhado para faturamento", status: null },
];

// Prototype-only sample threshold; not a system rule.
const SAMPLE_OVERDUE_MS = 3 * 24 * 60 * 60 * 1000;

export function ReceptionDashboard() {
  const all = useExamRequests();
  const count = (s: AuthorizationStatus) => all.filter((r) => r.status === s).length;
  const issues = count("pendencia");
  const now = Date.now();
  const overdue = all.filter((r) => r.status === "aguardando" && now - new Date(r.statusSince).getTime() > SAMPLE_OVERDUE_MS).length;

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
                  to="/autorizacoes"
                  search={{ status: a.status }}
                  className={cn("flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted", focusRing)}
                >
                  <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", a.tone)}>
                    <a.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">{a.label}</span>
                    <span className="block text-xs text-muted-foreground">{a.hint}</span>
                  </span>
                  <span className="font-mono text-lg font-semibold tabular-nums text-foreground" aria-label={`${count(a.status)} solicitações`}>{count(a.status)}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard title="Fluxo dos exames" description="Etapas das solicitações. Clique para ver em Exames.">
            <ol className="flex flex-col gap-2 md:flex-row md:items-center">
              {FLOW.map((f, i) => (
                <li key={f.label} className="flex flex-col items-stretch gap-2 md:flex-1 md:flex-row md:items-center">
                  {f.status ? (
                    <Link
                      to="/autorizacoes"
                      search={{ status: f.status }}
                      className={cn("flex flex-1 items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-muted", focusRing)}
                    >
                      <span className="text-sm font-medium text-foreground">{f.label}</span>
                      <span className="font-mono text-lg font-semibold tabular-nums text-foreground">{count(f.status)}</span>
                    </Link>
                  ) : (
                    <div className="flex flex-1 items-center justify-between gap-2 rounded-xl border border-dashed border-border bg-card px-4 py-3">
                      <span className="text-sm font-medium text-foreground">{f.label}</span>
                      <span className="font-mono text-lg font-semibold tabular-nums text-muted-foreground">0</span>
                    </div>
                  )}
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
                <Link to="/autorizacoes" search={{ status: "pendencia" }}>Ver pendências</Link>
              </Button>
            )}
          </div>

          {overdue > 0 && (
            <div role="status" className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm text-foreground">
                  {overdue === 1 ? "1 autorização aguardando" : `${overdue} autorizações aguardando`} retorno da operadora há mais tempo
                </span>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/autorizacoes" search={{ status: "aguardando" }}>Cobrar operadora</Link>
              </Button>
            </div>
          )}
        </div>
        <SiteFooter />
      </main>
    </div>
  );
}
