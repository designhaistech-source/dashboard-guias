import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field as FormField, SelectField } from "@/components/form-field";
import { AppModal } from "@/components/app-modal";
import { ScaledGuideSheet } from "@/components/scaled-guide-sheet";
import {
  MANUAL_PROFESSIONAL_ID,
  PROFESSIONALS,
  ProfessionalPicker,
  ProfessionalRegistryField,
  councilCode,
  councilLabel,
  defaultProfessionalValue,
  isProfessionalValid,
  parseCouncil,
  validateProfessional,
  type ProfessionalValue,
} from "@/features/professional";
import { ESTABLISHMENT, operatorEstablishmentCode } from "@/features/establishment";

import { AihGuideForm, ApacGuideForm, InternacaoGuideForm } from "@/features/guides";
import { SadtGuidePreview as GuiaLivePreview } from "@/features/guides/sadt/sadt-guide-preview";
import { fmtDate } from "@/features/guides/components/guide-print-primitives";



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
import { TUSS, TUSS_OPTIONS, resolveTissTable } from "@/lib/tuss";
import { nextGuiaNumber } from "@/lib/guia-number";
import { SADT_SECTION_TITLES as T } from "@/lib/guide-sections";
import {
  addIssuedGuide,
  downloadIssuedGuide,
  type IssuedGuide,
} from "@/features/issued-guides";
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

/** Campo 90 — Indicador de Cobertura Especial (domínio TISS nº 75). */
const COBERTURA_ESPECIAL_OPTIONS = [
  { value: "01", label: "01 - Gestante" },
  { value: "02", label: "02 - Pré-operatório" },
  { value: "03", label: "03 - Pós-operatório" },
] as const;

/** Campo 91 — Regime de atendimento (domínio TISS nº 76). */
const REGIME_ATENDIMENTO_OPTIONS = [
  { value: "01", label: "01 - Ambulatorial" },
  { value: "02", label: "02 - Domiciliar" },
  { value: "03", label: "03 - Internação" },
  { value: "04", label: "04 - Pronto-socorro" },
  { value: "05", label: "05 - Telessaúde" },
] as const;

/** Campo 92 — Saúde Ocupacional (domínio TISS nº 77). */
const SAUDE_OCUPACIONAL_OPTIONS = [
  { value: "01", label: "01 - Admissional" },
  { value: "02", label: "02 - Demissional" },
  { value: "03", label: "03 - Periódico" },
  { value: "04", label: "04 - Retorno ao trabalho" },
  { value: "05", label: "05 - Mudança de função" },
  { value: "06", label: "06 - Promoção à saúde" },
] as const;

/** Valor sentinela usado apenas no select para limpar o campo 92 (opcional). */
const SAUDE_OCUPACIONAL_NONE = "none";

/** Códigos aceitos no campo 92 (vazio = não informado). */
const SAUDE_OCUPACIONAL_CODES = new Set<string>(
  SAUDE_OCUPACIONAL_OPTIONS.map((o) => o.value),
);

/** Campo 92 é opcional, mas quando informado precisa ser um código do domínio 77. */
function isSaudeOcupacionalValid(value: string): boolean {
  return value === "" || SAUDE_OCUPACIONAL_CODES.has(value);
}



/** Campo 35 — Motivo de Encerramento do Atendimento (domínio TISS nº 39). */
/** Tipo de consulta (campo 34) conforme domínio TISS. */
const TIPO_CONSULTA_OPTIONS: readonly { value: string; label: string }[] = [
  { value: "1", label: "1 - Primeira Consulta" },
  { value: "2", label: "2 - Retorno" },
  { value: "3", label: "3 - Pré-natal" },
  { value: "4", label: "4 - Por encaminhamento" },
];

const MOTIVO_ENCERRAMENTO_OPTIONS: readonly { value: string; label: string }[] = [
  { value: "11", label: "11 - Alta Curado" },
  { value: "12", label: "12 - Alta Melhorado" },
  { value: "14", label: "14 - Alta a pedido" },
  { value: "15", label: "15 - Alta com previsão de retorno para acompanhamento do paciente" },
  { value: "16", label: "16 - Alta por Evasão" },
  { value: "18", label: "18 - Alta por outros motivos" },
  { value: "19", label: "19 - Alta de Paciente Agudo em Psiquiatria" },
  { value: "21", label: "21 - Permanência, por características próprias da doença" },
  { value: "22", label: "22 - Permanência, por intercorrência" },
  { value: "23", label: "23 - Permanência, por impossibilidade sócio-familiar" },
  { value: "24", label: "24 - Permanência, por Processo de doação de órgãos, tecidos e células - doador vivo" },
  { value: "25", label: "25 - Permanência, por Processo de doação de órgãos, tecidos e células - doador morto" },
  { value: "26", label: "26 - Permanência, por mudança de Procedimento" },
  { value: "27", label: "27 - Permanência, por reoperação" },
  { value: "28", label: "28 - Permanência, outros motivos" },
  { value: "31", label: "31 - Transferido para outro estabelecimento" },
  { value: "32", label: "32 - Transferência para Internação Domiciliar" },
  { value: "41", label: "41 - Óbito com declaração de Óbito fornecida pelo médico assistente" },
  { value: "42", label: "42 - Óbito com declaração de Óbito fornecida pelo Instituto Médico Legal - IML" },
  { value: "43", label: "43 - Óbito com declaração de Óbito fornecida pelo Serviço de Verificação de Óbito - SVO" },
  { value: "51", label: "51 - Encerramento Administrativo" },
  { value: "61", label: "61 - Alta da mãe/puérpera e do recém-nascido" },
  { value: "62", label: "62 - Alta da mãe/puérpera e permanência do recém-nascido" },
  { value: "63", label: "63 - Alta da mãe/puérpera e óbito do recém-nascido" },
  { value: "64", label: "64 - Alta da mãe/puérpera com óbito fetal" },
  { value: "65", label: "65 - Óbito da gestante e do concepto" },
  { value: "66", label: "66 - Óbito da mãe/puérpera e alta do recém-nascido" },
  { value: "67", label: "67 - Óbito da mãe/puérpera e permanência do recém-nascido" },
];

/** Campo 43 - Via de acesso (domínio TISS nº 61). */
const VIA_ACESSO_OPTIONS = [
  { value: "1", label: "1 - Única" },
  { value: "2", label: "2 - Mesma via" },
  { value: "3", label: "3 - Diferentes vias" },
];

/** Campo 44 - Técnica utilizada (domínio TISS nº 48). */
const TECNICA_OPTIONS = [
  { value: "1", label: "1 - Convencional" },
  { value: "2", label: "2 - Vídeo" },
  { value: "3", label: "3 - Robótica" },
];

/** TISS domínio 35 — Grau de participação do profissional executante (campo 49). */
const GRAU_PARTICIPACAO_OPTIONS = [
  { value: "00", label: "00 - Cirurgião" },
  { value: "01", label: "01 - Primeiro Auxiliar" },
  { value: "02", label: "02 - Segundo Auxiliar" },
  { value: "03", label: "03 - Terceiro Auxiliar" },
  { value: "04", label: "04 - Quarto Auxiliar" },
  { value: "05", label: "05 - Instrumentador" },
  { value: "06", label: "06 - Anestesista" },
  { value: "07", label: "07 - Auxiliar de Anestesista" },
  { value: "08", label: "08 - Consultor" },
  { value: "09", label: "09 - Perfusionista" },
  { value: "10", label: "10 - Pediatra na sala de parto" },
  { value: "11", label: "11 - Auxiliar SADT" },
  { value: "12", label: "12 - Clínico" },
  { value: "13", label: "13 - Intensivista" },
];




/**
 * Classes compartilhadas pelos campos 32–35 (Dados do Atendimento).
 * Garantem altura de célula uniforme, labels alinhados no topo (reservando
 * espaço para rótulos de duas linhas) e hints ancorados na base da célula,
 * mantendo o espaçamento vertical/horizontal idêntico entre os campos.
 */
const ATENDIMENTO_FIELD_CLASS =
  "flex h-full flex-col gap-1.5 space-y-0 sm:gap-2 [&>p]:mt-auto";
const ATENDIMENTO_LABEL_CLASS = "min-h-[2rem] items-start sm:min-h-[1.125rem]";
const ATENDIMENTO_TRIGGER_CLASS = "h-10 w-full";



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


type Procedure = {
  id: string;
  code: string;
  description: string;
  quantity: number;
  /** Campo 24 - Tabela: derivado do procedimento, nunca digitado pelo usuário. */
  table?: string;
};
type OpmeItem = { id: string; code: string; description: string; quantity: number };

/** Quadro "Procedimentos e exames realizados" (campos 36 a 47) da guia SP/SADT. */
type ExecutedItem = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  code: string;
  description: string;
  /** Campo 39 - Tabela: derivado do procedimento, nunca digitado pelo usuário. */
  table?: string;
  quantity: number;
  via: string;
  technique: string;
  reductionFactor: string;
  unitValue: string;
};
type Kit = { id: string; name: string; specialty?: string; procedures: Omit<Procedure, "id">[] };

// Tabela de domínio nº 23 — Caráter do atendimento (String, tamanho 1)
const CHARACTER_OPTIONS = [
  { value: "1", label: "1 - Eletivo" },
  { value: "2", label: "2 - Urgência/Emergência" },
];

/** Campo 33 — TUSS 36 (Indicador de Acidente): valor armazenado é o código de 1 caractere. */
const ACIDENTE_OPTIONS: { value: string; label: string }[] = [
  { value: "0", label: "0 - Trabalho" },
  { value: "1", label: "1 - Trânsito" },
  { value: "2", label: "2 - Outros" },
  { value: "9", label: "9 - Não acidente" },
];
const ACIDENTE_DEFAULT = "9";
const acidenteLabel = (code: string) =>
  ACIDENTE_OPTIONS.find((o) => o.value === code)?.label ?? "";

/** Campo 32 — Tabela de Domínio nº 50 (Tipo de Atendimento): código de 2 caracteres. */
const TIPO_ATENDIMENTO_OPTIONS: { value: string; label: string }[] = [
  { value: "01", label: "01 - Remoção" },
  { value: "02", label: "02 - Pequena cirurgia" },
  { value: "03", label: "03 - Outras terapias" },
  { value: "04", label: "04 - Consulta" },
  { value: "05", label: "05 - Exame ambulatorial" },
  { value: "06", label: "06 - Atendimento domiciliar" },
  { value: "07", label: "07 - Internação" },
  { value: "08", label: "08 - Quimioterapia" },
  { value: "09", label: "09 - Radioterapia" },
  { value: "10", label: "10 - Terapia Renal Substitutiva (TRS)" },
  { value: "11", label: "11 - Pronto socorro" },
  { value: "13", label: "13 - Pequeno atendimento (sutura, gesso e outros)" },
  { value: "14", label: "14 - Saúde Ocupacional - Admissional" },
  { value: "15", label: "15 - Saúde Ocupacional - Demissional" },
  { value: "16", label: "16 - Saúde Ocupacional - Periódico" },
  { value: "17", label: "17 - Saúde Ocupacional - Retorno ao trabalho" },
  { value: "18", label: "18 - Saúde Ocupacional - Mudança de função" },
  { value: "19", label: "19 - Saúde Ocupacional - Promoção a saúde" },
  { value: "20", label: "20 - Saúde Ocupacional - Beneficiário novo" },
  { value: "21", label: "21 - Saúde Ocupacional - Assistência a demitidos" },
  { value: "22", label: "22 - TELESSAÚDE" },
  { value: "23", label: "23 - Exame" },
];
const tipoAtendimentoLabel = (code: string) =>
  TIPO_ATENDIMENTO_OPTIONS.find((o) => o.value === code)?.label ?? "";




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
  const navigate = useNavigate();
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

  const [character, setCharacter] = useState("1");
  const [operadora, setOperadora] = useState("");
  const [registroAns, setRegistroAns] = useState("");

  // Campos TISS de autorização/senha (3 a 7)
  const [autorizacaoOpen, setAutorizacaoOpen] = useState(false);

  const [guiaPrincipal, setGuiaPrincipal] = useState("");
  const [dataAutorizacao, setDataAutorizacao] = useState("");
  const [senha, setSenha] = useState("");
  const [validadeSenha, setValidadeSenha] = useState("");
  const [guiaOperadora, setGuiaOperadora] = useState("");

  // Solicitante — campo 13 informado manualmente (não há cadastro prestador x operadora).
  const [codigoSolicitante, setCodigoSolicitante] = useState("");
  const contratadoSolicitante = ESTABLISHMENT.nome;
  const [assinaturaSolicitante, setAssinaturaSolicitante] = useState("");
  /** Campo 56 — até 10 datas de realização de procedimentos em série. */
  const [serieDates, setSerieDates] = useState<string[]>([""]);
  /**
   * Campos 66 a 68 — assinaturas não são coletadas na emissão (assinadas à mão
   * no papel); permanecem vazias na guia para preservar a compatibilidade TISS.
   */
  const assinaturaAutorizacao = "";
  const assinaturaBeneficiarioFinal = "";
  const assinaturaContratado = "";

  /**
   * Contratado executante (campos 29, 30 e 31): derivados do cadastro do
   * estabelecimento executor. Não são exibidos na emissão, mas seguem para o
   * PDF/XML da guia TISS.
   */
  const codigoExecutante = operatorEstablishmentCode(operadora);
  const contratadoExecutante = ESTABLISHMENT.nome;
  const cnesExecutante = ESTABLISHMENT.cnes;


  // Dados do atendimento (32 a 35)
  const [tipoAtendimento, setTipoAtendimento] = useState("");
  /** Campo 33 — padrão TISS "9 - Não acidente"; alterável quando necessário. */
  const [indicacaoAcidente, setIndicacaoAcidente] = useState(ACIDENTE_DEFAULT);
  const [tipoConsulta, setTipoConsulta] = useState("");
  /**
   * Campo 35 — condicional: só se aplica em caso de óbito (domínio TISS nº 39).
   * Qualquer valor fora dos códigos de óbito é descartado para que a guia saia
   * com o campo em branco nos atendimentos normais.
   */
  const [motivoEncerramento, setMotivoEncerramento] = useState("");
  /** Campo 34 só se aplica quando o atendimento é uma consulta (regra TISS). */
  const isConsulta = tipoAtendimento === "04";

  // Limpa o campo 35 quando o tipo de atendimento muda ou quando o código
  // armazenado não pertence ao domínio.
  useEffect(() => {
    setMotivoEncerramento((current) =>
      MOTIVO_ENCERRAMENTO_OPTIONS.some((o) => o.value === current) ? current : "",
    );
  }, [tipoAtendimento]);



  /**
   * Campo 2 — Nº Guia no Prestador. Não é informado pelo usuário: o sistema
   * gera a numeração sequencial por operadora ao criar/salvar a guia.
   */
  const [numeroGuia, setNumeroGuia] = useState<string>("");

  // Profissional solicitante (UI compartilhada em Emitir guia e Solicitar OPME)
  const [profissional, setProfissional] = useState<ProfessionalValue>(
    defaultProfessionalValue,
  );
  const medicoNome = profissional.nome;
  const medicoCrm = councilLabel(profissional);
  const medicoEspecialidade = profissional.especialidade;
  /** Campos 18 e 19 vêm do cadastro do profissional (sem digitação na guia). */
  const conselhoUf = profissional.uf;
  const codigoCbo = profissional.cbo;
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
      }
    | null
  >(null);

  /** Só oferece revisão quando existe algum dado padrão preenchido. */
  const prefsFilled: PrefField[] = [
    prefPrestador.trim() && ("prestador" as PrefField),
    prefMatricula.trim() && ("matricula" as PrefField),
    prefEstabelecimento.trim() && ("estabelecimento" as PrefField),
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
  const [pacienteNomeSocial, setPacienteNomeSocial] = useState("");
  const [pacienteRn, setPacienteRn] = useState("N");




  const [cidPrincipal, setCidPrincipal] = useState("");
  const [indicacaoClinica, setIndicacaoClinica] = useState("");
  const [coberturaEspecial, setCoberturaEspecial] = useState("");
  const [regimeAtendimento, setRegimeAtendimento] = useState("");
  const [saudeOcupacional, setSaudeOcupacional] = useState("");
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
  const canPreview = true;
  const [preview, setPreview] = useState<null | {
    numero: string;
    tipo: string;
    createdAt: string;
  }>(null);
  /** Guia salva como emitida na última geração — usada nas ações de sucesso. */
  const [issuedGuide, setIssuedGuide] = useState<IssuedGuide | null>(null);
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

  // Todos os kits disponíveis (usuário + especialidade) para o seletor do tópico 4
  const kitOptionsSource = useMemo<Kit[]>(
    () => [...userKits, ...SPECIALTY_KITS],
    [userKits],
  );
  const kitOptions = useMemo(
    () =>
      kitOptionsSource.map((k) => ({
        value: k.id,
        label: k.specialty ? `${k.name} · ${k.specialty}` : k.name,
        description: `${k.procedures.length} procedimento(s)`,
      })),
    [kitOptionsSource],
  );

  const applyKit = (kit: Kit) => {
    setProcedures(
      kit.procedures.map((p) => ({
        id: crypto.randomUUID(),
        ...p,
        // Campo 24 resolvido automaticamente também ao aplicar um kit.
        table: resolveTissTable(p.code),
      })),
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


  // Procedimentos e exames realizados (campos 36 a 47)
  const [executedItems, setExecutedItems] = useState<ExecutedItem[]>([]);
  /**
   * Campos 37/38 (horários) só são exigidos quando o tipo de atendimento
   * envolve registro de horário (urgência/emergência, remoção, internado).
   */
  // Códigos da Tabela 50: 01 - Remoção, 02 - Pequena cirurgia,
  // 13 - Pequeno atendimento.
  const requiresExecutionTime = ["01", "02", "13"].includes(tipoAtendimento);

  /** Permite registrar horários manualmente mesmo quando não obrigatórios. */
  const [showExecutionTime, setShowExecutionTime] = useState(false);
  const executionTimeVisible = requiresExecutionTime || showExecutionTime;
  const newExecutedItem = (patch: Partial<ExecutedItem> = {}): ExecutedItem => ({
    id: crypto.randomUUID(),
    // Campo 36 - Data: preenchida automaticamente com a data de realização.
    date: new Date().toISOString().slice(0, 10),
    startTime: "",
    endTime: "",
    code: "",
    description: "",
    table: "",
    quantity: 1,
    via: "",
    technique: "",
    reductionFactor: "",
    unitValue: "",
    ...patch,
  });
  /** Abertura controlada da seção de execução (abre ao adicionar/copiar itens). */
  const [execOpen, setExecOpen] = useState(false);
  /**
   * Abertura do bloco "Dados cirúrgicos (opcional)" por procedimento realizado
   * (campos 43 e 44). Recolhido por padrão — não há fonte confiável para
   * identificar automaticamente procedimentos cirúrgicos.
   */
  const [surgicalOpen, setSurgicalOpen] = useState<Record<string, boolean>>({});
  const addExecuted = () => {
    setExecutedItems((l) => [...l, newExecutedItem()]);
    setExecOpen(true);
  };


  const updateExecuted = (id: string, patch: Partial<ExecutedItem>) =>
    setExecutedItems((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const removeExecuted = (id: string) =>
    setExecutedItems((l) => l.filter((x) => x.id !== id));

  /** Copia os procedimentos solicitados (campos 25-27) para o quadro de realizados. */
  const importSolicitedProcedures = () => {
    const filled = procedures.filter((p) => p.code.trim() || p.description.trim());
    if (filled.length === 0) {
      toast.error("Nenhum procedimento solicitado preenchido");
      return;
    }
    setExecutedItems((l) => [
      ...l,
      ...filled.map((p) =>
        newExecutedItem({
          code: p.code,
          description: p.description,
          table: p.table ?? resolveTissTable(p.code),
          quantity: p.quantity ?? 1,
        }),
      ),
    ]);

    setExecOpen(true);
    toast.success(`${filled.length} procedimento(s) copiado(s) dos solicitados`);

  };

  /** Quadro "Identificação do(a) profissional executante" (campos 48 a 55). */
  type ExecutanteItem = {
    id: string;
    /** Campo 48 — gerado automaticamente pelo sistema (contingência). */
    seqRef: string;
    participation: string;
    operatorCode: string;
    name: string;
    council: string;
    councilNumber: string;
    uf: string;
    cbo: string;
    /** Id do cadastro selecionado; vazio quando ainda não escolhido. */
    professionalId: string;
  };
  const emptyExecutante = (seq: number): ExecutanteItem => ({
    id: crypto.randomUUID(),
    seqRef: String(seq),
    participation: "",
    operatorCode: "",
    name: "",
    council: "",
    councilNumber: "",
    uf: "",
    cbo: "",
    professionalId: "",
  });
  const [executantes, setExecutantes] = useState<ExecutanteItem[]>([]);
  /** Abertura controlada da seção de profissionais executantes. */
  const [execProfOpen, setExecProfOpen] = useState(false);
  const addExecutante = () => {
    setExecutantes((l) => [...l, emptyExecutante(l.length + 1)]);
    setExecProfOpen(true);
  };

  const updateExecutante = (id: string, patch: Partial<ExecutanteItem>) =>
    setExecutantes((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  /** Seleção do profissional executante — preenche 50 e 52 a 55 automaticamente. */
  const selectExecutanteProfessional = (id: string, professionalId: string) => {
    const found = PROFESSIONALS.find((p) => p.id === professionalId);
    if (!found) return;
    updateExecutante(id, {
      professionalId,
      name: found.nome,
      council: found.conselho,
      councilNumber: found.numero,
      uf: found.uf,
      cbo: found.cbo,
      operatorCode: operatorEstablishmentCode(operadora) || found.numero,
    });
  };
  const removeExecutante = (id: string) =>
    // Campo 48 é re-sequenciado pelo sistema após remoções.
    setExecutantes((l) =>
      l.filter((x) => x.id !== id).map((x, i) => ({ ...x, seqRef: String(i + 1) })),
    );
  /** Campo 49 — exibido só com múltiplos executantes ou honorários profissionais. */
  const [showParticipation, setShowParticipation] = useState(false);
  const participationVisible = executantes.length > 1 || showParticipation;
  /** Campo 56 — exibido apenas quando o procedimento realizado é seriado. */
  const [showSerieDates, setShowSerieDates] = useState(false);



  const parseMoney = (v: string) => Number(v.replace(/\./g, "").replace(",", ".")) || 0;
  const formatMoney = (v: number) =>
    v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const executedItemTotal = (item: ExecutedItem) =>
    parseMoney(item.unitValue) * (item.quantity || 0);
  const totalProcedimentos = executedItems.reduce((sum, i) => sum + executedItemTotal(i), 0);

  // Totais do quadro financeiro (campos 60 a 64): calculados automaticamente
  // a partir dos itens informados; não são preenchidos na emissão.
  const totalTaxas = "";
  const totalMateriais = "";
  const totalOpme = "";
  const totalMedicamentos = "";
  const totalGases = "";
  const totalGeral =
    totalProcedimentos +
    parseMoney(totalTaxas) +
    parseMoney(totalMateriais) +
    parseMoney(totalOpme) +
    parseMoney(totalMedicamentos) +
    parseMoney(totalGases);


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
    
    "atendimento",
    "realizados",
    "executantes",
    "observacao",
    
    "opme",
  ];

  const stepNumber = (key: string) => stepKeys.indexOf(key) + 1;

  const convenioOk =
    convenioId === "tiss"
      ? Boolean(operadora.trim())
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
  
  const saudeOcupacionalError = isSaudeOcupacionalValid(saudeOcupacional)
    ? undefined
    : "Selecione uma opção válida da tabela de domínio nº 77.";
  const atendimentoOk =
    Boolean(tipoAtendimento.trim()) && !saudeOcupacionalError;
  const realizadosOk = executedItems.some((i) => i.description.trim() || i.code.trim());
  const executantesOk = executantes.some((e) => e.name.trim() && e.councilNumber.trim());
  const observacaoOk = Boolean(observacoes.trim());
  



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

  /** Monta a guia emitida a partir do formulário, no formato do sistema. */
  const buildIssuedGuide = (numero: string, issuedAt: Date): IssuedGuide => {
    const filledProcedures = procedures.filter(
      (p) => p.code.trim() && p.description.trim(),
    );
    const issuedType: IssuedGuide["type"] =
      guideKind === "internacao"
        ? "Internação"
        : guideKind === "apac"
          ? "APAC (SUS)"
          : guideKind === "aih"
            ? "AIH (SUS)"
            : "SP/SADT";

    return {
      numero,
      issuedAt: issuedAt.toISOString(),
      patient: pacienteNome,
      operadora: convenioId === "sus" ? susEstabelecimento || "SUS" : operadora,
      type: issuedType,
      status: "Emitida",
      professional: `${medicoNome}${medicoCrm ? ` (${profissional.conselho} ${medicoCrm})` : ""}`,
      procedure: filledProcedures[0]
        ? `${filledProcedures[0].code} — ${filledProcedures[0].description}`
        : "—",
      total: totalGeral,
      sections: [
        {
          title: T.convenio,
          items: [
            { label: "Convênio", value: convenio.label },
            { label: "Tipo de guia", value: guideLabel },
            { label: "Registro ANS", value: registroAns },
            { label: "Caráter do atendimento", value: character },
            { label: "Tipo de atendimento", value: tipoAtendimentoLabel(tipoAtendimento) },
            { label: "Indicação de acidente", value: acidenteLabel(indicacaoAcidente) },
          ],
        },
        {
          title: T.beneficiario,
          items: [
            { label: "Nome", value: pacienteNome },
            { label: "Nº da carteira", value: pacienteCarteira },
            { label: "Nascimento", value: pacienteNascimento },
            { label: "CPF", value: pacienteCpf },
            { label: "Sexo", value: pacienteSexo },
          ],
        },
        {
          title: T.solicitante,
          items: [
            { label: "Profissional", value: medicoNome },
            { label: "Conselho / número", value: `${profissional.conselho} ${medicoCrm}`.trim() },
            { label: "UF do conselho", value: conselhoUf },
            { label: "CBO", value: codigoCbo },
            { label: "Contratado solicitante", value: contratadoSolicitante },
            { label: "Data da solicitação", value: fmtDate(dataSolicitacao) },
          ],
        },
        {
          title: T.clinico,
          items: [
            { label: "CID principal", value: cidPrincipal },
            { label: "Indicação clínica", value: indicacaoClinica },
            { label: "Observações", value: observacoes },
          ],
        },
        {
          title: T.procedimentos,
          items: filledProcedures.map((p, index) => ({
            label: `Procedimento ${index + 1}`,
            value: `${p.code} — ${p.description} (qtde. ${p.quantity})`,
          })),
        },
        {
          title: T.totais,
          items: [
            { label: "Total de procedimentos", value: formatMoney(totalProcedimentos) },
            { label: "Total geral", value: formatMoney(totalGeral) },
          ],
        },
      ],
    };
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
      // O campo 2 é gerado aqui, no momento da criação/salvamento da guia.
      const numero = nextGuiaNumber(operadora);
      setNumeroGuia(numero);
      const issuedAt = new Date();
      // A guia é salva automaticamente como emitida — sem passo manual de salvar.
      const saved = addIssuedGuide(buildIssuedGuide(numero, issuedAt));
      setIssuedGuide(saved);
      setPreview({
        numero,
        tipo: guideLabel,
        createdAt: issuedAt.toLocaleString("pt-BR"),
      });
      toast.success("Guia gerada e salva em Guias emitidas", {
        description: `Nº ${numero} — ${guideLabel}`,
      });
    }, 700);
  };

  const handleReset = () => {
    setPacienteNome("");
    setPacienteCarteira("");
    setPacienteValidadeCarteira("");
    setPacienteCpf("");
    setPacienteNascimento("");
    setCidPrincipal("");
    setIndicacaoClinica("");
    setObservacoes("");
    setProcedures([{ id: crypto.randomUUID(), code: "", description: "", quantity: 1 }]);
    setNumeroGuia("");
    toast.info("Formulário limpo");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar activeKey="emitir" />

      <main className="flex-1 overflow-x-hidden flex flex-col min-h-screen">
        <div className="w-full flex-1 space-y-6 px-4 py-6 pb-16 pt-20 sm:px-6 sm:py-8 md:pt-8 lg:px-10">
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
                            <Badge
                              variant={active ? "primary-soft" : "outline"}
                              size="sm"
                              className="mt-3 self-start uppercase tracking-wide"
                            >
                              {g.badge}
                            </Badge>

                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>
              </TabsContent>
            ))}
          </Tabs>

          {guideKind === "internacao" && convenioId === "tiss" ? (
            <InternacaoGuideForm
              numeroGuia={numeroGuia}
              registroAns={registroAns}
              operadora={operadora}
              operadoras={OPERADORAS}
              onOperadoraChange={(value, ans) => {
                setOperadora(value);
                setRegistroAns(ans);
              }}
              header={
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-primary rounded-full" />
                  <div className="min-w-0 flex-1">
                    <p className="text-eyebrow">
                      Formulário de emissão
                    </p>
                    <p className="text-sm font-semibold truncate">{guideHeaderTitle}</p>
                  </div>
                </div>
              }
            />
          ) : null}

          {guideKind === "apac" && convenioId === "sus" ? (
            <ApacGuideForm
              header={
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-primary rounded-full" />
                  <div className="min-w-0 flex-1">
                    <p className="text-eyebrow">
                      Formulário de emissão
                    </p>
                    <p className="text-sm font-semibold truncate">{guideHeaderTitle}</p>
                  </div>
                </div>
              }
            />
          ) : null}

          {guideKind === "aih" && convenioId === "sus" ? (
            <AihGuideForm
              header={
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-primary rounded-full" />
                  <div className="min-w-0 flex-1">
                    <p className="text-eyebrow">
                      Formulário de emissão
                    </p>
                    <p className="text-sm font-semibold truncate">{guideHeaderTitle}</p>
                  </div>
                </div>
              }
            />
          ) : null}

          {guideKind &&
            !(guideKind === "internacao" && convenioId === "tiss") &&
            !(guideKind === "apac" && convenioId === "sus") &&
            !(guideKind === "aih" && convenioId === "sus") && (


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
                  <p className="text-eyebrow">
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
                  title={T.convenio}
                  description="Campos 1 a 7 da guia — operadora responsável, autorização e senha."
                >
                  <Grid cols={12}>
                    <Field
                      label="Operadora / Convênio"
                      required
                      span="@md:col-span-6 @3xl:col-span-7"
                    >

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

                    <Field
                      label="1 - Registro ANS"
                      span="@md:col-span-6 @3xl:col-span-5"
                      hint="Preenchido automaticamente pela operadora selecionada."
                    >
                      <Input
                        value={registroAns}
                        readOnly
                        aria-readonly="true"
                        tabIndex={-1}
                        placeholder="—"
                        className="font-mono bg-muted text-muted-foreground cursor-default focus-visible:ring-0"
                      />
                    </Field>

                  </Grid>


                  <Collapsible
                    open={autorizacaoOpen}
                    onOpenChange={setAutorizacaoOpen}
                    className="mt-4 border-t pt-4"
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full justify-between sm:w-auto"
                        aria-expanded={autorizacaoOpen}
                      >
                        <span>Autorização da Operadora (Opcional)</span>
                        <ChevronRight
                          className={`transition-transform ${autorizacaoOpen ? "rotate-90" : ""}`}
                          aria-hidden
                        />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-4">
                      <Grid cols={12}>
                        {guideKind === "internacao" && (
                          <Field label="3 - Número da Guia Principal" span="@md:col-span-6 @3xl:col-span-4">
                            <Input
                              value={guiaPrincipal}
                              onChange={(e) => setGuiaPrincipal(e.target.value)}
                              placeholder="Número da guia a vincular"
                            />
                          </Field>
                        )}
                        <Field label="4 - Data da Autorização" span="@md:col-span-4 @3xl:col-span-4">
                          <Input
                            type="date"
                            value={dataAutorizacao}
                            onChange={(e) => setDataAutorizacao(e.target.value)}
                          />
                        </Field>
                        <Field label="5 - Senha" span="@md:col-span-4 @3xl:col-span-4">
                          <Input
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            placeholder="Senha de autorização"
                          />
                        </Field>
                        <Field label="6 - Data de Validade da Senha" span="@md:col-span-4 @3xl:col-span-4">
                          <Input
                            type="date"
                            value={validadeSenha}
                            onChange={(e) => setValidadeSenha(e.target.value)}
                          />
                        </Field>
                        <Field label="7 - Número da Guia Atribuído pela Operadora" span="@md:col-span-6 @3xl:col-span-4">
                          <Input
                            value={guiaOperadora}
                            onChange={(e) => setGuiaOperadora(e.target.value)}
                            placeholder="Informado pela operadora"
                          />
                        </Field>
                      </Grid>
                    </CollapsibleContent>
                  </Collapsible>



                </Section>
              ) : (
                <Section
                  number={stepNumber("convenio")}
                  done={convenioOk}
                  icon={<Building2 className="h-4 w-4" />}
                  title={T.estabelecimento}
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
                      value={internacaoTipo}
                      onValueChange={setInternacaoTipo}
                      options={["Clínica", "Cirúrgica", "Obstétrica", "Pediátrica", "Psiquiátrica"].map((o) => ({ value: o, label: o }))}
                    />
                    <SelectField
                      label="Regime"
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
                description="Campos 8 a 12 e 89 da guia — identificação do beneficiário na operadora."
              >
                <Grid cols={12}>
                  <Field
                    label="8 - Número da Carteira"
                    required
                    span="@md:col-span-6 @3xl:col-span-5"
                  >
                    <Input
                      value={pacienteCarteira}
                      onChange={(e) => setPacienteCarteira(e.target.value.slice(0, 20))}
                      placeholder="0000 0000 0000 0000"
                      maxLength={20}
                      className="font-mono"
                    />
                  </Field>

                  {/* 9 e 11 são condicionados no TISS: sem asterisco, preenchimento manual. */}
                  <Field
                    label="9 - Validade da Carteira"
                    span="@md:col-span-6 @3xl:col-span-3"
                    hint="Formato dd/mm/aaaa."
                  >
                    <Input
                      type="date"
                      value={pacienteValidadeCarteira}
                      onChange={(e) => setPacienteValidadeCarteira(e.target.value)}
                    />
                  </Field>

                  <Field
                    label="89 - Nome Social"
                    span="@md:col-span-6 @3xl:col-span-4"
                    hint="Preencha apenas quando solicitado pelo beneficiário (Decreto nº 8.727/2016)."
                  >
                    <Input
                      value={pacienteNomeSocial}
                      onChange={(e) => setPacienteNomeSocial(e.target.value.slice(0, 70))}
                      placeholder="Nome social do beneficiário"
                      maxLength={70}
                    />
                  </Field>

                  <Field
                    label="10 - Nome"
                    required
                    span="@md:col-span-6 @3xl:col-span-4"
                  >
                    <Input
                      value={pacienteNome}
                      onChange={(e) => setPacienteNome(e.target.value)}
                      placeholder="Nome completo"
                    />
                  </Field>




                  <SelectField
                    label="12 - Atendimento a RN"
                    required
                    className="@md:col-span-6 @3xl:col-span-4"
                    value={pacienteRn}
                    onValueChange={setPacienteRn}
                    options={[
                      { value: "S", label: "S - Sim" },
                      { value: "N", label: "N - Não" },
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
                description="Campos 13 a 20 — preenchidos pelos cadastros do estabelecimento e do profissional."
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


                <Grid cols={12}>
                  <Field
                    label="13 - Código na Operadora"
                    span="@md:col-span-2 @3xl:col-span-3"
                  >
                    <Input
                      value={codigoSolicitante}
                      onChange={(e) => setCodigoSolicitante(e.target.value)}
                      placeholder="Código"
                      className="font-mono"
                    />
                  </Field>
                  <Field label="14 - Nome do Contratado" span="@md:col-span-4 @3xl:col-span-9">
                    <Input
                      value={contratadoSolicitante}
                      readOnly
                      aria-readonly
                      tabIndex={-1}
                      className="bg-muted/50 text-foreground"
                    />
                  </Field>
                </Grid>

                <div className="mt-4 border-t pt-4">
                  <ProfessionalRegistryField
                    value={profissional}
                    onChange={setProfissional}
                  />
                </div>


                <div className="mt-5 border-t pt-5">
                  <SignatureField
                    label="20 - Assinatura do Profissional Solicitante"
                    value={assinaturaSolicitante}
                    onChange={setAssinaturaSolicitante}
                    hint="Obrigatório na guia: assinatura do profissional solicitante. Desenhe ou envie a imagem para sair impressa no campo 20, ou assine à mão no papel."

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
                description="Campos 21 a 28 e 90 — data e códigos preenchidos automaticamente pelo sistema."

              >
                <Grid cols={2}>
                  <SelectField
                    label="21 - Caráter do Atendimento"
                    hint="Código conforme tabela de domínio nº 23. Ex.: 1 (Eletivo)."
                    value={character}
                    onValueChange={setCharacter}
                    options={CHARACTER_OPTIONS}
                  />
                  <Field
                    label="22 - Data da Solicitação"
                    hint="Data em que o profissional realizou a solicitação"
                  >
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

                <SelectField
                  label="90 - Indicador de Cobertura Especial"
                  hint="Opcional — conforme tabela de domínio nº 75. Preencha em atendimento ambulatorial de plano exclusivamente hospitalar, a gestantes ou no pré e pós-operatório."
                  className="@md:max-w-xs"
                  value={coberturaEspecial}
                  onValueChange={setCoberturaEspecial}
                  placeholder="Selecione"
                  options={[...COBERTURA_ESPECIAL_OPTIONS]}
                />





                {/* Procedimentos solicitados (24 a 28) */}
                <div className="mt-5 border-t pt-5 space-y-3 @container">
                  <div className="flex flex-col gap-2 @md:flex-row @md:items-center @md:justify-between">
                    <h4 className="min-w-0 text-sm font-medium">
                      Procedimentos solicitados
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        Campos 24 a 28
                      </span>
                    </h4>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={clearProcedures}
                        className="flex-1 justify-center @md:flex-none"
                      >
                        Limpar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={addProcedure}
                        className="flex-1 justify-center @md:flex-none"
                      >
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
                    Busque por <strong>descrição</strong> (campo 26) — o
                    código (25) e a tabela (24) são preenchidos automaticamente.
                  </p>


                  {/* Rótulos das colunas (campos 25 a 27) — visíveis no desktop */}
                  <div
                    data-testid="proc-solic-headers"
                    className="hidden @3xl:grid @3xl:grid-cols-[1.5rem_minmax(0,1fr)_7rem_6rem_2.25rem] items-end gap-2 text-xs font-medium text-muted-foreground"
                  >
                    <div />
                    <div className="whitespace-nowrap" data-testid="proc-solic-header-26">
                      26 - Descrição <span className="text-destructive">*</span>
                    </div>
                    <div className="whitespace-nowrap" data-testid="proc-solic-header-25">
                      25 - Código
                    </div>
                    <div className="whitespace-nowrap text-center" data-testid="proc-solic-header-27">
                      27 - Qtde. <span className="text-destructive">*</span>
                    </div>

                    <div />
                  </div>





                  <div className="space-y-3 @3xl:space-y-2">
                    {procedures.map((p, idx) => (
                      <div
                        key={p.id}
                        draggable
                        onDragStart={() => onDragStart(p.id)}
                        onDragOver={onDragOver}
                        onDrop={() => onDrop(p.id)}
                        className={cn(
                          "rounded-lg border p-3 @3xl:grid @3xl:grid-cols-[1.5rem_minmax(0,1fr)_7rem_6rem_2.25rem] @3xl:items-center @3xl:gap-2 @3xl:rounded-none @3xl:border-0 @3xl:p-0",
                          dragId === p.id && "opacity-50",
                        )}
                      >
                        {/* Handle + remover (mobile: linha superior) */}
                        <div className="mb-2 flex items-center justify-between @3xl:mb-0 @3xl:contents">
                          <div className="flex cursor-grab items-center justify-center text-muted-foreground active:cursor-grabbing">
                            <GripVertical className="h-4 w-4" />
                            <span className="ml-1 text-xs font-medium @3xl:hidden">
                              Item {idx + 1}
                            </span>
                          </div>
                          <div className="@3xl:hidden">
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

                        {/*
                          Campo 24 - Tabela não é exibido: o sistema o resolve a partir do
                          procedimento escolhido e o envia na guia (PDF/XML).
                        */}

                        {/* Descrição (campo 26) — busca única por descrição */}
                        <FormField
                          label="26 - Descrição (buscar por descrição)"
                          required
                          labelClassName="@3xl:hidden"
                          className="min-w-0 @3xl:space-y-0"
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
                                // Campos 25 e 24 preenchidos a partir da seleção.
                                code: item ? item.codigo : "",
                                description: item ? item.descricao : "",
                                table: item ? resolveTissTable(item.codigo) : "",
                              });
                            }}
                            options={TUSS_OPTIONS}
                            placeholder={p.description || "Buscar procedimento pela descrição"}
                            searchPlaceholder="Digite a descrição do procedimento..."
                            emptyMessage="Nenhum procedimento encontrado."
                            clearable
                          />
                        </FormField>

                        {/* Código do procedimento (campo 25) — somente leitura */}
                        <FormField
                          label="25 - Código"
                          labelClassName="@3xl:hidden"
                          className="mt-3 min-w-0 @3xl:mt-0 @3xl:space-y-0"
                        >
                          <Input
                            value={p.code}
                            readOnly
                            aria-readonly
                            tabIndex={-1}
                            aria-label="25 - Código do Procedimento ou Item Assistencial"
                            placeholder="—"
                            className="bg-muted/50 font-mono text-foreground"
                          />
                        </FormField>

                        {/* Quantidade solicitada (campo 27) */}
                        <FormField
                          label="27 - Qtde. Solic."
                          required
                          labelClassName="@3xl:hidden"
                          className="mt-3 @3xl:mt-0 @3xl:space-y-0"
                        >
                          <Input
                            type="number"
                            min={1}
                            aria-label="27 - Qtde. Solic."
                            className="text-center"
                            value={p.quantity}
                            onChange={(e) =>
                              updateProcedure(p.id, {
                                quantity: Math.max(1, Number(e.target.value) || 1),
                              })
                            }
                          />
                        </FormField>







                        <div className="hidden @3xl:flex @3xl:justify-end">
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



              {/* Dados do Atendimento */}
              <Section
                number={stepNumber("atendimento")}
                done={atendimentoOk}
                icon={<ClipboardList className="h-4 w-4" />}
                title="Dados do Atendimento"
                description="Campos 32 a 35, 91 e 92 da guia — exibidos conforme o tipo de atendimento."
              >
                <Grid cols={2}>
                  <SelectField
                    className={ATENDIMENTO_FIELD_CLASS}
                    labelClassName={ATENDIMENTO_LABEL_CLASS}
                    triggerClassName={ATENDIMENTO_TRIGGER_CLASS}
                    label="32 - Tipo de Atendimento"
                    required
                    value={tipoAtendimento}
                    onValueChange={setTipoAtendimento}
                    placeholder="Selecione"
                    options={TIPO_ATENDIMENTO_OPTIONS}

                  />
                  <SelectField
                    className={ATENDIMENTO_FIELD_CLASS}
                    labelClassName={ATENDIMENTO_LABEL_CLASS}
                    triggerClassName={ATENDIMENTO_TRIGGER_CLASS}
                    label="33 - Indicação de Acidente"
                    required
                    value={indicacaoAcidente}
                    onValueChange={setIndicacaoAcidente}
                    placeholder="Selecione"
                    hint="Preenchido com “Não acidente”; altere apenas quando houver acidente ou doença relacionada."
                    options={ACIDENTE_OPTIONS}
                  />
                  {isConsulta && (
                    <SelectField
                      className={ATENDIMENTO_FIELD_CLASS}
                      labelClassName={ATENDIMENTO_LABEL_CLASS}
                      triggerClassName={ATENDIMENTO_TRIGGER_CLASS}
                      label="34 - Tipo de Consulta"
                      value={tipoConsulta}
                      onValueChange={setTipoConsulta}
                      placeholder="Selecione"
                      options={[...TIPO_CONSULTA_OPTIONS]}
                    />
                  )}
                  <SelectField
                    className={ATENDIMENTO_FIELD_CLASS}
                    labelClassName={ATENDIMENTO_LABEL_CLASS}
                    triggerClassName={ATENDIMENTO_TRIGGER_CLASS}
                    label="35 - Motivo de Encerramento do Atendimento"
                    value={motivoEncerramento}
                    onValueChange={setMotivoEncerramento}
                    placeholder="Selecione"
                    hint="Preencher no encerramento do atendimento."
                    options={[...MOTIVO_ENCERRAMENTO_OPTIONS]}
                  />
                  <SelectField
                    className={ATENDIMENTO_FIELD_CLASS}
                    triggerClassName={ATENDIMENTO_TRIGGER_CLASS}
                    label="91 - Regime de atendimento"
                    required
                    value={regimeAtendimento}
                    onValueChange={setRegimeAtendimento}
                    placeholder="Selecione"
                    hint="Conforme tabela de domínio nº 76."
                    options={[...REGIME_ATENDIMENTO_OPTIONS]}
                  />
                  <SelectField
                    className={ATENDIMENTO_FIELD_CLASS}
                    triggerClassName={ATENDIMENTO_TRIGGER_CLASS}
                    label="92 - Saúde Ocupacional"
                    value={saudeOcupacional}
                    onValueChange={setSaudeOcupacional}
                    placeholder="Selecione"
                    hint="Opcional — conforme tabela de domínio nº 77; preencha apenas em atendimentos de saúde ocupacional."
                    options={[...SAUDE_OCUPACIONAL_OPTIONS]}
                  />
                </Grid>
              </Section>


              {/* Dados da Execução — Procedimentos e Exames Realizados */}
              <Section
                number={stepNumber("realizados")}
                done={realizadosOk}
                icon={<ClipboardList className="h-4 w-4" />}
                title="Dados da Execução"
                description="Campos 36 a 47 da guia — busque o procedimento realizado; os demais dados são automáticos."
                collapsible
                open={execOpen}
                onOpenChange={setExecOpen}

                action={
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={importSolicitedProcedures}
                    >
                      Copiar solicitados
                    </Button>
                    <Button type="button" size="sm" onClick={addExecuted}>
                      <Plus className="h-4 w-4" /> Adicionar procedimento
                    </Button>
                  </div>
                }
              >
                {executedItems.length === 0 ? (
                  <EmptyState
                    size="sm"
                    title="Nenhum procedimento realizado"
                    description="Adicione os procedimentos executados ou copie os solicitados."
                    icon={<ClipboardList className="h-8 w-8" />}
                  />
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Busque por <strong>descrição</strong> (campo 41) — o código
                      (40) e a tabela (39) são preenchidos automaticamente. A{" "}
                      <strong>data (36)</strong> vem da realização e pode ser ajustada.
                    </p>

                    {executedItems.map((item, idx) => (
                      <div key={item.id} className="rounded-lg border p-3">
                        {/* Linha 1 — descrição (campo 41) em largura total */}
                        <div className="flex items-end gap-2">
                          <FormField
                            label={`41 - Descrição — procedimento ${idx + 1}`}
                            required
                            className="min-w-0 flex-1"
                          >
                            <Combobox
                              value={
                                TUSS.some((t) => t.descricao === item.description)
                                  ? TUSS.find((t) => t.descricao === item.description)!.codigo
                                  : ""
                              }
                              onChange={(codigo) => {
                                const tuss = TUSS.find((t) => t.codigo === codigo);
                                updateExecuted(item.id, {
                                  // Campos 40 e 39 preenchidos a partir da seleção.
                                  code: tuss ? tuss.codigo : "",
                                  description: tuss ? tuss.descricao : "",
                                  table: tuss ? resolveTissTable(tuss.codigo) : "",
                                });
                              }}
                              options={TUSS_OPTIONS}
                              placeholder={
                                item.description || "Buscar procedimento pela descrição"
                              }
                              searchPlaceholder="Digite a descrição do procedimento..."
                              emptyMessage="Nenhum procedimento encontrado."
                              clearable
                            />
                          </FormField>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={() => removeExecuted(item.id)}
                            aria-label={`Remover procedimento realizado ${idx + 1}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        {/* Linha 2 — código, quantidade, data e horários lado a lado */}
                        <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-4">
                          <FormField label="40 - Código" className="w-[110px] shrink-0">
                            <Input
                              value={item.code}
                              readOnly
                              aria-readonly
                              tabIndex={-1}
                              aria-label="40 - Código do Procedimento"
                              placeholder="—"
                              className="bg-muted/50 font-mono text-foreground"
                            />
                          </FormField>

                          <FormField label="42 - Qtde." className="w-[74px] shrink-0">
                            <Input
                              type="number"
                              min={1}
                              aria-label="42 - Quantidade realizada"
                              className="text-center"
                              value={item.quantity}
                              onChange={(e) =>
                                updateExecuted(item.id, {
                                  quantity: Math.max(1, Number(e.target.value) || 1),
                                })
                              }
                            />
                          </FormField>

                          <FormField label="36 - Data" className="w-[150px] shrink-0">
                            <Input
                              type="date"
                              aria-label="36 - Data da realização"
                              value={item.date}
                              onChange={(e) => updateExecuted(item.id, { date: e.target.value })}
                            />
                          </FormField>

                          {executionTimeVisible && (
                            <>
                              <FormField label="37 - Hora Ini." className="w-[110px] shrink-0">
                                <Input
                                  type="time"
                                  aria-label="37 - Hora Inicial"
                                  value={item.startTime}
                                  onChange={(e) =>
                                    updateExecuted(item.id, { startTime: e.target.value })
                                  }
                                />
                              </FormField>
                              <FormField label="38 - Hora Fim" className="w-[110px] shrink-0">
                                <Input
                                  type="time"
                                  aria-label="38 - Hora Final"
                                  value={item.endTime}
                                  onChange={(e) =>
                                    updateExecuted(item.id, { endTime: e.target.value })
                                  }
                                />
                              </FormField>
                            </>
                          )}

                          {!requiresExecutionTime && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="shrink-0"
                              onClick={() => setShowExecutionTime((v) => !v)}
                            >
                              {showExecutionTime
                                ? "Ocultar horários (37/38)"
                                : "Registrar horários (37/38)"}
                            </Button>
                          )}
                        </div>

                        {/* Campos 43 e 44 — opcionais, apenas para procedimento cirúrgico */}
                        <Collapsible
                          open={Boolean(surgicalOpen[item.id])}
                          onOpenChange={(o) =>
                            setSurgicalOpen((s) => ({ ...s, [item.id]: o }))
                          }
                          className="mt-4 border-t pt-3"
                        >
                          <CollapsibleTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full justify-between sm:w-auto"
                              aria-expanded={Boolean(surgicalOpen[item.id])}
                            >
                              <span>Dados cirúrgicos (opcional)</span>
                              <ChevronRight
                                className={`transition-transform ${surgicalOpen[item.id] ? "rotate-90" : ""}`}
                                aria-hidden
                              />
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pt-3">
                            <p className="mb-2 text-xs text-muted-foreground">
                              Preencher apenas para procedimento cirúrgico.
                            </p>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <SelectField
                                label="43 - Via"
                                hint="Via de acesso"
                                value={item.via}
                                onValueChange={(v) => updateExecuted(item.id, { via: v })}
                                placeholder="Selecione"
                                options={VIA_ACESSO_OPTIONS}
                              />
                              <SelectField
                                label="44 - Tec."
                                hint="Técnica utilizada"
                                value={item.technique}
                                onValueChange={(v) => updateExecuted(item.id, { technique: v })}
                                placeholder="Selecione"
                                options={TECNICA_OPTIONS}
                              />
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>

                    ))}
                  </div>

                )}


              </Section>

              {/* Identificação do(a) Profissional Executante (campos 48 a 55) */}
              <Section
                number={stepNumber("executantes")}
                done={executantesOk}
                icon={<Stethoscope className="h-4 w-4" />}
                title="Identificação do(s) Profissional(is) Executante(s)"
                description="Selecione o profissional — conselho, número, UF e CBO são preenchidos automaticamente."
                collapsible
                open={execProfOpen}
                onOpenChange={setExecProfOpen}

                action={
                  <Button type="button" size="sm" onClick={addExecutante}>
                    <Plus className="h-4 w-4" /> Adicionar profissional
                  </Button>
                }
              >
                {executantes.length === 0 ? (
                  <EmptyState
                    size="sm"
                    title="Nenhum profissional executante"
                    description="Adicione o profissional que executou os procedimentos."
                    icon={<Stethoscope className="h-8 w-8" />}
                  />
                ) : (
                  <div className="space-y-3">
                    {executantes.map((ex, idx) => (
                      <div key={ex.id} className="rounded-md border p-3 @container">
                        <div className="grid grid-cols-1 items-end gap-3 @md:grid-cols-12">
                          <div className={participationVisible ? "@md:col-span-7" : "@md:col-span-11"}>
                            <SelectField
                              label={`51 - Profissional executante ${executantes.length > 1 ? idx + 1 : ""}`.trim()}
                              value={ex.professionalId}
                              onValueChange={(v) => selectExecutanteProfessional(ex.id, v)}
                              placeholder="Selecione o profissional"
                              options={PROFESSIONALS.map((p) => ({
                                value: p.id,
                                label: `${p.nome} — ${p.conselho} ${p.numero}/${p.uf}`,
                              }))}
                            />
                          </div>
                          {participationVisible && (
                            <div className="@md:col-span-4">
                              <SelectField
                                label="49 - Grau Part."
                                value={ex.participation}
                                onValueChange={(v) => updateExecutante(ex.id, { participation: v })}
                                placeholder="Selecione"
                                options={GRAU_PARTICIPACAO_OPTIONS}
                              />
                            </div>
                          )}
                          <div className="flex justify-end @md:col-span-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeExecutante(ex.id)}
                              aria-label={`Remover profissional executante ${idx + 1}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>

                        {ex.professionalId && (
                          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 rounded-md bg-muted/40 p-3 text-xs @md:grid-cols-4">
                            {[
                              { label: "50 - Cód. na Operadora / CPF", value: ex.operatorCode },
                              { label: "52 - Conselho", value: ex.council },
                              { label: "53 - Nº no Conselho", value: ex.councilNumber },
                              { label: "54 - UF", value: ex.uf },
                              { label: "55 - Código CBO", value: ex.cbo },
                            ].map((f) => (
                              <div key={f.label}>
                                <dt className="text-muted-foreground">{f.label}</dt>
                                <dd className="font-mono text-foreground">{f.value || "—"}</dd>
                              </div>
                            ))}
                          </dl>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {executantes.length === 1 && !showParticipation && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setShowParticipation(true)}
                  >
                    Informar grau de participação (49)
                  </Button>
                )}

                <div className="mt-4 border-t pt-4 @container">
                  {!showSerieDates ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSerieDates(true)}
                    >
                      Procedimento seriado — informar datas (56)
                    </Button>
                  ) : (
                    <>
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          56 - Data de Realização de Procedimentos em Série
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowSerieDates(false);
                            setSerieDates([""]);
                          }}
                        >
                          Ocultar
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2 @2xl:grid-cols-4">
                        {serieDates.map((d, i) => (
                          <Field key={i} label={`${i + 1}ª data`}>
                            <div className="flex items-center gap-2">
                              <Input
                                type="date"
                                value={d}
                                onChange={(e) =>
                                  setSerieDates((l) =>
                                    l.map((v, j) => (j === i ? e.target.value : v)),
                                  )
                                }
                              />
                              {serieDates.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Remover ${i + 1}ª data`}
                                  onClick={() =>
                                    setSerieDates((l) => l.filter((_, j) => j !== i))
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </Field>
                        ))}
                      </div>
                      {serieDates.length < 10 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={() => setSerieDates((l) => [...l, ""])}
                        >
                          <Plus className="h-4 w-4" /> Adicionar data
                        </Button>
                      )}
                    </>
                  )}
                </div>

              </Section>


              {/* Observação / Justificativa */}

              <Section
                number={stepNumber("observacao")}
                done={observacaoOk}
                icon={<FileText className="h-4 w-4" />}
                title={T.observacao}
                description="Campo 58 — informações complementares ou justificativa clínica (opcional)."
              >
                <FormField
                  label="58 - Observação / Justificativa"
                  hint="Texto livre impresso no campo 58 da guia."
                >
                  <Textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Descreva observações ou a justificativa clínica do procedimento."
                    rows={4}
                  />
                </FormField>
              </Section>

              {/* Campos 59 a 65: totais calculados automaticamente pelo sistema
                  e enviados no XML/PDF da guia, sem exibição na emissão. */}




              {/* Barra de ação padrão: etapas + ações */}
              <FormActionBar
                stepsLabel="Etapas preenchidas"
                steps={[
                  {
                    label: convenioId === "tiss" ? T.convenio : T.estabelecimento,
                    done: convenioOk,
                  },
                  ...(guideKind === "internacao"
                    ? [{ label: "Internação", done: especificoOk }]
                    : []),
                  ...(guideKind === "apac" ? [{ label: "APAC", done: especificoOk }] : []),
                  ...(guideKind === "aih" ? [{ label: "AIH", done: especificoOk }] : []),
                  { label: T.beneficiario, done: pacienteOk },
                  { label: T.solicitante, done: profissionalOk },
                  { label: T.solicitacao, done: clinicoOk && procedimentosOk },
                  
                  { label: T.atendimento, done: atendimentoOk },
                  { label: T.execucao, done: realizadosOk },
                  { label: T.executante, done: executantesOk },
                  { label: `${T.observacao} (opcional)`, done: observacaoOk },
                  


                  
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
        <DialogContent className="max-w-[1200px] w-[95vw] max-h-[95vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" /> Pré-visualização da guia
            </DialogTitle>
          </DialogHeader>
          {guideKind && (
            <ScaledGuideSheet fit="width">
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
              tipoConsulta={isConsulta ? tipoConsulta : ""}
              motivoEncerramento={motivoEncerramento}
              pacienteValidadeCarteira={pacienteValidadeCarteira}
              pacienteNomeSocial={pacienteNomeSocial}
              coberturaEspecial={coberturaEspecial}
              regimeAtendimento={regimeAtendimento}
              saudeOcupacional={saudeOcupacional}
              pacienteRn={pacienteRn}
              assinaturaSolicitante={assinaturaSolicitante}
              totais={[
                formatMoney(totalProcedimentos),
                totalTaxas,
                totalMateriais,
                totalOpme,
                totalMedicamentos,
                totalGases,
                formatMoney(totalGeral),
              ]}
              assinaturaAutorizacao={assinaturaAutorizacao}
              assinaturaBeneficiarioFinal={assinaturaBeneficiarioFinal}
              assinaturaContratado={assinaturaContratado}

              fullSize
            />
            </ScaledGuideSheet>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Guia gerada e salva automaticamente
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
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
          </DialogBody>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end sm:gap-2 [&>button]:w-full [&>button]:justify-center sm:[&>button]:w-auto">
            <Button
              variant="outline"
              disabled={!profissionalValido}
              aria-describedby={profissionalValido ? undefined : "print-disabled-hint"}
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/guias-emitidas" })}
            >
              <FileText className="h-4 w-4" /> Ver em Guias emitidas
            </Button>
            <Button
              disabled={!profissionalValido || !issuedGuide}
              aria-describedby={profissionalValido ? undefined : "print-disabled-hint"}
              onClick={() => {
                if (!issuedGuide) return;
                downloadIssuedGuide(issuedGuide);
                toast.success("Download da guia iniciado");
              }}
            >
              <Download className="h-4 w-4" /> Baixar guia
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
  collapsible,
  defaultCollapsed,
  open,
  onOpenChange,
  children,
}: {
  number?: number;
  done?: boolean;
  icon: React.ReactNode;
  title: React.ReactNode;
  description?: string;
  action?: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
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
      collapsible={collapsible}
      defaultCollapsed={defaultCollapsed}
      open={open}
      onOpenChange={onOpenChange}
    >
      {children}
    </BaseSectionCard>
  );
}


function Grid({ cols, children }: { cols: 2 | 3 | 12; children: React.ReactNode }) {
  const colsClass =
    cols === 2
      ? "grid-cols-1 @md:grid-cols-2"
      : cols === 3
        ? "grid-cols-1 @md:grid-cols-2 @3xl:grid-cols-3"
        : // Grade de 12 colunas: permite campos curtos (datas, códigos) ocuparem
          // apenas a largura necessária, deixando a seção mais compacta.
          "grid-cols-1 @md:grid-cols-6 @3xl:grid-cols-12";
  return (
    <div className="@container">
      <div className={`grid items-start gap-x-4 gap-y-3 ${colsClass}`}>{children}</div>
    </div>
  );
}


function Field({
  label,
  required,
  hint,
  span,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  /** Classes de col-span (container queries) quando usado em `Grid cols={12}`. */
  span?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("min-w-0 space-y-1.5", span, className)}>
      <Label className="text-xs font-medium text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`min-w-0 flex-1 break-words text-right font-medium ${mono ? "font-mono" : ""}`}
      >
        {value || "—"}
      </span>
    </div>
  );
}


