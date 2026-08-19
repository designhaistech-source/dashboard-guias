import { useCallback, useMemo, useState } from "react";
import {
  FileText,
  Stethoscope,
  CalendarCheck,
  Printer,
  Download,
  BookmarkPlus,
  User,
  Loader2,
} from "lucide-react";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

import {
  appTabsIconClass,
  appTabsLabelClass,
  appTabsListClass,
  appTabsTriggerClass,
} from "@/components/app-tabs";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { FormActionBar } from "@/components/form-action-bar";
import { useDraftAutosave } from "@/hooks/use-draft-autosave";
import { SurfaceCard } from "@/components/surface-card";
import { Field, SelectField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CID10 } from "@/lib/cid";

import { improveDocumentText } from "../lib/improve-text.functions";

import { CidAutocomplete } from "./cid-autocomplete";
import { DocumentEditorHeader } from "./document-editor-header";
import { RichTextEditor } from "./rich-text-editor";
import { useTextReplacement } from "./use-text-replacement";
import { getDocumentDateStatus, todayIsoDate } from "../data/document-date";
import {
  findCid,
  validateCid,
  validateCidade,
  validateDiasAfastamento,
  validateLocal,
  validatePaciente,
  validateTimeRange,
} from "../data/document-validation";


import {
  DOCUMENT_VARIABLES,
  REPORT_TEMPLATES,
  AFASTAMENTO_OPTIONS,
  buildAtestado,
  buildComparecimento,
  formatDateLong,
  printHtml,
  todayIso,
} from "../data/documents";

/** Página de documentos clínicos: relatórios, atestados e declarações. */
export function DocumentsPage() {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <AppSidebar activeKey="relatorios" />

      <main className="flex min-h-screen flex-1 flex-col overflow-x-hidden">
        <div className="w-full flex-1 space-y-6 px-6 py-8 pb-16 pt-20 md:pt-8 lg:px-10">
          <AppBreadcrumb />
          <PageHeader
            title="Relatórios e documentos"
            description="Emita relatórios médicos, atestados e declarações de comparecimento com dados do paciente, CID e texto gerado automaticamente."
          />

          <Tabs defaultValue="relatorios" className="space-y-6">
            <TabsList className={appTabsListClass}>
              <TabsTrigger value="relatorios" className={appTabsTriggerClass}>
                <FileText className={appTabsIconClass} aria-hidden />
                <span className={appTabsLabelClass}>Relatórios</span>
              </TabsTrigger>
              <TabsTrigger value="atestados" className={appTabsTriggerClass}>
                <Stethoscope className={appTabsIconClass} aria-hidden />
                <span className={appTabsLabelClass}>Atestados</span>
              </TabsTrigger>
              <TabsTrigger value="comparecimento" className={appTabsTriggerClass}>
                <CalendarCheck className={appTabsIconClass} aria-hidden />
                <span className={appTabsLabelClass}>
                  <span className="xs:hidden">Compar.</span>
                  <span className="hidden xs:inline">Comparecimento</span>
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="relatorios" className="space-y-6">
              <ReportsTab />
            </TabsContent>
            <TabsContent value="atestados" className="space-y-6">
              <CertificateTab />
            </TabsContent>
            <TabsContent value="comparecimento" className="space-y-6">
              <AttendanceTab />
            </TabsContent>
          </Tabs>
        </div>
        <SiteFooter />
      </main>
    </div>
  );
}

/**
 * Encapsula a melhoria de texto com IA usada nas três abas de documentos.
 * Mantém o estado de carregamento e o feedback de erro/sucesso.
 */
function useImproveWithAi(
  documentType: string,
  html: string,
  onResult: (html: string) => void,
  requestReplace: ReturnType<typeof useTextReplacement>["requestReplace"],
) {
  const [improving, setImproving] = useState(false);

  const improve = useCallback(() => {
    const plain = html.replace(/<[^>]+>/g, "").trim();
    if (!plain) {
      toast.error("Escreva o texto do documento antes de melhorar com IA.");
      return;
    }
    requestReplace({
      title: "Melhorar texto com IA?",
      description:
        "A IA reescreve todo o texto do editor e substitui o conteúdo atual. Você poderá desfazer pelo aviso exibido após a substituição.",
      confirmLabel: "Melhorar texto",
      successMessage: "Texto aprimorado com IA.",
      apply: async () => {
        setImproving(true);
        try {
          const result = await improveDocumentText({ data: { documentType, html } });
          onResult(result.html);
        } catch (error) {
          toast.error(
            error instanceof Error && error.message
              ? error.message
              : "Não foi possível melhorar o texto agora.",
          );
          throw error;
        } finally {
          setImproving(false);
        }
      },
    });
  }, [documentType, html, onResult, requestReplace]);

  return { improving, improve };
}


/* ---------------- Ações comuns ---------------- */

export interface FieldIssue {
  /** id do campo culpado, usado para focar/rolar até ele. */
  fieldId: string;
  label: string;
  message: string;
}

/** Monta a lista de erros ignorando campos válidos. */
function buildIssues(
  entries: { fieldId: string; label: string; message?: string }[],
): FieldIssue[] {
  return entries
    .filter((e): e is FieldIssue => Boolean(e.message))
    .map((e) => ({ fieldId: e.fieldId, label: e.label, message: e.message }));
}

/** Move o foco (e a rolagem) para o campo com erro. */
function focusField(fieldId: string) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  (el as HTMLElement).focus({ preventScroll: true });
}

function DocumentActions({
  title,
  html,
  paciente,
  pacienteFieldId,
  onSaveTemplate,
  issues = [],
}: {
  title: string;
  html: string;
  paciente: string;
  /** id do campo de paciente, para focar quando estiver vazio. */
  pacienteFieldId: string;
  onSaveTemplate?: () => void;
  /** Erros de validação com o campo culpado, exibidos inline e anunciados por leitor de tela. */
  issues?: FieldIssue[];
}) {
  const disabled = !paciente.trim();
  const temTexto = html.replace(/<[^>]+>/g, "").trim().length > 0;
  const [downloading, setDownloading] = useState(false);
  const summaryId = "document-actions-issues";

  const allIssues: FieldIssue[] = disabled
    ? [
        {
          fieldId: pacienteFieldId,
          label: "Paciente",
          message: "Informe o nome do paciente.",
        },
        ...issues,
      ]
    : issues;

  const hasIssues = allIssues.length > 0;

  function reportIssues() {
    const first = allIssues[0];
    toast.error(first.message);
    focusField(first.fieldId);
  }

  function handlePrint() {
    if (hasIssues) {
      reportIssues();
      return;
    }
    printHtml(title, paciente, html);
  }

  async function handleDownload() {
    if (hasIssues) {
      reportIssues();
      return;
    }
    if (!temTexto) {
      toast.error("Escreva o texto do documento antes de baixar o PDF.");
      return;
    }


    setDownloading(true);
    const toastId = toast.loading("Gerando PDF do documento…");
    try {
      const { downloadDocumentPdf } = await import("../data/document-pdf");
      const fileName = downloadDocumentPdf(title, paciente, html);
      toast.success(`PDF gerado: ${fileName}`, {
        id: toastId,
        description: "Documento sem assinatura digital — imprima para assinar manualmente.",
      });
    } catch {
      toast.error("Não foi possível gerar o PDF. Tente novamente.", { id: toastId });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <FormActionBar
      stepsLabel="Etapas preenchidas"
      steps={[
        { label: "Paciente", done: !disabled },
        { label: "Texto do documento", done: temTexto },
      ]}
      note="Para ter validade, o documento deve ser impresso e assinado manualmente pelo médico."
      banner={
        hasIssues ? (
          <div
            id={summaryId}
            role="alert"
            aria-live="polite"
            className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive sm:text-sm"
          >
            <p className="flex items-start gap-1.5 font-medium">
              <AlertCircle className="icon-optical mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>
                {allIssues.length === 1
                  ? "1 campo precisa de correção antes de emitir o documento:"
                  : `${allIssues.length} campos precisam de correção antes de emitir o documento:`}
              </span>
            </p>
            <ul className="mt-1.5 space-y-1 pl-6">
              {allIssues.map((issue) => (
                <li key={`${issue.fieldId}-${issue.message}`}>
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto justify-start p-0 text-left text-xs text-destructive underline sm:text-sm"
                    onClick={() => focusField(issue.fieldId)}
                  >
                    {issue.label}: {issue.message}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : undefined
      }
    >
      {onSaveTemplate && (
        <Button type="button" variant="ghost" size="sm" onClick={onSaveTemplate}>
          <BookmarkPlus className="icon-optical h-4 w-4" aria-hidden />
          Salvar como modelo
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={downloading}
        aria-busy={downloading}
        aria-describedby={hasIssues ? summaryId : undefined}
      >
        {downloading ? (
          <Loader2 className="icon-optical h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Download className="icon-optical h-4 w-4" aria-hidden />
        )}
        {downloading ? "Gerando PDF…" : "Baixar PDF"}
      </Button>
      <Button
        type="button"
        size="sm"
        onClick={handlePrint}
        aria-describedby={hasIssues ? summaryId : undefined}
      >
        <Printer className="icon-optical h-4 w-4" aria-hidden />
        Imprimir e assinar
      </Button>

    </FormActionBar>
  );
}


function PatientField({
  id,
  value,
  onChange,
  error,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <Field id={id} label="Paciente" required error={error}>
      <div className="relative">
        <User
          className="icon-optical pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id={id}
          className="pl-9"
          maxLength={120}
          placeholder="Digite o nome do beneficiário..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </Field>
  );
}


function CidFields({
  cid,
  descricao,
  onChange,
  error,
}: {
  cid: string;
  descricao: string;
  onChange: (codigo: string, descricao: string) => void;
  error?: string;
}) {
  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]">
      <Field id="cid-codigo" label="CID" error={error}>
        <Input
          id="cid-codigo"
          className="font-mono"
          placeholder="CID"
          value={cid}
          aria-invalid={error ? true : undefined}
          onChange={(e) => {
            const codigo = e.target.value.toUpperCase();
            // Mantém a descrição sincronizada quando o código digitado existe na base.
            onChange(codigo, findCid(codigo)?.descricao ?? "");
          }}
        />
      </Field>
      <Field
        id="cid-diagnostico"
        label="Diagnóstico"
        hint="A busca consulta a base CID-10 e preenche o código automaticamente."
      >
        <CidAutocomplete
          id="cid-diagnostico"
          value={cid}
          description={descricao}
          onSelect={(item) => onChange(item?.codigo ?? "", item?.descricao ?? "")}
        />
      </Field>
    </div>
  );
}


/* ---------------- Relatórios ---------------- */

function ReportsTab() {
  const [paciente, setPaciente] = useState("");
  const [cid, setCid] = useState("");
  const [diagnosticoSelecionado, setDiagnosticoSelecionado] = useState("");
  const [modelo, setModelo] = useState("");
  const [html, setHtml] = useState("");

  useDraftAutosave({
    key: "hg:documentos:relatorio",
    data: { paciente, cid, diagnosticoSelecionado, modelo, html },
    isEmpty: (d) => !d.paciente.trim() && !d.cid.trim() && !d.html.replace(/<[^>]+>/g, "").trim(),
    onRestore: (d) => {
      setPaciente(d.paciente ?? "");
      setCid(d.cid ?? "");
      setDiagnosticoSelecionado(d.diagnosticoSelecionado ?? "");
      setModelo(d.modelo ?? "");
      setHtml(d.html ?? "");
    },
  });

  const diagnostico =
    diagnosticoSelecionado || (CID10.find((c) => c.codigo === cid)?.descricao ?? "");

  function handleCid(codigo: string, descricao: string) {
    setCid(codigo);
    setDiagnosticoSelecionado(descricao);
  }

  const { requestReplace, replacementDialog } = useTextReplacement(html, setHtml);

  const pacienteError = useMemo(() => validatePaciente(paciente), [paciente]);
  const cidError = useMemo(() => validateCid(cid), [cid]);

  const issues = useMemo(
    () =>
      buildIssues([
        { fieldId: "relatorio-paciente", label: "Paciente", message: pacienteError },
        { fieldId: "cid-codigo", label: "CID", message: cidError },
      ]),
    [pacienteError, cidError],
  );


  function applyTemplate(value: string) {
    const template = REPORT_TEMPLATES.find((t) => t.value === value);
    if (!template) return;
    requestReplace({
      title: "Aplicar modelo?",
      description: `O texto atual do relatório será substituído pelo modelo “${template.label}”. Você poderá desfazer pelo aviso exibido após a troca.`,
      confirmLabel: "Aplicar modelo",
      successMessage: `Modelo “${template.label}” aplicado.`,
      apply: () => {
        setModelo(value);
        setHtml(template.content);
      },
    });
  }

  const { improving, improve } = useImproveWithAi(
    "Relatório médico",
    html,
    setHtml,
    requestReplace,
  );


  return (
    <>
      <SurfaceCard
        title="Dados do relatório"
        description="Identifique o paciente e o diagnóstico que será impresso no documento."
        icon={<FileText className="icon-optical h-4 w-4" aria-hidden />}
        padding="lg"
      >
        <div className="space-y-4">
          <PatientField
            id="relatorio-paciente"
            value={paciente}
            onChange={setPaciente}
            error={pacienteError}
          />

          <SelectField
            id="relatorio-modelo"
            label="Modelos disponíveis"
            placeholder="Selecione um modelo salvo"
            value={modelo}
            onValueChange={applyTemplate}
            options={REPORT_TEMPLATES.map((t) => ({ value: t.value, label: t.label }))}
            hint="Use “Salvar como modelo” após redigir o texto para reaproveitá-lo depois."
          />
          <CidFields cid={cid} descricao={diagnosticoSelecionado} onChange={handleCid} error={cidError} />
        </div>
      </SurfaceCard>


      <RichTextEditor
        ariaLabel="Texto do relatório médico"
        value={html}
        onChange={setHtml}
        onImproveWithAi={improve}
        improving={improving}
        variables={DOCUMENT_VARIABLES}
        placeholder="Redija o relatório médico..."
        header={
          <DocumentEditorHeader
            title="Relatório médico"
            meta={
              <>
                Paciente: {paciente || "—"}
                {diagnostico && ` · ${cid} — ${diagnostico}`}
              </>
            }
          />
        }
      />

      <DocumentActions
        title="Relatório médico"
        html={html}
        paciente={paciente}
        pacienteFieldId="relatorio-paciente"
        issues={issues}

        onSaveTemplate={() => toast.success("Modelo salvo e disponível na lista (simulação).")}
      />

      {replacementDialog}
    </>
  );
}

/* ---------------- Atestados ---------------- */

function CertificateTab() {
  const [paciente, setPaciente] = useState("");
  const [cid, setCid] = useState("");
  const [diagnosticoSelecionado, setDiagnosticoSelecionado] = useState("");

  function handleCid(codigo: string, descricao: string) {
    setCid(codigo);
    setDiagnosticoSelecionado(descricao);
  }

  const [dias, setDias] = useState("1");
  const [data, setData] = useState(todayIso());
  const [cidade, setCidade] = useState("");
  const [html, setHtml] = useState("");

  useDraftAutosave({
    key: "hg:documentos:atestado",
    data: { paciente, cid, diagnosticoSelecionado, dias, data, cidade, html },
    isEmpty: (d) => !d.paciente.trim() && !d.cid.trim() && !d.cidade.trim() && !d.html,
    onRestore: (d) => {
      setPaciente(d.paciente ?? "");
      setCid(d.cid ?? "");
      setDiagnosticoSelecionado(d.diagnosticoSelecionado ?? "");
      setDias(d.dias ?? "1");
      setData(d.data ?? todayIso());
      setCidade(d.cidade ?? "");
      setHtml(d.html ?? "");
    },
  });

  const gerado = useMemo(
    () => buildAtestado({ paciente, dias, data, cidade, cid }),
    [paciente, dias, data, cidade, cid],
  );

  const conteudo = html || gerado;

  const dataStatus = useMemo(() => getDocumentDateStatus(data), [data]);

  const pacienteError = useMemo(() => validatePaciente(paciente), [paciente]);
  const cidError = useMemo(() => validateCid(cid), [cid]);
  const cidadeError = useMemo(() => validateCidade(cidade), [cidade]);
  const diasError = useMemo(() => validateDiasAfastamento(dias), [dias]);

  const issues = useMemo(
    () =>
      buildIssues([
        { fieldId: "atestado-paciente", label: "Paciente", message: pacienteError },
        { fieldId: "cid-codigo", label: "CID", message: cidError },
        { fieldId: "atestado-dias", label: "Dias de afastamento", message: diasError },
        { fieldId: "atestado-data", label: "Data do documento", message: dataStatus.error },
        { fieldId: "atestado-cidade", label: "Cidade", message: cidadeError },
      ]),
    [pacienteError, cidError, diasError, dataStatus.error, cidadeError],
  );


  const { requestReplace, replacementDialog } = useTextReplacement(html, setHtml);

  const { improving, improve } = useImproveWithAi(
    "Atestado médico",
    conteudo,
    setHtml,
    requestReplace,
  );

  function restoreDefault() {
    requestReplace({
      title: "Restaurar texto padrão?",
      description:
        "As alterações feitas no texto serão descartadas e o texto gerado automaticamente voltará. Você poderá desfazer pelo aviso exibido após a troca.",
      confirmLabel: "Restaurar texto",
      successMessage: "Texto padrão restaurado.",
      apply: () => setHtml(""),
    });
  }


  return (
    <>
      <SurfaceCard
        title="Dados do atestado"
        description="O texto padrão é gerado automaticamente a partir destes campos."
        icon={<Stethoscope className="icon-optical h-4 w-4" aria-hidden />}
        padding="lg"
      >
        <div className="space-y-4">
          <PatientField
            id="atestado-paciente"
            value={paciente}
            onChange={setPaciente}
            error={pacienteError}
          />
          <CidFields cid={cid} descricao={diagnosticoSelecionado} onChange={handleCid} error={cidError} />
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
            <SelectField
              id="atestado-dias"
              label="Dias de afastamento"
              value={dias}
              onValueChange={setDias}
              options={AFASTAMENTO_OPTIONS}
              error={diasError}
            />
            <Field
              id="atestado-data"
              label="Data do documento"
              error={dataStatus.error}
              hint={dataStatus.warning}
            >
              <Input
                id="atestado-data"
                type="date"
                max={todayIsoDate()}
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </Field>
            <Field id="atestado-cidade" label="Cidade" optional error={cidadeError}>
              <Input
                id="atestado-cidade"
                placeholder="Cidade de emissão"
                maxLength={60}
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
              />
            </Field>
          </div>
        </div>

      </SurfaceCard>

      <RichTextEditor
        ariaLabel="Texto do atestado"
        value={conteudo}
        onChange={setHtml}
        onImproveWithAi={improve}
        improving={improving}
        variables={DOCUMENT_VARIABLES}
        header={
          <DocumentEditorHeader
            title="Atestado médico"
            meta={
              <>
                Paciente: {paciente || "—"} · {formatDateLong(data)}
              </>
            }
            actions={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={restoreDefault}
              >
                Restaurar texto padrão
              </Button>
            }
          />
        }
      />

      <DocumentActions
        title="Atestado médico"
        html={conteudo}
        paciente={paciente}
        pacienteFieldId="atestado-paciente"
        issues={issues}
        onSaveTemplate={() =>
          toast.success("Modelo de atestado salvo e disponível na lista (simulação).")
        }
      />

      {replacementDialog}
    </>
  );
}

/* ---------------- Comparecimento ---------------- */

function AttendanceTab() {
  const [paciente, setPaciente] = useState("");
  const [local, setLocal] = useState("");
  const [cidade, setCidade] = useState("");
  const [data, setData] = useState(todayIso());
  const [entrada, setEntrada] = useState("");
  const [saida, setSaida] = useState("");
  const [html, setHtml] = useState("");

  useDraftAutosave({
    key: "hg:documentos:comparecimento",
    data: { paciente, local, cidade, data, entrada, saida, html },
    isEmpty: (d) =>
      !d.paciente.trim() &&
      !d.local.trim() &&
      !d.cidade.trim() &&
      !d.entrada &&
      !d.saida &&
      !d.html,
    onRestore: (d) => {
      setPaciente(d.paciente ?? "");
      setLocal(d.local ?? "");
      setCidade(d.cidade ?? "");
      setData(d.data ?? todayIso());
      setEntrada(d.entrada ?? "");
      setSaida(d.saida ?? "");
      setHtml(d.html ?? "");
    },
  });

  const gerado = useMemo(
    () => buildComparecimento({ paciente, local, cidade, data, entrada, saida }),
    [paciente, local, cidade, data, entrada, saida],
  );

  const conteudo = html || gerado;

  const dataStatus = useMemo(
    () =>
      getDocumentDateStatus(data, {
        future:
          "Data futura não é permitida: a declaração só pode ser emitida após o comparecimento.",
        retroactive: (days) =>
          `Comparecimento registrado há ${days} dias. Confirme a data do atendimento antes de emitir.`,
      }),
    [data],
  );

  const pacienteError = useMemo(() => validatePaciente(paciente), [paciente]);
  const localError = useMemo(() => validateLocal(local), [local]);
  const cidadeError = useMemo(() => validateCidade(cidade), [cidade]);
  const horarios = useMemo(() => validateTimeRange(entrada, saida), [entrada, saida]);

  const issues = useMemo(
    () =>
      buildIssues([
        { fieldId: "comp-paciente", label: "Paciente", message: pacienteError },
        { fieldId: "comp-local", label: "Local de atendimento", message: localError },
        { fieldId: "comp-cidade", label: "Cidade", message: cidadeError },
        { fieldId: "comp-data", label: "Data do comparecimento", message: dataStatus.error },
        { fieldId: "comp-entrada", label: "Horário de entrada", message: horarios.entradaError },
        { fieldId: "comp-saida", label: "Horário de saída", message: horarios.saidaError },
      ]),
    [
      pacienteError,
      localError,
      cidadeError,
      dataStatus.error,
      horarios.entradaError,
      horarios.saidaError,
    ],
  );


  const { requestReplace, replacementDialog } = useTextReplacement(html, setHtml);

  const { improving, improve } = useImproveWithAi(
    "Declaração de comparecimento",
    conteudo,
    setHtml,
    requestReplace,
  );

  function restoreDefault() {
    requestReplace({
      title: "Restaurar texto padrão?",
      description:
        "As alterações feitas no texto serão descartadas e o texto gerado automaticamente voltará. Você poderá desfazer pelo aviso exibido após a troca.",
      confirmLabel: "Restaurar texto",
      successMessage: "Texto padrão restaurado.",
      apply: () => setHtml(""),
    });
  }


  return (
    <>
      <SurfaceCard
        title="Dados da declaração"
        description="Informe o local e os horários de permanência do paciente no atendimento."
        icon={<CalendarCheck className="icon-optical h-4 w-4" aria-hidden />}
        padding="lg"
      >
        <div className="space-y-4">
          <PatientField
            id="comp-paciente"
            value={paciente}
            onChange={setPaciente}
            error={pacienteError}
          />
          <Field id="comp-local" label="Local de atendimento" error={localError}>
            <Input
              id="comp-local"
              placeholder="Clínica, hospital ou consultório"
              maxLength={120}
              value={local}
              onChange={(e) => setLocal(e.target.value)}
            />
          </Field>
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4 [&>*]:min-w-0">
            <Field id="comp-cidade" label="Cidade" optional error={cidadeError}>
              <Input
                id="comp-cidade"
                placeholder="Cidade de emissão"
                maxLength={60}
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
              />
            </Field>
            <Field
              id="comp-data"
              label="Data do comparecimento"
              error={dataStatus.error}
              hint={dataStatus.warning}
            >
              <Input
                id="comp-data"
                type="date"
                max={todayIsoDate()}
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </Field>
            <Field id="comp-entrada" label="Horário de entrada" error={horarios.entradaError}>
              <Input
                id="comp-entrada"
                type="time"
                max={saida || undefined}
                value={entrada}
                onChange={(e) => setEntrada(e.target.value)}
              />
            </Field>
            <Field id="comp-saida" label="Horário de saída" error={horarios.saidaError}>
              <Input
                id="comp-saida"
                type="time"
                min={entrada || undefined}
                value={saida}
                onChange={(e) => setSaida(e.target.value)}
              />
            </Field>
          </div>
        </div>

      </SurfaceCard>

      <RichTextEditor
        ariaLabel="Texto da declaração de comparecimento"
        value={conteudo}
        onChange={setHtml}
        onImproveWithAi={improve}
        improving={improving}
        variables={DOCUMENT_VARIABLES}
        header={
          <DocumentEditorHeader
            title="Declaração de comparecimento"
            meta={
              <>
                Paciente: {paciente || "—"} · {formatDateLong(data)}
              </>
            }
            actions={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={restoreDefault}
              >
                Restaurar texto padrão
              </Button>
            }
          />
        }
      />

      <DocumentActions
        title="Declaração de comparecimento"
        html={conteudo}
        paciente={paciente}
        pacienteFieldId="comp-paciente"
        issues={issues}

        onSaveTemplate={() =>
          toast.success(
            "Modelo de declaração salvo e disponível na lista (simulação).",
          )
        }
      />

      {replacementDialog}
    </>
  );
}
