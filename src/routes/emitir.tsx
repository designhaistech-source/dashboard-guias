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
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
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
import { SelectField } from "@/components/form-field";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/data-state";
import { Shield, Landmark, ArrowUp, Stethoscope as StethIcon, BedDouble, HeartPulse, Hospital, Check, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Combobox } from "@/components/ui/combobox";
import { CID_OPTIONS } from "@/lib/cid";
import convenioHumanasAsset from "@/assets/convenio-humanas-real.png.asset.json";
import convenioUnimedAsset from "@/assets/convenio-unimed-real.png.asset.json";
import convenioCaurnAsset from "@/assets/convenio-caurn-real.png.asset.json";
const convenioHumanasLogo = convenioHumanasAsset.url;
const convenioUnimedLogo = convenioUnimedAsset.url;
const convenioCaurnLogo = convenioCaurnAsset.url;

const OPERADORAS = [
  { value: "Humanas", label: "Humanas", logo: convenioHumanasLogo, ans: "357511" },
  { value: "Unimed", label: "Unimed Natal/RN", logo: convenioUnimedLogo, ans: "335592" },
  { value: "CAURN", label: "CAURN", logo: convenioCaurnLogo, ans: "31425-1" },
] as const;

interface Medico {
  id: string;
  nome: string;
  crm: string;
  especialidade: string;
}

const MEDICOS: Medico[] = [
  { id: "m1", nome: "Dra. Ana Beatriz Lima", crm: "CRM 1234/RN", especialidade: "Cardiologia" },
  { id: "m2", nome: "Dr. Carlos Eduardo Rocha", crm: "CRM 4521/RN", especialidade: "Ortopedia" },
  { id: "m3", nome: "Dra. Mariana Torres", crm: "CRM 7788/RN", especialidade: "Clínica médica" },
  { id: "m4", nome: "Dr. Rafael Nogueira", crm: "CRM 9012/PB", especialidade: "Neurologia" },
];



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

  const [medicoSelecionado, setMedicoSelecionado] = useState(MEDICOS[0].id);
  const [medicoNome, setMedicoNome] = useState(MEDICOS[0].nome);
  const [medicoCrm, setMedicoCrm] = useState(MEDICOS[0].crm);
  const [medicoEspecialidade, setMedicoEspecialidade] = useState(MEDICOS[0].especialidade);

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

  const [previewOpen, setPreviewOpen] = useState(false);
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
  const clearProcedures = () =>
    setProcedures([{ id: crypto.randomUUID(), code: "", description: "", quantity: 1 }]);

  // Drag & drop reorder
  const [dragId, setDragId] = useState<string | null>(null);
  const onDragStart = (id: string) => setDragId(id);
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return setDragId(null);
    setProcedures((list) => {
      const from = list.findIndex((x) => x.id === dragId);
      const to = list.findIndex((x) => x.id === targetId);
      if (from < 0 || to < 0) return list;
      const next = [...list];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDragId(null);
  };

  // Kits do usuário (persistidos)
  const [userKits, setUserKits] = useState<Kit[]>([]);
  const [kitsEditOpen, setKitsEditOpen] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("haisguias:kits");
      if (raw) setUserKits(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    localStorage.setItem("haisguias:kits", JSON.stringify(userKits));
  }, [userKits]);

  const [selectedUserKit, setSelectedUserKit] = useState<string>("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
  const [selectedSpecialtyKit, setSelectedSpecialtyKit] = useState<string>("");

  const specialties = useMemo(
    () => Array.from(new Set(SPECIALTY_KITS.map((k) => k.specialty!).filter(Boolean))),
    [],
  );
  const specialtyKitOptions = useMemo(
    () => SPECIALTY_KITS.filter((k) => k.specialty === selectedSpecialty),
    [selectedSpecialty],
  );

  const applyKit = (kit: Kit) => {
    setProcedures(
      kit.procedures.map((p) => ({ id: crypto.randomUUID(), ...p })),
    );
    toast.success(`Kit "${kit.name}" aplicado (${kit.procedures.length} procedimentos)`);
  };

  const saveAsKit = () => {
    const filled = procedures.filter((p) => p.code.trim() && p.description.trim());
    if (filled.length === 0) {
      toast.error("Preencha ao menos um procedimento para salvar como kit");
      return;
    }
    const name = window.prompt("Nome do kit:", "");
    if (!name?.trim()) return;
    const kit: Kit = {
      id: crypto.randomUUID(),
      name: name.trim(),
      procedures: filled.map(({ code, description, quantity }) => ({ code, description, quantity })),
    };
    setUserKits((k) => [...k, kit]);
    toast.success(`Kit "${kit.name}" salvo`);
  };

  // OPME
  const [opmeItems, setOpmeItems] = useState<OpmeItem[]>([]);
  const addOpme = () =>
    setOpmeItems((o) => [
      ...o,
      { id: crypto.randomUUID(), code: "", description: "", quantity: 1 },
    ]);
  const updateOpme = (id: string, patch: Partial<OpmeItem>) =>
    setOpmeItems((o) => o.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const removeOpme = (id: string) =>
    setOpmeItems((o) => o.filter((x) => x.id !== id));

  // Separar em guias
  const [splitInGuides, setSplitInGuides] = useState(false);
  const filledProceduresCount = procedures.filter((p) => p.code.trim() && p.description.trim()).length;


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
        <div className="w-full px-6 lg:px-10 py-8 space-y-6">
          <PageHeader
            title="Emitir Guias"
            description="Escolha entre guias de convênio (TISS) ou guias do SUS e selecione o tipo correspondente para começar."
            actions={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPrefsOpen(true)}
              >
                <Settings2 className="h-4 w-4" />
                Preferências
              </Button>
            }
          />


          {/* Hub: modo (TISS/SUS) via Tabs */}
          <Tabs
            value={convenioId}
            onValueChange={(v) => setConvenioId(v as ConvenioId)}
          >
            <TabsList className="w-full h-auto p-1 bg-muted border border-border shadow-inner grid grid-cols-2 gap-1 rounded-xl">
              {CONVENIOS.map((c) => {
                const Icon = c.id === "tiss" ? Shield : Landmark;
                return (
                  <TabsTrigger
                    key={c.id}
                    value={c.id}
                    className="flex items-center justify-center gap-2.5 py-3 px-6 rounded-lg text-muted-foreground font-medium transition-all hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:border data-[state=active]:border-border/60 data-[state=active]:shadow-sm"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm tracking-tight">{c.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>


            {CONVENIOS.map((c) => (
              <TabsContent key={c.id} value={c.id} className="mt-4 w-full">
                <section className="w-full rounded-xl border bg-card shadow-sm overflow-hidden">
                  <div className="px-5 sm:px-7 py-6">

                    <div className="mb-5">
                      <h2 className="text-lg font-semibold">Escolha o tipo de guia</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Selecione a modalidade de atendimento para prosseguir com o formulário.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {c.guides.map((g) => {
                        const active = c.id === convenioId && g.id === guideKind;
                        const Icon = g.icon;
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => setGuideKind(g.id)}
                            className={cn(
                              "group text-left p-4 rounded-xl border-2 transition-colors min-h-[168px] flex flex-col",
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
            <div>
            <form
              key={guideKind}
              onSubmit={handleSubmit}
              className="space-y-6 animate-fade-in"
            >

              {/* Cabeçalho integrado do formulário selecionado */}
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-primary rounded-full" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                    Formulário de emissão
                  </p>
                  <p className="text-sm font-semibold truncate">{guideHeaderTitle}</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
                  <Eye className="h-4 w-4" /> Pré-visualizar
                </Button>
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
                      <div className="space-y-2">
                        <Select value={operadora} onValueChange={(v) => { setOperadora(v); const op = OPERADORAS.find((o) => o.value === v); if (op) setRegistroAns(op.ans); }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o convênio" />
                          </SelectTrigger>
                          <SelectContent>
                            {OPERADORAS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {(() => {
                          const selected = OPERADORAS.find((o) => o.value === operadora);
                          if (!selected) return null;
                          return (
                            <div className="flex items-center gap-2 pt-1">
                              <img
                                src={selected.logo}
                                alt={`Logo ${selected.label}`}
                                width={64}
                                height={64}
                                loading="lazy"
                                className="h-10 w-auto object-contain"
                              />
                            </div>
                          );
                        })()}
                      </div>
                    </Field>
                    <Field label="Registro ANS">
                      <Input
                        value={registroAns}
                        onChange={(e) => setRegistroAns(e.target.value)}
                        placeholder="000000"
                      />
                    </Field>
                    <SelectField
                      label="Caráter do atendimento"
                      required
                      labelClassName="text-xs font-medium text-muted-foreground"
                      value={character}
                      onValueChange={setCharacter}
                      options={CHARACTER_OPTIONS.map((c) => ({ value: c, label: c }))}
                    />

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
                    <SelectField
                      label="Tipo de internação"
                      required
                      labelClassName="text-xs font-medium text-muted-foreground"
                      value={internacaoTipo}
                      onValueChange={setInternacaoTipo}
                      options={["Clínica", "Cirúrgica", "Obstétrica", "Pediátrica", "Psiquiátrica"].map((o) => ({ value: o, label: o }))}
                    />
                    <SelectField
                      label="Regime"
                      labelClassName="text-xs font-medium text-muted-foreground"
                      value={internacaoRegime}
                      onValueChange={setInternacaoRegime}
                      options={["Hospitalar", "Hospital-dia", "Domiciliar"].map((o) => ({ value: o, label: o }))}
                    />
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
                    <SelectField
                      label="Acomodação"
                      labelClassName="text-xs font-medium text-muted-foreground"
                      value={internacaoAcomodacao}
                      onValueChange={setInternacaoAcomodacao}
                      options={["Enfermaria", "Apartamento", "UTI"].map((o) => ({ value: o, label: o }))}
                    />

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
                    <SelectField
                      label="Tipo de APAC"
                      required
                      labelClassName="text-xs font-medium text-muted-foreground"
                      value={apacTipo}
                      onValueChange={setApacTipo}
                      options={["Inicial", "Continuidade", "Única"].map((o) => ({ value: o, label: o }))}
                    />

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
                    <SelectField
                      label="Caráter da internação"
                      required
                      labelClassName="text-xs font-medium text-muted-foreground"
                      value={aihCaraterEntry}
                      onValueChange={setAihCaraterEntry}
                      options={["Eletivo", "Urgência"].map((o) => ({ value: o, label: o }))}
                    />

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
                  <SelectField
                    label="Sexo"
                    labelClassName="text-xs font-medium text-muted-foreground"
                    value={pacienteSexo}
                    onValueChange={setPacienteSexo}
                    options={[
                      { value: "F", label: "Feminino" },
                      { value: "M", label: "Masculino" },
                      { value: "O", label: "Outro" },
                    ]}
                  />

                </Grid>
              </Section>

              {/* Solicitante */}
              <Section
                icon={<Stethoscope className="h-4 w-4" />}
                title="Profissional solicitante"
                description="Médico responsável pela emissão."
              >
                <Grid cols={2}>
                  <SelectField
                    label="Selecionar profissional"
                    placeholder="Escolha o médico"
                    value={medicoSelecionado}
                    onValueChange={(v) => {
                      setMedicoSelecionado(v);
                      const m = MEDICOS.find((x) => x.id === v);
                      if (m) {
                        setMedicoNome(m.nome);
                        setMedicoCrm(m.crm);
                        setMedicoEspecialidade(m.especialidade);
                      } else {
                        setMedicoNome("");
                        setMedicoCrm("");
                        setMedicoEspecialidade("");
                      }
                    }}
                    options={[
                      ...MEDICOS.map((m) => ({ value: m.id, label: `${m.nome} — ${m.crm}` })),
                      { value: "outro", label: "Outro (informar manualmente)" },
                    ]}
                    hint="Troque o médico responsável a qualquer momento."
                  />
                  <Field label="Nome do profissional" required>
                    <Input
                      value={medicoNome}
                      onChange={(e) => {
                        setMedicoNome(e.target.value);
                        setMedicoSelecionado("outro");
                      }}
                    />
                  </Field>
                  <Field label="Conselho / Nº" required>
                    <Input
                      value={medicoCrm}
                      onChange={(e) => {
                        setMedicoCrm(e.target.value);
                        setMedicoSelecionado("outro");
                      }}
                      placeholder="CRM 0000/UF"
                    />
                  </Field>
                  <Field label="Especialidade">
                    <Input
                      value={medicoEspecialidade}
                      onChange={(e) => {
                        setMedicoEspecialidade(e.target.value);
                        setMedicoSelecionado("outro");
                      }}
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
                    <Combobox
                      value={cidPrincipal}
                      onChange={setCidPrincipal}
                      options={CID_OPTIONS}
                      placeholder="Buscar CID-10 (ex.: I10)"
                      searchPlaceholder="Digite o código ou a descrição..."
                      emptyMessage="Nenhum CID encontrado."
                      clearable
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

              {/* Kits */}
              <Section
                icon={<Package className="h-4 w-4" />}
                title="Kits"
                description="Aplique um conjunto de procedimentos salvo ou por especialidade."
                action={
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setKitsEditOpen(true)}
                  >
                    <Pencil className="h-4 w-4" /> Editar kits
                  </Button>
                }
              >
                <SelectField
                  label="Kits do usuário"
                  labelClassName="text-xs font-medium text-muted-foreground"
                  value={selectedUserKit}
                  onValueChange={(v) => {
                    setSelectedUserKit(v);
                    const kit = userKits.find((k) => k.id === v);
                    if (kit) applyKit(kit);
                  }}
                  placeholder={
                    userKits.length === 0
                      ? "Nenhum kit cadastrado"
                      : "Selecione um kit salvo"
                  }
                  options={userKits.map((k) => ({
                    value: k.id,
                    label: `${k.name} (${k.procedures.length})`,
                  }))}
                />

                <Grid cols={2}>
                  <SelectField
                    label="Kits por Especialidade Médica"
                    labelClassName="text-xs font-medium text-muted-foreground"
                    value={selectedSpecialty}
                    onValueChange={(v) => {
                      setSelectedSpecialty(v);
                      setSelectedSpecialtyKit("");
                    }}
                    placeholder="Selecione uma especialidade (CBO)"
                    options={specialties.map((s) => ({ value: s, label: s }))}
                  />
                  <SelectField
                    label="Procedimento"
                    labelClassName="text-xs font-medium text-muted-foreground"
                    value={selectedSpecialtyKit}
                    onValueChange={(v) => {
                      setSelectedSpecialtyKit(v);
                      const kit = specialtyKitOptions.find((k) => k.id === v);
                      if (kit) applyKit(kit);
                    }}
                    disabled={!selectedSpecialty}
                    placeholder={
                      selectedSpecialty
                        ? "Selecione um kit"
                        : "Escolha a especialidade primeiro"
                    }
                    options={specialtyKitOptions.map((k) => ({ value: k.id, label: k.name }))}
                  />

                </Grid>
              </Section>

              {/* Procedimentos */}
              <Section
                icon={<ClipboardList className="h-4 w-4" />}
                title={
                  <span className="flex items-center gap-2">
                    Procedimentos solicitados
                    {guideKind && (
                      <span className="text-destructive font-semibold text-sm">
                        - {GUIDE_SHORT[guideKind]}
                      </span>
                    )}
                  </span>
                }
                description="Arraste para reordenar. Adicione um ou mais procedimentos (TUSS)."
                action={
                  <div className="flex items-center gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={clearProcedures}>
                      Limpar
                    </Button>
                    <Button type="button" size="sm" onClick={addProcedure}>
                      <Plus className="h-4 w-4" /> Adicionar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={saveAsKit}
                      className="bg-success text-success-foreground hover:bg-success/90"
                    >
                      <Plus className="h-4 w-4" /> Salvar como kit
                    </Button>
                  </div>
                }
              >
                <div className="space-y-2">
                  {procedures.map((p, idx) => (
                    <div
                      key={p.id}
                      draggable
                      onDragStart={() => onDragStart(p.id)}
                      onDragOver={onDragOver}
                      onDrop={() => onDrop(p.id)}
                      className={cn(
                        "grid grid-cols-12 gap-2 items-end rounded-md",
                        dragId === p.id && "opacity-50",
                      )}
                    >
                      <div className="col-span-1 flex items-center justify-center pb-2 cursor-grab active:cursor-grabbing text-muted-foreground">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <div className="col-span-2">
                        <Input
                          value={p.code}
                          onChange={(e) => updateProcedure(p.id, { code: e.target.value })}
                          placeholder="Código"
                        />
                      </div>
                      <div className="col-span-7">
                        <Input
                          value={p.description}
                          onChange={(e) =>
                            updateProcedure(p.id, { description: e.target.value })
                          }
                          placeholder="Descrição do procedimento"
                        />
                      </div>
                      <div className="col-span-1">
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

                {filledProceduresCount > 1 && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t">
                    <Checkbox
                      id="split-guides"
                      checked={splitInGuides}
                      onCheckedChange={(c) => setSplitInGuides(!!c)}
                    />
                    <Label htmlFor="split-guides" className="text-sm cursor-pointer">
                      Solicitar os exames em {filledProceduresCount} guias separadas
                    </Label>
                  </div>
                )}
              </Section>

              {/* OPME */}
              <Section
                icon={<Wrench className="h-4 w-4" />}
                title="OPME — Órteses, Próteses e Materiais Especiais"
                description="Adicione materiais/próteses solicitados (opcional)."
                action={
                  <Button type="button" size="sm" onClick={addOpme}>
                    <Plus className="h-4 w-4" /> Adicionar OPME
                  </Button>
                }
              >
                {opmeItems.length === 0 ? (
                  <EmptyState
                    size="sm"
                    title="Nenhum item OPME"
                    description="Adicione materiais, órteses ou próteses solicitados."
                    icon={<Package className="h-8 w-8" />}
                  />
                ) : (
                  <div className="space-y-2">
                    {opmeItems.map((o) => (
                      <div key={o.id} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-3">
                          <Input
                            value={o.code}
                            onChange={(e) => updateOpme(o.id, { code: e.target.value })}
                            placeholder="Código"
                          />
                        </div>
                        <div className="col-span-7">
                          <Input
                            value={o.description}
                            onChange={(e) =>
                              updateOpme(o.id, { description: e.target.value })
                            }
                            placeholder="Descrição do material/prótese"
                          />
                        </div>
                        <div className="col-span-1">
                          <Input
                            type="number"
                            min={1}
                            value={o.quantity}
                            onChange={(e) =>
                              updateOpme(o.id, {
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
                            onClick={() => removeOpme(o.id)}
                            aria-label="Remover OPME"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              {/* Assinatura */}
              <Section
                icon={<User className="h-4 w-4" />}
                title="Assinatura do Solicitante"
                description="Nome do profissional responsável pela emissão."
              >
                <Input
                  value={medicoNome}
                  readOnly
                  className="bg-muted/40 font-medium"
                />
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
            </div>
          )}

        </div>
        <SiteFooter />
      </main>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[1200px] w-[95vw] max-h-[95vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" /> Pré-visualização da guia
            </DialogTitle>
          </DialogHeader>
          {guideKind && (
            <GuiaLivePreview
              numeroGuia={numeroGuia}
              guideKind={guideKind}
              guideLabel={guideLabel}
              guideHeaderTitle={guideHeaderTitle}
              convenioId={convenioId}
              operadora={operadora}
              operadoraLogo={OPERADORAS.find((o) => o.value === operadora)?.logo}
              registroAns={registroAns}
              character={character}
              dataSolicitacao={dataSolicitacao}
              susEstabelecimento={susEstabelecimento}
              susCnes={susCnes}
              pacienteNome={pacienteNome}
              pacienteCarteira={pacienteCarteira}
              pacienteCpf={pacienteCpf}
              pacienteNascimento={pacienteNascimento}
              pacienteSexo={pacienteSexo}
              medicoNome={medicoNome}
              medicoCrm={medicoCrm}
              medicoEspecialidade={medicoEspecialidade}
              cidPrincipal={cidPrincipal}
              indicacaoClinica={indicacaoClinica}
              observacoes={observacoes}
              procedures={procedures}
              opmeItems={opmeItems}
              internacaoTipo={internacaoTipo}
              internacaoRegime={internacaoRegime}
              internacaoDias={internacaoDias}
              internacaoAcomodacao={internacaoAcomodacao}
              apacCompetencia={apacCompetencia}
              apacTipo={apacTipo}
              aihMotivo={aihMotivo}
              aihCaraterEntry={aihCaraterEntry}
              fullSize
            />
          )}
        </DialogContent>
      </Dialog>

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
            <SelectField
              label="UF"
              value={prefUf}
              onValueChange={setPrefUf}
              options={["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map((uf) => ({ value: uf, label: uf }))}
            />

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
  title: React.ReactNode;
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

// ---- Live preview of the guide being filled (modelo TISS SP/SADT) ----
function GuiaLivePreview(props: {
  numeroGuia: string;
  guideKind: GuideKind | null;
  guideLabel: string;
  guideHeaderTitle: string;
  convenioId: ConvenioId;
  operadora: string;
  operadoraLogo?: string;
  registroAns: string;
  character: string;
  dataSolicitacao: string;
  susEstabelecimento: string;
  susCnes: string;
  pacienteNome: string;
  pacienteCarteira: string;
  pacienteCpf: string;
  pacienteNascimento: string;
  pacienteSexo: string;
  medicoNome: string;
  medicoCrm: string;
  medicoEspecialidade: string;
  cidPrincipal: string;
  indicacaoClinica: string;
  observacoes: string;
  procedures: Procedure[];
  opmeItems: OpmeItem[];
  internacaoTipo: string;
  internacaoRegime: string;
  internacaoDias: number;
  internacaoAcomodacao: string;
  apacCompetencia: string;
  apacTipo: string;
  aihMotivo: string;
  aihCaraterEntry: string;
  fullSize?: boolean;
}) {
  const {
    numeroGuia, operadora, operadoraLogo,
    registroAns, character, dataSolicitacao,
    pacienteNome, pacienteCarteira, pacienteCpf,
    medicoNome, medicoCrm, medicoEspecialidade, cidPrincipal, indicacaoClinica,
    observacoes, procedures, opmeItems,
  } = props;

  const dd = (iso: string) => {
    const f = fmtDate(iso);
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(f);
    return m ? { d: m[1], m: m[2], y: m[3] } : { d: "", m: "", y: "" };
  };

  const dataSol = dd(dataSolicitacao);
  const rows = Array.from({ length: 5 }, (_, i) => procedures[i]);
  const execRows = rows;
  const profRows = Array.from({ length: 4 }, () => null);

  const fullSize = props.fullSize;

  return (
    <div className={fullSize ? "" : "rounded-xl border bg-card shadow-sm overflow-hidden"}>
      {!fullSize && (
        <div className="px-4 py-2.5 border-b bg-muted/40 flex items-center justify-between">
          <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            Pré-visualização · Modelo TISS SP/SADT
          </p>
          <span className="text-[10px] text-muted-foreground">Atualiza em tempo real</span>
        </div>
      )}

      <div className={fullSize ? "bg-muted p-4 overflow-auto" : "bg-muted p-2 overflow-hidden"}>
        <div
          className="origin-top-left"
          style={
            fullSize
              ? { width: 1100 }
              : { transform: "scale(0.4)", width: 1100, height: 820, transformOrigin: "top left" }
          }
        >

          <div className="w-[1100px] bg-surface text-foreground font-sans text-[9px] leading-tight border border-foreground">
            {/* Header */}
            <div className="grid grid-cols-[140px_1fr_260px] border-b border-foreground">
              <div className="flex items-center justify-center border-r border-foreground px-2 py-2">
                {operadoraLogo ? (
                  <img src={operadoraLogo} alt={operadora} className="max-h-10 max-w-[120px] object-contain" />
                ) : (
                  <span className="text-[9px] text-muted-foreground italic">Logo da Empresa</span>
                )}
              </div>
              <div className="flex items-center justify-center px-2 py-2 text-center">
                <div className="font-bold text-[13px] uppercase leading-tight">
                  Guia de Serviço Profissional / Serviço Auxiliar de<br />Diagnóstico e Terapia — SP/SADT
                </div>
              </div>
              <div className="border-l border-foreground px-2 py-1 flex flex-col justify-center">
                <div className="text-[8px] font-bold">2 - Nº Guia no Prestador</div>
                <div className="font-mono font-bold text-[11px] mt-0.5">{numeroGuia !== "—" ? numeroGuia : "\u00A0"}</div>
              </div>
            </div>

            <FieldRow>
              <FieldBox n="1" label="Registro ANS" value={registroAns} width={140} />
              <FieldBox n="3" label="Número da Guia Principal" value="" grow />
            </FieldRow>

            <FieldRow>
              <FieldBoxDate n="4" label="Data da Autorização" d="" m="" y="" width={170} />
              <FieldBox n="5" label="Senha" value="" grow />
              <FieldBoxDate n="6" label="Data de Validade da Senha" d="" m="" y="" width={190} />
              <FieldBox n="7" label="Nº Guia Atribuído pela Operadora" value="" width={280} />
            </FieldRow>

            <SectionBar>Dados do Beneficiário</SectionBar>
            <FieldRow>
              <FieldBox n="8" label="Número da Carteira" value={pacienteCarteira} width={230} />
              <FieldBoxDate n="9" label="Validade da Carteira" d="" m="" y="" width={170} />
              <FieldBox n="10" label="Nome" value={pacienteNome} grow />
              <FieldBox n="11" label="Cartão Nacional de Saúde" value={pacienteCpf} width={200} />
              <FieldBox n="12" label="Atend. RN" value="" width={90} />
            </FieldRow>

            <SectionBar>Dados do Solicitante</SectionBar>
            <FieldRow>
              <FieldBox n="13" label="Código na Operadora" value="" width={190} />
              <FieldBox n="14" label="Nome do Contratado" value={operadora} grow />
            </FieldRow>
            <FieldRow>
              <FieldBox n="15" label="Nome do Profissional Solicitante" value={medicoNome} grow />
              <FieldBox n="16" label="Conselho" value={medicoCrm ? "CRM" : ""} width={90} />
              <FieldBox n="17" label="Nº Conselho" value={medicoCrm} width={140} />
              <FieldBox n="18" label="UF" value="" width={50} />
              <FieldBox n="19" label="Cód CBO" value={medicoEspecialidade} width={140} />
              <FieldBox n="20" label="Assinatura Solicitante" value="" width={220} />
            </FieldRow>

            <SectionBar>Dados da Solicitação / Procedimentos ou Itens Assistenciais Solicitados</SectionBar>
            <FieldRow>
              <FieldBox n="21" label="Caráter" value={character} width={140} />
              <FieldBoxDate n="22" label="Data da Solicitação" d={dataSol.d} m={dataSol.m} y={dataSol.y} width={180} />
              <FieldBox n="23" label="Indicação Clínica" value={`${cidPrincipal ? cidPrincipal + " · " : ""}${indicacaoClinica}`} grow />
            </FieldRow>

            <div className="border-b border-foreground">
              <div className="grid grid-cols-[38px_60px_140px_1fr_60px_60px] text-[8px] font-bold border-b border-foreground bg-surface-subtle">
                <div className="px-1 py-0.5 border-r border-foreground">&nbsp;</div>
                <div className="px-1 py-0.5 border-r border-foreground">24-Tab</div>
                <div className="px-1 py-0.5 border-r border-foreground">25-Código</div>
                <div className="px-1 py-0.5 border-r border-foreground">26-Descrição</div>
                <div className="px-1 py-0.5 border-r border-foreground text-center">27-Qtd.Sol</div>
                <div className="px-1 py-0.5 text-center">28-Qtd.Aut</div>
              </div>
              {rows.map((p, i) => (
                <div key={i} className="grid grid-cols-[38px_60px_140px_1fr_60px_60px] text-[10px] border-b last:border-b-0 border-border min-h-[16px]">
                  <div className="px-1 py-0.5 border-r border-border font-mono">{i + 1} -</div>
                  <div className="px-1 py-0.5 border-r border-border font-mono">{p ? "22" : ""}</div>
                  <div className="px-1 py-0.5 border-r border-border font-mono">{p?.code ?? ""}</div>
                  <div className="px-1 py-0.5 border-r border-border truncate">{p?.description ?? ""}</div>
                  <div className="px-1 py-0.5 border-r border-border text-center font-mono">{p?.quantity ?? ""}</div>
                  <div className="px-1 py-0.5 text-center font-mono">{p?.quantity ?? ""}</div>
                </div>
              ))}
            </div>

            <SectionBar>Dados do Contratado Executante</SectionBar>
            <FieldRow>
              <FieldBox n="29" label="Código na Operadora" value="" width={190} />
              <FieldBox n="30" label="Nome do Contratado" value={operadora} grow />
              <FieldBox n="31" label="Código CNES" value="" width={160} />
            </FieldRow>

            <SectionBar>Dados do Atendimento</SectionBar>
            <FieldRow>
              <FieldBox n="32" label="Tipo de Atendimento" value="" width={160} />
              <FieldBox n="33" label="Indicação de Acidente" value="" width={200} />
              <FieldBox n="34" label="Tipo de Consulta" value="" width={140} />
              <FieldBox n="35" label="Motivo de Encerramento" value="" grow />
            </FieldRow>

            <SectionBar>Dados da Execução / Procedimentos e Exames Realizados</SectionBar>
            <div className="border-b border-foreground">
              <div className="grid grid-cols-[24px_80px_100px_50px_70px_1fr_40px_40px_40px_60px_70px_70px] text-[8px] font-bold border-b border-foreground bg-surface-subtle">
                <div className="px-1 py-0.5 border-r border-foreground">&nbsp;</div>
                <div className="px-1 py-0.5 border-r border-foreground">36-Data</div>
                <div className="px-1 py-0.5 border-r border-foreground">37/38-Hora</div>
                <div className="px-1 py-0.5 border-r border-foreground text-center">39-Tab</div>
                <div className="px-1 py-0.5 border-r border-foreground">40-Código</div>
                <div className="px-1 py-0.5 border-r border-foreground">41-Descrição</div>
                <div className="px-1 py-0.5 border-r border-foreground text-center">42-Qtd</div>
                <div className="px-1 py-0.5 border-r border-foreground text-center">43-Via</div>
                <div className="px-1 py-0.5 border-r border-foreground text-center">44-Tec</div>
                <div className="px-1 py-0.5 border-r border-foreground text-center">45-Red/Acr</div>
                <div className="px-1 py-0.5 border-r border-foreground text-center">46-Vl Unit</div>
                <div className="px-1 py-0.5 text-center">47-Vl Total</div>
              </div>
              {execRows.map((p, i) => (
                <div key={i} className="grid grid-cols-[24px_80px_100px_50px_70px_1fr_40px_40px_40px_60px_70px_70px] text-[10px] border-b last:border-b-0 border-border min-h-[16px]">
                  <div className="px-1 py-0.5 border-r border-border font-mono">{i + 1}-</div>
                  <div className="px-1 py-0.5 border-r border-border font-mono">{p ? fmtDate(dataSolicitacao) : ""}</div>
                  <div className="px-1 py-0.5 border-r border-border"></div>
                  <div className="px-1 py-0.5 border-r border-border text-center font-mono">{p ? "22" : ""}</div>
                  <div className="px-1 py-0.5 border-r border-border font-mono truncate">{p?.code ?? ""}</div>
                  <div className="px-1 py-0.5 border-r border-border truncate">{p?.description ?? ""}</div>
                  <div className="px-1 py-0.5 border-r border-border text-center font-mono">{p?.quantity ?? ""}</div>
                  <div className="px-1 py-0.5 border-r border-border"></div>
                  <div className="px-1 py-0.5 border-r border-border"></div>
                  <div className="px-1 py-0.5 border-r border-border"></div>
                  <div className="px-1 py-0.5 border-r border-border"></div>
                  <div className="px-1 py-0.5"></div>
                </div>
              ))}
            </div>

            <SectionBar>Identificação do(s) Profissional(is) Executante(s)</SectionBar>
            <div className="border-b border-foreground">
              <div className="grid grid-cols-[50px_60px_110px_1fr_90px_90px_40px_80px] text-[8px] font-bold border-b border-foreground bg-surface-subtle">
                <div className="px-1 py-0.5 border-r border-foreground">48-Seq</div>
                <div className="px-1 py-0.5 border-r border-foreground">49-Grau</div>
                <div className="px-1 py-0.5 border-r border-foreground">50-Cód/CPF</div>
                <div className="px-1 py-0.5 border-r border-foreground">51-Nome</div>
                <div className="px-1 py-0.5 border-r border-foreground">52-Conselho</div>
                <div className="px-1 py-0.5 border-r border-foreground">53-Nº</div>
                <div className="px-1 py-0.5 border-r border-foreground">54-UF</div>
                <div className="px-1 py-0.5">55-CBO</div>
              </div>
              {profRows.map((_, i) => (
                <div key={i} className="grid grid-cols-[50px_60px_110px_1fr_90px_90px_40px_80px] text-[10px] border-b last:border-b-0 border-border min-h-[16px]">
                  <div className="px-1 py-0.5 border-r border-border"></div>
                  <div className="px-1 py-0.5 border-r border-border"></div>
                  <div className="px-1 py-0.5 border-r border-border"></div>
                  <div className="px-1 py-0.5 border-r border-border truncate">{i === 0 ? medicoNome : ""}</div>
                  <div className="px-1 py-0.5 border-r border-border">{i === 0 && medicoCrm ? "CRM" : ""}</div>
                  <div className="px-1 py-0.5 border-r border-border font-mono">{i === 0 ? medicoCrm : ""}</div>
                  <div className="px-1 py-0.5 border-r border-border"></div>
                  <div className="px-1 py-0.5"></div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-[1fr_260px] border-b border-foreground">
              <div className="border-r border-foreground">
                <div className="px-1 py-0.5 text-[8px] font-bold bg-surface-subtle border-b border-border">
                  56 - Data de Realização de Procedimentos em Série
                </div>
                <div className="px-1 py-1 grid grid-cols-5 gap-1 text-[9px] font-mono">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i}>{i + 1}- __/__/____</div>
                  ))}
                </div>
              </div>
              <div>
                <div className="px-1 py-0.5 text-[8px] font-bold bg-surface-subtle border-b border-border">
                  57 - Assinatura do Beneficiário
                </div>
                <div className="h-10"></div>
              </div>
            </div>

            <div className="border-b border-foreground">
              <div className="px-1 py-0.5 text-[8px] font-bold bg-secondary">58 - Observação / Justificativa</div>
              <div className="px-1 py-1 min-h-[24px] text-[10px] whitespace-pre-wrap">{observacoes}</div>
            </div>

            <div className="grid grid-cols-7 border-b border-foreground text-[9px]">
              {[
                ["59", "Total Procedimentos"],
                ["60", "Total Taxas/Aluguéis"],
                ["61", "Total Materiais"],
                ["62", "Total OPME"],
                ["63", "Total Medicamentos"],
                ["64", "Total Gases Med."],
                ["65", "Total Geral (R$)"],
              ].map(([n, l]) => (
                <div key={n} className="border-r last:border-r-0 border-border-strong px-1 py-0.5">
                  <div className="text-[8px] font-bold">{n} - {l}</div>
                  <div className="font-mono text-right min-h-[12px]">{opmeItems.length > 0 && n === "62" ? "" : ""}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 text-[9px]">
              {[
                "66 - Assinatura Responsável pela Autorização",
                "67 - Assinatura Beneficiário",
                "68 - Assinatura do Contratado",
              ].map((l) => (
                <div key={l} className="border-r last:border-r-0 border-border-strong px-1 py-1">
                  <div className="text-[8px] font-bold">{l}</div>
                  <div className="h-8"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 py-0.5 bg-secondary border-y border-foreground text-[9px] font-bold">
      {children}
    </div>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="flex border-b border-foreground">{children}</div>;
}

function FieldBox({
  n,
  label,
  value,
  width,
  grow,
}: {
  n: string;
  label: string;
  value: string;
  width?: number;
  grow?: boolean;
}) {
  return (
    <div
      className="border-r last:border-r-0 border-foreground px-1 py-0.5"
      style={{ width: grow ? undefined : width, flex: grow ? 1 : undefined, minWidth: 0 }}
    >
      <div className="text-[8px] font-bold">{n} - {label}</div>
      <div className="text-[10px] font-mono truncate min-h-[12px]">{value}</div>
    </div>
  );
}

function FieldBoxDate({
  n,
  label,
  d,
  m,
  y,
  width,
}: {
  n: string;
  label: string;
  d: string;
  m: string;
  y: string;
  width?: number;
}) {
  return (
    <div className="border-r border-foreground px-1 py-0.5" style={{ width }}>
      <div className="text-[8px] font-bold">{n} - {label}</div>
      <div className="text-[10px] font-mono min-h-[12px]">{d || "__"}/{m || "__"}/{y || "____"}</div>
    </div>
  );
}

function fmtDate(iso: string) {
  if (!iso) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }
  if (/^\d{4}-\d{2}$/.test(iso)) {
    const [y, m] = iso.split("-");
    return `${m}/${y}`;
  }
  return iso;
}
