import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Upload,
  FileUp,
  Search,
  Calendar,
  Eye,
  ClipboardCopy,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Plus,
  Trash2,
  Save,
  Check,
  Info,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";

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
  { file: "4397007_1.png", id: 308, patient: "MARIA DENEYCARLA CAMPELO …", type: "SADT", date: "25/06/2026, 17:49", status: "Concluído" },
  { file: "3167897_1.png", id: 307, patient: "—", type: "Não válido", date: "19/06/2026, 09:25", status: "Erro" },
  { file: "4397583_1.png", id: 306, patient: "FRANCISCA IONE DANTAS DA SI…", type: "SADT", date: "19/06/2026, 09:24", status: "Concluído" },
  { file: "uqnw2vgi12_1773841465312_page_1.…", id: 305, patient: "—", type: "Não válido", date: "19/06/2026, 09:21", status: "Erro" },
  { file: "2139711_0224802026031810271…", id: 304, patient: "Luann Coutinho de A. Bassani", type: "SADT", date: "19/06/2026, 09:20", status: "Concluído", warn: true },
  { file: "s599yu9p1m_1773839606479.png", id: 303, patient: "MARTA FIGUEREDO DOS ANJOS", type: "Encaminhamento", date: "19/06/2026, 09:18", status: "Concluído" },
  { file: "2139853_0476902026031813221…", id: 302, patient: "Maíra Costa de Morais Nobre", type: "SADT", date: "19/06/2026, 09:18", status: "Concluído", warn: true },
  { file: "2140004_0118542026031815233…", id: 301, patient: "—", type: "SADT", date: "19/06/2026, 09:18", status: "Erro" },
  { file: "50863329-0e71-4018-8d88-04232…", id: 300, patient: "CONCEICAO APARECIDA LIMA D…", type: "SADT", date: "18/06/2026, 09:44", status: "Concluído" },
  { file: "50863329-0e71-4018-8d88-04232…", id: 299, patient: "CONCEICAO APARECIDA LIMA D…", type: "SADT", date: "17/06/2026, 21:01", status: "Concluído" },
];

function Page() {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <AppSidebar activeKey="guias" />
      <main className="flex-1 px-8 py-8">
        <div className="mx-auto max-w-[1400px] space-y-8">
          <Upload_Section />
          <History_Section />
        </div>
        <SiteFooter />
      </main>
    </div>
  );
}


/* ---------- Upload Section ---------- */

function Upload_Section() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight">Processamento de guias</h1>
        <RequiredFieldsModal />
      </div>
      <div className="rounded-2xl border-2 border-dashed border-border bg-card px-6 py-14 flex flex-col items-center justify-center text-center">
        <div className="mb-5 grid place-items-center h-16 w-16 rounded-full bg-muted">
          <Upload className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-lg font-semibold">Arraste suas guias médicas aqui</p>
        <p className="mt-1 text-sm text-muted-foreground">
          ou clique para selecionar arquivos (PDF, imagem)
        </p>
        <button className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted transition-colors">
          <FileUp className="h-4 w-4" />
          Selecionar arquivos
        </button>
      </div>
    </section>
  );
}

/* ---------- History Section ---------- */

function History_Section() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Histórico de processamento</h2>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por arquivo ou paciente"
            className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <FilterSelect label="Todos" />
        <FilterSelect label="Todos os tipos" />
        <DateField label="Data início" />
        <DateField label="Data fim" />
        <button className="text-sm font-medium text-foreground hover:text-primary">
          Limpar filtros
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground bg-muted/40">
              <Th>Arquivo</Th>
              <Th>ID da guia</Th>
              <Th>Paciente</Th>
              <Th>Tipo de guia</Th>
              <Th>Data de envio</Th>
              <Th>Status</Th>
              <Th className="text-right pr-6">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-border hover:bg-muted/30">
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="truncate max-w-[260px]">{r.file}</span>
                    {r.warn && <AlertTriangle className="h-4 w-4 text-warning" />}
                  </div>
                </Td>
                <Td className="text-muted-foreground">{r.id}</Td>
                <Td className="max-w-[260px] truncate">{r.patient}</Td>
                <Td>
                  <TypeBadge type={r.type} />
                </Td>
                <Td className="text-muted-foreground">{r.date}</Td>
                <Td>
                  <StatusBadge status={r.status} />
                </Td>
                <Td className="text-right pr-6">
                  <div className="inline-flex items-center gap-3 text-muted-foreground">
                    <button aria-label="Visualizar" className="hover:text-foreground">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      aria-label="Copiar"
                      className={r.status === "Erro" ? "opacity-40 cursor-not-allowed" : "hover:text-foreground"}
                    >
                      <ClipboardCopy className="h-4 w-4" />
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Mostrando 1 a 10 de 130 resultados
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Itens por página
              <button className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-foreground">
                10 <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
            <Pagination />
          </div>
        </div>
      </div>
    </section>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-6 py-3 font-medium ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-6 py-4 align-middle ${className}`}>{children}</td>;
}

function FilterSelect({ label }: { label: string }) {
  return (
    <button className="inline-flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm min-w-[160px]">
      <span className="text-muted-foreground">{label}</span>
      <ChevronDown className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}

function DateField({ label }: { label: string }) {
  return (
    <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm min-w-[150px]">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
    </button>
  );
}

function TypeBadge({ type }: { type: Row["type"] }) {
  const styles =
    type === "SADT"
      ? "bg-info text-info-foreground"
      : type === "Não válido"
      ? "bg-destructive text-destructive-foreground"
      : "bg-purple text-purple-foreground";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${styles}`}>
      {type}
    </span>
  );
}

function StatusBadge({ status }: { status: Row["status"] }) {
  if (status === "Concluído") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success text-success-foreground px-3 py-1 text-xs font-semibold">
        <CheckCircle2 className="h-3.5 w-3.5" /> Concluído
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive text-destructive-foreground px-3 py-1 text-xs font-semibold">
      <XCircle className="h-3.5 w-3.5" /> Erro
    </span>
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
    <button
      {...rest}
      className={[
        "h-8 min-w-8 px-2 rounded-md text-sm border transition-colors inline-flex items-center justify-center",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-foreground border-border hover:bg-muted",
      ].join(" ")}
    >
      {children}
    </button>
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
  const [typeOpen, setTypeOpen] = useState(false);
  const [fieldOpen, setFieldOpen] = useState(false);
  const [fieldSearch, setFieldSearch] = useState("");
  const [pickerSelection, setPickerSelection] = useState<string[]>([]);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Saved (persisted) state vs draft (being edited)
  const [saved, setSaved] = useState<Record<GuideType, string[]>>(DEFAULT_FIELDS);
  const [draft, setDraft] = useState<Record<GuideType, string[]>>(DEFAULT_FIELDS);
  const [saving, setSaving] = useState(false);

  const current = draft[guideType];
  const remaining = AVAILABLE_FIELDS.filter((f) => !current.includes(f));
  const visibleRemaining = remaining.filter((f) =>
    f.toLowerCase().includes(fieldSearch.trim().toLowerCase()),
  );

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
    setFieldSearch("");
    setFieldOpen(false);
  };

  const togglePick = (f: string) => {
    setPickerSelection((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
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
    setFieldSearch("");
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
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow-sm hover:bg-primary/90 transition-colors"
      >
        <ListChecks className="h-4 w-4" />
        Campos obrigatórios
      </button>

      <Dialog open={open} onOpenChange={attemptClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3 pr-6">
              <DialogTitle className="text-xl">Campos obrigatórios por tipo de guia</DialogTitle>
              {isDirty && (
                <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-warning/15 text-warning px-2.5 py-1 text-xs font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                  Alterações não salvas
                </span>
              )}
            </div>
            <div className="mt-2 flex items-start gap-2 rounded-lg bg-muted/60 border border-border px-3 py-2 text-xs text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5 shrink-0 text-info" />
              <p>
                Defina quais campos a guia precisa conter para ser processada automaticamente.
                Ao enviar um arquivo, se algum desses campos estiver ausente, a guia será
                marcada com aviso e exigirá revisão manual antes de seguir no fluxo.
              </p>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Tipo de guia */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tipo de guia</label>
              <div className="relative">
                <button
                  onClick={() => {
                    setTypeOpen((v) => !v);
                    setFieldOpen(false);
                  }}
                  className="w-full sm:w-72 inline-flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5 text-sm"
                >
                  <span>{guideType}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
                {typeOpen && (
                  <div className="absolute z-20 mt-1 w-full sm:w-72 rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
                    {GUIDE_TYPES.map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setGuideType(t);
                          setTypeOpen(false);
                          setPickerSelection([]);
                          setFieldSearch("");
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted"
                      >
                        <Check className={`h-4 w-4 ${t === guideType ? "opacity-100" : "opacity-0"}`} />
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selecionar campo */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <button
                  onClick={() => {
                    setFieldOpen((v) => !v);
                    setTypeOpen(false);
                  }}
                  className="w-full inline-flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5 text-sm"
                >
                  <span className={pickerSelection.length ? "" : "text-muted-foreground"}>
                    {pickerSelection.length
                      ? `${pickerSelection.length} campo${pickerSelection.length > 1 ? "s" : ""} selecionado${pickerSelection.length > 1 ? "s" : ""}`
                      : "Selecione um ou mais campos"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
                {fieldOpen && (
                  <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
                    <div className="relative border-b border-border">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        autoFocus
                        type="text"
                        value={fieldSearch}
                        onChange={(e) => setFieldSearch(e.target.value)}
                        placeholder="Buscar campo…"
                        className="w-full bg-transparent pl-9 pr-3 py-2 text-sm focus:outline-none"
                      />
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {visibleRemaining.length === 0 ? (
                        <div className="px-3 py-3 text-sm text-muted-foreground">
                          {remaining.length === 0
                            ? "Todos os campos disponíveis já foram adicionados."
                            : "Nenhum campo corresponde à busca."}
                        </div>
                      ) : (
                        visibleRemaining.map((f) => {
                          const picked = pickerSelection.includes(f);
                          return (
                            <button
                              key={f}
                              onClick={() => togglePick(f)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted"
                            >
                              <span
                                className={`grid place-items-center h-4 w-4 rounded border ${
                                  picked
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : "border-border bg-card"
                                }`}
                              >
                                {picked && <Check className="h-3 w-3" />}
                              </span>
                              {f}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={addSelected}
                disabled={pickerSelection.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Adicionar
                {pickerSelection.length > 0 && ` (${pickerSelection.length})`}
              </button>
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
                      <span
                        key={f}
                        className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm"
                      >
                        {f}
                        <button
                          onClick={() => removeField(f)}
                          aria-label={`Remover ${f}`}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <button
                onClick={() => attemptClose(false)}
                disabled={saving}
                className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || isEmpty || !isDirty}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
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
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmação de descarte */}
      <Dialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Descartar alterações?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Você tem alterações não salvas. Se sair agora, elas serão perdidas.
          </p>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <button
              onClick={() => setConfirmDiscard(false)}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted"
            >
              Continuar editando
            </button>
            <button
              onClick={discardChanges}
              className="inline-flex items-center justify-center rounded-lg bg-destructive text-destructive-foreground px-4 py-2.5 text-sm font-medium hover:bg-destructive/90"
            >
              Descartar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
