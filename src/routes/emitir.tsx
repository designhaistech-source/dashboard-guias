import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  FileText,
  Plus,
  Trash2,
  Save,
  Printer,
  Download,
  CheckCircle2,
  User,
  Stethoscope,
  ClipboardList,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/emitir")({
  head: () => ({
    meta: [
      { title: "HaisGuias — Emitir guia" },
      { name: "description", content: "Preencha os dados e gere uma nova guia médica." },
    ],
  }),
  component: EmitirPage,
});

type Procedure = {
  id: string;
  code: string;
  description: string;
  quantity: number;
};

type GuideType = "sadt" | "consulta" | "exame" | "encaminhamento";

const GUIDE_TYPES: { value: GuideType; label: string }[] = [
  { value: "sadt", label: "SADT" },
  { value: "consulta", label: "Consulta" },
  { value: "exame", label: "Solicitação de exame" },
  { value: "encaminhamento", label: "Encaminhamento" },
];

const CHARACTER_OPTIONS = [
  "Eletivo",
  "Urgência",
  "Emergência",
];

function EmitirPage() {
  const [guideType, setGuideType] = useState<GuideType>("sadt");
  const [character, setCharacter] = useState("Eletivo");

  // Operadora / prestador
  const [operadora, setOperadora] = useState("");
  const [registroAns, setRegistroAns] = useState("");
  const [numeroGuia, setNumeroGuia] = useState(() =>
    `G-${Math.floor(Math.random() * 900000 + 100000)}`,
  );

  // Paciente
  const [pacienteNome, setPacienteNome] = useState("");
  const [pacienteCarteira, setPacienteCarteira] = useState("");
  const [pacienteCpf, setPacienteCpf] = useState("");
  const [pacienteNascimento, setPacienteNascimento] = useState("");
  const [pacienteSexo, setPacienteSexo] = useState("F");

  // Solicitante
  const [medicoNome, setMedicoNome] = useState("Dr. Fulano");
  const [medicoCrm, setMedicoCrm] = useState("1234/RN");
  const [medicoEspecialidade, setMedicoEspecialidade] = useState("");

  // Clínico
  const [cidPrincipal, setCidPrincipal] = useState("");
  const [indicacaoClinica, setIndicacaoClinica] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [dataSolicitacao, setDataSolicitacao] = useState(
    () => new Date().toISOString().slice(0, 10),
  );

  // Procedimentos
  const [procedures, setProcedures] = useState<Procedure[]>([
    { id: crypto.randomUUID(), code: "", description: "", quantity: 1 },
  ]);

  const [preview, setPreview] = useState<null | {
    numero: string;
    tipo: string;
    createdAt: string;
  }>(null);
  const [submitting, setSubmitting] = useState(false);

  const guideTypeLabel = useMemo(
    () => GUIDE_TYPES.find((t) => t.value === guideType)?.label ?? "",
    [guideType],
  );

  const addProcedure = () =>
    setProcedures((p) => [
      ...p,
      { id: crypto.randomUUID(), code: "", description: "", quantity: 1 },
    ]);

  const updateProcedure = (id: string, patch: Partial<Procedure>) =>
    setProcedures((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const removeProcedure = (id: string) =>
    setProcedures((p) => (p.length === 1 ? p : p.filter((x) => x.id !== id)));

  const validate = () => {
    const missing: string[] = [];
    if (!pacienteNome.trim()) missing.push("Nome do paciente");
    if (!pacienteCarteira.trim()) missing.push("Nº da carteira");
    if (!operadora.trim()) missing.push("Operadora");
    if (!medicoNome.trim()) missing.push("Nome do profissional");
    if (!medicoCrm.trim()) missing.push("CRM");
    if (!indicacaoClinica.trim()) missing.push("Indicação clínica");
    const procsOk = procedures.some(
      (p) => p.code.trim() && p.description.trim() && p.quantity > 0,
    );
    if (!procsOk) missing.push("Ao menos um procedimento");
    return missing;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const missing = validate();
    if (missing.length) {
      toast.error("Preencha os campos obrigatórios", {
        description: missing.join(", "),
      });
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setPreview({
        numero: numeroGuia,
        tipo: guideTypeLabel,
        createdAt: new Date().toLocaleString("pt-BR"),
      });
      toast.success("Guia gerada com sucesso", {
        description: `Nº ${numeroGuia} — ${guideTypeLabel}`,
      });
    }, 700);
  };

  const handleReset = () => {
    setPacienteNome("");
    setPacienteCarteira("");
    setPacienteCpf("");
    setPacienteNascimento("");
    setCidPrincipal("");
    setIndicacaoClinica("");
    setObservacoes("");
    setProcedures([
      { id: crypto.randomUUID(), code: "", description: "", quantity: 1 },
    ]);
    setNumeroGuia(`G-${Math.floor(Math.random() * 900000 + 100000)}`);
    toast.info("Formulário limpo");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar activeKey="emitir" />

      <main className="flex-1 overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
          <header className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Emitir guia</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Preencha os dados abaixo para gerar uma nova guia médica.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-md border bg-card">
              <FileText className="h-4 w-4 text-primary" />
              <span className="font-medium">Nº</span>
              <span className="font-mono">{numeroGuia}</span>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de guia */}
            <Section
              icon={<ClipboardList className="h-4 w-4" />}
              title="Tipo de guia"
              description="Selecione o tipo e o caráter do atendimento."
            >
              <Grid cols={2}>
                <Field label="Tipo de guia" required>
                  <Select value={guideType} onValueChange={(v) => setGuideType(v as GuideType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GUIDE_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Caráter do atendimento" required>
                  <Select value={character} onValueChange={setCharacter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CHARACTER_OPTIONS.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </Grid>
            </Section>

            {/* Operadora */}
            <Section
              icon={<Building2 className="h-4 w-4" />}
              title="Operadora"
              description="Dados do convênio responsável pela guia."
            >
              <Grid cols={2}>
                <Field label="Operadora / Convênio" required>
                  <Input value={operadora} onChange={(e) => setOperadora(e.target.value)} placeholder="Unimed, Amil, SulAmérica..." />
                </Field>
                <Field label="Registro ANS">
                  <Input value={registroAns} onChange={(e) => setRegistroAns(e.target.value)} placeholder="000000" />
                </Field>
              </Grid>
            </Section>

            {/* Paciente */}
            <Section
              icon={<User className="h-4 w-4" />}
              title="Paciente"
              description="Identificação do beneficiário."
            >
              <Grid cols={2}>
                <Field label="Nome completo" required>
                  <Input value={pacienteNome} onChange={(e) => setPacienteNome(e.target.value)} placeholder="Nome do paciente" />
                </Field>
                <Field label="Nº da carteira" required>
                  <Input value={pacienteCarteira} onChange={(e) => setPacienteCarteira(e.target.value)} placeholder="0000 0000 0000 0000" />
                </Field>
                <Field label="CPF">
                  <Input value={pacienteCpf} onChange={(e) => setPacienteCpf(e.target.value)} placeholder="000.000.000-00" />
                </Field>
                <Field label="Data de nascimento">
                  <Input type="date" value={pacienteNascimento} onChange={(e) => setPacienteNascimento(e.target.value)} />
                </Field>
                <Field label="Sexo">
                  <Select value={pacienteSexo} onValueChange={setPacienteSexo}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="F">Feminino</SelectItem>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="O">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </Grid>
            </Section>

            {/* Solicitante */}
            <Section
              icon={<Stethoscope className="h-4 w-4" />}
              title="Profissional solicitante"
              description="Médico responsável pela emissão."
            >
              <Grid cols={2}>
                <Field label="Nome do profissional" required>
                  <Input value={medicoNome} onChange={(e) => setMedicoNome(e.target.value)} />
                </Field>
                <Field label="CRM" required>
                  <Input value={medicoCrm} onChange={(e) => setMedicoCrm(e.target.value)} placeholder="0000/UF" />
                </Field>
                <Field label="Especialidade">
                  <Input value={medicoEspecialidade} onChange={(e) => setMedicoEspecialidade(e.target.value)} placeholder="Cardiologia, Ortopedia..." />
                </Field>
                <Field label="Data da solicitação">
                  <Input type="date" value={dataSolicitacao} onChange={(e) => setDataSolicitacao(e.target.value)} />
                </Field>
              </Grid>
            </Section>

            {/* Clínico */}
            <Section
              icon={<FileText className="h-4 w-4" />}
              title="Dados clínicos"
              description="Hipótese diagnóstica e justificativa."
            >
              <Grid cols={2}>
                <Field label="CID principal">
                  <Input value={cidPrincipal} onChange={(e) => setCidPrincipal(e.target.value)} placeholder="Ex.: I10" />
                </Field>
              </Grid>
              <Field label="Indicação clínica / justificativa" required>
                <Textarea
                  rows={3}
                  value={indicacaoClinica}
                  onChange={(e) => setIndicacaoClinica(e.target.value)}
                  placeholder="Descreva a justificativa clínica do procedimento."
                />
              </Field>
              <Field label="Observações">
                <Textarea
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Informações adicionais (opcional)."
                />
              </Field>
            </Section>

            {/* Procedimentos */}
            <Section
              icon={<ClipboardList className="h-4 w-4" />}
              title="Procedimentos solicitados"
              description="Adicione um ou mais procedimentos (TUSS)."
              action={
                <Button type="button" size="sm" variant="outline" onClick={addProcedure}>
                  <Plus className="h-4 w-4" /> Adicionar
                </Button>
              }
            >
              <div className="space-y-3">
                {procedures.map((p, idx) => (
                  <div key={p.id} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-3">
                      <Label className="text-xs text-muted-foreground">Código TUSS</Label>
                      <Input
                        value={p.code}
                        onChange={(e) => updateProcedure(p.id, { code: e.target.value })}
                        placeholder="00000000"
                      />
                    </div>
                    <div className="col-span-7">
                      <Label className="text-xs text-muted-foreground">Descrição</Label>
                      <Input
                        value={p.description}
                        onChange={(e) => updateProcedure(p.id, { description: e.target.value })}
                        placeholder="Descrição do procedimento"
                      />
                    </div>
                    <div className="col-span-1">
                      <Label className="text-xs text-muted-foreground">Qtd.</Label>
                      <Input
                        type="number"
                        min={1}
                        value={p.quantity}
                        onChange={(e) =>
                          updateProcedure(p.id, { quantity: Math.max(1, Number(e.target.value) || 1) })
                        }
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeProcedure(p.id)}
                        disabled={procedures.length === 1}
                        aria-label={`Remover procedimento ${idx + 1}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2 sticky bottom-0 bg-background/80 backdrop-blur py-3 border-t">
              <Button type="button" variant="ghost" onClick={handleReset}>
                Limpar
              </Button>
              <Button type="button" variant="outline">
                <Save className="h-4 w-4" /> Salvar rascunho
              </Button>
              <Button type="submit" disabled={submitting}>
                <FileText className="h-4 w-4" />
                {submitting ? "Gerando..." : "Gerar guia"}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Guia gerada com sucesso
            </DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-3 text-sm">
              <Row label="Número da guia" value={preview.numero} mono />
              <Row label="Tipo" value={preview.tipo} />
              <Row label="Paciente" value={pacienteNome} />
              <Row label="Operadora" value={operadora} />
              <Row label="Emitida em" value={preview.createdAt} />
              <Row
                label="Procedimentos"
                value={String(
                  procedures.filter((p) => p.code.trim() && p.description.trim()).length,
                )}
              />
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
            <Button onClick={() => toast.success("Download iniciado")}>
              <Download className="h-4 w-4" /> Baixar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({
  icon,
  title,
  description,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card shadow-sm">
      <div className="flex items-start justify-between gap-4 px-5 py-4 border-b">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h2 className="text-sm font-semibold">{title}</h2>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
        </div>
        {action}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </section>
  );
}

function Grid({ cols, children }: { cols: 2 | 3; children: React.ReactNode }) {
  return (
    <div
      className={`grid gap-4 ${cols === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium text-right ${mono ? "font-mono" : ""}`}>{value || "—"}</span>
    </div>
  );
}
