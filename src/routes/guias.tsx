import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, type ChangeEvent } from "react";
import {
  Upload,
  Camera,

  FileUp,
  Search,
  Calendar,
  Eye,
  ClipboardCopy,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Plus,
  Trash2,
  Save,
  Check,
  Info,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  X,
} from "lucide-react";
import guiaMock from "@/assets/guia-mock.png.asset.json";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AppModal } from "@/components/app-modal";
import { Button } from "@/components/ui/button";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { Field, SearchInput } from "@/components/form-field";
import { Combobox, MultiSelect } from "@/components/ui/combobox";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/data-state";
import { FilterCard } from "@/components/filter-card";
import {
  DataTableRoot,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  DataTableCardList,
  DataTableCard,
  DataTableCardHeader,
  DataTableCardFields,
  DataTableCardActions,
  DataTableDesktop,
} from "@/components/data-table";
import { Chip } from "@/components/ui/chip";
import { CameraCaptureDialog } from "@/components/camera-capture-dialog";
import { ProcedureCodeModal } from "@/components/procedure-code-modal";
import { cn } from "@/lib/utils";



export const Route = createFileRoute("/guias")({
  head: () => ({
    meta: [
      { title: "HaisGuias — Minhas guias" },
      { name: "description", content: "Processamento e histórico de guias médicas." },
    ],
  }),
  component: Page,
});

type Row = {
  file: string;
  id: number;
  patient: string;
  type: "SADT" | "Não válido" | "Encaminhamento";
  date: string;
  status: "Concluído" | "Erro";
  warn?: boolean;
};

const rows: Row[] = [
  { file: "guia_001_paciente_silva.pdf", id: 1042, patient: "Ana Beatriz Silva Rodrigues", type: "SADT", date: "06/07/2026, 14:32", status: "Concluído" },
  { file: "guia_002_exame_ressonancia.pdf", id: 1041, patient: "Carlos Eduardo Mendes", type: "SADT", date: "06/07/2026, 11:15", status: "Concluído" },
  { file: "documento_ilegivel.jpg", id: 1040, patient: "—", type: "Não válido", date: "05/07/2026, 18:07", status: "Erro" },
  { file: "encaminhamento_cardio.pdf", id: 1039, patient: "Juliana Ferreira Costa", type: "Encaminhamento", date: "05/07/2026, 16:44", status: "Concluído" },
  { file: "guia_004_consulta.png", id: 1038, patient: "Roberto Almeida Souza", type: "SADT", date: "05/07/2026, 10:28", status: "Concluído", warn: true },
  { file: "guia_005_fisioterapia.pdf", id: 1037, patient: "Patrícia Oliveira Lima", type: "SADT", date: "04/07/2026, 15:53", status: "Concluído" },
  { file: "scan_borrado_003.jpg", id: 1036, patient: "—", type: "Não válido", date: "04/07/2026, 13:21", status: "Erro" },
  { file: "encaminhamento_neuro.pdf", id: 1035, patient: "Fernando Batista Nogueira", type: "Encaminhamento", date: "03/07/2026, 17:09", status: "Concluído", warn: true },
  { file: "guia_007_laboratorio.pdf", id: 1034, patient: "Mariana Santos Pereira", type: "SADT", date: "03/07/2026, 09:47", status: "Concluído" },
  { file: "guia_008_ultrassom.png", id: 1033, patient: "Lucas Henrique Barbosa", type: "SADT", date: "02/07/2026, 19:12", status: "Concluído" },
];

function Page() {
  const [extraRows, setExtraRows] = useState<Row[]>([]);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <AppSidebar activeKey="extrair" />
      <main className="flex min-h-screen min-w-0 flex-1 flex-col">
        <div className="w-full min-w-0 flex-1 space-y-6 px-4 py-6 pb-16 sm:px-6 sm:py-8 lg:px-10">
          <AppBreadcrumb />
          <Upload_Section onProcessed={(row) => setExtraRows((prev) => [row, ...prev])} />
          <History_Section extraRows={extraRows} />
        </div>
        <SiteFooter />
      </main>

    </div>
  );
}



/* ---------- Upload Section ---------- */

type QueueItem = {
  id: number;
  name: string;
  progress: number;
  stage: string;
  done: boolean;
};

function Upload_Section({ onProcessed }: { onProcessed: (row: Row) => void }) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);

  const handleFiles = (files: FileList | File[] | null) => {
    const list = files ? Array.from(files) : [];
    if (!list.length) return;

    const newItems: QueueItem[] = list.map((file, idx) => ({

      id: Date.now() + idx,
      name: file.name,
      progress: 0,
      stage: "Enviando documento...",
      done: false,
    }));

    setQueue((prev) => [...newItems, ...prev]);
    toast.success(
      list.length === 1
        ? `Arquivo selecionado: ${list[0].name}`
        : `${list.length} arquivos selecionados`,
    );


    newItems.forEach((item) => {
      const interval = setInterval(() => {
        setQueue((prev) =>
          prev.map((q) => {
            if (q.id !== item.id) return q;
            const next = Math.min(100, q.progress + Math.floor(Math.random() * 12) + 6);
            let stage = q.stage;
            if (next < 40) stage = "Enviando documento...";
            else if (next < 75) stage = "Extraindo dados...";
            else if (next < 100) stage = "Validando informações...";
            else stage = "Processamento concluído";
            if (next >= 100) {
              clearInterval(interval);
              const now = new Date();
              const date = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}, ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
              onProcessed({
                file: item.name,
                id: Number(item.id.toString().slice(-4)),
                patient: "CONCEICAO APARECIDA LIMA DOS SANTOS",
                type: "SADT",
                date,
                status: "Concluído",
              });
              setTimeout(() => {
                setQueue((p) => p.filter((x) => x.id !== item.id));
              }, 2000);
              return { ...q, progress: 100, stage, done: true };
            }

            return { ...q, progress: next, stage };
          }),
        );
      }, 500);
    });
  };

  const removeItem = (id: number) => {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  };

  return (
    <section className="space-y-4">
      <PageHeader
        title="Extrair dados da guia"
        description="Envie arquivos PDF ou imagens para extração automática dos dados."
        actions={<RequiredFieldsModal />}
      />
      <div
        className="rounded-2xl border-2 border-dashed border-border bg-card px-4 py-10 flex flex-col items-center justify-center text-center sm:px-6 sm:py-14"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          handleFiles(event.dataTransfer.files);
        }}
      >
        <div className="mb-5 grid place-items-center h-14 w-14 rounded-full bg-muted sm:h-16 sm:w-16">
          <Upload className="h-6 w-6 text-muted-foreground sm:h-7 sm:w-7" />
        </div>
        <p className="font-display text-base font-semibold tracking-tight text-foreground">Arraste suas guias médicas aqui</p>
        <p className="mt-1 text-sm text-muted-foreground">
          ou selecione um arquivo (PDF, imagem) ou tire uma foto da guia
        </p>
        <input /* ds-allow: input de arquivo oculto acionado pelo Button/label */
          id="guide-file-upload"
          type="file"
          accept=".pdf,image/*"
          multiple
          className="sr-only"
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <div className="mt-6 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
          <Button variant="outline" asChild className="justify-center">
            <label htmlFor="guide-file-upload" className="cursor-pointer">
              <FileUp className="h-4 w-4" />
              Selecionar arquivos
            </label>
          </Button>
          <Button variant="outline" onClick={() => setCameraOpen(true)} className="justify-center">
            <Camera className="h-4 w-4" aria-hidden="true" />
            Tirar foto
          </Button>
        </div>
      </div>

      <CameraCaptureDialog
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        onCapture={(file) => handleFiles([file])}
      />


      {queue.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-base font-semibold tracking-tight text-foreground">Fila de processamento ({queue.length})</h2>
          {queue.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2"
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                  <FileUp className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1 basis-40">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">ID: {item.id.toString().slice(-3)}</p>
                </div>
                <Badge variant={item.done ? "success-soft" : "primary-soft"} size="lg">
                  {item.done ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  {item.done ? "Concluído" : "Processando Dados"}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  className="h-7 w-7 text-muted-foreground"
                  aria-label="Remover"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full transition-all ${item.done ? "bg-success" : "bg-primary"}`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{item.stage}</span>
                <span className={item.done ? "text-success font-medium" : "text-primary font-medium"}>
                  {item.progress}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}


/* ---------- History Section ---------- */

function History_Section({ extraRows }: { extraRows: Row[] }) {
  const allRows = [...extraRows, ...rows];

  const [detailRow, setDetailRow] = useState<Row | null>(null);
  const [codeRow, setCodeRow] = useState<Row | null>(null);

  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl font-semibold tracking-tight">Histórico de processamento</h2>

      {/* Card de filtros padronizado (mesmo componente das telas de busca). */}
      <FilterCard id="history-filters" onClear={() => {}}>
        <div className="w-full min-w-0 sm:col-span-2 lg:w-auto lg:flex-1 lg:min-w-[240px]">
          <SearchInput placeholder="Buscar por arquivo ou paciente" />
        </div>
        <div className="w-full min-w-0 lg:w-[180px]">
          <Combobox
            options={[
              { value: "sucesso", label: "Sucesso" },
              { value: "erro", label: "Erro" },
              { value: "processando", label: "Processando" },
            ]}
            placeholder="Todos os status"
            searchPlaceholder="Buscar status..."
            clearable
          />
        </div>
        <div className="w-full min-w-0 lg:w-[200px]">
          <Combobox
            options={[
              { value: "sadt", label: "SADT" },
              { value: "consulta", label: "Consulta" },
              { value: "internacao", label: "Internação" },
              { value: "honorario", label: "Honorário" },
            ]}
            placeholder="Todos os tipos"
            searchPlaceholder="Buscar tipo..."
            clearable
          />
        </div>
        <DateField label="Data início" />
        <DateField label="Data fim" />
      </FilterCard>



      {/* Estado vazio padronizado (mesmo componente das telas de busca). */}
      {allRows.length === 0 && (
        <div className="rounded-2xl border border-border bg-card shadow-xs">
          <EmptyState
            title="Nenhuma guia processada"
            description="Envie ou fotografe uma guia para vê-la aqui. Ajuste os filtros se estiver buscando um envio antigo."
          />
        </div>
      )}

      {/* Mobile: fallback em cards compartilhado (DataTable). */}
      <DataTableCardList>
        {allRows.map((r, i) => (
          <DataTableCard key={i}>
            <DataTableCardHeader
              title={
                <>
                  <span className="truncate">{r.file}</span>
                  {r.warn && (
                    <AlertTriangle
                      className="h-4 w-4 shrink-0 text-warning"
                      aria-hidden="true"
                    />
                  )}
                </>
              }
              subtitle={r.patient}
              trailing={<StatusBadge status={r.status} />}
            />
            <DataTableCardFields
              fields={[
                { label: "ID da guia", value: `ID ${r.id}`, hideLabel: true },
                { label: "Data de envio", value: r.date, hideLabel: true },
              ]}
            />
            <DataTableCardActions>
              <TypeBadge type={r.type} />
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={r.status === "Erro"}
                  onClick={() => setDetailRow(r)}
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  Ver
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Códigos de procedimento"
                  disabled={r.status === "Erro"}
                  onClick={() => setCodeRow(r)}
                >
                  <ClipboardCopy className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </DataTableCardActions>
          </DataTableCard>
        ))}
      </DataTableCardList>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <DataTableDesktop>

          <DataTableRoot className="min-w-[880px]">
            <DataTableHeader>
              <DataTableRow className="hover:bg-transparent">
                <DataTableHead>Arquivo</DataTableHead>
                <DataTableHead>ID da guia</DataTableHead>
                <DataTableHead>Paciente</DataTableHead>
                <DataTableHead>Tipo de guia</DataTableHead>
                <DataTableHead>Data de envio</DataTableHead>
                <DataTableHead>Status</DataTableHead>
                <DataTableHead className="text-right">Ações</DataTableHead>
              </DataTableRow>
            </DataTableHeader>
            <DataTableBody>
              {allRows.map((r, i) => (
                <DataTableRow key={i}>
                  <DataTableCell>
                    <div className="flex items-center gap-2">
                      <span className="block max-w-[200px] truncate sm:max-w-[260px]">{r.file}</span>
                      {r.warn && <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />}
                    </div>
                  </DataTableCell>
                  <DataTableCell className="text-muted-foreground">{r.id}</DataTableCell>
                  <DataTableCell className="max-w-[200px] truncate sm:max-w-[260px]">{r.patient}</DataTableCell>
                  <DataTableCell>
                    <TypeBadge type={r.type} />
                  </DataTableCell>
                  <DataTableCell className="whitespace-nowrap text-muted-foreground">{r.date}</DataTableCell>
                  <DataTableCell>
                    <StatusBadge status={r.status} />
                  </DataTableCell>
                  <DataTableCell className="text-right">
                    <div className="inline-flex items-center icon-optical gap-3 text-muted-foreground">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Visualizar"
                        onClick={() => setDetailRow(r)}
                        disabled={r.status === "Erro"}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Códigos de procedimento"
                        onClick={() => setCodeRow(r)}
                        disabled={r.status === "Erro"}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      >
                        <ClipboardCopy className="h-4 w-4" />
                      </Button>
                    </div>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTableRoot>
        </DataTableDesktop>



        <div className="flex flex-col gap-4 border-t border-border px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6">
          <div className="text-sm text-muted-foreground">
            Mostrando 1 a 10 de 130 resultados
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Itens por página
              <Button variant="outline" size="sm" className="gap-1">
                10 <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Pagination />
          </div>
        </div>
      </div>

      <GuideDetailsModal row={detailRow} onClose={() => setDetailRow(null)} />
      <ProcedureCodeModal
        open={codeRow !== null}
        onOpenChange={(next: boolean) => {
          if (!next) setCodeRow(null);
        }}
      />
    </section>
  );
}

function GuideDetailsModal({ row, onClose }: { row: Row | null; onClose: () => void }) {
  const open = row !== null;
  // No mobile as duas colunas viram abas: a imagem não empurra mais os dados.
  const [mobileTab, setMobileTab] = useState<"guia" | "dados">("dados");
  const details = row
    ? {
        header: [
          { label: "Nº guia prestador", value: "178499" },
          { label: "Nº guia operadora", value: "42263120251127828416" },
          { label: "Senha", value: "A045158" },
          { label: "Data autorização", value: "27/11/2025" },
          { label: "Validade senha", value: "27/12/2025" },
          { label: "Registro ANS", value: "366871" },
        ],
        beneficiary: [
          { label: "Nome", value: row.patient !== "—" ? row.patient : "Não informado" },
          { label: "Nome social", value: "Não informado" },
          { label: "Nº carteira", value: "010170255406" },
          { label: "Validade carteira", value: "29/12/2029" },
          { label: "Atend. RN", value: "Não" },
        ],
        solicitante: [
          { label: "Nome prestador", value: "CECAN - CENTRO AVANCADO EM ONCOLOGIA" },
          { label: "Profissional", value: "WILMA SANTIAGO KAMAKURA" },
          { label: "Especialidade", value: "Não informado" },
          { label: "Conselho", value: "06" },
          { label: "Nº conselho", value: "1472" },
          { label: "UF", value: "Não informado" },
          { label: "CBO", value: "225315" },
        ],
        executante: [
          { label: "Código operadora", value: "Não informado" },
          { label: "Nome", value: "CECAN - DENSITOMETRIA OSSEA" },
          { label: "CNES", value: "Não informado" },
        ],
        procedimentosSolicitados: [
          { tabela: "22", codigo: "40808130", descricao: "DENSITOMETRIA OSSEA - ROTINA: COLUNA E FEMUR OU DOIS SEGMENTOS" },
        ],
        procedimentosRealizados: [
          { data: "Não informado", codigo: "40808130", descricao: "DENSITOMETRIA OSSEA - ROTINA: COLUNA E FEMUR OU DOIS SEGMENTOS" },
        ],
        codigosProcedimento: [
          { codigo: "40808130", proc: "densitometria óssea - rotina: coluna e fêmur (ou dois segmentos)", ref: "Tuss" },
          { codigo: "204060028", proc: "densitometria ossea duo-energetica de coluna (vertebras lombares)", ref: "Sigtap" },
        ],
        financeiro: [
          { label: "Honorários", value: "Não informado" },
          { label: "Materiais", value: "Não informado" },
          { label: "OPME", value: "Não informado" },
          { label: "Medicamentos", value: "Não informado" },
          { label: "Gases", value: "Não informado" },
          { label: "Procedimentos", value: "Não informado" },
        ],
      }
    : null;

  return (
    <AppModal
      open={open}
      onOpenChange={(v: boolean) => {
        if (!v) {
          setMobileTab("dados");
          onClose();
        }
      }}
      size="xl"
      unstyledBody
      icon={<FileUp className="h-5 w-5" />}
      title="Detalhes da guia"
      description={row ? `${row.file} • ID: ${row.id}` : undefined}
      headerExtra={
        row ? (
          <>
            <div className="mt-2">
              <TypeBadge type={row.type} />
            </div>
            <div
              className="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 lg:hidden"
              role="tablist"
            >
              {(["dados", "guia"] as const).map((tab) => (
                <Button
                  key={tab}
                  type="button"
                  variant="ghost"
                  role="tab"
                  aria-selected={mobileTab === tab}
                  onClick={() => setMobileTab(tab)}
                  className={`h-auto rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    mobileTab === tab
                      ? "bg-card text-foreground shadow-sm hover:bg-card"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "dados" ? "Detalhamento" : "Imagem da guia"}
                </Button>
              ))}
            </div>
          </>
        ) : undefined
      }
    >

        {row && details && (
          <DialogBody className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-muted/30">
            <div className={`${mobileTab === "guia" ? "flex" : "hidden"} lg:!flex lg:sticky lg:top-0 lg:self-start h-[65vh] lg:h-[calc(92vh-3rem)] rounded-xl border border-border bg-card p-4 sm:p-6 flex-col gap-4 min-h-0`}>
              <div className="text-sm font-medium truncate">Arquivo enviado: {row.file}</div>
              <div className="flex-1 min-h-0">
                <GuidePreview src={guiaMock.url} alt={row.file} />
              </div>
              <div className="flex justify-end">
                <Button>
                  <FileUp className="h-4 w-4" />
                  Baixar arquivo
                </Button>
              </div>
            </div>



            <div className={`${mobileTab === "dados" ? "block" : "hidden"} space-y-6 min-w-0 lg:block`}>
              <DetailCard title="Cabeçalho" icon={<Info className="h-5 w-5 text-primary" />} items={details.header} />
              <DetailCard title="Beneficiário" icon={<Info className="h-5 w-5 text-primary" />} items={details.beneficiary} />
              <DetailCard title="Prestador solicitante" icon={<Info className="h-5 w-5 text-primary" />} items={details.solicitante} />
              <DetailCard title="Prestador executante" icon={<Info className="h-5 w-5 text-primary" />} items={details.executante} />

              <SectionCard title="Procedimentos solicitados">
                <ProcedureTable
                  columns={["Tabela", "Código", "Descrição"]}
                  rows={details.procedimentosSolicitados.map((p) => [p.tabela, p.codigo, p.descricao])}
                />
              </SectionCard>

              <SectionCard title="Procedimentos realizados">
                <ProcedureTable
                  columns={["Data", "Código", "Descrição"]}
                  rows={details.procedimentosRealizados.map((p) => [p.data, p.codigo, p.descricao])}
                />
              </SectionCard>

              <SectionCard title="Códigos de procedimento">
                <ProcedureTable
                  columns={["Código", "Procedimento", "Referência"]}
                  rows={details.codigosProcedimento.map((p) => [p.codigo, p.proc, p.ref])}
                />
              </SectionCard>

              <SectionCard title="Financeiro" icon={<span className="text-primary font-bold">$</span>}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {details.financeiro.map((f) => (
                    <div key={f.label} className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                      <div className="text-xs text-muted-foreground">{f.label}</div>
                      <div className="mt-1 text-sm font-semibold">{f.value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
                  <div className="text-xs text-muted-foreground">Valor total geral</div>
                  <div className="mt-1 text-base font-bold text-primary">Não informado</div>
                </div>
              </SectionCard>
            </div>
          </DialogBody>
        )}
    </AppModal>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="font-display text-base font-semibold tracking-tight text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ProcedureTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full min-w-[420px] text-sm">
        <thead>
          <tr className="text-left text-muted-foreground">
            {columns.map((c) => (
              <th key={c} className="pb-3 pr-4 font-medium">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border">
              {r.map((cell, j) => (
                <td key={j} className="py-3 pr-4 align-top">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GuidePreview({ src, alt }: { src: string; alt: string }) {
  const [zoom, setZoom] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const clamp = (v: number) => Math.min(4, Math.max(0.5, v));
  const canPan = zoom > 1;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canPan || !scrollRef.current) return;
    setIsDragging(true);
    scrollRef.current.setPointerCapture(e.pointerId);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: scrollRef.current.scrollLeft,
      scrollTop: scrollRef.current.scrollTop,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollRef.current) return;
    scrollRef.current.scrollLeft = dragStart.current.scrollLeft - (e.clientX - dragStart.current.x);
    scrollRef.current.scrollTop = dragStart.current.scrollTop - (e.clientY - dragStart.current.y);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    scrollRef.current?.releasePointerCapture(e.pointerId);
  };


  const controls = (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 rounded-full border border-border bg-card/95 backdrop-blur px-2 py-1 shadow-sm">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Diminuir zoom"
        onClick={() => setZoom((z) => clamp(z - 0.25))}
        className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <span className="text-xs font-medium tabular-nums w-12 text-center">
        {Math.round(zoom * 100)}%
      </span>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Aumentar zoom"
        onClick={() => setZoom((z) => clamp(z + 0.25))}
        className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>


      <Button
        variant="outline"
        size="sm"
        aria-label="Redefinir zoom para 100%"
        title="Redefinir zoom (100%)"
        onClick={() => setZoom(1)}
        disabled={zoom === 1}
        className="ml-1 h-auto rounded-full px-3 py-1.5 text-xs font-semibold hover:bg-primary hover:text-primary-foreground hover:border-primary"
      >
        <RotateCcw className="h-3.5 w-3.5" /> Reset
      </Button>

      <Button
        variant="ghost"
        size="icon"
        aria-label={expanded ? "Reduzir" : "Expandir"}
        onClick={() => setExpanded((v) => !v)}
        className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <>
      <div className="relative rounded-lg border border-border bg-muted/40 overflow-hidden h-full min-h-[400px]">
        {controls}
        <div
          ref={scrollRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={`absolute inset-0 overflow-auto ${canPan ? (isDragging ? "cursor-grabbing" : "cursor-grab") : ""}`}
        >
          <div className="min-h-full min-w-full flex items-center justify-center p-4">
            <img
              src={src}
              alt={alt}
              style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
              className="max-h-full max-w-full w-auto h-auto object-contain transition-transform duration-150 select-none pointer-events-none"
              draggable={false}
            />
          </div>
        </div>
      </div>



      {expanded && (
        <div
          className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex flex-col"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="text-sm font-medium truncate">{alt}</div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Fechar"
              onClick={() => setExpanded(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="relative flex-1 overflow-hidden">
            {controls}
            <div className="absolute inset-0 overflow-auto">
              <div className="min-h-full min-w-full flex items-start justify-center p-6">
                <img
                  src={src}
                  alt={alt}
                  style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
                  className="max-w-full h-auto transition-transform duration-150 select-none"
                  draggable={false}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DetailCard({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: { label: string; value: string }[];
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="font-display text-base font-semibold tracking-tight text-foreground">{title}</h3>
      </div>
      <dl className="divide-y divide-border">
        {items.map((it) => (
          <div key={it.label} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <dt className="text-sm text-muted-foreground">{it.label}</dt>
            <dd className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground sm:text-right">
              <span className="min-w-0 truncate sm:max-w-[280px]">{it.value}</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Copiar ${it.label}`}
                onClick={() => navigator.clipboard?.writeText(it.value)}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                <ClipboardCopy className="h-3.5 w-3.5" />
              </Button>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}




function DateField({ label }: { label: string }) {
  return (
    <Button
      variant="outline"
      className="w-full justify-start gap-2 text-sm font-normal lg:w-auto lg:min-w-[150px]"
    >
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
    </Button>
  );
}

function TypeBadge({ type }: { type: Row["type"] }) {
  const variant =
    type === "SADT"
      ? "info"
      : type === "Não válido"
        ? "destructive"
        : "purple";
  return (
    <Badge variant={variant} size="sm">
      {type}
    </Badge>
  );
}

function StatusBadge({ status }: { status: Row["status"] }) {
  if (status === "Concluído") {
    return (
      <Badge variant="success" size="sm">
        <CheckCircle2 className="h-3.5 w-3.5" /> Concluído
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" size="sm">
      <XCircle className="h-3.5 w-3.5" /> Erro
    </Badge>
  );
}

function Pagination() {
  const pages = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-1">
      <PagBtn aria-label="Anterior">
        <ChevronLeft className="h-4 w-4" />
      </PagBtn>
      {pages.map((p) => (
        <PagBtn key={p} active={p === 1}>
          {p}
        </PagBtn>
      ))}
      <PagBtn aria-label="Próximo">
        <ChevronRight className="h-4 w-4" />
      </PagBtn>
    </div>
  );
}

function PagBtn({
  children,
  active,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <Button
      {...rest}
      variant={active ? "default" : "outline"}
      size="sm"
      className="h-8 min-w-8 px-2"
    >
      {children}
    </Button>
  );
}

/* ---------- Required Fields Modal ---------- */

const GUIDE_TYPES = ["SADT", "Solicitação de exame", "Encaminhamento"] as const;
type GuideType = (typeof GUIDE_TYPES)[number];

const AVAILABLE_FIELDS = [
  "Data autorização",
  "Nome social",
  "Nº carteira",
  "Validade carteira",
  "Atend. RN",
  "Nome prestador",
  "Profissional",
  "Especialidade",
  "Conselho",
  "Nº conselho",
  "UF",
  "Código procedimento",
  "Descrição procedimento",
  "Quantidade",
  "Data solicitação",
  "CID",
];

const DEFAULT_FIELDS: Record<GuideType, string[]> = {
  SADT: ["Nome", "Registro ANS", "Nº guia operadora", "Senha", "Validade senha", "Nº guia prestador"],
  "Solicitação de exame": ["Nome", "Nº carteira", "CID"],
  Encaminhamento: ["Nome", "Especialidade", "Profissional"],
};

function RequiredFieldsModal() {
  const [open, setOpen] = useState(false);
  const [guideType, setGuideType] = useState<GuideType>("SADT");
  const [pickerSelection, setPickerSelection] = useState<string[]>([]);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Saved (persisted) state vs draft (being edited)
  const [saved, setSaved] = useState<Record<GuideType, string[]>>(DEFAULT_FIELDS);
  const [draft, setDraft] = useState<Record<GuideType, string[]>>(DEFAULT_FIELDS);
  const [saving, setSaving] = useState(false);

  const current = draft[guideType];
  const remaining = AVAILABLE_FIELDS.filter((f) => !current.includes(f));


  const isDirty = (Object.keys(draft) as GuideType[]).some(
    (k) => draft[k].length !== saved[k].length || draft[k].some((f, i) => f !== saved[k][i]),
  );
  const isEmpty = current.length === 0;

  const addSelected = () => {
    if (pickerSelection.length === 0) return;
    setDraft((prev) => ({
      ...prev,
      [guideType]: [...prev[guideType], ...pickerSelection.filter((f) => !prev[guideType].includes(f))],
    }));
    setPickerSelection([]);
  };


  const removeField = (f: string) => {
    setDraft((prev) => ({ ...prev, [guideType]: prev[guideType].filter((x) => x !== f) }));
  };

  const attemptClose = (next: boolean) => {
    if (!next && isDirty) {
      setConfirmDiscard(true);
      return;
    }
    setOpen(next);
  };

  const discardChanges = () => {
    setDraft(saved);
    setPickerSelection([]);
    
    setConfirmDiscard(false);
    setOpen(false);
  };

  const handleSave = async () => {
    if (isEmpty) {
      toast.error("Adicione ao menos um campo obrigatório para salvar.");
      return;
    }
    setSaving(true);
    try {
      // Simulação de chamada ao backend
      await new Promise((r) => setTimeout(r, 700));
      setSaved(draft);
      toast.success("Configuração salva", {
        description: `Campos obrigatórios atualizados para ${guideType}.`,
      });
      setOpen(false);
    } catch {
      toast.error("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <ListChecks className="h-4 w-4" />
        Campos obrigatórios
      </Button>

      <AppModal
        open={open}
        onOpenChange={attemptClose}
        size="lg"
        title="Campos obrigatórios por tipo de guia"
        icon={<ListChecks className="h-4 w-4" aria-hidden="true" />}
        description="Defina quais campos a guia precisa conter para ser processada automaticamente. Se algum estiver ausente no arquivo enviado, a guia será marcada com aviso e exigirá revisão manual antes de seguir no fluxo."
        headerExtra={
          isDirty ? (
            <Badge variant="warning-soft" size="lg" className="w-fit">
              <span className="h-1.5 w-1.5 rounded-full bg-warning" />
              Alterações não salvas
            </Badge>
          ) : undefined
        }
        bodyClassName="space-y-4"
        footer={
          <>
            <Button variant="outline" onClick={() => attemptClose(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || isEmpty || !isDirty}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar alterações
                </>
              )}
            </Button>
          </>
        }
      >
        <>

            {/* Tipo de guia */}
            <Field label="Tipo de guia" className="w-full sm:w-72">
              <Combobox
                value={guideType}
                onChange={(v) => {
                  setGuideType(v as GuideType);
                  setPickerSelection([]);
                }}
                options={GUIDE_TYPES.map((t) => ({ value: t, label: t }))}
                placeholder="Selecione o tipo"
                searchPlaceholder="Buscar tipo..."
              />
            </Field>

            {/* Selecionar campo */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <MultiSelect
                  values={pickerSelection}
                  onChange={setPickerSelection}
                  options={remaining.map((f) => ({ value: f, label: f }))}
                  placeholder="Selecione um ou mais campos"
                  emptyLabel="Selecione um ou mais campos"
                  allLabel="Todos os campos"
                  searchPlaceholder="Buscar campo…"
                  emptyMessage={
                    remaining.length === 0
                      ? "Todos os campos já foram adicionados."
                      : "Nenhum campo corresponde à busca."
                  }
                  countLabel={(n) => `${n} campo${n > 1 ? "s" : ""} selecionado${n > 1 ? "s" : ""}`}
                />
              </div>
              <Button onClick={addSelected} disabled={pickerSelection.length === 0}>
                <Plus className="h-4 w-4" />
                Adicionar
                {pickerSelection.length > 0 && ` (${pickerSelection.length})`}
              </Button>
            </div>


            {/* Lista de campos */}
            <div
              className={`rounded-lg border bg-card p-4 min-h-[140px] ${
                isEmpty ? "border-destructive/50" : "border-border"
              }`}
            >
              {isEmpty ? (
                <div className="flex items-start gap-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>
                    Adicione ao menos um campo obrigatório para que este tipo de guia possa ser
                    processado.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-3 text-xs text-muted-foreground">
                    {current.length} campo{current.length > 1 ? "s" : ""} obrigatório
                    {current.length > 1 ? "s" : ""} para {guideType}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {current.map((f) => (
                      <Chip key={f} asSpan variant="outline" size="md" className="gap-1.5 pr-1.5">
                        {f}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeField(f)}
                          aria-label={`Remover ${f}`}
                          className="h-5 w-5 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </Chip>
                    ))}
                  </div>
                </>
              )}
            </div>
        </>
      </AppModal>


      {/* Confirmação de descarte */}
      <Dialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Descartar alterações?</DialogTitle>
            <DialogDescription>
              Você tem alterações não salvas. Se sair agora, elas serão perdidas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDiscard(false)}>
              Continuar editando
            </Button>
            <Button variant="destructive" onClick={discardChanges}>
              Descartar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
