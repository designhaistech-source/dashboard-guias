import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState, useEffect } from "react";
import {
  Pill,
  Settings2,
  Search,
  User,
  X,
  Plus,
  Check,
  Printer,
  Save,
  Link2,
  Download,
  GripVertical,
  History,
  RefreshCw,
  Trash2,
  
  BookMarked,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Star,
  ShieldAlert,
  Shield,
  ArrowUp,
  CircleDashed,
} from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MultiSelect } from "@/components/ui/combobox";


import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, SearchInput, SelectField } from "@/components/form-field";
import { PageHeader } from "@/components/page-header";
import { SavedIndicator } from "@/components/saved-indicator";

import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { StatusPill } from "@/components/status-pill";
import { EmptyState } from "@/components/data-state";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { KitsModal } from "@/components/kits-modal";
import { consumirKitParaAplicar, upsertKit, type Kit } from "@/lib/kits";
import logoAsset from "@/assets/haisguias-logo.png.asset.json";

async function loadImageDataUrl(url: string): Promise<{ dataUrl: string; w: number; h: number }> {
  const res = await fetch(url);
  const blob = await res.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
  const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = reject;
    img.src = dataUrl;
  });
  return { dataUrl, ...dims };
}


export const Route = createFileRoute("/prescricao")({
  head: () => ({
    meta: [
      { title: "HaisGuias — Prescrição médica" },
      {
        name: "description",
        content:
          "Prescreva medicamentos com busca, posologia guiada e receituário especial para substâncias controladas.",
      },
    ],
  }),
  component: PrescricaoPage,
});

type MedType =
  | "Biológico"
  | "Similar"
  | "Genérico"
  | "Referência"
  | "Fitoterápico"
  | "Oftalmológico"
  | "Específico";

type Medicamento = {
  nome: string;
  forma: string;
  fabricante: string;
  tipo: MedType;
  preco: number;
  principios: string;
  classe: string;
  favorito?: boolean;
  alerta?: boolean;
  /** Substância sob controle especial (Portaria 344/98). Exige receituário próprio com CPF e endereço. */
  controlado?: boolean;
};

type ItemReceita = {
  med: Medicamento;
  posologia: string;
};

const MEDICAMENTOS: Medicamento[] = [
  {
    nome: "APRACUR 1mg + 100mg + 50mg",
    forma: "comprimidos revestidos, 150 un",
    fabricante: "COSMED INDUSTRIA DE COSMETICOS E MEDICAMENTOS",
    tipo: "Referência",
    preco: 302.46,
    principios: "MALEATO DE CLORFENIRAMINA + DIPIRONA + ÁCIDO ASCÓRBICO",
    classe: "ANTIGRIPAIS SEM ANTIINFECCIOSOS",
    favorito: true,
  },
  {
    nome: "BENEGRIP 250mg + 30mg + 250mg + 2mg",
    forma: "comprimidos revestidos",
    fabricante: "COSMED INDUSTRIA DE COSMETICOS E MEDICAMENTOS",
    tipo: "Referência",
    preco: 27.47,
    principios: "MALEATO DE CLORFENIRAMINA + DIPIRONA MONOIDRATADA + CAFEÍNA ANIDRA",
    classe: "ANTIGRIPAIS SEM ANTIINFECCIOSOS",
    favorito: true,
  },
  {
    nome: "BROMETO DE N-BUTIL ESCOPOLAMINA + DIPIRONA SODICA 6.67mg/ml + 333.4mg/ml",
    forma: "Solução, 20 ML",
    fabricante: "EMS",
    tipo: "Genérico",
    preco: 11.59,
    principios: "BUTILBROMETO DE ESCOPOLAMINA + DIPIRONA",
    classe: "ASSOCIAÇÕES DE ANTIESPASMÓDICOS COM ANALGÉSICOS",
  },
  {
    nome: "BUSCOPAN COMPOSTO",
    forma: "Solução para infusão, 5 ML",
    fabricante: "COSMED INDUSTRIA DE COSMETICOS E MEDICAMENTOS",
    tipo: "Referência",
    preco: 35.24,
    principios: "DIPIRONA MONOIDRATADA + BUTILBROMETO DE ESCOPOLAMINA",
    classe: "ASSOCIAÇÕES DE ANTIESPASMÓDICOS COM ANALGÉSICOS",
    favorito: true,
    alerta: true,
  },
  {
    nome: "DIPIRONA MONOIDRATADA 500mg",
    forma: "comprimidos, 10 un",
    fabricante: "MEDLEY",
    tipo: "Genérico",
    preco: 7.9,
    principios: "DIPIRONA MONOIDRATADA",
    classe: "ANALGÉSICOS NÃO OPIOIDES",
  },
  {
    nome: "NOVALGINA 500mg/ml",
    forma: "Solução oral, 10 ML",
    fabricante: "SANOFI MEDLEY FARMACÊUTICA LTDA",
    tipo: "Referência",
    preco: 14.6,
    principios: "DIPIRONA SÓDICA",
    classe: "ANALGÉSICOS NÃO OPIOIDES",
    favorito: true,
  },
  {
    nome: "LOSARTANA POTÁSSICA 50mg",
    forma: "comprimidos revestidos, 30 un",
    fabricante: "EUROFARMA",
    tipo: "Similar",
    preco: 18.9,
    principios: "LOSARTANA POTÁSSICA",
    classe: "ANTAGONISTAS DA ANGIOTENSINA II",
    favorito: true,
  },
  {
    nome: "AMOXICILINA 500mg",
    forma: "cápsulas, 21 un",
    fabricante: "PRATI-DONADUZZI",
    tipo: "Similar",
    preco: 22.4,
    principios: "AMOXICILINA",
    classe: "ANTIBIÓTICOS BETA-LACTÂMICOS",
    controlado: true,
  },
  {
    nome: "HUMIRA 40mg/0,8ml",
    forma: "solução injetável, 2 seringas",
    fabricante: "ABBVIE",
    tipo: "Biológico",
    preco: 4890.0,
    principios: "ADALIMUMABE",
    classe: "IMUNOSSUPRESSORES SELETIVOS",
    alerta: true,
    controlado: true,
  },
  {
    nome: "ENBREL 50mg",
    forma: "solução injetável, 4 seringas",
    fabricante: "PFIZER",
    tipo: "Biológico",
    preco: 5230.0,
    principios: "ETANERCEPTE",
    classe: "IMUNOSSUPRESSORES SELETIVOS",
  },
  {
    nome: "PASSIFLORINE",
    forma: "solução oral, 150 ml",
    fabricante: "SANOFI",
    tipo: "Fitoterápico",
    preco: 39.5,
    principios: "PASSIFLORA INCARNATA + CRATAEGUS OXYACANTHA + SALIX ALBA",
    classe: "ANSIOLÍTICOS FITOTERÁPICOS",
    favorito: true,
  },
  {
    nome: "GINKGO BILOBA 80mg",
    forma: "comprimidos revestidos, 60 un",
    fabricante: "HERBARIUM",
    tipo: "Fitoterápico",
    preco: 62.3,
    principios: "GINKGO BILOBA",
    classe: "VASODILATADORES PERIFÉRICOS",
  },
  {
    nome: "SYSTANE ULTRA",
    forma: "colírio, 10 ml",
    fabricante: "ALCON",
    tipo: "Oftalmológico",
    preco: 58.9,
    principios: "POLIETILENOGLICOL + PROPILENOGLICOL",
    classe: "LUBRIFICANTES OFTÁLMICOS",
    favorito: true,
  },
  {
    nome: "MAXIFLOX 3mg/ml",
    forma: "solução oftálmica, 5 ml",
    fabricante: "ALCON",
    tipo: "Oftalmológico",
    preco: 47.2,
    principios: "MOXIFLOXACINO",
    classe: "ANTIBIÓTICOS OFTÁLMICOS",
    alerta: true,
  },
  {
    nome: "VACINA INFLUENZA TETRAVALENTE",
    forma: "suspensão injetável, 1 seringa 0,5 ml",
    fabricante: "SANOFI PASTEUR",
    tipo: "Específico",
    preco: 129.0,
    principios: "ANTÍGENOS DE VÍRUS INFLUENZA A E B",
    classe: "VACINAS VIRAIS",
  },
  {
    nome: "SORO ANTIOFÍDICO POLIVALENTE",
    forma: "solução injetável, ampola 10 ml",
    fabricante: "BUTANTAN",
    tipo: "Específico",
    preco: 0,
    principios: "IMUNOGLOBULINAS EQUINAS ANTIOFÍDICAS",
    classe: "SOROS HIPERIMUNES",
    alerta: true,
  },
];

const TIPOS: MedType[] = [
  "Biológico",
  "Similar",
  "Genérico",
  "Referência",
  "Fitoterápico",
  "Oftalmológico",
  "Específico",
];

const SUGESTOES_POSOLOGIA = [
  "Tomar 1 comprimido, por via oral, 1 vez ao dia. Uso contínuo.",
  "Tomar 2 comprimidos, por via oral, 1 vez ao dia. Uso contínuo.",
  "Tomar 1 comprimido, por via oral, 1 vez ao dia. Em jejum. Uso contínuo.",
  "Tomar 2 comprimidos, por via oral, 1 vez ao dia. Em jejum. Uso contínuo.",
  "Tomar 1 comprimido, por via oral, 1 vez ao dia. Após o café da manhã. Uso contínuo.",
  "Tomar 1 comprimido, por via oral, de 12 em 12 horas por 5 dias.",
  "Tomar 1 comprimido, por via oral, de 8 em 8 horas por 7 dias.",
];

function isCpfValid(digits: string): boolean {
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += parseInt(digits[i], 10) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === parseInt(digits[9], 10) && calc(10) === parseInt(digits[10], 10);
}

function formatCpf(digits: string): string {
  const d = digits.slice(0, 11);
  const p1 = d.slice(0, 3);
  const p2 = d.slice(3, 6);
  const p3 = d.slice(6, 9);
  const p4 = d.slice(9, 11);
  let out = p1;
  if (d.length > 3) out += "." + p2;
  if (d.length > 6) out += "." + p3;
  if (d.length > 9) out += "-" + p4;
  return out;
}

function isEnderecoCompleto(endereco: string): boolean {
  const s = endereco.trim();
  if (s.length < 10) return false;
  // exige pelo menos duas partes separadas por vírgula/traço (rua, bairro, cidade/UF)
  const partes = s.split(/[,\-]/).map((p) => p.trim()).filter(Boolean);
  if (partes.length < 2) return false;
  // exige uma UF (2 letras) no final — indica "cidade/UF" preenchido
  if (!/\/[A-Za-z]{2}\b/.test(s)) return false;
  return true;
}

// Valida a posologia: exige texto mínimo, quantidade (número) e intervalo/frequência.
type PosologiaCheck = {
  ok: boolean;
  motivo?: "vazia" | "curta" | "sem-quantidade" | "sem-intervalo";
  mensagem?: string;
};
const INTERVAL_RE =
  /\b(hora|horas|hr|h\b|vez|vezes|x\/dia|x ao dia|ao dia|por dia|dia|dias|semana|semanas|mes|mês|meses|min|minutos|em em|de \d+ em \d+|contínuo|continuo|sos|s\/n)\b/i;

function checkPosologia(pos: string): PosologiaCheck {
  const s = pos.trim();
  if (!s) return { ok: false, motivo: "vazia", mensagem: "posologia em branco" };
  if (s.length < 12)
    return { ok: false, motivo: "curta", mensagem: "posologia muito curta (mín. 12 caracteres)" };
  if (!/\d/.test(s))
    return {
      ok: false,
      motivo: "sem-quantidade",
      mensagem: "falta a quantidade (ex.: 1 comprimido, 10 ml)",
    };
  if (!INTERVAL_RE.test(s))
    return {
      ok: false,
      motivo: "sem-intervalo",
      mensagem: "falta o intervalo/frequência (ex.: de 8 em 8 horas, 1x ao dia)",
    };
  return { ok: true };
}


const LS_PACIENTES = "hg:prescricao:pacientes-recentes";
const LS_MEDS = "hg:prescricao:meds-recentes";
const LS_DRAFT = "hg:prescricao:rascunho";
const LS_HISTORICO = "hg:prescricao:historico";
const HIST_MAX = 30;

type Rascunho = {
  paciente: string;
  cpfDigits: string;
  cepDigits: string;
  endereco: string;
  numero?: string;
  complemento?: string;
  itens: ItemReceita[];
  especial: boolean;
  tipos: MedType[];
  savedAt: number;
};

type Historico = {
  id: string;
  emittedAt: number;
  action: "imprimir" | "pdf";
  paciente: string;
  cpfDigits: string;
  cepDigits: string;
  endereco: string;
  numero?: string;
  complemento?: string;
  itens: ItemReceita[];
  especial: boolean;
  tipos: MedType[];
};

function loadRascunho(): Rascunho | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LS_DRAFT);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d || typeof d !== "object") return null;
    return d as Rascunho;
  } catch {
    return null;
  }
}

function loadHistorico(): Historico[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_HISTORICO);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as Historico[]) : [];
  } catch {
    return [];
  }
}

function saveHistorico(list: Historico[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_HISTORICO, JSON.stringify(list.slice(0, HIST_MAX)));
}

function loadRecentes(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function pushRecente(key: string, value: string, max = 8) {
  if (typeof window === "undefined") return;
  const v = value.trim();
  if (!v) return;
  const cur = loadRecentes(key).filter((x) => x.toLowerCase() !== v.toLowerCase());
  cur.unshift(v);
  window.localStorage.setItem(key, JSON.stringify(cur.slice(0, max)));
}

type CepResult = { logradouro: string; bairro: string; cidade: string; uf: string };

async function buscarCep(cep: string): Promise<CepResult | null> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!r.ok) return null;
    const j = await r.json();
    if (j.erro) return null;
    return {
      logradouro: j.logradouro || "",
      bairro: j.bairro || "",
      cidade: j.localidade || "",
      uf: j.uf || "",
    };
  } catch {
    return null;
  }
}

function composeEnderecoBase(r: CepResult): string {
  const cidadeUf = r.cidade && r.uf ? `${r.cidade}/${r.uf}` : r.cidade || r.uf;
  return [r.logradouro, r.bairro, cidadeUf].filter(Boolean).join(", ");
}

function enderecoCompletoStr(base: string, numero: string, complemento: string): string {
  const parts: string[] = [];
  if (base.trim()) parts.push(base.trim());
  if (numero.trim()) parts.push(`nº ${numero.trim()}`);
  if (complemento.trim()) parts.push(complemento.trim());
  return parts.join(", ");
}




function PrescricaoPage() {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <AppSidebar activeKey="prescricao" />
      <main className="flex-1 min-w-0 flex flex-col min-h-screen">
        <div className="w-full flex-1 space-y-6 px-6 py-8 pb-16 lg:px-10">
          <AppBreadcrumb />
          <PrescricaoForm />
        </div>
        <SiteFooter />
      </main>
    </div>
  );
}


function Header() {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-xs px-6 py-5 flex items-center gap-4">
      <div className="grid place-items-center h-12 w-12 rounded-xl bg-primary/15 text-primary shrink-0">
        <Pill className="h-6 w-6" />
      </div>
      <PageHeader
        title="Prescrição"
        description="Prescrição de medicamentos ou substâncias controladas"
        className="flex-1"
      />
    </div>
  );
}

function PrescricaoForm() {
  const [paciente, setPaciente] = useState("");
  const [cpfDigits, setCpfDigits] = useState("");
  const [cepDigits, setCepDigits] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [numeroTouched, setNumeroTouched] = useState(false);
  const [complemento, setComplemento] = useState("");
  const [query, setQuery] = useState("");
  const [tipos, setTipos] = useState<Set<MedType>>(
    new Set(TIPOS),

  );
  const [itens, setItens] = useState<ItemReceita[]>([]);
  // Tipo de receituário deduzido automaticamente pelos itens (não é escolha do usuário).
  const itensControlados = itens.filter((it) => it.med.controlado);
  const itensComuns = itens.filter((it) => !it.med.controlado);
  const hasControlado = itensControlados.length > 0;
  const hasComum = itensComuns.length > 0;
  const [especialManual, setEspecialManual] = useState(false);
  const especial = hasControlado || especialManual;
  const setEspecial = (v: boolean) => setEspecialManual(v);

  // Sincroniza automaticamente o tipo de receita conforme itens controlados entram/saem da lista.
  const prevHasControladoRef = useRef(hasControlado);
  useEffect(() => {
    const prev = prevHasControladoRef.current;
    if (prev === hasControlado) return;
    prevHasControladoRef.current = hasControlado;
    if (hasControlado) {
      // Passou a existir controlado: força Especial e limpa a preferência manual anterior.
      if (especialManual) setEspecialManual(false);
      toast.info("Tipo de receita alterado para Especial", {
        description: "A lista contém medicamento controlado.",
      });
    } else {
      // Último controlado removido: volta para Comum (a menos que o usuário tenha marcado Especial manualmente).
      if (!especialManual) {
        toast.info("Tipo de receita alterado para Comum", {
          description: "Nenhum medicamento controlado na lista.",
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasControlado]);

  const [editing, setEditing] = useState<Medicamento | null>(null);
  const mostrarCamposEspeciais = especial;
  const [highlight, setHighlight] = useState(0);
  const [pacientesRecentes, setPacientesRecentes] = useState<string[]>([]);
  const [medsRecentes, setMedsRecentes] = useState<string[]>([]);
  const [rascunhoRestaurado, setRascunhoRestaurado] = useState<number | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [historico, setHistorico] = useState<Historico[]>([]);
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [kitsAberto, setKitsAberto] = useState(false);


  const hidratado = useRef(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [triedEmit, setTriedEmit] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowTopBtn(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const pacienteRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const cpfRef = useRef<HTMLInputElement>(null);
  const enderecoRef = useRef<HTMLInputElement>(null);
  const numeroRef = useRef<HTMLInputElement>(null);
  const receitaRef = useRef<HTMLDivElement>(null);
  const descartarRascunhoRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setPacientesRecentes(loadRecentes(LS_PACIENTES));
    setMedsRecentes(loadRecentes(LS_MEDS));
    setHistorico(loadHistorico());
    const d = loadRascunho();
    if (d) {
      const temConteudo =
        (d.paciente && d.paciente.trim()) ||
        (d.itens && d.itens.length > 0) ||
        (d.cpfDigits && d.cpfDigits.length > 0) ||
        (d.endereco && d.endereco.trim());
      if (temConteudo) {
        setPaciente(d.paciente || "");
        setCpfDigits(d.cpfDigits || "");
        setCepDigits(d.cepDigits || "");
        setEndereco(d.endereco || "");
        setNumero(d.numero || "");
        setComplemento(d.complemento || "");
        setItens(Array.isArray(d.itens) ? d.itens : []);
        setEspecial(!!d.especial);
        if (Array.isArray(d.tipos) && d.tipos.length > 0) setTipos(new Set(d.tipos));
        const ts = d.savedAt || Date.now();
        setSavedAt(ts);
        toast(`Rascunho recuperado de ${fmtHora(ts)}`, {
          action: { label: "Descartar", onClick: () => descartarRascunhoRef.current?.() },
        });
      }
    }
    hidratado.current = true;
    pacienteRef.current?.focus();

    // Se veio da página de Kits salvos com um kit para aplicar, aplica agora
    const kit = consumirKitParaAplicar();
    if (kit) {
      setItens(kit.itens as unknown as ItemReceita[]);
      setStep(paciente.trim() || (d && d.paciente) ? 2 : 1);
      toast.success(`Kit "${kit.nome}" aplicado à receita.`);
    }
  }, []);


  // Autosave debounced
  useEffect(() => {
    if (!hidratado.current || typeof window === "undefined") return;
    const id = window.setTimeout(() => {
      const vazio =
        !paciente.trim() &&
        itens.length === 0 &&
        !cpfDigits &&
        !endereco.trim() &&
        !cepDigits &&
        !numero.trim() &&
        !complemento.trim();
      if (vazio) {
        window.localStorage.removeItem(LS_DRAFT);
        setSavedAt(null);
        return;
      }
      const draft: Rascunho = {
        paciente,
        cpfDigits,
        cepDigits,
        endereco,
        numero,
        complemento,
        itens,
        especial,
        tipos: Array.from(tipos),
        savedAt: Date.now(),
      };
      window.localStorage.setItem(LS_DRAFT, JSON.stringify(draft));
      setSavedAt(draft.savedAt);
    }, 400);
    return () => window.clearTimeout(id);
  }, [paciente, cpfDigits, cepDigits, endereco, numero, complemento, itens, especial, tipos]);

  const descartarRascunho = () => {
    if (typeof window !== "undefined") window.localStorage.removeItem(LS_DRAFT);
    setPaciente("");
    setCpfDigits("");
    setCepDigits("");
    setEndereco("");
    setNumero("");
    setComplemento("");
    setCepError(null);
    setItens([]);
    setEspecial(false);
    setTipos(new Set(TIPOS));
    setRascunhoRestaurado(null);
    setSavedAt(null);
    toast.success("Rascunho descartado.");
  };
  descartarRascunhoRef.current = descartarRascunho;





  const todos = tipos.size === TIPOS.length;
  const toggleTipo = (t: MedType) =>
    setTipos((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  const toggleTodos = () => setTipos(todos ? new Set() : new Set(TIPOS));

  const resultados = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = MEDICAMENTOS.filter((m) => tipos.has(m.tipo));
    if (!q) {
      // Sem busca: favoritos + recentes primeiro, depois os demais do tipo
      const favs = base.filter((m) => m.favorito);
      const recentes = medsRecentes
        .map((n) => base.find((m) => m.nome === n))
        .filter((m): m is Medicamento => !!m && !favs.includes(m));
      const restantes = base.filter(
        (m) => !favs.includes(m) && !recentes.includes(m),
      );
      return [...favs, ...recentes, ...restantes];
    }
    return base.filter(
      (m) =>
        m.nome.toLowerCase().includes(q) ||
        m.principios.toLowerCase().includes(q) ||
        m.fabricante.toLowerCase().includes(q) ||
        m.classe.toLowerCase().includes(q),
    );
  }, [query, tipos, medsRecentes]);


  useEffect(() => {
    setHighlight(0);
  }, [query, tipos]);

  const addItem = (med: Medicamento, posologia: string) => {
    setItens((prev) => [...prev, { med, posologia }]);
    pushRecente(LS_MEDS, med.nome);
    setMedsRecentes(loadRecentes(LS_MEDS));
    setEditing(null);
    setQuery("");
    toast.success(`${med.nome.split(" ")[0]} adicionado à receita.`);
    setTimeout(() => searchRef.current?.focus(), 50);
  };
  const removeItem = (i: number) =>
    setItens((prev) => prev.filter((_, idx) => idx !== i));

  const moveItem = (from: number, to: number) => {
    setItens((prev) => {
      if (to < 0 || to >= prev.length || from === to) return prev;
      const next = prev.slice();
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      return next;
    });
  };

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [editingPosIdx, setEditingPosIdx] = useState<number | null>(null);
  const [editingPosValue, setEditingPosValue] = useState("");

  const startEditPos = (i: number) => {
    setEditingPosIdx(i);
    setEditingPosValue(itens[i]?.posologia ?? "");
  };
  const saveEditPos = () => {
    if (editingPosIdx === null) return;
    const check = checkPosologia(editingPosValue);
    if (!check.ok) {
      toast.error(`Posologia inválida — ${check.mensagem}.`);
      return;
    }
    const idx = editingPosIdx;
    setItens((prev) =>
      prev.map((it, j) => (j === idx ? { ...it, posologia: editingPosValue.trim() } : it)),
    );
    setEditingPosIdx(null);
    setEditingPosValue("");
    toast.success("Posologia atualizada.");
  };
  const cancelEditPos = () => {
    setEditingPosIdx(null);
    setEditingPosValue("");
  };

  const [overIndex, setOverIndex] = useState<number | null>(null);




  const cpfValido = isCpfValid(cpfDigits);
  const enderecoValido = isEnderecoCompleto(endereco);
  const numeroValido = numero.trim().length > 0;
  const enderecoFullValido = enderecoValido && numeroValido;
  const enderecoCompleto = enderecoCompletoStr(endereco, numero, complemento);
  const especialInvalido =
    especial && (!cpfValido || !enderecoFullValido);
  const posologiasInvalidas = itens
    .map((it, i) => ({ i, med: it.med, check: checkPosologia(it.posologia) }))
    .filter((x) => !x.check.ok);
  const podeEmitir =
    paciente.trim().length > 0 &&
    itens.length > 0 &&
    !especialInvalido &&
    posologiasInvalidas.length === 0;

  const validarEmissao = (): boolean => {
    setTriedEmit(true);
    if (!paciente.trim()) {
      toast.error("Informe o paciente.");
      return false;
    }
    if (itens.length === 0) {
      toast.error("Adicione ao menos um medicamento.");
      return false;
    }
    if (posologiasInvalidas.length > 0) {
      const primeira = posologiasInvalidas[0];
      toast.error(
        `Posologia do item ${primeira.i + 1} (${primeira.med.nome.split(" ")[0]}) — ${primeira.check.mensagem}.`,
      );
      return false;
    }
    if (especial) {
      if (!cpfValido) {
        toast.error("Informe um CPF válido (11 dígitos) do paciente.");
        return false;
      }
      if (!enderecoValido) {
        toast.error(
          "Informe o endereço completo do paciente (rua, bairro, cidade/UF).",
        );
        return false;
      }
      if (!numeroValido) {
        toast.error("Informe o número do endereço.");
        return false;
      }
    }
    return true;
  };

  const imprimir = () => {
    if (!validarEmissao()) return;

    pushRecente(LS_PACIENTES, paciente);
    setPacientesRecentes(loadRecentes(LS_PACIENTES));
    registrarHistorico("imprimir");
    toast.success(
      hasControlado && hasComum
        ? "Receitas (comum + controle especial) enviadas para impressão."
        : hasControlado
          ? "Receituário especial enviado para impressão."
          : "Receita enviada para impressão.",
    );
  };

  const registrarHistorico = (action: "imprimir" | "pdf") => {
    const entry: Historico = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      emittedAt: Date.now(),
      action,
      paciente: paciente.trim(),
      cpfDigits,
      cepDigits,
      endereco,
      numero,
      complemento,
      itens,
      especial,
      tipos: Array.from(tipos),
    };
    const next = [entry, ...historico].slice(0, HIST_MAX);
    setHistorico(next);
    saveHistorico(next);
  };

  const reutilizarHistorico = (h: Historico) => {
    setPaciente(h.paciente);
    setCpfDigits(h.cpfDigits || "");
    setCepDigits(h.cepDigits || "");
    setEndereco(h.endereco || "");
    setNumero(h.numero || "");
    setComplemento(h.complemento || "");
    setItens(h.itens || []);
    setEspecial(!!h.especial);
    if (Array.isArray(h.tipos) && h.tipos.length > 0) setTipos(new Set(h.tipos));
    setHistoricoAberto(false);
    setRascunhoRestaurado(null);
    toast.success(`Prescrição de ${h.paciente || "paciente"} carregada como base.`);
    setTimeout(() => receitaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const removerHistorico = (id: string) => {
    const next = historico.filter((h) => h.id !== id);
    setHistorico(next);
    saveHistorico(next);
  };

  const limparHistorico = () => {
    if (historico.length === 0) return;
    if (typeof window !== "undefined" && !window.confirm("Apagar todo o histórico de prescrições?"))
      return;
    setHistorico([]);
    saveHistorico([]);
    toast.success("Histórico apagado.");
  };
  const imprimirPdf = (doc: jsPDF, nome: string) => {
    if (typeof window === "undefined") {
      doc.save(nome);
      return false;
    }
    try {
      doc.autoPrint();
    } catch {
      /* noop */
    }
    const blob = doc.output("blob");
    const blobUrl = URL.createObjectURL(blob);

    // Chrome bloqueia navegação para blob: em nova aba (ERR_BLOCKED_BY_CLIENT).
    // Usamos um iframe oculto para acionar o diálogo de impressão sem abrir aba.
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.src = blobUrl;
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        doc.save(nome);
      }
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
        iframe.remove();
      }, 60_000);
    };
    document.body.appendChild(iframe);
    return true;
  };


  const baixarPdf = async (opts: { emitir?: boolean } = {}) => {
    const { emitir = false } = opts;
    if (!validarEmissao()) return;


    const slugPaciente = paciente
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Um documento por tipo detectado nos itens
    const grupos: Array<{ tipo: "comum" | "especial"; itens: ItemReceita[] }> = [];
    if (hasComum) grupos.push({ tipo: "comum", itens: itensComuns });
    if (hasControlado) grupos.push({ tipo: "especial", itens: itensControlados });

    // Dados mockados do prescritor / clínica
    const clinica = {
      nome: "Clínica HaisGuias",
      endereco: "Av. Paulista, 1000 · Conj. 42 · Bela Vista · São Paulo/SP",
      contato: "(11) 3000-0000 · contato@haisguias.com.br",
    };
    const medico = {
      nome: "Dra. Marina Souza Andrade",
      crm: "CRM/SP 123.456",
      especialidade: "Clínica Médica · RQE 45.892",
    };
    const cidade = "São Paulo/SP";

    const docImpressao = emitir ? new jsPDF({ unit: "mm", format: "a4" }) : null;
    const documentosParaBaixar: Array<{ doc: jsPDF; nome: string }> = [];

    // Carrega a logo (best-effort — se falhar, cai no texto)
    let logoImg: { dataUrl: string; w: number; h: number } | null = null;
    try {
      logoImg = await loadImageDataUrl(logoAsset.url);
    } catch {
      logoImg = null;
    }

    for (let grupoIndex = 0; grupoIndex < grupos.length; grupoIndex++) {
      const grupo = grupos[grupoIndex];
      const isEspecial = grupo.tipo === "especial";
      const doc = docImpressao ?? new jsPDF({ unit: "mm", format: "a4" });
      if (docImpressao && grupoIndex > 0) doc.addPage();
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxW = pageW - margin * 2;
      let y = margin;

      // Logo HaisGuias centralizada no topo
      if (logoImg) {
        const logoH = 14;
        const logoW = (logoImg.w / logoImg.h) * logoH;
        doc.addImage(
          logoImg.dataUrl,
          "PNG",
          (pageW - logoW) / 2,
          y,
          logoW,
          logoH,
        );
        y += logoH + 8;
      } else {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text("HaisGuias", pageW / 2, y + 6, { align: "center" });
        y += 14;
      }

      // Nome do médico (grande, serifa itálico centralizado)
      doc.setFont("times", "bolditalic");
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42);
      doc.text(medico.nome, pageW / 2, y + 6, { align: "center" });
      y += 10;

      // CRM / especialidade
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(70, 70, 70);
      doc.text(`${medico.crm} · ${medico.especialidade}`, pageW / 2, y + 4, {
        align: "center",
      });
      y += 14;

      // Selo do tipo de receita (discreto, à direita)
      const seloLabel = isEspecial
        ? "RECEITUÁRIO DE CONTROLE ESPECIAL"
        : "RECEITUÁRIO";
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      const seloColor: [number, number, number] = isEspecial
        ? [180, 83, 9]
        : [71, 85, 105];
      doc.setTextColor(...seloColor);
      const seloW = doc.getTextWidth(seloLabel) + 6;
      doc.setDrawColor(...seloColor);
      doc.setLineWidth(0.3);
      doc.roundedRect(pageW - margin - seloW, y - 4, seloW, 5.5, 1, 1);
      doc.text(seloLabel, pageW - margin - seloW / 2, y - 0.3, {
        align: "center",
      });

      // Linha do paciente (Nome à esquerda, CPF + Data à direita como no modelo)
      const dataHora = new Date().toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text("Nome:", margin, y);
      doc.setFont("helvetica", "normal");
      const nomePaciente = (paciente.trim() || "—").toUpperCase();
      doc.text(nomePaciente, margin + doc.getTextWidth("Nome: ") + 1, y);

      y += 6;

      if (isEspecial) {
        doc.setFont("helvetica", "bold");
        doc.text("CPF:", margin, y);
        doc.setFont("helvetica", "normal");
        doc.text(
          formatCpf(cpfDigits) || "—",
          margin + doc.getTextWidth("CPF: ") + 1,
          y,
        );
      }
      // Data e hora sempre à direita
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      const dataLabel = "Data e hora: ";
      const dataLabelW = doc.getTextWidth(dataLabel);
      const dataValW = doc.getTextWidth(dataHora);
      const dataStartX = pageW - margin - dataLabelW - dataValW;
      doc.text(dataLabel, dataStartX, y);
      doc.setFont("helvetica", "normal");
      doc.text(dataHora, dataStartX + dataLabelW, y);
      y += 6;

      if (isEspecial && enderecoCompleto.trim()) {
        doc.setFont("helvetica", "bold");
        doc.text("Endereço:", margin, y);
        doc.setFont("helvetica", "normal");
        const endLines = doc.splitTextToSize(
          enderecoCompleto.trim(),
          maxW - doc.getTextWidth("Endereço: ") - 2,
        );
        doc.text(endLines, margin + doc.getTextWidth("Endereço: ") + 1, y);
        y += endLines.length * 5;
      }

      y += 8;

      // Itens numerados (modelo CEN)
      grupo.itens.forEach((it, idx) => {
        const numero = `${idx + 1}.`;
        const nomeMed = it.med.nome;
        const forma = it.med.forma || "";
        const principio = it.med.principios || "";
        const posText = it.posologia.trim() || "—";
        const usoTag = "uso contínuo";

        // Título do item (nome em negrito + forma + tag "uso contínuo" à direita)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        const numeroW = doc.getTextWidth(numero + " ");
        const nomeW = doc.getTextWidth(nomeMed);
        doc.text(numero, margin, y);
        doc.text(nomeMed, margin + numeroW, y);

        doc.setFont("helvetica", "normal");
        const formaTxt = forma ? `, ${forma}` : "";
        const formaWrapped = doc.splitTextToSize(
          formaTxt,
          maxW - numeroW - nomeW - 40,
        );
        if (formaTxt) {
          doc.text(formaWrapped[0], margin + numeroW + nomeW, y);
        }

        // Tag "uso contínuo" à direita
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(70, 70, 70);
        doc.text(usoTag, pageW - margin, y, { align: "right" });

        y += 5;

        // Princípio ativo (cinza pequeno)
        if (principio) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(110, 110, 110);
          const pWrap = doc.splitTextToSize(principio, maxW - numeroW);
          doc.text(pWrap, margin + numeroW, y);
          y += pWrap.length * 4.2;
        }

        y += 1.5;

        // Posologia
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10.5);
        doc.setTextColor(30, 30, 30);
        const posWrap = doc.splitTextToSize(posText, maxW - numeroW);
        // Quebra de página se necessário
        if (y + posWrap.length * 5 > pageH - margin - 45) {
          doc.addPage();
          y = margin;
        }
        doc.text(posWrap, margin + numeroW, y);
        y += posWrap.length * 5 + 6;
      });

      // Rodapé: bloco de validação (inspirado no MEMED)
      const footerY = pageH - margin - 26;

      doc.setDrawColor(220);
      doc.setLineWidth(0.2);
      doc.line(margin, footerY - 4, pageW - margin, footerY - 4);

      // "QR" simulado (quadrado sólido pequeno) à esquerda
      doc.setFillColor(15, 23, 42);
      doc.rect(margin, footerY, 16, 16, "F");
      doc.setFillColor(255, 255, 255);
      // pequenos quadrados internos para lembrar QR
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          if ((i + j) % 2 === 0) {
            doc.rect(margin + 2 + i * 3, footerY + 2 + j * 3, 2, 2, "F");
          }
        }
      }

      // Texto de validação ao lado do QR
      const txtX = margin + 20;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text("HaisGuias", txtX, footerY + 3);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(70, 70, 70);
      doc.text("Acesso à sua receita digital via QR Code", txtX, footerY + 3 + 4);
      doc.text(clinica.endereco, txtX, footerY + 3 + 8);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      const assinadoLabel = "Assinado digitalmente por ";
      const assinadoNome = `${medico.nome} · ${medico.crm}`;
      doc.text(assinadoLabel, txtX, footerY + 3 + 12);
      doc.setFont("helvetica", "bold");
      doc.text(
        assinadoNome,
        txtX + doc.getTextWidth(assinadoLabel),
        footerY + 3 + 12,
      );

      if (isEspecial) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.5);
        doc.setTextColor(140, 140, 140);
        doc.text(
          "Receituário de controle especial · 2 vias (paciente / farmácia) · Portaria SVS/MS nº 344/98",
          margin,
          pageH - margin + 2,
        );
      }


      const slug = slugPaciente || "paciente";
      const nome = `${isEspecial ? "receita-especial" : "prescricao"}-${slug}.pdf`;
      if (!emitir) documentosParaBaixar.push({ doc, nome });
    }



    let abriuImpressao = false;
    if (emitir && docImpressao) {
      const nomeImpressao = grupos.length > 1
        ? `receitas-${slugPaciente || "paciente"}.pdf`
        : `${hasControlado ? "receita-especial" : "prescricao"}-${slugPaciente || "paciente"}.pdf`;
      abriuImpressao = imprimirPdf(docImpressao, nomeImpressao);
    } else {
      documentosParaBaixar.forEach(({ doc, nome }) => doc.save(nome));
    }


    pushRecente(LS_PACIENTES, paciente);
    setPacientesRecentes(loadRecentes(LS_PACIENTES));
    registrarHistorico(emitir ? "imprimir" : "pdf");
    if (emitir) {
      if (abriuImpressao) {
        toast.success(
          grupos.length > 1
            ? `${grupos.length} receitas emitidas. Janela de impressão aberta.`
            : "Receita emitida. Janela de impressão aberta.",
        );
      } else {
        toast.info("Pop-up bloqueado — baixamos o PDF para você imprimir manualmente.");
      }
    } else {
      toast.success(
        grupos.length > 1
          ? `${grupos.length} PDFs baixados (comum + controle especial).`
          : "PDF baixado.",
      );
    }

  };



  const [kitDialogOpen, setKitDialogOpen] = useState(false);
  const [kitNome, setKitNome] = useState("");
  const kitNomeRef = useRef<HTMLInputElement>(null);

  const abrirSalvarKit = () => {
    if (itens.length === 0)
      return toast.error("Adicione medicamentos para salvar um kit.");
    const nomeSugerido = paciente.trim()
      ? `Kit ${paciente.trim().split(" ")[0]}`
      : `Kit ${new Date().toLocaleDateString("pt-BR")}`;
    setKitNome(nomeSugerido);
    setKitDialogOpen(true);
  };

  const confirmarSalvarKit = () => {
    const nome = kitNome.trim();
    if (!nome) return;
    const kit: Kit = {
      id: `kit-${Date.now()}`,
      nome,
      descricao: `Modelo criado a partir da receita ${paciente.trim() ? `de ${paciente.trim()}` : "atual"}.`,
      categoria: "Meus kits",
      itens: itens.map((it) => ({ med: it.med, posologia: it.posologia })),
      atualizadoEm: Date.now(),
      usos: 0,
    };
    upsertKit(kit);
    setKitDialogOpen(false);
    toast.success(`Kit "${kit.nome}" salvo.`, {
      action: {
        label: "Ver kits",
        onClick: () => setKitsAberto(true),
      },
    });
  };



  type Pend = { msg: string; focus?: () => void };
  const focusEl = (el: HTMLElement | null) => {
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => (el as HTMLInputElement).focus?.(), 300);
  };
  const scrollToReceita = () =>
    receitaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const pendencias: Pend[] = [];
  if (!paciente.trim())
    pendencias.push({ msg: "Nome do paciente", focus: () => focusEl(pacienteRef.current) });
  if (itens.length === 0)
    pendencias.push({
      msg: "Ao menos um medicamento na receita",
      focus: () => focusEl(searchRef.current),
    });
  if (especial) {
    const focusCpf = () => focusEl(cpfRef.current);
    if (cpfDigits.length === 0)
      pendencias.push({ msg: "CPF do paciente (obrigatório em receita especial)", focus: focusCpf });
    else if (cpfDigits.length < 11)
      pendencias.push({
        msg: `CPF incompleto — faltam ${11 - cpfDigits.length} dígito(s)`,
        focus: focusCpf,
      });
    else if (!cpfValido)
      pendencias.push({ msg: "CPF inválido — confira o dígito verificador", focus: focusCpf });
    if (!enderecoValido)
      pendencias.push({
        msg: "Endereço do paciente (rua, bairro, cidade/UF)",
        focus: () => focusEl(enderecoRef.current),
      });
    if (!numeroValido)
      pendencias.push({
        msg: "Número do endereço",
        focus: () => focusEl(numeroRef.current),
      });
  }
  posologiasInvalidas.forEach(({ i, med, check }) => {
    pendencias.push({
      msg: `Posologia do item ${i + 1} (${med.nome.split(" ")[0]}) — ${check.mensagem}`,
      focus: () => {
        const el = document.getElementById(`item-receita-${i}`);
        focusEl(el);
      },
    });
  });







  // Atalhos globais: Ctrl/Cmd+P imprimir, Ctrl/Cmd+S salvar kit, "/" foca busca
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      const tag = (e.target as HTMLElement | null)?.tagName;
      const digitando = tag === "INPUT" || tag === "TEXTAREA";
      if (meta && e.key.toLowerCase() === "p") {
        e.preventDefault();
        imprimir();
      } else if (meta && e.key.toLowerCase() === "s") {
        e.preventDefault();
        abrirSalvarKit();
      } else if (e.key === "/" && !digitando) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  // Auto-preenchimento de endereço por CEP
  const onCepChange = async (raw: string) => {
    const d = raw.replace(/\D/g, "").slice(0, 8);
    setCepDigits(d);
    setCepError(null);
    if (d.length === 8) {
      setCepLoading(true);
      const res = await buscarCep(d);
      setCepLoading(false);
      if (res) {
        setEndereco(composeEnderecoBase(res));
        toast.success("Endereço preenchido pelo CEP.");
        setTimeout(() => numeroRef.current?.focus(), 50);
      } else {
        setCepError("CEP não encontrado. Preencha o endereço manualmente.");
      }
    } else if (d.length > 0 && d.length < 8) {
      setCepError(null);
    }
  };


  const fmtHora = (ts: number) =>
    new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });




  return (
    <div className="space-y-5 pb-8">
      {/* Header unificado */}
      <PageHeader
        title="Emitir prescrição"
        description="Gere receitas médicas digitais, comuns ou especiais, prontas para impressão ou download em PDF."
        actions={
          <>
            <SavedIndicator savedAt={savedAt} />

            {triedEmit && pendencias.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  document
                    .getElementById("sec-revisar")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                className="border-warning/40 bg-warning/10 text-warning-strong hover:bg-warning/15"
                title="Ver o que falta"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                Faltam {pendencias.length} {pendencias.length > 1 ? "itens" : "item"}
              </Button>
            ) : triedEmit && pendencias.length === 0 ? (
              <span
                className="inline-flex items-center icon-optical gap-1.5 text-xs font-medium rounded-lg border border-success/40 bg-success/10 text-success-strong px-2.5 py-1.5"
                title="Todos os campos estão válidos"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Pronto para emitir
              </span>
            ) : null}
          </>
        }
      />










      {/* Seção 1 — Dados do paciente */}
      <section id="sec-paciente" className="scroll-mt-4">
        <div className="rounded-2xl border border-border bg-card shadow-xs p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground">1. Dados do paciente</h2>
              <p className="text-xs text-muted-foreground">
                Identifique o paciente. Campos de CPF e endereço aparecem para receita especial.
              </p>
            </div>
          </div>

          <>

          <Field id="paciente-input" label="Nome do paciente" required>
            <SearchInput
              ref={pacienteRef}
              leftIcon={<User className="h-4 w-4" />}
              list="pacientes-recentes"
              value={paciente}
              onChange={(e) => setPaciente(e.target.value)}
              placeholder="Digite o nome do beneficiário..."
              autoComplete="off"
            />
            <datalist id="pacientes-recentes">
              {pacientesRecentes.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </Field>

          <SelectField
            label="Tipo de receita"
            required
            className="max-w-xs"
            value={especial ? "especial" : "comum"}
            onValueChange={(v) => setEspecial(v === "especial")}
            disabled={hasControlado}
            hint={
              hasControlado
                ? "Definido como especial automaticamente por conter medicamento controlado."
                : especial
                  ? "Exige CPF e endereço completo do paciente."
                  : undefined
            }
            options={[
              { value: "comum", label: "Comum" },
              { value: "especial", label: "Especial" },
            ]}
          />

          {hasControlado && (
            <div
              role="status"
              className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning-strong"
            >
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-warning-strong" />
              <div className="min-w-0">
                <p className="font-medium">
                  Receita marcada como Especial — CPF e endereço obrigatórios
                </p>
                <p className="mt-0.5 text-warning-strong/90">
                  {itensControlados.length === 1
                    ? `Motivo: “${itensControlados[0].med.nome}” é medicamento controlado (Portaria 344/98).`
                    : `Motivo: ${itensControlados.length} medicamentos controlados na lista (Portaria 344/98).`}
                </p>
              </div>
            </div>
          )}





          {mostrarCamposEspeciais && (
            <div className="space-y-4 pt-2 border-t border-border/60">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-warning-strong" />
                  Dados exigidos para receituário especial
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Substâncias controladas exigem CPF e endereço completo do paciente.
                </p>
              </div>

              {/* Documento */}
              <Field
                label="CPF"
                required
                hint={
                  cpfDigits.length === 0
                    ? undefined
                    : cpfDigits.length < 11
                      ? `Faltam ${11 - cpfDigits.length} dígito(s).`
                      : cpfValido
                        ? "CPF válido."
                        : undefined
                }
                error={
                  cpfDigits.length === 11 && !cpfValido
                    ? "Dígito verificador inválido."
                    : undefined
                }
                rightAdornment={
                  cpfValido ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : cpfDigits.length > 0 ? (
                    <AlertCircle className="h-4 w-4 text-destructive/70" />
                  ) : null
                }
                className="max-w-xs"
              >
                <Input
                  ref={cpfRef}
                  value={formatCpf(cpfDigits)}
                  onChange={(e) =>
                    setCpfDigits(e.target.value.replace(/\D/g, "").slice(0, 11))
                  }
                  onPaste={(e) => {
                    e.preventDefault();
                    const text = e.clipboardData
                      .getData("text")
                      .replace(/\D/g, "")
                      .slice(0, 11);
                    setCpfDigits(text);
                  }}
                  autoComplete="off"
                  inputMode="numeric"
                  maxLength={14}
                  placeholder="000.000.000-00"
                  aria-invalid={cpfDigits.length > 0 && !cpfValido}
                  className="pr-9"
                />
              </Field>

              {/* Endereço */}
              <div className="space-y-3">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,200px)_minmax(0,1fr)]">
                  <Field
                    label="CEP"
                    required
                    hint={
                      cepLoading
                        ? "Buscando endereço…"
                        : cepDigits.length === 8
                          ? "Endereço preenchido."
                          : "Preenche o endereço automaticamente."
                    }
                    error={cepError || undefined}
                    rightAdornment={
                      cepLoading ? (
                        <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                      ) : cepError ? (
                        <AlertCircle className="h-4 w-4 text-destructive/70" />
                      ) : cepDigits.length === 8 ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : null
                    }
                  >
                    <Input
                      value={cepDigits.replace(/(\d{5})(\d)/, "$1-$2")}
                      onChange={(e) => onCepChange(e.target.value)}
                      inputMode="numeric"
                      maxLength={9}
                      placeholder="00000-000"
                      aria-invalid={!!cepError}
                      className="pr-9"
                    />
                  </Field>

                  <Field
                    label="Rua, bairro, cidade/UF"
                    required
                    hint={
                      enderecoValido
                        ? "Endereço válido."
                        : "Preenchido automaticamente pelo CEP."
                    }
                    rightAdornment={
                      enderecoValido ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : endereco.length > 0 ? (
                        <AlertCircle className="h-4 w-4 text-destructive/70" />
                      ) : null
                    }
                  >
                    <Input
                      ref={enderecoRef}
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                      placeholder="Ex: Av. Paulista, Bela Vista, São Paulo/SP"
                      aria-invalid={endereco.length > 0 && !enderecoValido}
                      className="pr-9"
                    />
                  </Field>
                </div>

                <Field
                  label="Número e complemento"
                  required
                  error={
                    numeroTouched && numero.length === 0
                      ? "Informe o número."
                      : undefined
                  }
                >
                  <div className="flex gap-2">
                    <Input
                      ref={numeroRef}
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                      onBlur={() => setNumeroTouched(true)}
                      placeholder="Nº"
                      inputMode="numeric"
                      aria-invalid={numeroTouched && numero.length === 0}
                      className="w-24"
                    />
                    <Input
                      value={complemento}
                      onChange={(e) => setComplemento(e.target.value)}
                      placeholder="Complemento (opcional) — apto, bloco…"
                      className="flex-1"
                    />
                  </div>
                </Field>

                {enderecoFullValido && (
                  <div className="rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-xs text-success-strong">
                    <span className="font-medium">Endereço completo: </span>
                    {enderecoCompleto}
                  </div>
                )}
              </div>
            </div>
          )}
          </>

        </div>
      </section>

      {/* Seção 2 — Medicamentos */}
      <section id="sec-medicamentos" className="scroll-mt-4 space-y-5">

          <div className="rounded-2xl border border-border bg-card shadow-xs p-5 space-y-4">
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">

            <div className="min-w-0 w-full sm:flex-1">
              <h2 className="text-base font-semibold text-foreground">2. Buscar e adicionar medicamentos</h2>
              <p className="text-xs text-muted-foreground">
                Busque pelo nome do medicamento para adicionar à prescrição. Medicamentos controlados são identificados automaticamente e geram receituário especial.
              </p>
            </div>


            <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">
              <ActionBtn
                onClick={() => setKitsAberto(true)}
                icon={<BookMarked className="h-3.5 w-3.5" />}
                size="sm"
              >
                Kits salvos
              </ActionBtn>
            {itens.length > 0 && (

              <Chip
                size="sm"
                onClick={() =>
                  document
                    .getElementById("sec-revisar")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                className="shrink-0"
                title="Ir para a revisão"
              >
                <Pill className="h-3 w-3" />
                <span>
                  {itens.length} {itens.length === 1 ? "item" : "itens"}
                </span>
                {itensControlados.length > 0 && (
                  <>
                    <span className="text-border">·</span>
                    <span className="inline-flex items-center icon-optical gap-1 text-warning-strong">
                      <ShieldAlert className="h-3 w-3" />
                      {itensControlados.length} controlado{itensControlados.length > 1 ? "s" : ""}
                    </span>
                  </>
                )}
                <ChevronRight className="h-3 w-3" />
              </Chip>
            )}
            </div>
            </div>



            <>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
              <SearchInput
                id="med-search"
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (editing) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setHighlight((h) => Math.min(h + 1, resultados.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setHighlight((h) => Math.max(h - 1, 0));
                  } else if (e.key === "Enter" && resultados[highlight]) {
                    e.preventDefault();
                    setEditing(resultados[highlight]);
                  } else if (e.key === "Escape") {
                    setQuery("");
                  }
                }}
                placeholder='Nome comercial ou princípio ativo…  (tecle "/" para focar)'
                clearable
                onClear={() => setQuery("")}
                rightSlot={!query ? <Kbd>/</Kbd> : undefined}
              />

              <MultiSelect
                options={TIPOS.map((t) => ({ value: t, label: t }))}
                values={Array.from(tipos)}
                onChange={(vs) => setTipos(new Set(vs as MedType[]))}
                placeholder="Filtrar por tipo"
                allLabel="Todos os tipos"
                emptyLabel="Nenhum tipo"
                searchPlaceholder="Buscar tipo..."
                countLabel={(n) => `${n} tipos`}
              />

            </div>


            {!editing && resultados.length > 0 && (
              <div className="rounded-xl border border-border bg-background/40 divide-y divide-border max-h-[420px] overflow-y-auto">
                {resultados.map((m, i) => (
                  <MedRow
                    key={m.nome}
                    m={m}
                    highlighted={i === highlight}
                    onHover={() => setHighlight(i)}
                    onPick={() => setEditing(m)}
                  />
                ))}
              </div>
            )}
            {query && !editing && resultados.length === 0 && (
              <EmptyState
                size="sm"
                title="Nenhum medicamento encontrado"
                description="Ajuste os filtros ou tente outro termo de busca."
                icon={<Search className="h-8 w-8" />}
              />
            )}

            {editing && (
              <PosologiaPanel
                med={editing}
                onCancel={() => setEditing(null)}
                onAdd={(pos) => addItem(editing, pos)}
              />
            )}
            </>
          </div>






      </section>


      {/* Seção 3 — Revisar e emitir */}
      <section id="sec-revisar" className="scroll-mt-4">

        <div
          ref={receitaRef}
          className="rounded-2xl border border-border bg-card shadow-xs"
        >
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-semibold">
                    3. Revisão da receita
                  </h2>

                  {hasControlado && (
                    <Badge variant="warning-soft" size="sm" className="uppercase tracking-wide">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-warning" />
                      {hasComum ? "Comum + Controlada" : "Controlada"}
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mt-0.5">
                  {itens.length}{" "}
                  {itens.length === 1 ? "medicamento" : "medicamentos"}
                </p>

              </div>
              {itens.length > 0 && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => setItens([])}
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-destructive"
                >
                  Limpar itens
                </Button>
              )}
            </div>




            <ul className="space-y-3">
              {itens.map((it, i) => {
                const isDragging = dragIndex === i;
                const isOver =
                  overIndex === i && dragIndex !== null && dragIndex !== i;
                const posCheck = checkPosologia(it.posologia);
                const isEditing = editingPosIdx === i;
                const editCheck = isEditing
                  ? checkPosologia(editingPosValue)
                  : null;
                return (
                  <li
                    id={`item-receita-${i}`}
                    key={i}
                    draggable={!isEditing}
                    onDragStart={(e) => {
                      setDragIndex(i);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", String(i));
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      if (overIndex !== i) setOverIndex(i);
                    }}
                    onDragLeave={() => {
                      if (overIndex === i) setOverIndex(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragIndex !== null && dragIndex !== i)
                        moveItem(dragIndex, i);
                      setDragIndex(null);
                      setOverIndex(null);
                    }}
                    onDragEnd={() => {
                      setDragIndex(null);
                      setOverIndex(null);
                    }}
                    className={`rounded-xl border bg-background/40 p-4 transition-all ${
                      isDragging ? "opacity-40 border-primary/60" : ""
                    } ${
                      isOver
                        ? "ring-2 ring-primary/60 border-primary/60"
                        : posCheck.ok
                          ? "border-border/70"
                          : "border-destructive/60 bg-destructive/5"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Arrastar para reordenar"
                        title="Arraste para reordenar"
                        className="h-6 w-6 mt-0.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing shrink-0"
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <GripVertical className="h-4 w-4" />
                      </Button>
                      <div className="min-w-0 space-y-1 flex-1">
                        <div className="text-sm font-semibold">
                          <span className="text-muted-foreground mr-1">
                            {i + 1}.
                          </span>
                          {it.med.nome}, {it.med.forma}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {it.med.principios} | {it.med.fabricante} |{" "}
                          {it.med.forma} | {it.med.tipo}
                        </div>
                        {isEditing ? (
                          <div className="mt-2 space-y-1.5">
                            <Textarea
                              value={editingPosValue}
                              onChange={(e) =>
                                setEditingPosValue(e.target.value)
                              }
                              rows={2}
                              autoFocus
                              aria-invalid={!editCheck?.ok}
                              className={
                                editCheck?.ok
                                  ? "border-success/40 focus-visible:ring-success/40"
                                  : "border-destructive/50 focus-visible:ring-destructive/40"
                              }
                            />
                            {editCheck && !editCheck.ok && (
                              <div className="text-xs text-destructive">
                                ⚠ {editCheck.mensagem}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={saveEditPos}
                                disabled={!editCheck?.ok}
                              >
                                Salvar
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={cancelEditPos}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="mt-1 flex items-start gap-2 text-sm text-foreground/90">
                              <Link2
                                className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${
                                  posCheck.ok ? "text-primary" : "text-destructive"
                                }`}
                              />
                              <span>
                                {it.posologia || (
                                  <em className="text-muted-foreground">
                                    sem posologia
                                  </em>
                                )}
                              </span>
                            </div>
                            {!posCheck.ok && (
                              <div className="text-xs text-destructive flex items-center gap-2">
                                <span>⚠ {posCheck.mensagem}</span>
                                <Button
                                  type="button"
                                  variant="link"
                                  size="sm"
                                  onClick={() => startEditPos(i)}
                                  className="h-auto p-0 text-xs text-destructive underline hover:no-underline font-medium"
                                >
                                  Editar posologia
                                </Button>
                              </div>
                            )}
                            {posCheck.ok && (
                              <Button
                                type="button"
                                variant="link"
                                size="sm"
                                onClick={() => startEditPos(i)}
                                className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
                              >
                                Editar posologia
                              </Button>
                            )}
                          </>
                        )}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeItem(i)}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive hover:border-destructive/60 shrink-0"
                        aria-label="Remover item"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Detecção automática do tipo de receituário */}
            {itens.length > 0 && (
              <div
                className={`rounded-xl border px-4 py-3 ${
                  hasControlado
                    ? "border-warning/40 bg-warning/5"
                    : "border-success/30 bg-success/5"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 inline-block h-2 w-2 rounded-full ${
                      hasControlado ? "bg-warning/100" : "bg-success"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">
                      {hasControlado && hasComum
                        ? "Serão gerados 2 documentos separados"
                        : hasControlado
                          ? "Receituário de controle especial"
                          : "Receita simples"}
                    </div>
                    <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                      {hasComum && (
                        <li className="flex items-center gap-1.5">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
                          Receita simples — {itensComuns.length}{" "}
                          {itensComuns.length === 1 ? "item" : "itens"}
                        </li>
                      )}
                      {hasControlado && (
                        <li className="flex items-center gap-1.5">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-warning/100" />
                          Controle especial — {itensControlados.length}{" "}
                          {itensControlados.length === 1 ? "item" : "itens"}
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}






          </div>
        </div>
      </section>

      {/* Barra de ação padrão: etapas + ações */}
      <FormActionBar
        stepsLabel="Etapas preenchidas"
        steps={[
          {
            label: "Paciente",
            done:
              paciente.trim().length > 0 &&
              (!especial || (cpfValido && enderecoFullValido)),
          },
          {
            label: "Medicamentos",
            done: itens.length > 0 && posologiasInvalidas.length === 0,
          },
          { label: "Pronto para emitir", done: podeEmitir },
        ]}
        note={
          <>
            Campos com <span className="text-destructive/80">*</span> são
            obrigatórios e serão validados antes da emissão.
          </>
        }
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={abrirSalvarKit}
          title="Ctrl+S"
        >
          <Save className="h-4 w-4" />
          Salvar como kit
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setTriedEmit(true);
            if (!podeEmitir) {
              document
                .getElementById("sec-revisar")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
              return;
            }
            baixarPdf({ emitir: true });
          }}
          disabled={!podeEmitir}
          title={
            !podeEmitir && pendencias.length > 0
              ? `Corrija ${pendencias.length} pendência${pendencias.length > 1 ? "s" : ""} antes de emitir:\n• ${pendencias.map((p) => p.msg).join("\n• ")}`
              : undefined
          }
        >
          <Printer className="h-4 w-4" />
          Emitir receita
        </Button>
      </FormActionBar>

      {/* Histórico de prescrições — rodapé da página, após as ações de emitir */}
      {historico.length > 0 && (
        <section id="sec-historico" className="scroll-mt-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground">
                Histórico de prescrições
              </h2>
              <p className="text-xs text-muted-foreground">
                Últimas receitas emitidas neste navegador — reabra para reemitir.
              </p>
            </div>
            <ActionBtn
              onClick={() => setHistoricoAberto((v) => !v)}
              icon={<History className="h-3.5 w-3.5" />}
              size="sm"
              active={historicoAberto}
              title={historicoAberto ? "Ocultar histórico" : "Mostrar histórico"}
            >
              {historicoAberto ? "Ocultar" : `Ver (${historico.length})`}
            </ActionBtn>
          </div>
          {historicoAberto && (
            <HistoricoPanel
              historico={historico}
              onClose={() => setHistoricoAberto(false)}
              onReutilizar={reutilizarHistorico}
              onRemover={removerHistorico}
              onLimpar={limparHistorico}
            />
          )}
        </section>
      )}










      <Dialog open={kitDialogOpen} onOpenChange={setKitDialogOpen}>
        <DialogContent size="sm" initialFocusRef={kitNomeRef}>
          <DialogHeader>
            <DialogTitle>Salvar como kit</DialogTitle>
            <DialogDescription>
              Salve a receita atual como modelo reutilizável ({itens.length} {itens.length === 1 ? "item" : "itens"}).
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="grid gap-2">
            <Label htmlFor="kit-nome">Nome do kit</Label>
            <Input
              id="kit-nome"
              ref={kitNomeRef}
              value={kitNome}
              onChange={(e) => setKitNome(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && kitNome.trim()) {
                  e.preventDefault();
                  confirmarSalvarKit();
                }
              }}
              placeholder="Ex.: Kit pós-cirúrgico"
            />
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKitDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmarSalvarKit} disabled={!kitNome.trim()}>
              Salvar kit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <KitsModal
        open={kitsAberto}
        onClose={() => setKitsAberto(false)}
        currentCount={itens.length}
        onAplicar={(kit, mode) => {
          const kitItens = kit.itens as unknown as ItemReceita[];
          if (mode === "append") {
            setItens((prev) => [...prev, ...kitItens]);
            toast.success(
              `Kit "${kit.nome}" adicionado (${kitItens.length} ${
                kitItens.length === 1 ? "item" : "itens"
              }).`,
            );
          } else {
            setItens(kitItens);
            toast.success(`Kit "${kit.nome}" aplicado à receita.`);
          }
          setTimeout(() => {
            document
              .getElementById("sec-medicamentos")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 100);
        }}
      />

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Voltar ao topo"
        title="Voltar ao topo"
        className={`fixed bottom-6 right-6 z-40 h-10 w-10 rounded-full bg-card/90 backdrop-blur text-muted-foreground shadow-md hover:text-foreground hover:bg-card transition-all duration-200 ${
          showTopBtn ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ActionBtn({
  onClick,
  icon,
  children,
  variant = "default",
  size = "md",
  disabled,
  title,
  disabledReason,
  active = false,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  variant?: "default" | "primary" | "secondary";
  size?: "sm" | "md";
  disabled?: boolean;
  title?: string;
  disabledReason?: string;
  active?: boolean;
}) {
  const variantCls =
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
      : active
        ? "border-primary bg-primary/10 text-primary hover:bg-primary/15 ring-1 ring-primary/40"
        : "border-border text-foreground hover:bg-muted";
  const sizeCls =
    size === "sm" ? "px-2.5 py-1.5 text-xs gap-1.5" : "px-3 py-1.5 text-sm gap-1.5";
  const effectiveTitle = disabled && disabledReason ? disabledReason : title;
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      aria-pressed={active}
      title={effectiveTitle}
      className={`rounded-lg border font-medium [&_svg]:shrink-0 ${sizeCls} ${variantCls} disabled:hover:bg-transparent`}
    >
      {icon}
      {children}
    </Button>
  );
}


function PosologiaPanel({
  med,
  onCancel,
  onAdd,
}: {
  med: Medicamento;
  onCancel: () => void;
  onAdd: (pos: string) => void;
}) {
  const [pos, setPos] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [showSug, setShowSug] = useState(true);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    taRef.current?.focus();
  }, []);

  const sugestoes = SUGESTOES_POSOLOGIA;

  const apply = (i: number) => {
    setPos(sugestoes[i]);
    setShowSug(false);
    setTimeout(() => taRef.current?.focus(), 0);
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSug) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, sugestoes.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      apply(highlight);
    } else if (e.key === "Tab") {
      e.preventDefault();
      apply(highlight);
    }
  };

  const check = checkPosologia(pos);

  const submit = () => {
    if (!check.ok) {
      toast.error(`Posologia inválida — ${check.mensagem}.`);
      taRef.current?.focus();
      return;
    }
    onAdd(pos.trim());
  };


  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
      <div>
        <div className="text-sm font-semibold text-foreground">Posologia (obrigatória)</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {med.nome.split(" ")[0]} - {med.nome.replace(/^\S+\s*/, "")} -{" "}
          {med.fabricante} - {med.forma}
        </div>
      </div>

      <div className="relative">
        <Textarea
          ref={taRef}
          value={pos}
          onChange={(e) => {
            setPos(e.target.value);
            setShowSug(true);
          }}
          onFocus={() => setShowSug(true)}
          onKeyDown={onKey}
          rows={3}
          placeholder="Ex: Tomar 1 comprimido de 12 em 12 horas por 05 dias."
        />
        {showSug && (
          <div className="mt-2 rounded-lg border border-border bg-card max-h-56 overflow-y-auto">
            {sugestoes.map((s, i) => (
              <Button
                key={i}
                type="button"
                variant="ghost"
                onMouseEnter={() => setHighlight(i)}
                onClick={() => apply(i)}
                className={`block h-auto w-full justify-start rounded-none px-3 py-2 text-left text-sm font-normal ${
                  i === highlight
                    ? "bg-primary/15 text-foreground"
                    : "text-foreground/85 hover:bg-muted/50"
                }`}
              >
                {s}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        Sugestões ao digitar ·{" "}
        <Kbd>↑</Kbd> <Kbd>↓</Kbd> <span className="mx-1">navega</span>
        <Kbd>Enter</Kbd> <span className="mx-1">ou</span> <Kbd>Tab</Kbd>{" "}
        <span className="mx-1">aplica</span>
        <Kbd>Shift</Kbd>+<Kbd>Enter</Kbd> <span className="mx-1">quebra linha</span>
      </div>

      {pos.trim() && !check.ok && (
        <div className="text-xs text-destructive">
          ⚠ {check.mensagem}. Ex.: "Tomar 1 comprimido de 8 em 8 horas por 5 dias."
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button
          type="button"
          onClick={submit}
          disabled={!check.ok}
          title={!check.ok ? check.mensagem : undefined}
        >
          <Plus className="h-4 w-4" />
          Adicionar à receita
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center rounded border border-border bg-muted/60 px-1.5 py-0.5 text-xs font-mono">
      {children}
    </kbd>
  );
}

function TipoCheckbox({
  label,
  checked,
  onChange,
  bold,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  bold?: boolean;
}) {
  return (
    <label className="inline-flex items-center icon-optical gap-2 cursor-pointer select-none">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <span className={`text-sm ${bold ? "font-semibold" : ""}`}>{label}</span>
    </label>
  );
}

function MedRow({
  m,
  onPick,
  highlighted,
  onHover,
}: {
  m: Medicamento;
  onPick: () => void;
  highlighted?: boolean;
  onHover?: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onPick}
      onMouseEnter={onHover}
      className={`h-auto w-full items-center justify-start rounded-none px-4 py-2.5 whitespace-normal text-left font-normal grid grid-cols-[minmax(0,1fr)_auto] gap-3 ${
        highlighted ? "bg-primary/10" : "hover:bg-muted/40"
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium text-sm text-foreground truncate">{m.nome}</span>
          <span className="text-xs text-muted-foreground truncate hidden xl:inline">
            · {m.forma}
          </span>
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground truncate">
          <span className="xl:hidden">{m.forma} · </span>
          {m.principios}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {m.alerta && (
          <span
            className="grid place-items-center h-7 w-7 rounded-md text-warning-strong"
            title="Medicamento controlado"
            aria-label="Controlado"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
          </span>
        )}
        {m.favorito && (
          <span
            className="grid place-items-center h-7 w-7 rounded-md text-warning"
            title="Favorito"
            aria-label="Favorito"
          >
            <Star className="h-3.5 w-3.5 fill-current" />
          </span>
        )}
        <span
          className="grid place-items-center h-7 w-7 rounded-md border border-border text-muted-foreground hover:text-primary hover:border-primary/60 transition-colors"
          aria-label="Selecionar"
        >
          <Plus className="h-4 w-4" />
        </span>
      </div>
    </Button>
  );
}

function TipoChip({
  tipo,
  active,
  onClick,
}: {
  tipo: MedType;
  active: boolean;
  onClick: () => void;
}) {
  const activeStyles: Record<MedType, string> = {
    Biológico: "bg-cat-1/15 text-cat-1-fg border-cat-1/50 ring-cat-1/30",
    Similar: "bg-cat-2/15 text-cat-2-fg border-cat-2/50 ring-cat-2/30",
    Genérico: "bg-cat-3/15 text-cat-3-fg border-cat-3/50 ring-cat-3/30",
    Referência: "bg-primary/15 text-primary border-primary/50 ring-primary/30",
    Fitoterápico: "bg-cat-4/15 text-cat-4-fg border-cat-4/50 ring-cat-4/30",
    Oftalmológico: "bg-cat-5/15 text-cat-5-fg border-cat-5/50 ring-cat-5/30",
    Específico: "bg-cat-6/15 text-cat-6-fg border-cat-6/50 ring-cat-6/30",
  };
  return (
    <Chip
      onClick={onClick}
      aria-pressed={active}
      className={active ? `${activeStyles[tipo]} shadow-sm` : undefined}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? "bg-current" : "bg-muted-foreground/40"}`}
      />
      {tipo}
    </Chip>
  );
}

function Dot() {
  return <span className="text-muted-foreground/60 text-sm">-</span>;
}

function TipoBadge({ tipo }: { tipo: MedType }) {
  const styles: Record<MedType, string> = {
    Biológico: "bg-cat-1/15 text-cat-1-fg border-cat-1/40",
    Similar: "bg-cat-2/15 text-cat-2-fg border-cat-2/40",
    Genérico: "bg-cat-3/15 text-cat-3-fg border-cat-3/40",
    Referência: "bg-primary/15 text-primary border-primary/40",
    Fitoterápico: "bg-cat-4/15 text-cat-4-fg border-cat-4/40",
    Oftalmológico: "bg-cat-5/15 text-cat-5-fg border-cat-5/40",
    Específico: "bg-cat-6/15 text-cat-6-fg border-cat-6/40",
  };

  return (
    <Badge variant="outline" size="sm" className={styles[tipo]}>
      {tipo}
    </Badge>
  );
}

function HistoricoPanel({
  historico,
  onClose,
  onReutilizar,
  onRemover,
  onLimpar,
}: {
  historico: Historico[];
  onClose: () => void;
  onReutilizar: (h: Historico) => void;
  onRemover: (id: string) => void;
  onLimpar: () => void;
}) {
  const fmt = (ts: number) =>
    new Date(ts).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  return (
    <div className="rounded-2xl border border-border bg-card shadow-xs p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Histórico de prescrições</h3>
          <span className="text-xs text-muted-foreground">
            ({historico.length} {historico.length === 1 ? "entrada" : "entradas"} — só neste navegador)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {historico.length > 0 && (
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={onLimpar}
              className="h-auto p-0 text-xs text-destructive"
            >
              Limpar tudo
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onClose}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            aria-label="Fechar histórico"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {historico.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground text-center">
          Ainda não há prescrições emitidas. Ao imprimir ou baixar um PDF, a
          prescrição fica registrada aqui.
        </div>
      ) : (
        <ul className="space-y-2 max-h-[480px] overflow-y-auto">
          {historico.map((h) => (
            <li
              key={h.id}
              className={`rounded-xl border p-3 ${
                h.especial ? "border-destructive/40 bg-destructive/5" : "border-border bg-background/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold truncate">
                      {h.paciente || "Sem paciente"}
                    </span>
                    {h.especial && (
                      <span className="text-xs font-semibold uppercase tracking-wide rounded px-1.5 py-0.5 bg-destructive/15 text-destructive border border-destructive/30">
                        Especial
                      </span>
                    )}
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      {h.action === "pdf" ? "PDF" : "Impressão"}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {fmt(h.emittedAt)} · {h.itens.length}{" "}
                    {h.itens.length === 1 ? "medicamento" : "medicamentos"}
                  </div>
                  <div className="text-xs text-foreground/80 line-clamp-2">
                    {h.itens.map((it) => it.med.nome.split(" ")[0]).join(", ") || "—"}
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onReutilizar(h)}
                    className="border-primary/50 text-primary hover:bg-primary/10"
                    title="Carregar esta prescrição no formulário como base"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Reutilizar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onRemover(h.id)}
                    className="text-muted-foreground hover:text-destructive hover:border-destructive/60"
                    title="Remover do histórico"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remover
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

void Check;


