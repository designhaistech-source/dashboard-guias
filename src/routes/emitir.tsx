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
import { SectionCard as BaseSectionCard } from "@/components/section-card";
import { SavedIndicator } from "@/components/saved-indicator";
import { SignatureField } from "@/components/signature-field";
import { useDraftAutosave } from "@/hooks/use-draft-autosave";

import { FormActionBar } from "@/components/form-action-bar";

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
import { Field as FormField, SelectField } from "@/components/form-field";
import { AppModal } from "@/components/app-modal";
import {
  MANUAL_PROFESSIONAL_ID,
  ProfessionalPicker,
  councilLabel,
  defaultProfessionalValue,
  isProfessionalValid,
  parseCouncil,
  validateProfessional,
  type ProfessionalValue,
} from "@/features/professional";


import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
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
import { TUSS, TUSS_OPTIONS } from "@/lib/tuss";
import convenioHumanasAsset from "@/assets/convenio-humanas-real.png.asset.json";
import convenioUnimedAsset from "@/assets/convenio-unimed-real.png.asset.json";
import convenioCaurnAsset from "@/assets/convenio-caurn-real.png.asset.json";
import { z } from "zod";
import { AlertCircle } from "lucide-react";


const convenioHumanasLogo = convenioHumanasAsset.url;
const convenioUnimedLogo = convenioUnimedAsset.url;
const convenioCaurnLogo = convenioCaurnAsset.url;


const UF_LIST = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB",
  "PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
] as const;

/**
 * Validação das preferências do prestador. O padrão de matrícula aceita
 * "CRM 123456/RN" (conselho + UF) ou uma matrícula numérica do SUS.
 */
const prefsSchema = z.object({
  prestador: z
    .string()
    .trim()
    .min(3, { message: "Informe o nome completo (mínimo de 3 caracteres)." })
    .max(120, { message: "O nome deve ter no máximo 120 caracteres." })
    .regex(/^[\p{L}\p{M}\s.'-]+$/u, { message: "Use apenas letras, espaços, apóstrofos e hífens." }),
  matricula: z
    .string()
    .trim()
    .min(1, { message: "Informe a matrícula ou o registro no conselho." })
    .max(40, { message: "A matrícula deve ter no máximo 40 caracteres." })
    .refine(
      (value) =>
        /^[A-Za-zÀ-ÿ]{2,6}\s?\d{2,10}\s?\/\s?[A-Za-z]{2}$/.test(value) || /^\d{4,15}$/.test(value),
      { message: "Use o formato CRM 123456/RN ou apenas números da matrícula." },
    ),
  estabelecimento: z
    .string()
    .trim()
    .max(120, { message: "O estabelecimento deve ter no máximo 120 caracteres." }),
  uf: z.enum(UF_LIST, { message: "Selecione uma UF válida." }),
});

type PrefsValues = z.infer<typeof prefsSchema>;
type PrefField = keyof PrefsValues;
const PREF_FIELD_ORDER: PrefField[] = ["prestador", "matricula", "estabelecimento", "uf"];

const OPERADORAS = [

  { value: "Humanas", label: "Humanas", logo: convenioHumanasLogo, ans: "357511" },
  { value: "Unimed", label: "Unimed Natal/RN", logo: convenioUnimedLogo, ans: "335592" },
  { value: "CAURN", label: "CAURN", logo: convenioCaurnLogo, ans: "31425-1" },
] as const;




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

  // Campos TISS de autorização/senha (3 a 7)
  const [guiaPrincipal, setGuiaPrincipal] = useState("");
  const [dataAutorizacao, setDataAutorizacao] = useState("");
  const [senha, setSenha] = useState("");
  const [validadeSenha, setValidadeSenha] = useState("");
  const [guiaOperadora, setGuiaOperadora] = useState("");

  // Solicitante (13, 14, 18, 19)
  const [codigoSolicitante, setCodigoSolicitante] = useState("");
  const [contratadoSolicitante, setContratadoSolicitante] = useState("");
  const [conselhoUf, setConselhoUf] = useState("RN");
  const [codigoCbo, setCodigoCbo] = useState("");
  const [assinaturaSolicitante, setAssinaturaSolicitante] = useState("");

  // Contratado executante (29, 30, 31)
  const [codigoExecutante, setCodigoExecutante] = useState("");
  const [contratadoExecutante, setContratadoExecutante] = useState("");
  const [cnesExecutante, setCnesExecutante] = useState("");

  // Dados do atendimento (32 a 35)
  const [tipoAtendimento, setTipoAtendimento] = useState("");
  const [indicacaoAcidente, setIndicacaoAcidente] = useState("");
  const [tipoConsulta, setTipoConsulta] = useState("");
  const [motivoEncerramento, setMotivoEncerramento] = useState("");


  // nº da guia — gerado somente no cliente para evitar hydration mismatch
  const [numeroGuia, setNumeroGuia] = useState<string>("—");
  useEffect(() => {
    setNumeroGuia(`G-${Math.floor(Math.random() * 900000 + 100000)}`);
  }, []);

  // Profissional solicitante (UI compartilhada em Emitir guia e Solicitar OPME)
  const [profissional, setProfissional] = useState<ProfessionalValue>(
    defaultProfessionalValue,
  );
  const medicoNome = profissional.nome;
  const medicoCrm = councilLabel(profissional);
  const medicoEspecialidade = profissional.especialidade;
  /** Campos 15, 16 e 17 precisam estar válidos antes de imprimir ou gerar o PDF. */
  const profissionalErrors = validateProfessional(profissional);
  const profissionalValido = isProfessionalValid(profissional);


  /** Preferências salvas sobrescrevem o profissional como preenchimento manual. */
  const applyPrefsToProfissional = (prestador?: string, matricula?: string) => {
    setProfissional((prev) => ({
      ...prev,
      id: MANUAL_PROFESSIONAL_ID,
      nome: prestador?.trim() ? prestador : prev.nome,
      ...(matricula?.trim() ? parseCouncil(matricula) : {}),
    }));
  };

  // Preferências do usuário (persistidas em localStorage)

  const [prefsOpen, setPrefsOpen] = useState(false);
  const [prefPrestador, setPrefPrestador] = useState("");
  const [prefMatricula, setPrefMatricula] = useState("");
  const [prefEstabelecimento, setPrefEstabelecimento] = useState("");
  const [prefUf, setPrefUf] = useState("RN");
  const [prefErrors, setPrefErrors] = useState<Partial<Record<PrefField, string>>>({});

  /** Campos dos dados padrão selecionados para aplicar nesta guia. */
  const [prefSelection, setPrefSelection] = useState<Record<PrefField, boolean>>({
    prestador: true,
    matricula: true,
    estabelecimento: true,
    uf: true,
  });
  /** Estado da revisão: aguardando decisão, aplicado ou dispensado. */
  const [prefsStatus, setPrefsStatus] = useState<"none" | "review" | "applied" | "dismissed">(
    "none",
  );
  /** Snapshot dos campos da guia antes de aplicar (permite desfazer). */
  const [prefsUndo, setPrefsUndo] = useState<
    | {
        profissional: ProfessionalValue;
        estabelecimento: string;
        uf: string;
      }
    | null
  >(null);

  /** Só oferece revisão quando existe algum dado padrão preenchido. */
  const prefsFilled: PrefField[] = [
    prefPrestador.trim() && ("prestador" as PrefField),
    prefMatricula.trim() && ("matricula" as PrefField),
    prefEstabelecimento.trim() && ("estabelecimento" as PrefField),
    prefUf.trim() && ("uf" as PrefField),
  ].filter(Boolean) as PrefField[];

  const prefValue = (field: PrefField) =>
    field === "prestador"
      ? prefPrestador
      : field === "matricula"
        ? prefMatricula
        : field === "estabelecimento"
          ? prefEstabelecimento
          : prefUf;

  const PREF_LABELS: Record<PrefField, string> = {
    prestador: "Nome do profissional (campo 15)",
    matricula: "Conselho e registro (campos 16/17)",
    estabelecimento: "Estabelecimento (guia SUS)",
    uf: "UF do conselho (campo 18)",
  };

  const selectedPrefFields = prefsFilled.filter((f) => prefSelection[f]);

  const togglePrefField = (field: PrefField) =>
    setPrefSelection((prev) => ({ ...prev, [field]: !prev[field] }));

  /** Aplica somente os campos revisados e marcados pelo usuário. */
  const applySelectedPrefs = () => {
    if (selectedPrefFields.length === 0) return;
    setPrefsUndo({
      profissional,
      estabelecimento: susEstabelecimento,
      uf: conselhoUf,
    });
    if (prefSelection.prestador || prefSelection.matricula) {
      applyPrefsToProfissional(
        prefSelection.prestador ? prefPrestador : undefined,
        prefSelection.matricula ? prefMatricula : undefined,
      );
    }
    if (prefSelection.estabelecimento && prefEstabelecimento.trim()) {
      setSusEstabelecimento(prefEstabelecimento);
    }
    if (prefSelection.uf && prefUf.trim()) setConselhoUf(prefUf);
    setPrefsStatus("applied");
    toast.success(
      `${selectedPrefFields.length} ${selectedPrefFields.length === 1 ? "campo aplicado" : "campos aplicados"} a esta guia`,
    );
  };

  /** Restaura os valores que a guia tinha antes da aplicação. */
  const undoPrefs = () => {
    if (!prefsUndo) return;
    setProfissional(prefsUndo.profissional);
    setSusEstabelecimento(prefsUndo.estabelecimento);
    setConselhoUf(prefsUndo.uf);
    setPrefsUndo(null);
    setPrefsStatus("review");
    toast.success("Aplicação desfeita");
  };

  const clearPrefError = (field: PrefField) =>
    setPrefErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  useEffect(() => {
    try {
      const raw = localStorage.getItem("haisguias:prefs");
      if (raw) {
        const p = JSON.parse(raw);
        setPrefPrestador(p.prestador ?? "");
        setPrefMatricula(p.matricula ?? "");
        setPrefEstabelecimento(p.estabelecimento ?? "");
        setPrefUf(p.uf ?? "RN");
        // Nada é aplicado automaticamente: o usuário revisa e confirma.
        if (p.prestador || p.matricula || p.estabelecimento) setPrefsStatus("review");
      }
    } catch { /* ignore */ }
  }, []);
  const savePrefs = () => {
    const result = prefsSchema.safeParse({
      prestador: prefPrestador,
      matricula: prefMatricula,
      estabelecimento: prefEstabelecimento,
      uf: prefUf,
    });

    if (!result.success) {
      const errors: Partial<Record<PrefField, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as PrefField | undefined;
        if (field && !errors[field]) errors[field] = issue.message;
      }
      setPrefErrors(errors);
      toast.error("Revise os campos destacados antes de salvar.");
      const firstField = PREF_FIELD_ORDER.find((f) => errors[f]);
      if (firstField) {
        document.getElementById(`pref-${firstField}`)?.focus();
      }
      return;
    }

    try {
      localStorage.setItem("haisguias:prefs", JSON.stringify(result.data));
    } catch {
      toast.error("Não foi possível salvar as preferências neste navegador.");
      return;
    }

    setPrefErrors({});
    setPrefsStatus("review");
    toast.success("Dados padrão salvos — revise e aplique a esta guia");
    setPrefsOpen(false);
  };



  const [pacienteNome, setPacienteNome] = useState("");
  const [pacienteCarteira, setPacienteCarteira] = useState("");
  const [pacienteCpf, setPacienteCpf] = useState("");
  const [pacienteNascimento, setPacienteNascimento] = useState("");
  const [pacienteSexo, setPacienteSexo] = useState("F");
  const [pacienteValidadeCarteira, setPacienteValidadeCarteira] = useState("");
  const [pacienteCns, setPacienteCns] = useState("");
  const [pacienteRn, setPacienteRn] = useState("N");




  const [cidPrincipal, setCidPrincipal] = useState("");
  const [indicacaoClinica, setIndicacaoClinica] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [dataSolicitacao, setDataSolicitacao] = useState(
    () => new Date().toISOString().slice(0, 10),
  );

  // Campos SUS (substituem operadora/ANS)
  const [susEstabelecimento, setSusEstabelecimento] = useState("");
  const [susCnes, setSusCnes] = useState("");
  // Estabelecimento e UF do conselho só são preenchidos após a revisão explícita
  // dos dados padrão (ver applySelectedPrefs).



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
  const canPreview = convenioId === "tiss" ? Boolean(operadora) : true;
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

  // Formulário inline "criar kit" (rodapé do tópico 4)
  const [kitName, setKitName] = useState("");
  const [kitFormOpen, setKitFormOpen] = useState(false);

  const filledProcedures = useMemo(
    () => procedures.filter((p) => p.code.trim() && p.description.trim()),
    [procedures],
  );

  const saveAsKit = () => {
    if (filledProcedures.length === 0) {
      toast.error("Preencha ao menos um procedimento para salvar como kit");
      return;
    }
    if (!kitName.trim()) {
      toast.error("Informe um nome para o kit");
      return;
    }
    const kit: Kit = {
      id: crypto.randomUUID(),
      name: kitName.trim(),
      procedures: filledProcedures.map(({ code, description, quantity }) => ({
        code,
        description,
        quantity,
      })),
    };
    setUserKits((k) => [...k, kit]);
    setKitName("");
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

  // Drag & drop reorder (OPME)
  const [dragOpmeId, setDragOpmeId] = useState<string | null>(null);
  const onOpmeDrop = (targetId: string) => {
    if (!dragOpmeId || dragOpmeId === targetId) return setDragOpmeId(null);
    setOpmeItems((list) => {
      const from = list.findIndex((x) => x.id === dragOpmeId);
      const to = list.findIndex((x) => x.id === targetId);
      if (from < 0 || to < 0) return list;
      const next = [...list];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDragOpmeId(null);
  };

  // Separar em guias
  const [splitInGuides, setSplitInGuides] = useState(false);
  const filledProceduresCount = procedures.filter((p) => p.code.trim() && p.description.trim()).length;

  // Autosave do rascunho + indicador "salvo HH:MM" no cabeçalho.
  const { savedAt } = useDraftAutosave({
    key: "hg:emitir:rascunho",
    data: {
      pacienteNome,
      pacienteCarteira,
      pacienteCpf,
      pacienteNascimento,
      pacienteSexo,
      cidPrincipal,
      indicacaoClinica,
      observacoes,
      procedures,
      opmeItems,
    },
    isEmpty: (d) =>
      !d.pacienteNome.trim() &&
      !d.pacienteCarteira.trim() &&
      !d.pacienteCpf.trim() &&
      !d.cidPrincipal.trim() &&
      !d.indicacaoClinica.trim() &&
      !d.observacoes.trim() &&
      !d.procedures.some((p) => p.code.trim() || p.description.trim()) &&
      d.opmeItems.length === 0,
    onRestore: (d) => {
      setPacienteNome(d.pacienteNome);
      setPacienteCarteira(d.pacienteCarteira);
      setPacienteCpf(d.pacienteCpf);
      setPacienteNascimento(d.pacienteNascimento);
      setPacienteSexo(d.pacienteSexo);
      setCidPrincipal(d.cidPrincipal);
      setIndicacaoClinica(d.indicacaoClinica);
      setObservacoes(d.observacoes);
      if (Array.isArray(d.procedures) && d.procedures.length) setProcedures(d.procedures);
      if (Array.isArray(d.opmeItems)) setOpmeItems(d.opmeItems);
    },
  });


  /**
   * Ordem dos tópicos numerados do formulário. Segue a mesma sequência dos
   * quadros impressos na guia SP/SADT: dados da operadora (1-7), beneficiário
   * (8-12), contratado solicitante (13-22), dados da solicitação (23),
   * procedimentos solicitados (24-28), contratado executante e atendimento
   * (29-35) e procedimentos/materiais realizados (36-56).
   */
  const stepKeys: string[] = [
    "convenio",
    ...(guideKind === "internacao" ? ["internacao"] : []),
    ...(guideKind === "apac" ? ["apac"] : []),
    ...(guideKind === "aih" ? ["aih"] : []),
    "paciente",
    "profissional",
    "clinico",
    "executante",
    "opme",
  ];
  const stepNumber = (key: string) => stepKeys.indexOf(key) + 1;

  const convenioOk =
    convenioId === "tiss"
      ? Boolean(operadora.trim() && character.trim())
      : Boolean(susEstabelecimento.trim());
  const especificoOk =
    guideKind === "internacao"
      ? Boolean(internacaoTipo && internacaoDias > 0)
      : guideKind === "apac"
        ? Boolean(apacCompetencia && apacTipo)
        : guideKind === "aih"
          ? Boolean(aihCaraterEntry && aihMotivo.trim())
          : true;
  const pacienteOk = Boolean(pacienteNome.trim() && pacienteCarteira.trim());
  const profissionalOk = profissionalValido;
  const executanteOk = Boolean(contratadoExecutante.trim() && tipoAtendimento.trim());

  const clinicoOk = Boolean(indicacaoClinica.trim() && dataSolicitacao.trim());
  const procedimentosOk = procedures.some(
    (p) => p.code.trim() && p.description.trim() && p.quantity > 0,
  );
  const opmeOk = opmeItems.some((i) => i.description.trim());




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
        <div className="w-full flex-1 space-y-6 px-6 py-8 pb-16 pt-20 md:pt-8 lg:px-10">
          <AppBreadcrumb />
          <PageHeader
            title="Emitir guia"
            description="Escolha entre guias de convênio (TISS) ou guias do SUS e selecione o tipo correspondente para começar."
            actions={<SavedIndicator savedAt={savedAt} />}
          />



          {/* Hub: modo (TISS/SUS) via Tabs */}
          <Tabs
            value={convenioId}
            onValueChange={(v) => setConvenioId(v as ConvenioId)}
          >
            <TabsList className={appTabsListClass}>
              {CONVENIOS.map((c) => {
                const Icon = c.id === "tiss" ? Shield : Landmark;
                return (
                  <TabsTrigger
                    key={c.id}
                    value={c.id}
                    className={appTabsTriggerClass}
                  >
                    <Icon className={appTabsIconClass} />
                    <span className={appTabsLabelClass}>
                      <span className="lg:hidden">{c.short}</span>
                      <span className="hidden lg:inline">{c.label}</span>
                    </span>
                  </TabsTrigger>


                );
              })}
            </TabsList>


            {CONVENIOS.map((c) => (
              <TabsContent key={c.id} value={c.id} className="mt-4 w-full">
                <section className="w-full rounded-xl border bg-card shadow-sm overflow-hidden">
                  <div className="px-5 sm:px-7 py-6">

                    <div className="mb-5">
                      <h2 className="font-display text-base font-semibold tracking-tight text-foreground">Escolha o tipo de guia</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Selecione a modalidade de atendimento para prosseguir com o formulário.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {c.guides.map((g) => {
                        const active = c.id === convenioId && g.id === guideKind;
                        const Icon = g.icon;
                        return (
                          <button /* ds-allow: card selecionável de tipo de guia */
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
                                    : "border-muted-foreground/70 bg-background group-hover:border-primary group-hover:bg-primary/10",
                                )}
                              >
                                {active && <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />}
                              </div>

                            </div>
                            <div className="mt-3">
                              <h3 className="font-display text-sm font-semibold leading-tight tracking-tight text-foreground">
                                {g.label}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                {g.description}
                              </p>
                            </div>
                            <div
                              className={cn(
                                "mt-3 inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
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
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Formulário de emissão
                  </p>
                  <p className="text-sm font-semibold truncate">{guideHeaderTitle}</p>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={canPreview ? -1 : 0}>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!canPreview}
                          aria-describedby={canPreview ? undefined : "preview-disabled-hint"}
                          onClick={() => setPreviewOpen(true)}
                        >
                          <Eye className="h-4 w-4" /> Pré-visualizar
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!canPreview && (
                      <TooltipContent id="preview-disabled-hint">
                        Selecione a operadora / convênio para pré-visualizar a guia.
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>


              </div>

              {/* Convênio / Estabelecimento */}
              {convenioId === "tiss" ? (
                <Section
                  number={stepNumber("convenio")}
                  done={convenioOk}
                  icon={<Building2 className="h-4 w-4" />}
                  title="Convênio e atendimento"
                  description="Campos 1 a 7 da guia — operadora responsável, autorização e senha."
                >
                  <Grid cols={2}>
                    <Field label="Operadora / Convênio" required>
                      <Select value={operadora} onValueChange={(v) => { setOperadora(v); const op = OPERADORAS.find((o) => o.value === v); if (op) setRegistroAns(op.ans); }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o convênio">
                            {(() => {
                              const selected = OPERADORAS.find((o) => o.value === operadora);
                              if (!selected) return null;
                              return (
                                <span className="flex min-w-0 items-center gap-2">
                                  <img
                                    src={selected.logo}
                                    alt=""
                                    aria-hidden
                                    loading="lazy"
                                    className="h-4 w-auto max-w-[56px] shrink-0 object-contain"
                                  />
                                  <span className="truncate">{selected.label}</span>
                                </span>
                              );
                            })()}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {OPERADORAS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              <span className="flex min-w-0 items-center gap-2">
                                <img
                                  src={o.logo}
                                  alt=""
                                  aria-hidden
                                  loading="lazy"
                                  className="h-4 w-auto max-w-[56px] shrink-0 object-contain"
                                />
                                <span className="truncate">{o.label}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field label="1 - Registro ANS">
                      <Input
                        value={registroAns}
                        onChange={(e) => setRegistroAns(e.target.value)}
                        placeholder="000000"
                      />
                    </Field>
                  </Grid>

                  <div className="mt-5 space-y-4 border-t pt-5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Autorização e senha
                    </p>
                    <Grid cols={3}>
                      <Field label="3 - Número da Guia Principal">
                        <Input
                          value={guiaPrincipal}
                          onChange={(e) => setGuiaPrincipal(e.target.value)}
                          placeholder="Guia de internação vinculada"
                        />
                      </Field>
                      <Field label="4 - Data da Autorização">
                        <Input
                          type="date"
                          value={dataAutorizacao}
                          onChange={(e) => setDataAutorizacao(e.target.value)}
                        />
                      </Field>
                      <Field label="5 - Senha">
                        <Input
                          value={senha}
                          onChange={(e) => setSenha(e.target.value)}
                          placeholder="Senha emitida pela operadora"
                        />
                      </Field>
                      <Field label="6 - Data de Validade da Senha">
                        <Input
                          type="date"
                          value={validadeSenha}
                          onChange={(e) => setValidadeSenha(e.target.value)}
                        />
                      </Field>
                      <Field label="7 - Número da Guia Atribuído pela Operadora">
                        <Input
                          value={guiaOperadora}
                          onChange={(e) => setGuiaOperadora(e.target.value)}
                          placeholder="Informado pela operadora"
                        />
                      </Field>
                    </Grid>
                  </div>

                </Section>
              ) : (
                <Section
                  number={stepNumber("convenio")}
                  done={convenioOk}
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
                  number={stepNumber("internacao")}
                  done={especificoOk}
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
                  number={stepNumber("apac")}
                  done={especificoOk}
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
                  number={stepNumber("aih")}
                  done={especificoOk}
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
                number={stepNumber("paciente")}
                done={pacienteOk}
                icon={<User className="h-4 w-4" />}
                title="Dados do Beneficiário"
                description="Campos 8 a 12 da guia — identificação do beneficiário na operadora."
              >
                <Grid cols={2}>
                  <Field label="8 - Número da Carteira" required>
                    <Input
                      value={pacienteCarteira}
                      onChange={(e) => setPacienteCarteira(e.target.value)}
                      placeholder="0000 0000 0000 0000"
                    />
                  </Field>
                  <Field label="9 - Validade da Carteira">
                    <Input
                      type="date"
                      value={pacienteValidadeCarteira}
                      onChange={(e) => setPacienteValidadeCarteira(e.target.value)}
                    />
                  </Field>
                  <Field label="10 - Nome" required>
                    <Input
                      value={pacienteNome}
                      onChange={(e) => setPacienteNome(e.target.value)}
                      placeholder="Nome completo"
                    />
                  </Field>
                  <Field label="11 - Cartão Nacional de Saúde">
                    <Input
                      value={pacienteCns}
                      onChange={(e) => setPacienteCns(e.target.value)}
                      placeholder="000 0000 0000 0000"
                    />
                  </Field>
                  <SelectField
                    label="12 - Atendimento a RN"
                    labelClassName="text-xs font-medium text-muted-foreground"
                    value={pacienteRn}
                    onValueChange={setPacienteRn}
                    options={[
                      { value: "N", label: "Não" },
                      { value: "S", label: "Sim" },
                    ]}
                  />
                </Grid>

              </Section>

              {/* Solicitante */}
              <Section
                number={stepNumber("profissional")}
                done={profissionalOk}
                icon={<Stethoscope className="h-4 w-4" />}
                title="Dados do Solicitante"
                description="Campos 13 a 20 da guia — contratado e profissional solicitante."
                action={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPrefsOpen(true)}
                  >
                    <Settings2 className="h-4 w-4" />
                    Meus dados padrão

                  </Button>
                }
              >
                {prefsStatus === "review" && prefsFilled.length > 0 && (
                  <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
                    <div className="flex items-start gap-2">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          Revise seus dados padrão antes de aplicar
                        </p>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          Nada foi preenchido ainda. Escolha o que deve entrar nesta guia.
                        </p>
                      </div>
                    </div>

                    <ul className="mt-3 space-y-2">
                      {prefsFilled.map((field) => (
                        <li key={field} className="flex items-start gap-2.5">
                          <Checkbox
                            id={`pref-apply-${field}`}
                            checked={prefSelection[field]}
                            onCheckedChange={() => togglePrefField(field)}
                            className="mt-0.5"
                          />
                          <label
                            htmlFor={`pref-apply-${field}`}
                            className="min-w-0 cursor-pointer text-xs leading-relaxed"
                          >
                            <span className="block text-muted-foreground">
                              {PREF_LABELS[field]}
                            </span>
                            <span className="block font-medium text-foreground">
                              {prefValue(field)}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={applySelectedPrefs}
                        disabled={selectedPrefFields.length === 0}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Aplicar {selectedPrefFields.length > 0 ? selectedPrefFields.length : ""}{" "}
                        {selectedPrefFields.length === 1 ? "campo" : "campos"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPrefsOpen(true)}
                      >
                        <Settings2 className="h-4 w-4" />
                        Editar meus dados padrão
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPrefsStatus("dismissed")}
                      >
                        Preencher manualmente
                      </Button>
                    </div>
                  </div>
                )}

                {prefsStatus === "applied" && (
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-muted/30 px-3.5 py-2.5">
                    <p className="flex min-w-0 items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                      <CheckCircle2
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success-strong"
                        aria-hidden="true"
                      />
                      <span>
                        Dados padrão aplicados a esta guia. Edite abaixo para valer só aqui.
                      </span>
                    </p>
                    <Button type="button" variant="outline" size="sm" onClick={undoPrefs}>
                      Desfazer
                    </Button>
                  </div>
                )}


                <Grid cols={2}>
                  <Field label="13 - Código na Operadora">
                    <Input
                      value={codigoSolicitante}
                      onChange={(e) => setCodigoSolicitante(e.target.value)}
                      placeholder="Código do contrato"
                    />
                  </Field>
                  <Field label="14 - Nome do Contratado">
                    <Input
                      value={contratadoSolicitante}
                      onChange={(e) => setContratadoSolicitante(e.target.value)}
                      placeholder="Clínica, consultório ou hospital"
                    />
                  </Field>
                </Grid>

                <div className="mt-5 border-t pt-5">
                  <ProfessionalPicker
                    value={profissional}
                    onChange={setProfissional}
                    labels={{
                      nome: "15 - Nome do Profissional Solicitante",
                      conselho: "16 - Conselho Profissional",
                      numero: "17 - Número no Conselho",
                    }}
                  />
                </div>

                <div className="mt-5">
                  <Grid cols={3}>
                    <Field label="18 - UF">
                      <Input
                        value={conselhoUf}
                        onChange={(e) => setConselhoUf(e.target.value.toUpperCase().slice(0, 2))}
                        placeholder="RN"
                      />
                    </Field>
                    <Field label="19 - Código CBO">
                      <Input
                        value={codigoCbo}
                        onChange={(e) => setCodigoCbo(e.target.value)}
                        placeholder="225125"
                      />
                    </Field>
                  </Grid>
                </div>

                <div className="mt-5 border-t pt-5">
                  <SignatureField
                    label="20 - Assinatura do Profissional Solicitante"
                    value={assinaturaSolicitante}
                    onChange={setAssinaturaSolicitante}
                    hint="Opcional: desenhe ou envie a assinatura para sair impressa no campo 20. Deixe em branco para assinar à mão no papel."

                  />
                </div>
              </Section>





              {/* Dados da solicitação (21 a 28) */}
              <Section
                number={stepNumber("clinico")}
                done={clinicoOk && procedimentosOk}
                icon={<FileText className="h-4 w-4" />}
                title={
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    Dados da Solicitação
                    {guideKind && (
                      <Badge variant="secondary" className="font-medium">
                        {GUIDE_SHORT[guideKind]}
                      </Badge>
                    )}
                  </span>
                }
                description="Campos 21 a 28 da guia — solicitação, indicação clínica e procedimentos solicitados."

              >
                <Grid cols={2}>
                  <SelectField
                    label="21 - Caráter do Atendimento"
                    required
                    value={character}
                    onValueChange={setCharacter}
                    options={CHARACTER_OPTIONS.map((c) => ({ value: c, label: c }))}
                  />
                  <Field label="22 - Data da Solicitação" required>
                    <Input
                      type="date"
                      value={dataSolicitacao}
                      onChange={(e) => setDataSolicitacao(e.target.value)}
                    />
                  </Field>
                </Grid>


                <Field label="23 - Indicação Clínica" required>
                  <Textarea
                    rows={3}
                    value={indicacaoClinica}
                    onChange={(e) => setIndicacaoClinica(e.target.value)}
                    placeholder="Descreva a justificativa clínica do procedimento."
                  />
                </Field>




                {/* Procedimentos solicitados (24 a 28) */}
                <div className="mt-5 border-t pt-5 space-y-3">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:justify-between">
                    <h4 className="min-w-0 text-sm font-medium">
                      Procedimentos solicitados
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        Campos 24 a 28
                      </span>
                    </h4>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={clearProcedures}>
                        Limpar
                      </Button>
                      <Button type="button" size="sm" onClick={addProcedure}>
                        <Plus className="h-4 w-4" /> Adicionar
                      </Button>
                    </div>
                  </div>

                  {/* Usar kit salvo */}
                  <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-center">
                    <Label htmlFor="use-kit" className="shrink-0 text-xs font-medium">
                      Usar kit salvo
                    </Label>
                    <div className="min-w-0 flex-1">
                      <Combobox
                        id="use-kit"
                        value={selectedUserKit}
                        onChange={(id) => {
                          setSelectedUserKit(id);
                          const kit = kitOptionsSource.find((k) => k.id === id);
                          if (kit) applyKit(kit);
                        }}
                        options={kitOptions}
                        placeholder={
                          kitOptions.length === 0
                            ? "Nenhum kit disponível"
                            : "Selecione um kit de procedimentos"
                        }
                        searchPlaceholder="Buscar kit..."
                        emptyMessage="Nenhum kit encontrado."
                        disabled={kitOptions.length === 0}
                        clearable
                      />
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Busque pela descrição — o código TUSS é preenchido automaticamente. O campo{" "}
                    <strong>24 - Tabela</strong> é fixo (22) e o campo <strong>28 - Qtde. Aut.</strong>{" "}
                    é preenchido pela operadora.
                  </p>


                  {/* Rótulos das colunas (campos 24 a 28) — visíveis no desktop */}
                  <div className="hidden lg:grid lg:grid-cols-[28px_56px_128px_minmax(0,1fr)_80px_80px_40px] items-end gap-3 text-xs font-medium text-muted-foreground">
                    <div />
                    <div className="truncate text-center" title="24 - Tabela">
                      24 - Tab.
                    </div>
                    <div className="truncate" title="25 - Código do Procedimento ou Item Assistencial">
                      25 - Código <span className="text-destructive">*</span>
                    </div>
                    <div className="truncate" title="26 - Descrição">
                      26 - Descrição <span className="text-destructive">*</span>
                    </div>
                    <div className="truncate text-center" title="27 - Qtde. Solicitada">
                      27 - Qtde. <span className="text-destructive">*</span>
                    </div>
                    <div className="truncate text-center" title="28 - Qtde. Autorizada (operadora)">
                      28 - Qtde. Aut.
                    </div>
                    <div />
                  </div>


                  <div className="space-y-3 lg:space-y-2">
                    {procedures.map((p, idx) => (
                      <div
                        key={p.id}
                        draggable
                        onDragStart={() => onDragStart(p.id)}
                        onDragOver={onDragOver}
                        onDrop={() => onDrop(p.id)}
                        className={cn(
                          "rounded-lg border p-3 lg:grid lg:grid-cols-[28px_56px_128px_minmax(0,1fr)_80px_80px_40px] lg:items-center lg:gap-3 lg:rounded-none lg:border-0 lg:p-0",
                          dragId === p.id && "opacity-50",
                        )}
                      >
                        {/* Handle + remover (mobile: linha superior) */}
                        <div className="mb-2 flex items-center justify-between lg:mb-0 lg:contents">
                          <div className="flex cursor-grab items-center justify-center text-muted-foreground active:cursor-grabbing">
                            <GripVertical className="h-4 w-4" />
                            <span className="ml-1 text-xs font-medium lg:hidden">
                              Item {idx + 1}
                            </span>
                          </div>
                          <div className="lg:hidden">
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

                        {/* 24 - Tabela (somente leitura) */}
                        <div className="hidden lg:block text-center font-mono text-sm text-muted-foreground">
                          22
                        </div>

                        {/* 25 - Código */}
                        <FormField
                          label="25 - Código"
                          required
                          labelClassName="lg:hidden"
                          className="min-w-0 lg:space-y-0"
                        >
                          <Input
                            value={p.code}
                            onChange={(e) => updateProcedure(p.id, { code: e.target.value })}
                            aria-label="25 - Código do Procedimento ou Item Assistencial"
                            placeholder="Código TUSS"
                            className="font-mono"
                          />
                        </FormField>

                        {/* 26 - Descrição (busca principal) */}
                        <FormField
                          label="26 - Descrição"
                          required
                          labelClassName="lg:hidden"
                          className="mt-3 min-w-0 lg:mt-0 lg:space-y-0"
                        >
                          <Combobox
                            value={
                              TUSS.some((t) => t.descricao === p.description)
                                ? TUSS.find((t) => t.descricao === p.description)!.codigo
                                : ""
                            }
                            onChange={(codigo) => {
                              const item = TUSS.find((t) => t.codigo === codigo);
                              updateProcedure(p.id, {
                                code: item ? item.codigo : "",
                                description: item ? item.descricao : "",
                              });
                            }}
                            options={TUSS_OPTIONS}
                            placeholder={p.description || "Buscar procedimento (TUSS)"}
                            searchPlaceholder="Digite o código ou a descrição..."
                            emptyMessage="Nenhum procedimento encontrado."
                            clearable
                          />
                        </FormField>

                        {/* 27 - Qtde. Solicitada */}
                        <FormField
                          label="27 - Qtde. Solic."
                          required
                          labelClassName="lg:hidden"
                          className="mt-3 lg:mt-0 lg:space-y-0"
                        >
                          <Input
                            type="number"
                            min={1}
                            aria-label="27 - Qtde. Solicitada"
                            className="text-center"
                            value={p.quantity}
                            onChange={(e) =>
                              updateProcedure(p.id, {
                                quantity: Math.max(1, Number(e.target.value) || 1),
                              })
                            }
                          />
                        </FormField>

                        {/* 28 - Qtde. Autorizada (operadora) */}
                        <div className="hidden lg:block text-center text-sm text-muted-foreground">
                          —
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground lg:hidden">
                          24 - Tabela: <span className="font-mono">22</span> · 28 - Qtde. Aut.: —
                          (operadora)
                        </p>


                        <div className="hidden lg:flex lg:justify-end">
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
                </div>

                <div className="mt-5 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setKitFormOpen((o) => !o)}
                    aria-expanded={kitFormOpen}
                    disabled={filledProcedures.length === 0}
                  >
                    <Plus className="h-4 w-4" /> Salvar como kit
                  </Button>
                  {filledProcedures.length === 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Preencha ao menos um procedimento para criar um kit reutilizável.
                    </p>
                  )}

                  {kitFormOpen && filledProcedures.length > 0 && (
                    <div className="mt-3 space-y-3 rounded-lg border bg-muted/30 p-3">
                      <ul className="space-y-1">
                        {filledProcedures.map((p) => (
                          <li
                            key={p.id}
                            className="flex min-w-0 items-center gap-2 text-xs text-foreground"
                          >
                            <span className="font-mono text-muted-foreground">{p.code}</span>
                            <span className="min-w-0 flex-1 truncate">{p.description}</span>
                            <span className="shrink-0 text-muted-foreground">{p.quantity}x</span>
                          </li>
                        ))}
                      </ul>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <FormField
                          id="kit-name"
                          label="Nome do kit"
                          className="min-w-0 flex-1"
                          hint="Ex.: Check-up cardiológico"
                        >
                          <Input
                            value={kitName}
                            onChange={(e) => setKitName(e.target.value)}
                            placeholder="Nome do kit"
                          />
                        </FormField>
                        <Button
                          type="button"
                          onClick={saveAsKit}
                          disabled={!kitName.trim()}
                          className="sm:mb-6"
                        >
                          Salvar kit
                        </Button>
                      </div>
                    </div>
                  )}
                </div>




              </Section>


              {/* Contratado executante e atendimento */}
              <Section
                number={stepNumber("executante")}
                done={executanteOk}
                icon={<Building2 className="h-4 w-4" />}
                title="Contratado executante e atendimento"
                description="Campos 29 a 35 da guia — contratado executante e características do atendimento."
              >
                <Grid cols={3}>
                  <Field label="29 - Código na Operadora">
                    <Input
                      value={codigoExecutante}
                      onChange={(e) => setCodigoExecutante(e.target.value)}
                      placeholder="Código do contrato"
                    />
                  </Field>
                  <Field label="30 - Nome do Contratado">
                    <Input
                      value={contratadoExecutante}
                      onChange={(e) => setContratadoExecutante(e.target.value)}
                      placeholder="Prestador que executa"
                    />
                  </Field>
                  <Field label="31 - Código CNES">
                    <Input
                      value={cnesExecutante}
                      onChange={(e) => setCnesExecutante(e.target.value)}
                      placeholder="0000000"
                    />
                  </Field>
                  <SelectField
                    label="32 - Tipo de Atendimento"
                    labelClassName="text-xs font-medium text-muted-foreground"
                    value={tipoAtendimento}
                    onValueChange={setTipoAtendimento}
                    placeholder="Selecione"
                    options={[
                      "Remoção",
                      "Pequena cirurgia",
                      "Terapias",
                      "Consulta",
                      "Exame",
                      "Atendimento domiciliar",
                      "Urgência / emergência",
                      "SADT internado",
                    ].map((o) => ({ value: o, label: o }))}
                  />
                  <SelectField
                    label="33 - Indicação de Acidente (acidente ou doença relacionada)"
                    labelClassName="text-xs font-medium text-muted-foreground"
                    value={indicacaoAcidente}
                    onValueChange={setIndicacaoAcidente}
                    placeholder="Selecione"
                    options={[
                      "Acidente de trabalho",
                      "Acidente de trânsito",
                      "Outros acidentes",
                      "Não acidente",
                    ].map((o) => ({ value: o, label: o }))}
                  />
                  <SelectField
                    label="34 - Tipo de Consulta"
                    labelClassName="text-xs font-medium text-muted-foreground"
                    value={tipoConsulta}
                    onValueChange={setTipoConsulta}
                    placeholder="Selecione"
                    options={["Primeira consulta", "Seguimento", "Pré-natal", "Por encaminhamento"].map(
                      (o) => ({ value: o, label: o }),
                    )}
                  />
                  <SelectField
                    label="35 - Motivo de Encerramento do Atendimento"
                    labelClassName="text-xs font-medium text-muted-foreground"
                    value={motivoEncerramento}
                    onValueChange={setMotivoEncerramento}
                    placeholder="Selecione"
                    options={[
                      "Retorno",
                      "Retorno por complicação",
                      "Alta curado",
                      "Alta melhorado",
                      "Alta a pedido",
                      "Alta com previsão de retorno",
                      "Alta administrativa",
                      "Óbito",
                    ].map((o) => ({ value: o, label: o }))}
                  />
                </Grid>
              </Section>

              {/* OPME */}
              <Section
                number={stepNumber("opme")}
                done={opmeOk}
                icon={<Wrench className="h-4 w-4" />}
                title="OPME — Órteses, Próteses e Materiais Especiais"
                description="Campos 36 a 56 da guia — materiais, órteses e próteses realizados (opcional)."
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
                    {opmeItems.map((o, idx) => (
                      <div
                        key={o.id}
                        draggable
                        onDragStart={() => setDragOpmeId(o.id)}
                        onDragOver={onDragOver}
                        onDrop={() => onOpmeDrop(o.id)}
                        className={cn(
                          "grid grid-cols-[28px_1fr_auto] items-end gap-2 rounded-md border p-2 lg:grid-cols-12 lg:border-0 lg:p-0",
                          dragOpmeId === o.id && "opacity-50",
                        )}
                      >
                        <div className="row-span-3 flex cursor-grab items-center justify-center self-center text-muted-foreground active:cursor-grabbing lg:row-span-1 lg:col-span-1 lg:self-end lg:pb-2">
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <div className="col-span-2 lg:col-span-3">
                          <Input
                            value={o.code}
                            onChange={(e) => updateOpme(o.id, { code: e.target.value })}
                            placeholder="Código"
                          />
                        </div>
                        <div className="col-span-2 lg:col-span-6">
                          <Input
                            value={o.description}
                            onChange={(e) =>
                              updateOpme(o.id, { description: e.target.value })
                            }
                            placeholder="Descrição do material/prótese"
                          />
                        </div>
                        <div className="col-span-1 w-24 lg:w-auto">
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
                        <div className="col-span-1 flex justify-end lg:col-span-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOpme(o.id)}
                            aria-label={`Remover OPME ${idx + 1}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              {/* Barra de ação padrão: etapas + ações */}
              <FormActionBar
                stepsLabel="Etapas preenchidas"
                steps={[
                  {
                    label: convenioId === "tiss" ? "Convênio" : "Estabelecimento",
                    done: convenioOk,
                  },
                  ...(guideKind === "internacao"
                    ? [{ label: "Internação", done: especificoOk }]
                    : []),
                  ...(guideKind === "apac" ? [{ label: "APAC", done: especificoOk }] : []),
                  ...(guideKind === "aih" ? [{ label: "AIH", done: especificoOk }] : []),
                  { label: "Beneficiário", done: pacienteOk },
                  { label: "Profissional", done: profissionalOk },
                  { label: "Dados da Solicitação", done: clinicoOk && procedimentosOk },
                  { label: "Executante", done: executanteOk },
                  { label: "OPME (opcional)", done: opmeOk },
                ]}
                note={
                  <>
                    Campos com <span className="text-destructive/80">*</span> são
                    obrigatórios e serão validados antes da emissão.
                  </>
                }
              >
                <Button type="button" variant="outline" size="sm" onClick={handleReset}>
                  Limpar
                </Button>
                <Button type="button" variant="outline" size="sm">
                  <Save className="h-4 w-4" /> Salvar rascunho
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  <FileText className="h-4 w-4" />
                  {submitting ? "Gerando..." : "Gerar guia"}
                </Button>
              </FormActionBar>
            </form>
            </div>
          )}

        </div>
        <SiteFooter />
      </main>

      <Dialog open={previewOpen && canPreview} onOpenChange={setPreviewOpen}>
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
              medicoConselho={profissional.conselho}
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
              guiaPrincipal={guiaPrincipal}
              dataAutorizacao={dataAutorizacao}
              senha={senha}
              validadeSenha={validadeSenha}
              guiaOperadora={guiaOperadora}
              codigoSolicitante={codigoSolicitante}
              contratadoSolicitante={contratadoSolicitante}
              conselhoUf={conselhoUf}
              codigoCbo={codigoCbo}
              codigoExecutante={codigoExecutante}
              contratadoExecutante={contratadoExecutante}
              cnesExecutante={cnesExecutante}
              tipoAtendimento={tipoAtendimento}
              indicacaoAcidente={indicacaoAcidente}
              tipoConsulta={tipoConsulta}
              motivoEncerramento={motivoEncerramento}
              pacienteValidadeCarteira={pacienteValidadeCarteira}
              pacienteCns={pacienteCns}
              pacienteRn={pacienteRn}
              assinaturaSolicitante={assinaturaSolicitante}

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
          {!profissionalValido && (
            <p
              id="print-disabled-hint"
              role="alert"
              className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>
                Corrija os campos 15, 16 e 17 (Dados do Solicitante) antes de imprimir ou
                gerar o PDF:{" "}
                {[
                  profissionalErrors.nome && `15 — ${profissionalErrors.nome}`,
                  profissionalErrors.conselho && `16 — ${profissionalErrors.conselho}`,
                  profissionalErrors.numero && `17 — ${profissionalErrors.numero}`,
                ]
                  .filter(Boolean)
                  .join(" ")}
              </span>
            </p>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              disabled={!profissionalValido}
              aria-describedby={profissionalValido ? undefined : "print-disabled-hint"}
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
            <Button
              disabled={!profissionalValido}
              aria-describedby={profissionalValido ? undefined : "print-disabled-hint"}
              onClick={() => toast.success("Download iniciado")}
            >
              <Download className="h-4 w-4" /> Baixar PDF
            </Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>

      <AppModal
        open={prefsOpen}
        onOpenChange={setPrefsOpen}
        title="Meus dados padrão de emissão"
        description="Salve uma vez os seus dados de prestador. Em cada nova guia você escolhe quais deles aplicar aos campos 13 a 20 — sem redigitar."

        icon={<Settings2 className="h-4 w-4" aria-hidden="true" />}
        size="lg"
        bodyClassName="space-y-5"
        footer={
          <>
            <Button variant="outline" onClick={() => setPrefsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={savePrefs}>
              <Save className="h-4 w-4" />
              Salvar dados padrão
            </Button>
          </>
        }

      >
        <>
          <FormField
              id="pref-prestador"
              label="Nome do Prestador"
              required
              hint="Utilizado em todas as guias."
              error={prefErrors.prestador}
            >
              <Input
                value={prefPrestador}
                onChange={(e) => { setPrefPrestador(e.target.value); clearPrefError("prestador"); }}
                placeholder="Nome completo do prestador"
                autoComplete="name"
              />
            </FormField>
            <FormField
              id="pref-matricula"
              label="Matrícula / Conselho"
              required
              hint="Formato aceito: CRM 123456/RN ou apenas números da matrícula."
              error={prefErrors.matricula}
            >
              <Input
                value={prefMatricula}
                onChange={(e) => { setPrefMatricula(e.target.value); clearPrefError("matricula"); }}
                placeholder="CRM 0000/UF ou nº de matrícula"
              />
            </FormField>
            <FormField
              id="pref-estabelecimento"
              label="Estabelecimento (Guia SUS)"
              optional
              hint="Preenche automaticamente o campo Estabelecimento nas guias SUS."
              error={prefErrors.estabelecimento}
            >
              <Input
                value={prefEstabelecimento}
                onChange={(e) => { setPrefEstabelecimento(e.target.value); clearPrefError("estabelecimento"); }}
                placeholder="Ex: Hospital Municipal, UBS Centro..."
              />
            </FormField>
            <SelectField
              id="pref-uf"
              label="UF"
              required
              value={prefUf}
              onValueChange={(v) => { setPrefUf(v); clearPrefError("uf"); }}
              options={UF_LIST.map((uf) => ({ value: uf, label: uf }))}
              error={prefErrors.uf}
            />


            <p className="flex items-start gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
              Ao salvar, os campos do profissional solicitante desta guia são atualizados. Você
              pode sobrescrevê-los na guia sem alterar os dados padrão.
            </p>

        </>
      </AppModal>
    </div>
  );
}


function Section({
  number,
  done,
  icon,
  title,
  description,
  action,
  children,
}: {
  number?: number;
  done?: boolean;
  icon: React.ReactNode;
  title: React.ReactNode;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <BaseSectionCard
      number={number}
      title={title}
      description={description}
      icon={icon}
      done={done}
      actions={action}
    >
      {children}
    </BaseSectionCard>
  );
}


function Grid({ cols, children }: { cols: 2 | 3; children: React.ReactNode }) {
  return (
    <div
      className={`grid gap-4 ${cols === 2 ? "lg:grid-cols-2" : "lg:grid-cols-2 xl:grid-cols-3"}`}
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
  medicoConselho: string;
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
  guiaPrincipal: string;
  dataAutorizacao: string;
  senha: string;
  validadeSenha: string;
  guiaOperadora: string;
  codigoSolicitante: string;
  contratadoSolicitante: string;
  conselhoUf: string;
  codigoCbo: string;
  codigoExecutante: string;
  contratadoExecutante: string;
  cnesExecutante: string;
  tipoAtendimento: string;
  indicacaoAcidente: string;
  tipoConsulta: string;
  motivoEncerramento: string;
  pacienteValidadeCarteira: string;
  pacienteCns: string;
  pacienteRn: string;
  assinaturaSolicitante: string;
  fullSize?: boolean;
}) {
  const {
    numeroGuia, operadora, operadoraLogo,
    registroAns, character, dataSolicitacao,
    pacienteNome, pacienteCarteira, pacienteCpf,
    medicoNome, medicoCrm, medicoConselho, medicoEspecialidade, cidPrincipal, indicacaoClinica,
    observacoes, procedures, opmeItems,
    guiaPrincipal, dataAutorizacao, senha, validadeSenha, guiaOperadora,
    codigoSolicitante, contratadoSolicitante, conselhoUf, codigoCbo,
    codigoExecutante, contratadoExecutante, cnesExecutante,
    tipoAtendimento, indicacaoAcidente, tipoConsulta, motivoEncerramento,
    pacienteValidadeCarteira, pacienteCns, pacienteRn, assinaturaSolicitante,
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
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
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
              <FieldBox n="3" label="Número da Guia Principal" value={guiaPrincipal} grow />
            </FieldRow>

            <FieldRow>
              <FieldBoxDate n="4" label="Data da Autorização" {...dd(dataAutorizacao)} width={170} />
              <FieldBox n="5" label="Senha" value={senha} grow />
              <FieldBoxDate n="6" label="Data de Validade da Senha" {...dd(validadeSenha)} width={190} />
              <FieldBox n="7" label="Número da Guia Atribuído pela Operadora" value={guiaOperadora} width={280} />
            </FieldRow>

            <SectionBar>Dados do Beneficiário</SectionBar>
            <FieldRow>
              <FieldBox n="8" label="Número da Carteira" value={pacienteCarteira} width={230} />
              <FieldBoxDate n="9" label="Validade da Carteira" {...dd(pacienteValidadeCarteira)} width={170} />
              <FieldBox n="10" label="Nome" value={pacienteNome} grow />
              <FieldBox n="11" label="Cartão Nacional de Saúde" value={pacienteCns} width={200} />
              <FieldBox n="12" label="Atendimento a RN" value={pacienteRn === "S" ? "Sim" : "Não"} width={90} />
            </FieldRow>

            <SectionBar>Dados do Solicitante</SectionBar>
            <FieldRow>
              <FieldBox n="13" label="Código na Operadora" value={codigoSolicitante} width={190} />
              <FieldBox n="14" label="Nome do Contratado" value={contratadoSolicitante || operadora} grow />
            </FieldRow>
            <FieldRow>
              <FieldBox n="15" label="Nome do Profissional Solicitante" value={medicoNome} grow />
              <FieldBox n="16" label="Conselho Profissional" value={medicoCrm ? medicoConselho : ""} width={90} />
              <FieldBox n="17" label="Número no Conselho" value={medicoCrm} width={140} />
              <FieldBox n="18" label="UF" value={conselhoUf} width={50} />
              <FieldBox n="19" label="Código CBO" value={codigoCbo || medicoEspecialidade} width={140} />
              <FieldBox n="20" label="Assinatura do Profissional Solicitante" value="" image={assinaturaSolicitante} width={220} />
            </FieldRow>


            <SectionBar>Dados da Solicitação / Procedimentos ou Itens Assistenciais Solicitados</SectionBar>
            <FieldRow>
              <FieldBox n="21" label="Caráter do Atendimento" value={character} width={140} />
              <FieldBoxDate n="22" label="Data da Solicitação" d={dataSol.d} m={dataSol.m} y={dataSol.y} width={180} />
              <FieldBox n="23" label="Indicação Clínica" value={`${cidPrincipal ? cidPrincipal + " · " : ""}${indicacaoClinica}`} grow />
            </FieldRow>

            <div className="border-b border-foreground">
              <div className="grid grid-cols-[38px_60px_140px_1fr_60px_60px] text-[8px] font-bold border-b border-foreground bg-surface-subtle">
                <div className="px-1 py-0.5 border-r border-foreground">&nbsp;</div>
                <div className="px-1 py-0.5 border-r border-foreground">24 - Tabela</div>
                <div className="px-1 py-0.5 border-r border-foreground">25 - Código do Procedimento ou Item Assistencial</div>
                <div className="px-1 py-0.5 border-r border-foreground">26 - Descrição</div>
                <div className="px-1 py-0.5 border-r border-foreground text-center">27 - Qtde. Solic.</div>
                <div className="px-1 py-0.5 text-center">28 - Qtde. Aut.</div>
              </div>
              {rows.map((p, i) => (
                <div key={i} className="grid grid-cols-[38px_60px_140px_1fr_60px_60px] text-[10px] border-b last:border-b-0 border-border min-h-[16px]">
                  <div className="px-1 py-0.5 border-r border-border font-mono">{i + 1} -</div>
                  <div className="px-1 py-0.5 border-r border-border font-mono">{p ? "22" : ""}</div>
                  <div className="px-1 py-0.5 border-r border-border font-mono">{p?.code ?? ""}</div>
                  <div className="px-1 py-0.5 border-r border-border truncate">{p?.description ?? ""}</div>
                  <div className="px-1 py-0.5 border-r border-border text-center font-mono">{p?.quantity ?? ""}</div>
                  <div className="px-1 py-0.5 text-center font-mono">&nbsp;</div>
                </div>
              ))}
            </div>

            <SectionBar>Dados do Contratado Executante</SectionBar>
            <FieldRow>
              <FieldBox n="29" label="Código na Operadora" value={codigoExecutante} width={190} />
              <FieldBox n="30" label="Nome do Contratado" value={contratadoExecutante || operadora} grow />
              <FieldBox n="31" label="Código CNES" value={cnesExecutante} width={160} />
            </FieldRow>

            <SectionBar>Dados do Atendimento</SectionBar>
            <FieldRow>
              <FieldBox n="32" label="Tipo de Atendimento" value={tipoAtendimento} width={160} />
              <FieldBox n="33" label="Indicação de Acidente (acidente ou doença relacionada)" value={indicacaoAcidente} width={200} />
              <FieldBox n="34" label="Tipo de Consulta" value={tipoConsulta} width={140} />
              <FieldBox n="35" label="Motivo de Encerramento do Atendimento" value={motivoEncerramento} grow />
            </FieldRow>


            <SectionBar>Dados da Execução / Procedimentos e Exames Realizados</SectionBar>
            <div className="border-b border-foreground">
              <div className="grid grid-cols-[24px_80px_100px_50px_70px_1fr_40px_40px_40px_60px_70px_70px] text-[8px] font-bold border-b border-foreground bg-surface-subtle">
                <div className="px-1 py-0.5 border-r border-foreground">&nbsp;</div>
                <div className="px-1 py-0.5 border-r border-foreground">36 - Data</div>
                <div className="px-1 py-0.5 border-r border-foreground">37 - Hora Inicial / 38 - Hora Final</div>
                <div className="px-1 py-0.5 border-r border-foreground text-center">39 - Tabela</div>
                <div className="px-1 py-0.5 border-r border-foreground">40 - Código do Procedimento</div>
                <div className="px-1 py-0.5 border-r border-foreground">41 - Descrição</div>
                <div className="px-1 py-0.5 border-r border-foreground text-center">42 - Qtde.</div>
                <div className="px-1 py-0.5 border-r border-foreground text-center">43 - Via</div>
                <div className="px-1 py-0.5 border-r border-foreground text-center">44 - Tec.</div>
                <div className="px-1 py-0.5 border-r border-foreground text-center">45 - Fator Red./Acresc.</div>
                <div className="px-1 py-0.5 border-r border-foreground text-center">46 - Valor Unitário (R$)</div>
                <div className="px-1 py-0.5 text-center">47 - Valor Total (R$)</div>
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
                <div className="px-1 py-0.5 border-r border-foreground">48 - Seq. Ref.</div>
                <div className="px-1 py-0.5 border-r border-foreground">49 - Grau Part.</div>
                <div className="px-1 py-0.5 border-r border-foreground">50 - Código na Operadora / CPF</div>
                <div className="px-1 py-0.5 border-r border-foreground">51 - Nome do Profissional</div>
                <div className="px-1 py-0.5 border-r border-foreground">52 - Conselho Profissional</div>
                <div className="px-1 py-0.5 border-r border-foreground">53 - Número no Conselho</div>
                <div className="px-1 py-0.5 border-r border-foreground">54 - UF</div>
                <div className="px-1 py-0.5">55 - Código CBO</div>
              </div>
              {profRows.map((_, i) => (
                <div key={i} className="grid grid-cols-[50px_60px_110px_1fr_90px_90px_40px_80px] text-[10px] border-b last:border-b-0 border-border min-h-[16px]">
                  <div className="px-1 py-0.5 border-r border-border"></div>
                  <div className="px-1 py-0.5 border-r border-border"></div>
                  <div className="px-1 py-0.5 border-r border-border"></div>
                  <div className="px-1 py-0.5 border-r border-border truncate">{i === 0 ? medicoNome : ""}</div>
                  <div className="px-1 py-0.5 border-r border-border">{i === 0 && medicoCrm ? medicoConselho : ""}</div>
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
                  57 - Assinatura do Beneficiário ou Responsável
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
                ["59", "Total de Procedimentos (R$)"],
                ["60", "Total de Taxas e Aluguéis (R$)"],
                ["61", "Total de Materiais (R$)"],
                ["62", "Total de OPME (R$)"],
                ["63", "Total de Medicamentos (R$)"],
                ["64", "Total de Gases Medicinais (R$)"],
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
                "66 - Assinatura do Responsável pela Autorização",
                "67 - Assinatura do Beneficiário ou Responsável",
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
  image,
  width,
  grow,
}: {
  n: string;
  label: string;
  value: string;
  /** Data URL opcional renderizado no lugar do texto (ex.: assinatura). */
  image?: string;
  width?: number;
  grow?: boolean;
}) {
  return (
    <div
      className="border-r last:border-r-0 border-foreground px-1 py-0.5"
      style={{ width: grow ? undefined : width, flex: grow ? 1 : undefined, minWidth: 0 }}
    >
      <div className="text-[8px] font-bold">{n} - {label}</div>
      {image ? (
        <img src={image} alt={label} className="h-6 w-auto max-w-full object-contain" />
      ) : (
        <div className="text-[10px] font-mono truncate min-h-[12px]">{value}</div>
      )}
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
