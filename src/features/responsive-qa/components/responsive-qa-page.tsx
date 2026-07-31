import { useCallback, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw, ScanLine } from "lucide-react";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { PageHeader } from "@/components/page-header";
import { SiteFooter } from "@/components/site-footer";
import { SelectField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { QA_ROUTES, QA_WIDTHS, type QaWidth } from "../data/targets";
import { auditDocument, type QaReport } from "../lib/audit";

type ReportState = Record<number, QaReport | "pending" | "blocked" | undefined>;

export function ResponsiveQaPage() {
  const [route, setRoute] = useState(QA_ROUTES[0].path);
  const [reports, setReports] = useState<ReportState>({});
  const frames = useRef<Record<number, HTMLIFrameElement | null>>({});

  const auditWidth = useCallback((width: QaWidth) => {
    const frame = frames.current[width];
    const doc = frame?.contentDocument;
    if (!doc || !doc.body) {
      setReports((prev) => ({ ...prev, [width]: "blocked" }));
      return;
    }
    setReports((prev) => ({ ...prev, [width]: auditDocument(doc) }));
  }, []);

  const auditAll = useCallback(() => {
    for (const width of QA_WIDTHS) {
      setReports((prev) => ({ ...prev, [width]: "pending" }));
      auditWidth(width);
    }
  }, [auditWidth]);

  function handleRouteChange(next: string) {
    setRoute(next);
    setReports({});
  }

  const totalIssues = QA_WIDTHS.reduce((sum, width) => {
    const report = reports[width];
    return typeof report === "object" ? sum + report.issues.length : sum;
  }, 0);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <AppSidebar activeKey="qa-responsividade" />

      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <div className="w-full flex-1 space-y-6 px-4 py-6 pb-16 sm:px-6 sm:py-8 lg:px-10">
          <AppBreadcrumb />
          <PageHeader
            title="Testes de responsividade"
            description="Renderize qualquer tela do sistema em 360, 390, 768 e 1280px e verifique cortes de texto, rolagem horizontal e elementos fora da viewport."
            actions={
              <Button type="button" onClick={auditAll} className="justify-center">
                <RefreshCw className="icon-optical h-4 w-4" aria-hidden />
                Verificar cortes
              </Button>
            }
          />

          <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 lg:flex-row lg:items-end">
            <SelectField
              id="qa-rota"
              label="Tela avaliada"
              value={route}
              onValueChange={handleRouteChange}
              options={QA_ROUTES.map((item) => ({ value: item.path, label: item.label }))}
              className="lg:w-72"
              triggerClassName="w-full"
            />
            <p
              className="text-sm text-muted-foreground lg:pb-2.5"
              aria-live="polite"
            >
              {totalIssues === 0
                ? "Ajuste a tela e clique em “Verificar cortes” para inspecionar todas as larguras."
                : `${totalIssues} ${totalIssues === 1 ? "ocorrência" : "ocorrências"} encontradas nas larguras testadas.`}
            </p>
          </div>

          <div className="space-y-6">
            {QA_WIDTHS.map((width) => {
              const report = reports[width];
              return (
                <section
                  key={width}
                  aria-label={`Pré-visualização em ${width} pixels`}
                  className="rounded-xl border border-border bg-card"
                >
                  <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <ScanLine className="icon-optical h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      <h2 className="truncate font-display text-sm font-semibold tracking-tight">
                        {width}px
                      </h2>
                      <StatusBadge report={report} />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => auditWidth(width)}
                    >
                      Verificar
                    </Button>
                  </header>

                  <div className="overflow-x-auto p-4">
                    <iframe
                      ref={(node) => {
                        frames.current[width] = node;
                      }}
                      src={route}
                      title={`${route} em ${width}px`}
                      className="block h-[620px] rounded-lg border border-border bg-background"
                      style={{ width: `${width}px`, maxWidth: "none" }}
                      onLoad={() => auditWidth(width)}
                    />
                  </div>

                  <IssueList report={report} />
                </section>
              );
            })}
          </div>
        </div>

        <SiteFooter />
      </main>
    </div>
  );
}

function StatusBadge({ report }: { report: QaReport | "pending" | "blocked" | undefined }) {
  if (report === undefined) return <Badge variant="secondary">Não verificado</Badge>;
  if (report === "pending") return <Badge variant="secondary">Verificando…</Badge>;
  if (report === "blocked") return <Badge variant="destructive">Sem acesso ao conteúdo</Badge>;
  const problems = report.issues.length + (report.hasHorizontalScroll ? 1 : 0);
  if (problems === 0) {
    return (
      <Badge variant="secondary" className="gap-1">
        <CheckCircle2 className="icon-optical h-3.5 w-3.5" aria-hidden />
        Sem cortes
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="gap-1">
      <AlertTriangle className="icon-optical h-3.5 w-3.5" aria-hidden />
      {problems} {problems === 1 ? "problema" : "problemas"}
    </Badge>
  );
}

function IssueList({ report }: { report: QaReport | "pending" | "blocked" | undefined }) {
  if (typeof report !== "object") return null;
  if (!report.hasHorizontalScroll && report.issues.length === 0) return null;

  return (
    <div className="border-t border-border px-4 py-3">
      {report.hasHorizontalScroll && (
        <p className="mb-2 text-sm font-medium text-destructive">
          A página apresenta rolagem horizontal nesta largura.
        </p>
      )}
      <ul className="space-y-2">
        {report.issues.map((issue, index) => (
          <li
            key={`${issue.selector}-${index}`}
            className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {issue.kind === "text-clip" ? "Texto cortado" : "Fora da viewport"}
              </Badge>
              <span className="font-mono text-xs text-muted-foreground">
                {issue.clientWidth}px visível / {issue.scrollWidth}px necessário
              </span>
            </div>
            {issue.text && <p className="mt-1 break-words">“{issue.text}”</p>}
            <p className="mt-1 font-mono text-xs text-muted-foreground break-words">
              {issue.selector}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
