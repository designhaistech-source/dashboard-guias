import { useCallback, useMemo, useState } from "react";
import {
  FileText,
  Stethoscope,
  CalendarCheck,
  Printer,
  Download,
  BookmarkPlus,
  ShieldCheck,
  User,
} from "lucide-react";
import { toast } from "sonner";

import {
  appTabsIconClass,
  appTabsLabelClass,
  appTabsListClass,
  appTabsTriggerClass,
} from "@/components/app-tabs";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppModal } from "@/components/app-modal";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { FormActionBar } from "@/components/form-action-bar";
import { SavedIndicator } from "@/components/saved-indicator";
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
              <TabsTrigger
                value="relatorios"
                className={appTabsTriggerClass}
              >
                <FileText className={appTabsIconClass} aria-hidden />
                <span className={appTabsLabelClass}>Relatórios</span>
              </TabsTrigger>
              <TabsTrigger
                value="atestados"
                className={appTabsTriggerClass}
              >
                <Stethoscope className={appTabsIconClass} aria-hidden />
                <span className={appTabsLabelClass}>Atestados</span>
              </TabsTrigger>
              <TabsTrigger
                value="comparecimento"
                className={appTabsTriggerClass}
              >
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
function useImproveWithAi(documentType: string, html: string, onResult: (html: string) => void) {
  const [improving, setImproving] = useState(false);

  const improve = useCallback(async () => {
    const plain = html.replace(/<[^>]+>/g, "").trim();
    if (!plain) {
      toast.error("Escreva o texto do documento antes de melhorar com IA.");
      return;
    }
    setImproving(true);
    try {
      const result = await improveDocumentText({ data: { documentType, html } });
      onResult(result.html);
      toast.success("Texto aprimorado com IA.");
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Não foi possível melhorar o texto agora.",
      );
    } finally {
      setImproving(false);
    }
  }, [documentType, html, onResult]);

  return { improving, improve };
}

/* ---------------- Ações comuns ---------------- */

function DocumentActions({
  title,
  html,
  paciente,
  onSaveTemplate,
  signable,
}: {
  title: string;
  html: string;
  paciente: string;
  onSaveTemplate?: () => void;
  signable?: boolean;
}) {
  const [signOpen, setSignOpen] = useState(false);
  const disabled = !paciente.trim();
  const temTexto = html.replace(/<[^>]+>/g, "").trim().length > 0;

  function handlePrint() {
    if (disabled) {
      toast.error("Informe o paciente antes de imprimir.");
      return;
    }
    printHtml(title, paciente, html);
  }

  return (
    <FormActionBar
      stepsLabel="Etapas preenchidas"
      steps={[
        { label: "Paciente", done: !disabled },
        { label: "Texto do documento", done: temTexto },
      ]}
      note="Campos marcados com * são obrigatórios. Para emissão eletrônica, o documento deve ser assinado com certificado digital ICP-Brasil."
    >
      {onSaveTemplate && (
        <Button type="button" variant="outline" size="sm" onClick={onSaveTemplate}>
          <BookmarkPlus className="icon-optical h-4 w-4" aria-hidden />
          Salvar como modelo
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          toast.success("Documento baixado em PDF sem assinatura digital (simulação).")
        }
      >
        <Download className="icon-optical h-4 w-4" aria-hidden />
        Baixar PDF
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="icon-optical h-4 w-4" aria-hidden />
        Imprimir
      </Button>
      {signable && (
        <>
          <Button
            type="button"
            size="sm"
            aria-haspopup="dialog"
            onClick={() => {
              if (disabled) {
                toast.error("Informe o paciente antes de assinar o documento.");
                return;
              }
              if (!temTexto) {
                toast.error("Escreva o texto do documento antes de assinar.");
                return;
              }
              setSignOpen(true);
            }}
          >
            <ShieldCheck className="icon-optical h-4 w-4" aria-hidden />
            Assinar digitalmente
          </Button>
          <AppModal
            open={signOpen}
            onOpenChange={setSignOpen}
            title="Assinar documento"
            icon={<ShieldCheck className="h-5 w-5" aria-hidden />}
            description="Para emitir este documento em formato eletrônico, é necessário assiná-lo utilizando um certificado digital ICP-Brasil."
            size="sm"
            unstyledBody
            footer={
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSignOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setSignOpen(false);
                    toast.info(
                      "Fluxo de assinatura digital ainda em definição (representação).",
                    );
                  }}
                >
                  Continuar para assinatura
                </Button>
              </>
            }
          />
        </>
      )}
    </FormActionBar>
  );
}


function PatientField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field id={id} label="Paciente" required>
      <div className="relative">
        <User
          className="icon-optical pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id={id}
          className="pl-9"
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
}: {
  cid: string;
  descricao: string;
  onChange: (codigo: string, descricao: string) => void;
}) {
  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]">
      <Field id="cid-codigo" label="CID">
        <Input
          id="cid-codigo"
          className="font-mono"
          placeholder="CID"
          value={cid}
          onChange={(e) => onChange(e.target.value.toUpperCase(), "")}
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

  const { savedAt } = useDraftAutosave({
    key: "hg:documentos:relatorio",
    data: { paciente, cid, diagnosticoSelecionado, modelo, html },
    isEmpty: (d) =>
      !d.paciente.trim() && !d.cid.trim() && !d.html.replace(/<[^>]+>/g, "").trim(),
    onRestore: (d) => {
      setPaciente(d.paciente ?? "");
      setCid(d.cid ?? "");
      setDiagnosticoSelecionado(d.diagnosticoSelecionado ?? "");
      setModelo(d.modelo ?? "");
      setHtml(d.html ?? "");
    },
  });

  const diagnostico =
    diagnosticoSelecionado ||
    (CID10.find((c) => c.codigo === cid)?.descricao ?? "");

  function handleCid(codigo: string, descricao: string) {
    setCid(codigo);
    setDiagnosticoSelecionado(descricao);
  }



  function applyTemplate(value: string) {
    setModelo(value);
    const template = REPORT_TEMPLATES.find((t) => t.value === value);
    if (template) setHtml(template.content);
  }


  const { improving, improve } = useImproveWithAi(
    "Relatório médico",
    html,
    setHtml,
  );

  return (
    <>
      <SurfaceCard
        title="Dados do relatório"
        description="Identifique o paciente e o diagnóstico que será impresso no documento."
        icon={<FileText className="icon-optical h-4 w-4" aria-hidden />}
        padding="lg"
        actions={<SavedIndicator savedAt={savedAt} />}
      >
        <div className="space-y-4">
          <PatientField id="relatorio-paciente" value={paciente} onChange={setPaciente} />
          <SelectField
            id="relatorio-modelo"
            label="Modelos disponíveis"
            placeholder="Selecione um modelo salvo"
            value={modelo}
            onValueChange={applyTemplate}
            options={REPORT_TEMPLATES.map((t) => ({ value: t.value, label: t.label }))}
            hint="Use “Salvar como modelo” após redigir o texto para reaproveitá-lo depois."
          />
          <CidFields cid={cid} descricao={diagnosticoSelecionado} onChange={handleCid} />
          <p className="text-xs text-muted-foreground">
            Variáveis que podem ser utilizadas no texto:{" "}
            {DOCUMENT_VARIABLES.map((v) => (
              <code
                key={v}
                className="mr-1 rounded bg-muted px-1 py-0.5 font-mono text-xs"
              >
                {v}
              </code>
            ))}
          </p>
        </div>
      </SurfaceCard>

      <RichTextEditor
        ariaLabel="Texto do relatório médico"
        value={html}
        onChange={setHtml}
        onImproveWithAi={improve}
        improving={improving}
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
        signable
        onSaveTemplate={() =>
          toast.success("Modelo salvo e disponível na lista (simulação).")
        }
      />
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

  const { savedAt } = useDraftAutosave({
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

  const { improving, improve } = useImproveWithAi(
    "Atestado médico",
    conteudo,
    setHtml,
  );

  return (
    <>
      <SurfaceCard
        title="Dados do atestado"
        description="O texto padrão é gerado automaticamente a partir destes campos."
        icon={<Stethoscope className="icon-optical h-4 w-4" aria-hidden />}
        padding="lg"
        actions={<SavedIndicator savedAt={savedAt} />}
      >
        <div className="space-y-4">
          <PatientField id="atestado-paciente" value={paciente} onChange={setPaciente} />
          <CidFields cid={cid} descricao={diagnosticoSelecionado} onChange={handleCid} />
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
            <SelectField
              id="atestado-dias"
              label="Dias de afastamento"
              value={dias}
              onValueChange={setDias}
              options={AFASTAMENTO_OPTIONS}
            />
            <Field id="atestado-data" label="Data do documento">
              <Input
                id="atestado-data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </Field>
            <Field id="atestado-cidade" label="Cidade" optional>
              <Input
                id="atestado-cidade"
                placeholder="Cidade de emissão"
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
        header={
          <DocumentEditorHeader
            title="Atestado médico"
            meta={<>Paciente: {paciente || "—"} · {formatDateLong(data)}</>}
            actions={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setHtml("");
                  toast.success("Texto padrão restaurado.");
                }}
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
        signable
      />
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

  const { savedAt } = useDraftAutosave({
    key: "hg:documentos:comparecimento",
    data: { paciente, local, cidade, data, entrada, saida, html },
    isEmpty: (d) =>
      !d.paciente.trim() && !d.local.trim() && !d.cidade.trim() && !d.entrada && !d.saida && !d.html,
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

  const { improving, improve } = useImproveWithAi(
    "Declaração de comparecimento",
    conteudo,
    setHtml,
  );

  return (
    <>
      <SurfaceCard
        title="Dados da declaração"
        description="Informe o local e os horários de permanência do paciente no atendimento."
        icon={<CalendarCheck className="icon-optical h-4 w-4" aria-hidden />}
        padding="lg"
        actions={<SavedIndicator savedAt={savedAt} />}
      >
        <div className="space-y-4">
          <PatientField id="comp-paciente" value={paciente} onChange={setPaciente} />
          <Field id="comp-local" label="Local de atendimento">
            <Input
              id="comp-local"
              placeholder="Clínica, hospital ou consultório"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
            />
          </Field>
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4 [&>*]:min-w-0">
            <Field id="comp-cidade" label="Cidade" optional>
              <Input
                id="comp-cidade"
                placeholder="Cidade de emissão"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
              />
            </Field>
            <Field id="comp-data" label="Data do comparecimento">
              <Input
                id="comp-data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </Field>
            <Field id="comp-entrada" label="Horário de entrada">
              <Input
                id="comp-entrada"
                type="time"
                value={entrada}
                onChange={(e) => setEntrada(e.target.value)}
              />
            </Field>
            <Field id="comp-saida" label="Horário de saída">
              <Input
                id="comp-saida"
                type="time"
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
        header={
          <DocumentEditorHeader
            title="Declaração de comparecimento"
            meta={<>Paciente: {paciente || "—"} · {formatDateLong(data)}</>}
            actions={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setHtml("");
                  toast.success("Texto padrão restaurado.");
                }}
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
        signable
      />
    </>
  );
}
