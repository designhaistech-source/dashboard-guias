import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
  Settings2,
  Info,
  GripVertical,
  Wrench,
  Pencil,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Shield, Landmark, ArrowUp, Stethoscope as StethIcon, BedDouble, HeartPulse, Hospital, Check, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/emitir")({
  head: () => ({
    meta: [
      { title: "HaisGuias — Emitir guia" },
      { name: "description", content: "Preencha os dados e gere uma nova guia médica." },
    ],
  }),
  component: EmitirPage,
});

// -------- Modelo inspirado no fluxo PedeGuia --------

type ConvenioId = "tiss" | "sus";

type GuideKind = "sadt" | "internacao" | "apac" | "aih";

const CONVENIOS: {
  id: ConvenioId;
  label: string;
  short: string;
  description: string;
  guides: {
    id: GuideKind;
    label: string;
    description: string;
    badge: string;
    icon: LucideIcon;
  }[];
}[] = [
  {
    id: "tiss",
    label: "Guias Padronizadas TISS",
    short: "TISS",
    description: "Padrão ANS para planos de saúde privados.",
    guides: [
      {
        id: "sadt",
        label: "Ambulatorial / SADT",
        description: "Consultas, exames diagnósticos e terapias externas.",
        badge: "SP / SADT",
        icon: StethIcon,
      },
      {
        id: "internacao",
        label: "Internação",
        description: "Procedimentos cirúrgicos ou clínicos hospitalares.",
        badge: "Hospitalar",
        icon: BedDouble,
      },
    ],
  },
  {
    id: "sus",
    label: "SUS",
    short: "SUS",
    description: "Guias do Sistema Único de Saúde (DATASUS).",
    guides: [
      {
        id: "apac",
        label: "APAC",
        description: "Autorização de Procedimentos Ambulatoriais de alta complexidade.",
        badge: "Ambulatorial",
        icon: HeartPulse,
      },
      {
        id: "aih",
        label: "AIH",
        description: "Autorização de Internação Hospitalar no SUS.",
        badge: "Hospitalar",
        icon: Hospital,
      },
    ],
  },
];


type Procedure = { id: string; code: string; description: string; quantity: number };
type OpmeItem = { id: string; code: string; description: string; quantity: number };
type Kit = { id: string; name: string; specialty?: string; procedures: Omit<Procedure, "id">[] };

const CHARACTER_OPTIONS = ["Eletivo", "Urgência", "Emergência"];

const GUIDE_SHORT: Record<GuideKind, string> = {
  sadt: "SADT",
  internacao: "Internação",
  apac: "APAC",
  aih: "AIH",
};

// Kits pré-cadastrados por especialidade (CBO)
const SPECIALTY_KITS: Kit[] = [
  {
    id: "cbo-oftalmo-estrabismo",
    name: "Músculos (estrabismo)",
    specialty: "CBO - Oftalmologia",
    procedures: [
      { code: "3.03.11.02-0", description: "Cirurgia com sutura ajustável (7C)", quantity: 1 },
      { code: "3.03.11.03-9", description: "Estrabismo ciclo vertical/transposição - monocular (8A)", quantity: 1 },
      { code: "3.03.11.04-7", description: "Estrabismo horizontal - monocular (7C)", quantity: 1 },
    ],
  },
  {
    id: "cbo-oftalmo-catarata",
    name: "Catarata",
    specialty: "CBO - Oftalmologia",
    procedures: [
      { code: "3.03.06.03-0", description: "Facectomia com implante de lente intraocular", quantity: 1 },
    ],
  },
  {
    id: "cbo-cardio-check",
    name: "Check-up cardiológico",
    specialty: "CBO - Cardiologia",
    procedures: [
      { code: "4.01.01.04-2", description: "Eletrocardiograma", quantity: 1 },
      { code: "4.09.01.03-6", description: "Ecocardiograma transtorácico", quantity: 1 },
      { code: "4.01.02.03-0", description: "Teste ergométrico", quantity: 1 },
    ],
  },
  {
    id: "cbo-clinica-rotina",
    name: "Exames de rotina",
    specialty: "CBO - Clínica Médica",
    procedures: [
      { code: "4.03.04.36-1", description: "Hemograma com contagem de plaquetas ou frações", quantity: 1 },
      { code: "4.03.02.14-9", description: "Colesterol total", quantity: 1 },
      { code: "4.03.02.20-3", description: "Glicose", quantity: 1 },
      { code: "4.03.04.86-8", description: "TSH", quantity: 1 },
    ],
  },
];

function EmitirPage() {
  // Hub — convênio + tipo de guia
  const [convenioId, setConvenioId] = useState<ConvenioId>("tiss");
  const convenio = useMemo(
    () => CONVENIOS.find((c) => c.id === convenioId)!,
    [convenioId],
  );
  const [guideKind, setGuideKind] = useState<GuideKind | null>(null);

  // Ao trocar de convênio, limpa a escolha de guia
  useEffect(() => {
    setGuideKind(null);
  }, [convenioId]);

  const guideLabel = useMemo(
    () => convenio.guides.find((g) => g.id === guideKind)?.label ?? "",
    [convenio, guideKind],
  );

  const guideHeaderTitle = useMemo(() => {
    switch (guideKind) {
      case "sadt":
        return "TISS — Ambulatorial / SADT (SP/SADT)";
      case "internacao":
        return "TISS — Guia de Solicitação de Internação";
      case "apac":
        return "SUS — APAC (Autorização de Procedimentos Ambulatoriais)";
      case "aih":
        return "SUS — AIH (Autorização de Internação Hospitalar)";
      default:
        return "";
    }
  }, [guideKind]);

  const [character, setCharacter] = useState("Eletivo");
  const [operadora, setOperadora] = useState("");
  const [registroAns, setRegistroAns] = useState("");

  // nº da guia — gerado somente no cliente para evitar hydration mismatch
  const [numeroGuia, setNumeroGuia] = useState<string>("—");
  useEffect(() => {
    setNumeroGuia(`G-${Math.floor(Math.random() * 900000 + 100000)}`);
  }, []);

  // Preferências do usuário (persistidas em localStorage)
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [prefPrestador, setPrefPrestador] = useState("");
  const [prefMatricula, setPrefMatricula] = useState("");
  const [prefEstabelecimento, setPrefEstabelecimento] = useState("");
  const [prefUf, setPrefUf] = useState("RN");
  useEffect(() => {
    try {
      const raw = localStorage.getItem("haisguias:prefs");
      if (raw) {
        const p = JSON.parse(raw);
        setPrefPrestador(p.prestador ?? "");
        setPrefMatricula(p.matricula ?? "");
        setPrefEstabelecimento(p.estabelecimento ?? "");
        setPrefUf(p.uf ?? "RN");
        if (p.prestador) setMedicoNome(p.prestador);
        if (p.matricula) setMedicoCrm(p.matricula);
      }
    } catch { /* ignore */ }
  }, []);
  const savePrefs = () => {
    localStorage.setItem(
      "haisguias:prefs",
      JSON.stringify({
        prestador: prefPrestador,
        matricula: prefMatricula,
        estabelecimento: prefEstabelecimento,
        uf: prefUf,
      }),
    );
    if (prefPrestador) setMedicoNome(prefPrestador);
    if (prefMatricula) setMedicoCrm(prefMatricula);
    toast.success("Preferências salvas");
    setPrefsOpen(false);
  };

  const [pacienteNome, setPacienteNome] = useState("");
  const [pacienteCarteira, setPacienteCarteira] = useState("");
  const [pacienteCpf, setPacienteCpf] = useState("");
  const [pacienteNascimento, setPacienteNascimento] = useState("");
  const [pacienteSexo, setPacienteSexo] = useState("F");

  const [medicoNome, setMedicoNome] = useState("Dr. Fulano");
  const [medicoCrm, setMedicoCrm] = useState("1234/RN");
  const [medicoEspecialidade, setMedicoEspecialidade] = useState("");

  const [cidPrincipal, setCidPrincipal] = useState("");
  const [indicacaoClinica, setIndicacaoClinica] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [dataSolicitacao, setDataSolicitacao] = useState(
    () => new Date().toISOString().slice(0, 10),
  );

  // Campos SUS (substituem operadora/ANS)
  const [susEstabelecimento, setSusEstabelecimento] = useState("");
  const [susCnes, setSusCnes] = useState("");
  useEffect(() => {
    if (prefEstabelecimento) setSusEstabelecimento(prefEstabelecimento);
  }, [prefEstabelecimento]);

  // Específicos por tipo de guia
  const [internacaoTipo, setInternacaoTipo] = useState("Clínica");
  const [internacaoRegime, setInternacaoRegime] = useState("Hospitalar");
  const [internacaoDias, setInternacaoDias] = useState(1);
  const [internacaoAcomodacao, setInternacaoAcomodacao] = useState("Enfermaria");

  const [apacCompetencia, setApacCompetencia] = useState(
    () => new Date().toISOString().slice(0, 7),
  );
  const [apacTipo, setApacTipo] = useState("Inicial");

  const [aihMotivo, setAihMotivo] = useState("");
  const [aihCaraterEntry, setAihCaraterEntry] = useState("Eletivo");

  const [procedures, setProcedures] = useState<Procedure[]>([
    { id: "p-1", code: "", description: "", quantity: 1 },
  ]);

  const [preview, setPreview] = useState<null | {
    numero: string;
    tipo: string;
    createdAt: string;
  }>(null);
  const [submitting, setSubmitting] = useState(false);

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
    if (!pacienteCarteira.trim())
      missing.push(convenioId === "sus" ? "Cartão SUS" : "Nº da carteira");
    if (convenioId === "tiss" && !operadora.trim()) missing.push("Operadora");
    if (convenioId === "sus" && !susEstabelecimento.trim()) missing.push("Estabelecimento");
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
        tipo: guideLabel,
        createdAt: new Date().toLocaleString("pt-BR"),
      });
      toast.success("Guia gerada com sucesso", {
        description: `Nº ${numeroGuia} — ${guideLabel}`,
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
    setProcedures([{ id: crypto.randomUUID(), code: "", description: "", quantity: 1 }]);
    setNumeroGuia(`G-${Math.floor(Math.random() * 900000 + 100000)}`);
    toast.info("Formulário limpo");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar activeKey="emitir" />

      <main className="flex-1 overflow-x-hidden flex flex-col min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
          {/* Header do hub */}
          <header className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Emitir Guias</h1>
                <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                  Escolha entre guias de convênio (TISS) ou guias do SUS e selecione o tipo
                  correspondente para começar.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPrefsOpen(true)}
              >
                <Settings2 className="h-4 w-4" />
                Preferências
              </Button>
            </div>
          </header>

          {/* Hub: modo (TISS/SUS) via Tabs */}
          <Tabs
            value={convenioId}
            onValueChange={(v) => setConvenioId(v as ConvenioId)}
          >
            <TabsList className="w-full h-auto p-1 bg-muted/60 grid grid-cols-2 gap-1">
              {CONVENIOS.map((c) => {
                const Icon = c.id === "tiss" ? Shield : Landmark;
                return (
                  <TabsTrigger
                    key={c.id}
                    value={c.id}
                    className="flex items-center gap-2 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{c.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {CONVENIOS.map((c) => (
              <TabsContent key={c.id} value={c.id} className="mt-4">
                <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
                  <div className="px-5 sm:px-7 py-6">

                    <div className="mb-5">
                      <h2 className="text-lg font-semibold">Escolha o tipo de guia</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Selecione a modalidade de atendimento para prosseguir com o formulário.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {c.guides.map((g) => {
                        const active = c.id === convenioId && g.id === guideKind;
                        const Icon = g.icon;
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => setGuideKind(g.id)}
                            className={cn(
                              "group text-left p-4 rounded-xl border-2 transition-all",
                              active
                                ? "bg-primary/5 border-primary ring-4 ring-primary/10"
                                : "bg-background border-border hover:border-primary/40 hover:bg-muted/40",
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div
                                className={cn(
                                  "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                                  active
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "bg-muted text-muted-foreground group-hover:bg-muted/80",
                                )}
                              >
                                <Icon className="h-5 w-5" />
                              </div>
                              <div
                                className={cn(
                                  "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
                                  active
                                    ? "border-primary bg-primary"
                                    : "border-border bg-background",
                                )}
                              >
                                {active && <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />}
                              </div>
                            </div>
                            <div className="mt-3">
                              <h3 className={cn("font-semibold leading-tight", active ? "text-foreground" : "text-foreground/90")}>
                                {g.label}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                {g.description}
                              </p>
                            </div>
                            <div
                              className={cn(
                                "mt-3 inline-flex items-center text-[10px] font-bold uppercase tracking-tight px-2 py-0.5 rounded",
                                active
                                  ? "bg-primary/10 text-primary"
                                  : "text-muted-foreground",
                              )}
                            >
                              {g.badge}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>
              </TabsContent>
            ))}
          </Tabs>

          {guideKind && (
            <form
              key={guideKind}
              onSubmit={handleSubmit}
              className="space-y-6 animate-fade-in"
            >
              {/* Cabeçalho integrado do formulário selecionado */}
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-primary rounded-full" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                    Formulário de emissão
                  </p>
                  <p className="text-sm font-semibold truncate">{guideHeaderTitle}</p>
                </div>
              </div>

              {/* Convênio / Estabelecimento */}
              {convenioId === "tiss" ? (
                <Section
                  icon={<Building2 className="h-4 w-4" />}
                  title="Convênio e atendimento"
                  description="Operadora responsável e caráter da solicitação."
                >
                  <Grid cols={2}>
                    <Field label="Operadora / Convênio" required>
                      <Input
                        value={operadora}
                        onChange={(e) => setOperadora(e.target.value)}
                        placeholder="Unimed, Amil, SulAmérica..."
                      />
                    </Field>
                    <Field label="Registro ANS">
                      <Input
                        value={registroAns}
                        onChange={(e) => setRegistroAns(e.target.value)}
                        placeholder="000000"
                      />
                    </Field>
                    <Field label="Caráter do atendimento" required>
                      <Select value={character} onValueChange={setCharacter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CHARACTER_OPTIONS.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Data da solicitação">
                      <Input
                        type="date"
                        value={dataSolicitacao}
                        onChange={(e) => setDataSolicitacao(e.target.value)}
                      />
                    </Field>
                  </Grid>
                </Section>
              ) : (
                <Section
                  icon={<Building2 className="h-4 w-4" />}
                  title="Estabelecimento (SUS)"
                  description="Unidade executante e identificação DATASUS."
                >
                  <Grid cols={2}>
                    <Field label="Estabelecimento" required>
                      <Input
                        value={susEstabelecimento}
                        onChange={(e) => setSusEstabelecimento(e.target.value)}
                        placeholder="Nome da unidade de saúde"
                      />
                    </Field>
                    <Field label="CNES">
                      <Input
                        value={susCnes}
                        onChange={(e) => setSusCnes(e.target.value)}
                        placeholder="0000000"
                      />
                    </Field>
                    <Field label="Data da solicitação">
                      <Input
                        type="date"
                        value={dataSolicitacao}
                        onChange={(e) => setDataSolicitacao(e.target.value)}
                      />
                    </Field>
                  </Grid>
                </Section>
              )}

              {/* Detalhes específicos por tipo de guia */}
              {guideKind === "internacao" && (
                <Section
                  icon={<BedDouble className="h-4 w-4" />}
                  title="Dados da internação"
                  description="Regime, acomodação e previsão de permanência."
                >
                  <Grid cols={2}>
                    <Field label="Tipo de internação" required>
                      <Select value={internacaoTipo} onValueChange={setInternacaoTipo}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Clínica", "Cirúrgica", "Obstétrica", "Pediátrica", "Psiquiátrica"].map((o) => (
                            <SelectItem key={o} value={o}>{o}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Regime">
                      <Select value={internacaoRegime} onValueChange={setInternacaoRegime}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Hospitalar", "Hospital-dia", "Domiciliar"].map((o) => (
                            <SelectItem key={o} value={o}>{o}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Dias solicitados" required>
                      <Input
                        type="number"
                        min={1}
                        value={internacaoDias}
                        onChange={(e) =>
                          setInternacaoDias(Math.max(1, Number(e.target.value) || 1))
                        }
                      />
                    </Field>
                    <Field label="Acomodação">
                      <Select value={internacaoAcomodacao} onValueChange={setInternacaoAcomodacao}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Enfermaria", "Apartamento", "UTI"].map((o) => (
                            <SelectItem key={o} value={o}>{o}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </Grid>
                </Section>
              )}

              {guideKind === "apac" && (
                <Section
                  icon={<HeartPulse className="h-4 w-4" />}
                  title="Dados da APAC"
                  description="Competência e tipo de autorização."
                >
                  <Grid cols={2}>
                    <Field label="Competência" required>
                      <Input
                        type="month"
                        value={apacCompetencia}
                        onChange={(e) => setApacCompetencia(e.target.value)}
                      />
                    </Field>
                    <Field label="Tipo de APAC" required>
                      <Select value={apacTipo} onValueChange={setApacTipo}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Inicial", "Continuidade", "Única"].map((o) => (
                            <SelectItem key={o} value={o}>{o}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </Grid>
                </Section>
              )}

              {guideKind === "aih" && (
                <Section
                  icon={<Hospital className="h-4 w-4" />}
                  title="Dados da AIH"
                  description="Caráter da internação e motivo."
                >
                  <Grid cols={2}>
                    <Field label="Caráter da internação" required>
                      <Select value={aihCaraterEntry} onValueChange={setAihCaraterEntry}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Eletivo", "Urgência"].map((o) => (
                            <SelectItem key={o} value={o}>{o}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Motivo da internação" required>
                      <Input
                        value={aihMotivo}
                        onChange={(e) => setAihMotivo(e.target.value)}
                        placeholder="Descreva brevemente"
                      />
                    </Field>
                  </Grid>
                </Section>
              )}

              {/* Paciente */}
              <Section
                icon={<User className="h-4 w-4" />}
                title="Beneficiário / Paciente"
                description="Identificação do paciente na operadora."
              >
                <Grid cols={2}>
                  <Field label="Nome do beneficiário" required>
                    <Input
                      value={pacienteNome}
                      onChange={(e) => setPacienteNome(e.target.value)}
                      placeholder="Nome completo"
                    />
                  </Field>
                  <Field label="Nº da carteira / Código na operadora" required>
                    <Input
                      value={pacienteCarteira}
                      onChange={(e) => setPacienteCarteira(e.target.value)}
                      placeholder="0000 0000 0000 0000"
                    />
                  </Field>
                  <Field label="CPF">
                    <Input
                      value={pacienteCpf}
                      onChange={(e) => setPacienteCpf(e.target.value)}
                      placeholder="000.000.000-00"
                    />
                  </Field>
                  <Field label="Data de nascimento">
                    <Input
                      type="date"
                      value={pacienteNascimento}
                      onChange={(e) => setPacienteNascimento(e.target.value)}
                    />
                  </Field>
                  <Field label="Sexo">
                    <Select value={pacienteSexo} onValueChange={setPacienteSexo}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
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
                    <Input
                      value={medicoNome}
                      onChange={(e) => setMedicoNome(e.target.value)}
                    />
                  </Field>
                  <Field label="Conselho / Nº" required>
                    <Input
                      value={medicoCrm}
                      onChange={(e) => setMedicoCrm(e.target.value)}
                      placeholder="CRM 0000/UF"
                    />
                  </Field>
                  <Field label="Especialidade">
                    <Input
                      value={medicoEspecialidade}
                      onChange={(e) => setMedicoEspecialidade(e.target.value)}
                      placeholder="Cardiologia, Ortopedia..."
                    />
                  </Field>
                </Grid>
              </Section>

              {/* Clínico */}
              <Section
                icon={<FileText className="h-4 w-4" />}
                title="Dados clínicos"
                description="Hipótese diagnóstica e justificativa técnica."
              >
                <Grid cols={2}>
                  <Field label="CID principal">
                    <Input
                      value={cidPrincipal}
                      onChange={(e) => setCidPrincipal(e.target.value)}
                      placeholder="Ex.: I10"
                    />
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
                          onChange={(e) =>
                            updateProcedure(p.id, { description: e.target.value })
                          }
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
                            updateProcedure(p.id, {
                              quantity: Math.max(1, Number(e.target.value) || 1),
                            })
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

              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 border rounded-md px-3 py-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Campos marcados com <span className="text-destructive">*</span> são
                  obrigatórios. A guia será validada antes da emissão.
                </span>
              </div>

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
          )}
        </div>
        <SiteFooter />
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
              <Row label="Convênio" value={convenio.label} />
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

      <Dialog open={prefsOpen} onOpenChange={setPrefsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Preferências do Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome do Prestador</Label>
              <Input
                value={prefPrestador}
                onChange={(e) => setPrefPrestador(e.target.value)}
                placeholder="Nome completo do prestador"
              />
              <p className="text-xs text-muted-foreground">Utilizado em todas as guias.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Matrícula / Conselho</Label>
              <Input
                value={prefMatricula}
                onChange={(e) => setPrefMatricula(e.target.value)}
                placeholder="CRM 0000/UF ou nº de matrícula"
              />
              <p className="text-xs text-muted-foreground">Utilizado como identificação do profissional.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Estabelecimento (Guia SUS)</Label>
              <Input
                value={prefEstabelecimento}
                onChange={(e) => setPrefEstabelecimento(e.target.value)}
                placeholder="Ex: Hospital Municipal, UBS Centro..."
              />
              <p className="text-xs text-muted-foreground">
                Preenche automaticamente o campo <span className="font-medium">Estabelecimento</span> nas guias SUS.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>UF</Label>
              <Select value={prefUf} onValueChange={setPrefUf}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map((uf) => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-md border border-primary/30 bg-primary/5 text-primary text-xs px-3 py-2 flex gap-2">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Estas preferências serão utilizadas para preencher automaticamente os campos
                nas guias, evitando retrabalho. Você pode editá-las a qualquer momento.
              </span>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setPrefsOpen(false)}>Fechar</Button>
            <Button onClick={savePrefs}>
              <Save className="h-4 w-4" />
              Salvar preferências
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
