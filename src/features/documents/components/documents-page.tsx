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
  Send,
  FilePlus2,
  ExternalLink,
  Eye,

  CheckCircle2,
  Info,
  BookMarked,
} from "lucide-react";
import { AlertCircle } from "lucide-react";
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import {
  appTabsIconClass,
  appTabsLabelClass,
  appTabsListClass,
  appTabsTriggerClass,
} from "@/components/app-tabs";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { AppModal } from "@/components/app-modal";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { FormActionBar } from "@/components/form-action-bar";
import { SurfaceCard } from "@/components/surface-card";
import { Field, SelectField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CID10 } from "@/lib/cid";
import type {
  IssuedDocument,
  IssuedDocumentType,
} from "@/features/issued-documents/data/issued-documents";
import { addIssuedDocument } from "@/features/issued-documents/data/issued-documents-store";

import { improveDocumentText } from "../lib/improve-text.functions";

import { CidAutocomplete } from "./cid-autocomplete";
import { DocumentEditorHeader } from "./document-editor-header";
import { RichTextEditor } from "./rich-text-editor";
import { useTextReplacement } from "./use-text-replacement";
import { useGeneratedSync } from "./use-generated-sync";
import { useDocumentTemplates } from "./use-document-templates";
import type { SavedDocumentTemplate } from "../data/document-templates";
import {
  pendingVariables as findPendingVariables,
  resolveDocumentVariables,
  VARIABLE_LABELS,
  variableTokenValues,
} from "../data/document-variables";
import { getDocumentDateStatus, todayIsoDate } from "../data/document-date";
import {
  validateCid,
  validateCidade,
  validateDiasAfastamento,
  validateLocal,
  validatePaciente,
  validateTimeRange,
} from "../data/document-validation";


import {
  DOCUMENT_VARIABLES,
  ATTENDANCE_TEMPLATES,
  CERTIFICATE_TEMPLATES,
  REPORT_TEMPLATES,
  type ReportTemplate,
  AFASTAMENTO_OPTIONS,
  buildAtestado,
  buildRelatorio,
  buildComparecimento,
  formatDateLong,
  printHtml,
  todayIso,
} from "../data/documents";

const documentsRoute = getRouteApi("/documentos");

/** Página de documentos clínicos: relatórios, atestados e declarações. */
export function DocumentsPage() {
  const { aba } = documentsRoute.useSearch();
  // "Novo documento" limpa o formulário remontando a aba correspondente.
  const [resetKeys, setResetKeys] = useState({ relatorios: 0, atestados: 0, comparecimento: 0 });
  const resetTab = useCallback((tab: "relatorios" | "atestados" | "comparecimento") => {
    setResetKeys((prev) => ({ ...prev, [tab]: prev[tab] + 1 }));
  }, []);
  const navigate = useNavigate({ from: "/documentos" });
  const activeTab = aba ?? "relatorios";

  const handleTabChange = useCallback(
    (value: string) => {
      void navigate({
        search: { aba: value as typeof aba },
        replace: true,
        resetScroll: false,
      });
    },
    [navigate],
  );

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

          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
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
              <ReportsTab
                key={`relatorios-${resetKeys.relatorios}`}
                onNewDocument={() => resetTab("relatorios")}
              />
            </TabsContent>
            <TabsContent value="atestados" className="space-y-6">
              <CertificateTab
                key={`atestados-${resetKeys.atestados}`}
                onNewDocument={() => resetTab("atestados")}
              />
            </TabsContent>
            <TabsContent value="comparecimento" className="space-y-6">
              <AttendanceTab
                key={`comparecimento-${resetKeys.comparecimento}`}
                onNewDocument={() => resetTab("comparecimento")}
              />
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
  type,
  html,
  paciente,
  pacienteFieldId,
  onSaveTemplate,
  issues = [],
  issuedDoc,
  onIssued,
  onNewDocument,
}: {
  title: string;
  /** Tipo registrado em "Documentos emitidos". */
  type: IssuedDocumentType;
  html: string;
  paciente: string;
  /** id do campo de paciente, para focar quando estiver vazio. */
  pacienteFieldId: string;
  onSaveTemplate?: () => void;
  /** Erros de validação com o campo culpado, exibidos inline e anunciados por leitor de tela. */
  issues?: FieldIssue[];
  /** Documento já emitido nesta aba (formulário em modo somente leitura). */
  issuedDoc: IssuedDocument | null;
  onIssued: (doc: IssuedDocument) => void;
  onNewDocument: () => void;
}) {
  const disabled = !paciente.trim();
  const temTexto = html.replace(/<[^>]+>/g, "").trim().length > 0;
  const [downloading, setDownloading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

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
  // O resumo de erros só aparece depois da primeira tentativa de emissão.
  const [issuesVisible, setIssuesVisible] = useState(false);
  const showIssues = hasIssues && issuesVisible;

  function reportIssues() {
    const first = allIssues[0];
    toast.error(first.message);
    focusField(first.fieldId);
  }

  function handleIssue() {
    if (hasIssues) {
      setIssuesVisible(true);
      reportIssues();
      return;
    }
    if (!temTexto) {
      toast.error("Escreva o texto do documento antes de emitir.");
      return;
    }
    const doc = addIssuedDocument({ type, patient: paciente.trim(), body: html });
    onIssued(doc);
    setConfirmOpen(true);
  }

  function handlePrint() {
    printHtml(title, paciente, html);
  }

  async function handleDownload() {
    setDownloading(true);
    const toastId = toast.loading("Gerando PDF do documento…");
    try {
      const { downloadDocumentPdf } = await import("../data/document-pdf");
      const fileName = downloadDocumentPdf(title, paciente, html);
      toast.success(`PDF gerado: ${fileName}`, { id: toastId });
    } catch {
      toast.error("Não foi possível gerar o PDF. Tente novamente.", { id: toastId });
    } finally {
      setDownloading(false);
    }
  }

  const downloadButton = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={downloading}
      aria-busy={downloading}
    >
      {downloading ? (
        <Loader2 className="icon-optical h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Download className="icon-optical h-4 w-4" aria-hidden />
      )}
      {downloading ? "Gerando PDF…" : "Baixar PDF"}
    </Button>
  );




  const viewIssuedButton = (
    <Button type="button" variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
      <Eye className="icon-optical h-4 w-4" aria-hidden />
      Ver documento emitido
    </Button>
  );


  return (
    <>
      <FormActionBar
        stepsLabel="Etapas para emissão"
        steps={[
          { label: "Dados preenchidos", done: !hasIssues },
          { label: "Texto do documento", done: temTexto },
        ]}

        note={
          issuedDoc
            ? undefined
            : "Emita o documento para poder baixar ou imprimir. Para ter validade, será necessário assiná-lo manualmente."
        }
        banner={
          issuedDoc ? (
            <div className="space-y-3">
              <div
                role="status"
                className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-foreground sm:p-4"
              >
                <div className="flex items-start gap-2.5">
                  <CheckCircle2
                    className="icon-optical mt-0.5 h-5 w-5 shrink-0 text-success"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-success">
                      {type} {issuedDoc.id} emitido
                    </p>
                    <p className="mt-0.5 text-muted-foreground">
                      O formulário está em modo somente leitura.
                    </p>
                  </div>
                </div>
              </div>
              <p className="flex items-start gap-1.5 border-t border-border/60 pt-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                <Info className="icon-optical mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>Para ter validade, será necessário assiná-lo manualmente.</span>
              </p>
            </div>
          ) : showIssues ? (

            <div
              id={summaryId}
              role="alert"
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
        {issuedDoc ? (
          <>
            {viewIssuedButton}
            <Button type="button" size="sm" onClick={onNewDocument}>
              <FilePlus2 className="icon-optical h-4 w-4" aria-hidden />
              Novo documento
            </Button>
          </>
        ) : (
          <>
            {onSaveTemplate && (
              <Button type="button" variant="outline" size="sm" onClick={onSaveTemplate}>
                <BookmarkPlus className="icon-optical h-4 w-4" aria-hidden />
                Salvar como modelo
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={handleIssue}
              disabled={hasIssues || !temTexto}
              title={
                hasIssues || !temTexto
                  ? "Preencha os dados obrigatórios e o texto do documento para emitir."
                  : undefined
              }
              aria-describedby={showIssues ? summaryId : undefined}
            >

              <Send className="icon-optical h-4 w-4" aria-hidden />
              Emitir documento
            </Button>
          </>
        )}
      </FormActionBar>

      <AppModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Documento emitido com sucesso"
        description={
          issuedDoc
            ? `${type} ${issuedDoc.id} salvo em “Documentos emitidos”.`
            : "Documento salvo em “Documentos emitidos”."
        }
        icon={<CheckCircle2 className="icon-optical h-4 w-4 text-success" aria-hidden />}
        size="md"
        footer={
          <>
            {downloadButton}
            <Button type="button" size="sm" onClick={handlePrint}>
              <Printer className="icon-optical h-4 w-4" aria-hidden />
              Imprimir
            </Button>
          </>
        }


      >
        <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <Info className="icon-optical mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            Para ter validade, imprima o documento e realize a assinatura manualmente.
          </span>
        </p>
      </AppModal>
    </>
  );
}


function PatientField({
  id,
  value,
  onChange,
  error,
  readOnly,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  /** Documento já emitido: mantém o valor legível e copiável. */
  readOnly?: boolean;
}) {
  return (
    <Field id={id} label="Paciente" required error={error} injectChildProps={false}>
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
          readOnly={readOnly}
          aria-readonly={readOnly || undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={`${id}-msg`}
        />
      </div>
    </Field>
  );
}


function CidFields({
  id,
  cid,
  descricao,
  onChange,
  error,
  readOnly,
}: {
  /** id único por aba, evitando duplicidade entre Relatórios/Atestados. */
  id: string;
  cid: string;
  descricao: string;
  onChange: (codigo: string, descricao: string) => void;
  error?: string;
  /** Documento já emitido: exibe o CID escolhido como texto somente leitura. */
  readOnly?: boolean;
}) {
  const diagnosticoId = `${id}-diagnostico`;
  const diagnostico = descricao.trim();

  return (
    <div className="grid min-w-0 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
      {readOnly ? (
        <Field id={id} label="CID-10" error={error} injectChildProps={false}>
          <Input
            id={id}
            readOnly
            aria-readonly="true"
            aria-describedby={`${id}-msg`}
            value={cid}
            placeholder="CID não informado"
          />
        </Field>
      ) : (
        <Field
          id={id}
          label="CID-10"
          error={error}
          hint="Busque pelo código ou pela descrição."
          injectChildProps={false}
        >
          <CidAutocomplete
            id={id}
            value={cid}
            description={descricao}
            invalid={Boolean(error)}
            describedById={`${id}-msg`}
            onSelect={(item) => onChange(item?.codigo ?? "", item?.descricao ?? "")}
          />
        </Field>
      )}

      <Field
        id={diagnosticoId}
        label="Diagnóstico"
        hint={readOnly ? undefined : "Preenchido automaticamente a partir do CID-10 selecionado."}
      >
        <Input
          id={diagnosticoId}
          readOnly
          aria-readonly="true"
          tabIndex={-1}
          value={diagnostico}
          placeholder="Selecione um CID-10"
        />
      </Field>
    </div>
  );
}


/* ---------------- Relatórios ---------------- */

function ReportsTab({ onNewDocument }: { onNewDocument: () => void }) {
  const [issuedDoc, setIssuedDoc] = useState<IssuedDocument | null>(null);
  const [paciente, setPaciente] = useState("");
  const [cid, setCid] = useState("");
  const [diagnosticoSelecionado, setDiagnosticoSelecionado] = useState("");
  const [modelo, setModelo] = useState(REPORT_TEMPLATES[0].value);
  const [data, setData] = useState(todayIso());
  const [cidade, setCidade] = useState("");
  const [html, setHtml] = useState("");

  const diagnostico =
    diagnosticoSelecionado || (CID10.find((c) => c.codigo === cid)?.descricao ?? "");

  function handleCid(codigo: string, descricao: string) {
    setCid(codigo);
    setDiagnosticoSelecionado(descricao);
  }

  const { requestReplace, replacementDialog } = useTextReplacement(html, setHtml);

  const {
    templates: savedTemplates,
    requestSave: requestSaveTemplate,
    saveDialog,
    openManage: openTemplatesManager,
    manageDialog: templatesManagerDialog,
  } = useDocumentTemplates({
    kind: "relatorio",
    getContent: () => html || gerado,
  });

  // Modelo escolhido (salvo ou padrão) que serve de base ao texto gerado.
  const baseTemplate = useMemo(() => {
    const found = [...savedTemplates, ...REPORT_TEMPLATES].find((t) => t.value === modelo);
    return found?.content ?? REPORT_TEMPLATES[0].content;
  }, [savedTemplates, modelo]);

  const gerado = useMemo(
    () => buildRelatorio({ base: baseTemplate, data, cidade }),
    [baseTemplate, data, cidade],
  );

  const conteudo = html || gerado;

  const { staleNotice } = useGeneratedSync({ generated: gerado, html, setHtml });

  const variableValues = useMemo(
    () => ({ paciente, data, cidade, cid, diagnostico, emissao: data }),
    [paciente, data, cidade, cid, diagnostico],
  );
  const tokenValues = useMemo(() => variableTokenValues(variableValues), [variableValues]);
  const previewHtml = useMemo(
    () => resolveDocumentVariables(conteudo, variableValues),
    [conteudo, variableValues],
  );
  const pending = useMemo(
    () => findPendingVariables(conteudo, variableValues).map((v) => VARIABLE_LABELS[v] ?? v),
    [conteudo, variableValues],
  );

  const pacienteError = useMemo(() => validatePaciente(paciente), [paciente]);
  const cidError = useMemo(() => validateCid(cid), [cid]);
  const cidadeError = useMemo(() => validateCidade(cidade), [cidade]);
  const dataStatus = useMemo(() => getDocumentDateStatus(data), [data]);
  // Campo obrigatório: sem data preenchida a etapa "Dados preenchidos" fica pendente.
  const dataError = dataStatus.error ?? (data ? undefined : "Informe a data do documento.");

  const issues = useMemo(
    () =>
      buildIssues([
        { fieldId: "relatorio-paciente", label: "Paciente", message: pacienteError },
        { fieldId: "relatorio-cid", label: "CID", message: cidError },
        { fieldId: "relatorio-data", label: "Data do documento", message: dataError },
        { fieldId: "relatorio-cidade", label: "Cidade", message: cidadeError },
      ]),
    [pacienteError, cidError, dataError, cidadeError],
  );


  function applyTemplate(value: string) {
    const template = [...savedTemplates, ...REPORT_TEMPLATES].find((t) => t.value === value);
    if (!template) return;
    requestReplace({
      title: "Aplicar modelo?",
      description: `O texto atual do relatório será substituído pelo modelo “${template.label}”. Você poderá desfazer pelo aviso exibido após a troca.`,
      confirmLabel: "Aplicar modelo",
      successMessage: `Modelo “${template.label}” aplicado.`,
      apply: () => {
        setModelo(value);
        // Volta ao texto gerado para que o modelo seja preenchido com os campos atuais.
        setHtml("");
      },
    });
  }

  const { improving, improve } = useImproveWithAi(
    "Relatório médico",
    conteudo,
    setHtml,
    requestReplace,
  );

  const modeloPadrao = REPORT_TEMPLATES[0];

  function restoreDefault() {
    requestReplace({
      title: "Restaurar texto padrão?",
      description: `O texto atual do relatório será substituído pelo modelo padrão “${modeloPadrao.label}”. Você poderá desfazer pelo aviso exibido após a troca.`,
      confirmLabel: "Restaurar texto",
      successMessage: "Texto padrão restaurado.",
      apply: () => {
        setModelo(modeloPadrao.value);
        setHtml("");
      },
    });
  }


  const locked = Boolean(issuedDoc);

  return (
    <>
      <div className="min-w-0 space-y-6">
      <SurfaceCard
        title="Dados do relatório"
        actions={<ManageTemplatesButton onClick={openTemplatesManager} />}
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
            readOnly={locked}
          />

          <CidFields id="relatorio-cid" cid={cid} descricao={diagnostico} onChange={handleCid} error={cidError} readOnly={locked} />
          <SelectField
            id="relatorio-modelo"
            label="Modelos disponíveis"
            placeholder="Selecione um modelo salvo"
            value={modelo}
            onValueChange={applyTemplate}
            readOnly={locked}
            options={[
              ...savedTemplates.map((t) => ({ value: t.value, label: `${t.label} (salvo)` })),
              ...REPORT_TEMPLATES.map((t) => ({ value: t.value, label: t.label })),
            ]}
            hint={
              savedTemplates.length > 0
                ? `${savedTemplates.length} ${savedTemplates.length === 1 ? "modelo salvo" : "modelos salvos"} neste navegador, além dos modelos padrão.`
                : "Use “Salvar como modelo” após redigir o texto para reaproveitá-lo depois."
            }
          />
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
            <Field
              id="relatorio-data"
              label="Data do documento"
              required
              error={dataError}
              hint={dataStatus.warning}
            >
              <Input
                id="relatorio-data"
                readOnly={locked}
                aria-readonly={locked || undefined}
                type="date"
                max={todayIsoDate()}
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </Field>
            <Field id="relatorio-cidade" label="Cidade" optional error={cidadeError}>
              <Input
                id="relatorio-cidade"
                readOnly={locked}
                aria-readonly={locked || undefined}
                placeholder="Cidade de emissão"
                maxLength={60}
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
              />
            </Field>
          </div>
        </div>
      </SurfaceCard>


      {staleNotice}
      <RichTextEditor
        readOnly={locked}
        ariaLabel="Texto do relatório médico"
        pagePreview={{ title: "Relatório médico", paciente }}
        value={conteudo}
        onChange={setHtml}
        onImproveWithAi={improve}
        improving={improving}
        variables={DOCUMENT_VARIABLES}
        variableValues={tokenValues}
        previewHtml={previewHtml}
        pendingVariables={pending}
        placeholder="Redija o relatório médico..."
        header={
          <DocumentEditorHeader
            title="Relatório médico"
            meta={
              <>
                Paciente: {paciente || "—"} · {formatDateLong(data)}
                {diagnostico && ` · ${cid} — ${diagnostico}`}
              </>
            }
            actions={
              <Button type="button" variant="ghost" size="sm" onClick={restoreDefault}>
                Restaurar texto padrão
              </Button>
            }
          />
        }
      />

      </div>

      <DocumentActions
        title="Relatório médico"
        html={previewHtml}
        paciente={paciente}
        pacienteFieldId="relatorio-paciente"
        type="Relatório"
        issuedDoc={issuedDoc}
        onIssued={setIssuedDoc}
        onNewDocument={onNewDocument}
        issues={issues}

        onSaveTemplate={requestSaveTemplate}
      />

      {saveDialog}
      {templatesManagerDialog}
      {replacementDialog}
    </>
  );
}

/* ---------------- Atestados ---------------- */

function CertificateTab({ onNewDocument }: { onNewDocument: () => void }) {
  const [issuedDoc, setIssuedDoc] = useState<IssuedDocument | null>(null);
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

  const gerado = useMemo(
    () => buildAtestado({ paciente, dias, data, cidade, cid }),
    [paciente, dias, data, cidade, cid],
  );

  const conteudo = html || gerado;

  const { staleNotice } = useGeneratedSync({ generated: gerado, html, setHtml });

  const dataStatus = useMemo(() => getDocumentDateStatus(data), [data]);

  const variableValues = useMemo(
    () => ({ paciente, data, cidade, cid, diagnostico: diagnosticoSelecionado, emissao: data }),
    [paciente, data, cidade, cid, diagnosticoSelecionado],
  );
  const tokenValues = useMemo(() => variableTokenValues(variableValues), [variableValues]);
  const previewHtml = useMemo(
    () => resolveDocumentVariables(conteudo, variableValues),
    [conteudo, variableValues],
  );
  const pending = useMemo(
    () => findPendingVariables(conteudo, variableValues).map((v) => VARIABLE_LABELS[v] ?? v),
    [conteudo, variableValues],
  );

  const pacienteError = useMemo(() => validatePaciente(paciente), [paciente]);
  const cidError = useMemo(() => validateCid(cid), [cid]);
  const cidadeError = useMemo(() => validateCidade(cidade), [cidade]);
  const diasError = useMemo(
    () => validateDiasAfastamento(dias) ?? (dias ? undefined : "Informe os dias de afastamento."),
    [dias],
  );
  // Campo obrigatório: sem data preenchida a etapa "Dados preenchidos" fica pendente.
  const dataError = dataStatus.error ?? (data ? undefined : "Informe a data do documento.");

  const issues = useMemo(
    () =>
      buildIssues([
        { fieldId: "atestado-paciente", label: "Paciente", message: pacienteError },
        { fieldId: "atestado-cid", label: "CID", message: cidError },
        { fieldId: "atestado-dias", label: "Dias de afastamento", message: diasError },
        { fieldId: "atestado-data", label: "Data do documento", message: dataError },
        { fieldId: "atestado-cidade", label: "Cidade", message: cidadeError },
      ]),
    [pacienteError, cidError, diasError, dataError, cidadeError],
  );


  const { requestReplace, replacementDialog } = useTextReplacement(html, setHtml);

  const {
    templates: savedTemplates,
    requestSave: requestSaveTemplate,
    saveDialog,
    openManage: openTemplatesManager,
    manageDialog: templatesManagerDialog,
  } = useDocumentTemplates({
    kind: "atestado",
    getContent: () => conteudo,
  });

  const [modelo, setModelo] = useState(GENERATED_TEMPLATE);

  function applySavedTemplate(value: string) {
    applySaved({
      templates: [...CERTIFICATE_TEMPLATES, ...savedTemplates],
      value,
      setModelo,
      requestReplace,
      setHtml,
    });
  }

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
      apply: () => {
        setModelo(GENERATED_TEMPLATE);
        setHtml("");
      },
    });
  }


  const locked = Boolean(issuedDoc);

  return (
    <>
      <div className="min-w-0 space-y-6">
      <SurfaceCard
        title="Dados do atestado"
        actions={<ManageTemplatesButton onClick={openTemplatesManager} />}
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
            readOnly={locked}
          />
          <CidFields id="atestado-cid" cid={cid} descricao={diagnosticoSelecionado} onChange={handleCid} error={cidError} readOnly={locked} />
          <TemplatesField
            id="atestado-modelo"
            defaults={CERTIFICATE_TEMPLATES}
            templates={savedTemplates}
            value={modelo}
            onSelect={applySavedTemplate}
            readOnly={locked}
          />
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
            <SelectField
              id="atestado-dias"
              readOnly={locked}
              label="Dias de afastamento"
              required
              value={dias}
              onValueChange={setDias}
              options={AFASTAMENTO_OPTIONS}
              error={diasError}
            />
            <Field
              id="atestado-data"
              label="Data do documento"
              required
              error={dataError}
              hint={dataStatus.warning}
            >
              <Input
                id="atestado-data"
                readOnly={locked}
                aria-readonly={locked || undefined}
                type="date"
                max={todayIsoDate()}
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </Field>
            <Field id="atestado-cidade" label="Cidade" optional error={cidadeError}>
              <Input
                id="atestado-cidade"
                readOnly={locked}
                aria-readonly={locked || undefined}
                placeholder="Cidade de emissão"
                maxLength={60}
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
              />
            </Field>
          </div>
        </div>

      </SurfaceCard>

      {staleNotice}
      <RichTextEditor
        readOnly={locked}
        ariaLabel="Texto do atestado"
        pagePreview={{ title: "Atestado médico", paciente }}
        value={conteudo}
        onChange={setHtml}
        onImproveWithAi={improve}
        improving={improving}
        variables={DOCUMENT_VARIABLES}
        variableValues={tokenValues}
        previewHtml={previewHtml}
        pendingVariables={pending}
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

      </div>

      <DocumentActions
        title="Atestado médico"
        html={previewHtml}
        paciente={paciente}
        pacienteFieldId="atestado-paciente"
        type="Atestado"
        issuedDoc={issuedDoc}
        onIssued={setIssuedDoc}
        onNewDocument={onNewDocument}
        issues={issues}
        onSaveTemplate={requestSaveTemplate}
      />

      {saveDialog}
      {templatesManagerDialog}
      {replacementDialog}
    </>
  );
}

/* ---------------- Comparecimento ---------------- */

function AttendanceTab({ onNewDocument }: { onNewDocument: () => void }) {
  const [issuedDoc, setIssuedDoc] = useState<IssuedDocument | null>(null);
  const [paciente, setPaciente] = useState("");
  const [local, setLocal] = useState("");
  const [cidade, setCidade] = useState("");
  const [data, setData] = useState(todayIso());
  const [emissao, setEmissao] = useState(todayIso());
  const [entrada, setEntrada] = useState("");
  const [saida, setSaida] = useState("");
  const [html, setHtml] = useState("");

  const gerado = useMemo(
    () => buildComparecimento({ paciente, local, cidade, data, emissao, entrada, saida }),
    [paciente, local, cidade, data, emissao, entrada, saida],
  );

  const conteudo = html || gerado;

  const { staleNotice } = useGeneratedSync({ generated: gerado, html, setHtml });

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

  const variableValues = useMemo(
    () => ({ paciente, data, cidade, emissao }),
    [paciente, data, cidade, emissao],
  );
  const tokenValues = useMemo(() => variableTokenValues(variableValues), [variableValues]);
  const previewHtml = useMemo(
    () => resolveDocumentVariables(conteudo, variableValues),
    [conteudo, variableValues],
  );
  const pending = useMemo(
    () => findPendingVariables(conteudo, variableValues).map((v) => VARIABLE_LABELS[v] ?? v),
    [conteudo, variableValues],
  );

  const pacienteError = useMemo(() => validatePaciente(paciente), [paciente]);
  const localError = useMemo(() => validateLocal(local), [local]);
  const cidadeError = useMemo(() => validateCidade(cidade), [cidade]);
  const horarios = useMemo(() => validateTimeRange(entrada, saida), [entrada, saida]);
  // Campos obrigatórios: horários vazios mantêm a etapa "Dados preenchidos" pendente.
  const localIssue = localError ?? (local.trim() ? undefined : "Informe o local de atendimento.");
  const entradaError = horarios.entradaError;
  const saidaError = horarios.saidaError;
  const entradaIssue = entradaError ?? (entrada ? undefined : "Informe o horário de entrada.");
  const saidaIssue = saidaError ?? (saida ? undefined : "Informe o horário de saída.");
  const dataError =
    dataStatus.error ?? (data ? undefined : "Informe a data do comparecimento.");
  const emissaoError = useMemo(() => {
    if (!emissao) return "Informe a data de emissão.";
    if (emissao > todayIsoDate()) return "A data de emissão não pode ser futura.";
    if (data && emissao < data)
      return "A emissão não pode ser anterior à data do comparecimento.";
    return undefined;
  }, [emissao, data]);

  const issues = useMemo(
    () =>
      buildIssues([
        { fieldId: "comp-paciente", label: "Paciente", message: pacienteError },
        { fieldId: "comp-local", label: "Local de atendimento", message: localIssue },
        { fieldId: "comp-cidade", label: "Cidade", message: cidadeError },
        { fieldId: "comp-data", label: "Data do comparecimento", message: dataError },
        { fieldId: "comp-emissao", label: "Data de emissão", message: emissaoError },
        { fieldId: "comp-entrada", label: "Horário de entrada", message: entradaIssue },
        { fieldId: "comp-saida", label: "Horário de saída", message: saidaIssue },
      ]),
    [
      pacienteError,
      localIssue,
      cidadeError,
      dataError,
      emissaoError,
      entradaIssue,
      saidaIssue,
    ],
  );


  const { requestReplace, replacementDialog } = useTextReplacement(html, setHtml);

  const {
    templates: savedTemplates,
    requestSave: requestSaveTemplate,
    saveDialog,
    openManage: openTemplatesManager,
    manageDialog: templatesManagerDialog,
  } = useDocumentTemplates({
    kind: "comparecimento",
    getContent: () => conteudo,
  });

  const [modelo, setModelo] = useState(GENERATED_TEMPLATE);

  function applySavedTemplate(value: string) {
    applySaved({
      templates: [...ATTENDANCE_TEMPLATES, ...savedTemplates],
      value,
      setModelo,
      requestReplace,
      setHtml,
    });
  }

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
      apply: () => {
        setModelo(GENERATED_TEMPLATE);
        setHtml("");
      },
    });
  }


  const locked = Boolean(issuedDoc);

  return (
    <>
      <div className="min-w-0 space-y-6">
      <SurfaceCard
        title="Dados da declaração"
        actions={<ManageTemplatesButton onClick={openTemplatesManager} />}
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
            readOnly={locked}
          />
          <Field id="comp-local" label="Local de atendimento" required error={localError}>
            <Input
              id="comp-local"
              readOnly={locked}
              aria-readonly={locked || undefined}
              placeholder="Clínica, hospital ou consultório"
              maxLength={120}
              value={local}
              onChange={(e) => setLocal(e.target.value)}
            />
          </Field>
          <TemplatesField
            id="comp-modelo"
            defaults={ATTENDANCE_TEMPLATES}
            templates={savedTemplates}
            value={modelo}
            onSelect={applySavedTemplate}
            readOnly={locked}
          />
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4 [&>*]:min-w-0">
            <Field id="comp-cidade" label="Cidade" optional error={cidadeError}>
              <Input
                id="comp-cidade"
                readOnly={locked}
                aria-readonly={locked || undefined}
                placeholder="Cidade de emissão"
                maxLength={60}
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
              />
            </Field>
            <Field
              id="comp-data"
              label="Data do comparecimento"
              required
              error={dataError}
              hint={dataStatus.warning ?? "Data do atendimento; é o valor usado pela variável @data."}
            >
              <Input
                id="comp-data"
                readOnly={locked}
                aria-readonly={locked || undefined}
                type="date"
                max={todayIsoDate()}
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </Field>
            <Field
              id="comp-emissao"
              label="Data de emissão"
              required
              error={emissaoError}
              hint="Data em que a declaração é assinada; compõe o fechamento com a cidade."
            >
              <Input
                id="comp-emissao"
                readOnly={locked}
                aria-readonly={locked || undefined}
                type="date"
                min={data || undefined}
                max={todayIsoDate()}
                value={emissao}
                onChange={(e) => setEmissao(e.target.value)}
              />
            </Field>
            <Field id="comp-entrada" label="Horário de entrada" required error={entradaError}>
              <Input
                id="comp-entrada"
                readOnly={locked}
                aria-readonly={locked || undefined}
                type="time"
                max={saida || undefined}
                value={entrada}
                onChange={(e) => setEntrada(e.target.value)}
              />
            </Field>
            <Field id="comp-saida" label="Horário de saída" required error={saidaError}>
              <Input
                id="comp-saida"
                readOnly={locked}
                aria-readonly={locked || undefined}
                type="time"
                min={entrada || undefined}
                value={saida}
                onChange={(e) => setSaida(e.target.value)}
              />
            </Field>
          </div>
        </div>

      </SurfaceCard>

      {staleNotice}
      <RichTextEditor
        readOnly={locked}
        ariaLabel="Texto da declaração de comparecimento"
        pagePreview={{ title: "Declaração de comparecimento", paciente }}
        value={conteudo}
        onChange={setHtml}
        onImproveWithAi={improve}
        improving={improving}
        variables={["@paciente", "@data", "@cidade", "@emissao"]}
        variableValues={tokenValues}
        previewHtml={previewHtml}
        pendingVariables={pending}
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

      </div>

      <DocumentActions
        title="Declaração de comparecimento"
        html={previewHtml}
        paciente={paciente}
        pacienteFieldId="comp-paciente"
        type="Comparecimento"
        issuedDoc={issuedDoc}
        onIssued={setIssuedDoc}
        onNewDocument={onNewDocument}
        issues={issues}

        onSaveTemplate={requestSaveTemplate}
      />

      {saveDialog}
      {templatesManagerDialog}
      {replacementDialog}
    </>
  );
}

/* ---------------- Modelos salvos ---------------- */

/** Select de modelos: opção de texto gerado, modelos padrão e modelos salvos. */
function TemplatesField({
  id,
  defaults,
  templates,
  value,
  onSelect,
  readOnly,
}: {
  id: string;
  defaults: ReportTemplate[];
  templates: SavedDocumentTemplate[];
  value: string;
  onSelect: (value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <SelectField
      id={id}
      label="Modelos disponíveis"
      placeholder="Selecione um modelo"
      value={value}
      onValueChange={onSelect}
      readOnly={readOnly}
      options={[
        { value: GENERATED_TEMPLATE, label: "Texto gerado pelos campos" },
        ...defaults.map((t) => ({ value: t.value, label: t.label })),
        ...templates.map((t) => ({ value: t.value, label: `${t.label} (salvo)` })),
      ]}
      hint={
        templates.length > 0
          ? `${defaults.length} modelos padrão e ${templates.length} ${templates.length === 1 ? "modelo salvo" : "modelos salvos"} neste navegador. Aplicar um modelo substitui o texto atual (com confirmação).`
          : `${defaults.length} modelos padrão disponíveis. Use “Salvar como modelo” após redigir o texto para reaproveitá-lo depois.`
      }
    />
  );
}

/** Aplica um modelo salvo protegendo o texto atual com confirmação/desfazer. */
/** Valor especial: volta ao texto gerado automaticamente a partir dos campos. */
const GENERATED_TEMPLATE = "__gerado__";

function applySaved({
  templates,
  value,
  setModelo,
  requestReplace,
  setHtml,
}: {
  templates: (SavedDocumentTemplate | ReportTemplate)[];
  value: string;
  setModelo: (value: string) => void;
  requestReplace: ReturnType<typeof useTextReplacement>["requestReplace"];
  setHtml: (html: string) => void;
}) {
  if (value === GENERATED_TEMPLATE) {
    requestReplace({
      title: "Voltar ao texto gerado?",
      description:
        "O texto atual será substituído pelo texto gerado automaticamente a partir dos campos. Você poderá desfazer pelo aviso exibido após a troca.",
      confirmLabel: "Usar texto gerado",
      successMessage: "Texto gerado aplicado.",
      apply: () => {
        setModelo(GENERATED_TEMPLATE);
        setHtml("");
      },
    });
    return;
  }

  const template = templates.find((t) => t.value === value);
  if (!template) return;
  requestReplace({
    title: "Aplicar modelo?",
    description: `O texto atual será substituído pelo modelo “${template.label}”. Você poderá desfazer pelo aviso exibido após a troca.`,
    confirmLabel: "Aplicar modelo",
    successMessage: `Modelo “${template.label}” aplicado.`,
    apply: () => {
      setModelo(value);
      setHtml(template.content);
    },
  });
}

/** Botão de acesso ao gerenciamento de modelos, no cabeçalho do card de dados. */
function ManageTemplatesButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className="gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted [&_svg]:shrink-0"
    >
      <BookMarked className="h-3.5 w-3.5" aria-hidden />
      Gerenciar modelos
    </Button>
  );
}
