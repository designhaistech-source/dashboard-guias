import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { SurfaceCard } from "@/components/surface-card";
import { Button } from "@/components/ui/button";
import {
  RECEPTION_TASKS,
  RequestActionDialog,
  RequestsTable,
  byLongestWaiting,
  isReceptionTask,
  useExamRequests,
} from "@/features/authorizations";

export const Route = createFileRoute("/tarefas/$tarefa")({
  head: ({ params }) => {
    const task = isReceptionTask(params.tarefa) ? RECEPTION_TASKS[params.tarefa] : null;
    const title = `${task?.title ?? "Tarefa"} | Guias+`;
    return {
      meta: [
        { title },
        { name: "description", content: task?.description ?? "Tarefas operacionais da Recepção." },
        { property: "og:title", content: title },
        { property: "og:description", content: "Tarefas operacionais da Recepção no Guias+." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: TaskPage,
});

function TaskPage() {
  const { tarefa } = Route.useParams();
  const all = useExamRequests();
  const [openId, setOpenId] = useState<string | null>(null);
  const task = isReceptionTask(tarefa) ? RECEPTION_TASKS[tarefa] : null;
  const rows = task ? all.filter((r) => r.status === task.status).sort(byLongestWaiting) : [];
  const selected = all.find((r) => r.id === openId) ?? null;

  return (
    <div className="flex min-h-dvh w-full bg-background text-foreground">
      <AppSidebar activeKey="dashboard" />
      <main className="min-w-0 flex-1 flex flex-col min-h-dvh">
        <div className="w-full flex-1 space-y-6 px-4 py-6 pb-16 pt-20 sm:px-6 sm:py-8 md:pt-8 lg:px-10">
          <AppBreadcrumb />
          <PageHeader
            title={task?.title ?? "Tarefa não encontrada"}
            description={task?.description ?? "Volte para a Visão geral e escolha uma ação."}
            actions={
              <Button asChild variant="outline" size="sm">
                <Link to="/">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Voltar para Visão geral
                </Link>
              </Button>
            }
          />
          {task && (
            <SurfaceCard
              title={task.listTitle}
              description={`${rows.length} ${rows.length === 1 ? "solicitação" : "solicitações"}, da mais antiga para a mais recente.`}
            >
              <RequestsTable
                rows={rows}
                emptyLabel={task.empty}
                actionLabel={task.action}
                onView={(r) => setOpenId(r.id)}
              />
            </SurfaceCard>
          )}
          <RequestActionDialog request={selected} open={!!openId} onOpenChange={(o) => !o && setOpenId(null)} />
        </div>
        <SiteFooter />
      </main>
    </div>
  );
}
