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
  ArrowUp,
  ArrowDown,
  History,
  RefreshCw,
  Trash2,
  ChevronDown,
  Cloud,
  BookMarked,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { KitsModal } from "@/components/kits-modal";
import { consumirKitParaAplicar, upsertKit, type Kit } from "@/lib/kits";


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
  if (s.length < 15) return false;
  // exige um número e uma vírgula/traço separando partes
  if (!/\d/.test(s)) return false;
  if (!/[,\-]/.test(s)) return false;
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

async function buscarCep(cep: string): Promise<string | null> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!r.ok) return null;
    const j = await r.json();
    if (j.erro) return null;
    const partes = [j.logradouro, j.bairro, j.localidade && `${j.localidade}/${j.uf}`]
      .filter(Boolean)
      .join(", ");
    return partes || null;
  } catch {
    return null;
  }
}


function PrescricaoPage() {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <AppSidebar activeKey="prescricao" />
      <main className="flex-1 flex flex-col min-h-screen">
        <div className="w-full max-w-5xl mx-auto space-y-6 flex-1 px-8 pt-8 pb-16">
          <PrescricaoForm />
        </div>
        <SiteFooter />
      </main>
    </div>
  );
}


function Header() {
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="grid place-items-center h-12 w-12 rounded-xl bg-primary/15 text-primary">
          <Pill className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prescrição</h1>
          <p className="text-sm text-muted-foreground">
            Prescrição de medicamentos ou substâncias controladas
          </p>
        </div>
      </div>
    </div>
  );
}

function PrescricaoForm() {
  const [paciente, setPaciente] = useState("");
  const [cpfDigits, setCpfDigits] = useState("");
  const [cepDigits, setCepDigits] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [endereco, setEndereco] = useState("");
  const [query, setQuery] = useState("");
  const [tipos, setTipos] = useState<Set<MedType>>(
    new Set(["Genérico", "Referência", "Específico"]),
  );
  const [itens, setItens] = useState<ItemReceita[]>([]);
  const [especial, setEspecial] = useState(false);
  const [editing, setEditing] = useState<Medicamento | null>(null);
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

  const pacienteRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const cpfRef = useRef<HTMLInputElement>(null);
  const enderecoRef = useRef<HTMLInputElement>(null);
  const receitaRef = useRef<HTMLDivElement>(null);

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
        setItens(Array.isArray(d.itens) ? d.itens : []);
        setEspecial(!!d.especial);
        if (Array.isArray(d.tipos) && d.tipos.length > 0) setTipos(new Set(d.tipos));
        setRascunhoRestaurado(d.savedAt || Date.now());
        setSavedAt(d.savedAt || Date.now());
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
        !cepDigits;
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
        itens,
        especial,
        tipos: Array.from(tipos),
        savedAt: Date.now(),
      };
      window.localStorage.setItem(LS_DRAFT, JSON.stringify(draft));
      setSavedAt(draft.savedAt);
    }, 400);
    return () => window.clearTimeout(id);
  }, [paciente, cpfDigits, cepDigits, endereco, itens, especial, tipos]);

  const descartarRascunho = () => {
    if (typeof window !== "undefined") window.localStorage.removeItem(LS_DRAFT);
    setPaciente("");
    setCpfDigits("");
    setCepDigits("");
    setEndereco("");
    setItens([]);
    setEspecial(false);
    setTipos(new Set(["Genérico", "Referência", "Específico"]));
    setRascunhoRestaurado(null);
    setSavedAt(null);
    toast.success("Rascunho descartado.");
  };





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
  const especialInvalido =
    especial && (!cpfValido || !enderecoValido);
  const posologiasInvalidas = itens
    .map((it, i) => ({ i, med: it.med, check: checkPosologia(it.posologia) }))
    .filter((x) => !x.check.ok);
  const podeEmitir =
    paciente.trim().length > 0 &&
    itens.length > 0 &&
    !especialInvalido &&
    posologiasInvalidas.length === 0;

  const validarEmissao = (): boolean => {
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
          "Informe o endereço completo do paciente (rua, número, bairro, cidade/UF).",
        );
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
      especial ? "Receituário especial enviado para impressão." : "Receita enviada para impressão.",
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



  const baixarPdf = () => {
    if (!validarEmissao()) return;



    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 15;
    const maxW = pageW - margin * 2;
    let y = margin;

    // Tarja vermelha para receita especial
    if (especial) {
      doc.setFillColor(220, 38, 38);
      doc.rect(0, 0, pageW, 6, "F");
      y = 14;
    }

    // Cabeçalho
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(20, 20, 20);
    doc.text(
      especial ? "RECEITUÁRIO DE CONTROLE ESPECIAL" : "PRESCRIÇÃO MÉDICA",
      pageW / 2,
      y,
      { align: "center" },
    );
    y += 8;

    doc.setDrawColor(200);
    doc.line(margin, y, pageW - margin, y);
    y += 6;

    // Paciente
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Paciente:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(paciente.trim(), margin + 22, y);
    y += 6;

    if (especial) {
      doc.setFont("helvetica", "bold");
      doc.text("CPF:", margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(formatCpf(cpfDigits), margin + 22, y);
      y += 6;

      doc.setFont("helvetica", "bold");
      doc.text("Endereço:", margin, y);
      doc.setFont("helvetica", "normal");
      const endLines = doc.splitTextToSize(endereco.trim(), maxW - 22);
      doc.text(endLines, margin + 22, y);
      y += endLines.length * 5 + 2;
    }

    y += 2;
    doc.line(margin, y, pageW - margin, y);
    y += 6;

    // Itens
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Medicamentos", margin, y);
    y += 6;

    itens.forEach((it, idx) => {
      const bloco: string[] = [];
      bloco.push(`${idx + 1}. ${it.med.nome}`);
      if (it.med.forma) bloco.push(`   ${it.med.forma}`);
      if (it.med.principios) bloco.push(`   Princípio ativo: ${it.med.principios}`);
      const posLinhas = it.posologia.trim()
        ? doc.splitTextToSize(`   Posologia: ${it.posologia.trim()}`, maxW)
        : ["   Posologia: —"];

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      const wrapped: string[] = [];
      bloco.forEach((line) => {
        wrapped.push(...doc.splitTextToSize(line, maxW));
      });

      // Estimativa de altura para nova página
      const alturaEstim = (wrapped.length + posLinhas.length) * 5 + 4;
      if (y + alturaEstim > pageH - margin - 30) {
        doc.addPage();
        y = margin;
      }

      doc.setFont("helvetica", "bold");
      doc.text(wrapped[0], margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      for (let i = 1; i < wrapped.length; i++) {
        doc.text(wrapped[i], margin, y);
        y += 5;
      }
      doc.text(posLinhas, margin, y);
      y += posLinhas.length * 5 + 3;
    });

    // Assinatura
    const assY = Math.max(y + 20, pageH - margin - 25);
    doc.setDrawColor(120);
    doc.line(margin + 30, assY, pageW - margin - 30, assY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Assinatura e carimbo do médico", pageW / 2, assY + 5, {
      align: "center",
    });

    const dataEmissao = new Date().toLocaleDateString("pt-BR");
    doc.text(`Emitido em ${dataEmissao}`, pageW - margin, pageH - margin, {
      align: "right",
    });

    const slugPaciente = paciente
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const nome = `${especial ? "receita-especial" : "prescricao"}-${slugPaciente || "paciente"}.pdf`;
    doc.save(nome);
    pushRecente(LS_PACIENTES, paciente);
    setPacientesRecentes(loadRecentes(LS_PACIENTES));
    registrarHistorico("pdf");
    toast.success("PDF gerado.");
  };

  const salvarKit = () => {
    if (itens.length === 0)
      return toast.error("Adicione medicamentos para salvar um kit.");
    const nomeSugerido = paciente.trim()
      ? `Kit ${paciente.trim().split(" ")[0]}`
      : `Kit ${new Date().toLocaleDateString("pt-BR")}`;
    const nome = window.prompt("Nome do kit:", nomeSugerido);
    if (!nome || !nome.trim()) return;
    const kit: Kit = {
      id: `kit-${Date.now()}`,
      nome: nome.trim(),
      descricao: `Modelo criado a partir da receita ${paciente.trim() ? `de ${paciente.trim()}` : "atual"}.`,
      categoria: "Meus kits",
      itens: itens.map((it) => ({ med: it.med, posologia: it.posologia })),
      atualizadoEm: Date.now(),
      usos: 0,
    };
    upsertKit(kit);
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
        msg: "Endereço completo do paciente (rua, número, bairro, cidade/UF)",
        focus: () => focusEl(enderecoRef.current),
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
        salvarKit();
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
    if (d.length === 8) {
      setCepLoading(true);
      const end = await buscarCep(d);
      setCepLoading(false);
      if (end) {
        setEndereco((cur) => {
          // Se o usuário já digitou número após a rua, preserva; senão substitui
          if (!cur.trim() || cur.trim().length < end.length) return end + ", ";
          return cur;
        });
        toast.success("Endereço preenchido pelo CEP.");
        setTimeout(() => enderecoRef.current?.focus(), 50);
      } else {
        toast.error("CEP não encontrado.");
      }
    }
  };

  const fmtHora = (ts: number) =>
    new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });




  return (
    <div className="space-y-5 pb-8">
      {/* Header unificado */}
      <div className="rounded-2xl border border-border bg-card px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="grid place-items-center h-11 w-11 rounded-xl bg-primary/15 text-primary shrink-0">
            <Pill className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold leading-tight tracking-tight">Emitir prescrição</h1>
            <p className="text-xs text-muted-foreground">
              Preencha as seções em qualquer ordem — o botão libera com paciente e ao menos um medicamento.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {savedAt && (
            <div
              className="hidden md:flex items-center gap-1.5 text-[11px] text-muted-foreground mr-1"
              title={`Rascunho salvo às ${fmtHora(savedAt)}`}
            >
              <Cloud className="h-3.5 w-3.5" />
              salvo {fmtHora(savedAt)}
            </div>
          )}
          {pendencias.length > 0 ? (
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("sec-revisar")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className="inline-flex items-center gap-1.5 text-xs font-medium rounded-lg border border-destructive/40 bg-destructive/10 text-destructive px-2.5 py-1.5 hover:bg-destructive/15 transition-colors"
              title="Ver pendências"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              {pendencias.length} pendência{pendencias.length > 1 ? "s" : ""}
            </button>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-medium rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2.5 py-1.5"
              title="Todos os campos estão válidos"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Pronto para emitir
            </span>
          )}
          <ActionBtn
            onClick={() => setKitsAberto(true)}
            icon={<BookMarked className="h-3.5 w-3.5" />}
            size="sm"
          >
            Kits salvos
          </ActionBtn>
          <ActionBtn
            onClick={() => setHistoricoAberto((v) => !v)}
            icon={<History className="h-3.5 w-3.5" />}
            size="sm"
            active={historicoAberto}
            title={historicoAberto ? "Ocultar histórico" : "Mostrar histórico"}
          >
            Histórico{historico.length > 0 ? ` (${historico.length})` : ""}
          </ActionBtn>
        </div>
      </div>

      {rascunhoRestaurado && (
        <div className="rounded-xl border border-border bg-card px-4 py-2 flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">
            Rascunho recuperado de {fmtHora(rascunhoRestaurado)}.
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setRascunhoRestaurado(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              Ocultar
            </button>
            <button
              onClick={descartarRascunho}
              className="text-destructive hover:underline"
            >
              Descartar
            </button>
          </div>
        </div>
      )}




      {historicoAberto && (
        <HistoricoPanel
          historico={historico}
          onClose={() => setHistoricoAberto(false)}
          onReutilizar={reutilizarHistorico}
          onRemover={removerHistorico}
          onLimpar={limparHistorico}
        />
      )}

      {/* Seção 1 — Paciente */}

      <section id="sec-paciente" className="scroll-mt-4">

        <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
          <div>
            <h2 className="text-base font-semibold">Dados do paciente</h2>
            <p className="text-xs text-muted-foreground">
              Comece pelo nome. Se for receita controlada, ative o receituário especial abaixo.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground" htmlFor="paciente-input">
              Nome do paciente
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="paciente-input"
                ref={pacienteRef}
                type="text"
                list="pacientes-recentes"
                value={paciente}
                onChange={(e) => setPaciente(e.target.value)}
                placeholder="Digite o nome do beneficiário..."
                autoComplete="off"
                className="w-full rounded-xl border border-border bg-background/40 pl-10 pr-3 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
              <datalist id="pacientes-recentes">
                {pacientesRecentes.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>
          </div>

          <div
            className={`rounded-xl border ${especial ? "border-destructive/40 bg-destructive/5" : "border-border/70 bg-background/40"} px-4 py-3 space-y-3`}
          >
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={especial}
                onChange={(e) => setEspecial(e.target.checked)}
                className="h-4 w-4 mt-0.5 rounded border-border accent-primary"
              />
              <span>
                <span className="block text-sm font-medium">
                  Receituário de controle especial
                </span>
                <span className="block text-xs text-muted-foreground">
                  Para substâncias controladas — exige CPF e endereço completo do paciente.
                </span>
              </span>
            </label>

            {especial && (
              <div className="space-y-3 pt-1">
                <div className="grid gap-3 md:grid-cols-[minmax(0,200px)_minmax(0,1fr)]">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">CPF</label>
                    <input
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
                      aria-invalid={!cpfValido}
                      className={`w-full rounded-xl border bg-background/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                        cpfValido
                          ? "border-emerald-500/40 focus:ring-emerald-500/40"
                          : "border-destructive/50 focus:ring-destructive/40"
                      }`}
                    />
                    <p
                      className={`text-[11px] ${cpfValido ? "text-emerald-500" : "text-destructive"}`}
                    >
                      {cpfDigits.length === 0
                        ? "Obrigatório."
                        : cpfDigits.length < 11
                          ? `Faltam ${11 - cpfDigits.length} dígito(s).`
                          : cpfValido
                            ? "CPF válido."
                            : "Dígito verificador inválido."}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      CEP (preenche endereço automaticamente)
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={cepDigits.replace(/(\d{5})(\d)/, "$1-$2")}
                        onChange={(e) => onCepChange(e.target.value)}
                        inputMode="numeric"
                        maxLength={9}
                        placeholder="00000-000"
                        className="w-32 rounded-xl border border-border bg-background/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                      />
                      {cepLoading && (
                        <span className="text-xs text-muted-foreground self-center">
                          Buscando…
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Endereço completo</label>
                  <input
                    ref={enderecoRef}
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Rua, número, bairro, cidade/UF"
                    aria-invalid={!enderecoValido}
                    className={`w-full rounded-xl border bg-background/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                      enderecoValido
                        ? "border-emerald-500/40 focus:ring-emerald-500/40"
                        : "border-destructive/50 focus:ring-destructive/40"
                    }`}
                  />
                  <p
                    className={`text-[11px] ${enderecoValido ? "text-emerald-500" : "text-destructive"}`}
                  >
                    {enderecoValido
                      ? "Endereço completo."
                      : "Inclua rua, número, bairro e cidade/UF."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Seção 2 — Medicamentos */}
      <section id="sec-medicamentos" className="scroll-mt-4 space-y-5">

          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div>
              <h2 className="text-base font-semibold">Buscar e adicionar medicamentos</h2>
              <p className="text-xs text-muted-foreground">
                Nome comercial ou princípio ativo. Ajuste os filtros à direita se precisar.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="med-search"
                  ref={searchRef}
                  type="text"
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
                  className="w-full rounded-xl border border-border bg-background/40 pl-10 pr-16 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {!query && <Kbd>/</Kbd>}
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      aria-label="Limpar busca"
                      className="text-muted-foreground hover:text-foreground p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between gap-2 rounded-xl border border-border bg-background/40 px-3 py-3 text-sm hover:bg-accent/40 transition"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Settings2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">
                        {tipos.size === 0
                          ? "Nenhum tipo"
                          : tipos.size === TIPOS.length
                            ? "Todos os tipos"
                            : `${tipos.size} tipos`}
                      </span>
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-[--radix-popover-trigger-width] p-0"
                >
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Filtrar por tipo
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setTipos(new Set(TIPOS))}
                        className="text-[11px] px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/40 transition"
                      >
                        Todos
                      </button>
                      <span className="text-muted-foreground/40 text-[11px]">·</span>
                      <button
                        type="button"
                        onClick={() => setTipos(new Set())}
                        className="text-[11px] px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/40 transition"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto py-1">
                    {TIPOS.map((t) => {
                      const active = tipos.has(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleTipo(t)}
                          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-accent/40 transition"
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className={`h-4 w-4 rounded border flex items-center justify-center transition ${
                                active
                                  ? "bg-primary border-primary text-primary-foreground"
                                  : "border-border bg-background"
                              }`}
                            >
                              {active && <Check className="h-3 w-3" />}
                            </span>
                            {t}
                          </span>
                          <TipoBadge tipo={t} />
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
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
              <div className="rounded-xl border border-border bg-background/40 p-6 text-sm text-muted-foreground text-center">
                Nenhum medicamento encontrado para os filtros atuais.
              </div>
            )}

            {editing && (
              <PosologiaPanel
                med={editing}
                onCancel={() => setEditing(null)}
                onAdd={(pos) => addItem(editing, pos)}
              />
            )}
          </div>

          {/* Lista compacta de itens adicionados */}
          {itens.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-base font-semibold">Resumo da receita</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {itens.length}{" "}
                    {itens.length > 1 ? "medicamentos adicionados" : "medicamento adicionado"}
                  </p>
                </div>
                <button
                  onClick={() => setItens([])}
                  className="text-xs text-destructive hover:underline"
                >
                  Limpar
                </button>
              </div>

              <ul className="space-y-1.5">
                {itens.map((it, i) => {
                  const c = checkPosologia(it.posologia);
                  return (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm py-1.5 border-t border-border/60 first:border-0"
                    >
                      <span className="text-muted-foreground w-4 text-right">
                        {i + 1}.
                      </span>
                      <span
                        className={`h-1.5 w-1.5 rounded-full shrink-0 ${c.ok ? "bg-emerald-500" : "bg-destructive"}`}
                        title={c.ok ? "Posologia ok" : c.mensagem}
                      />
                      <span className="flex-1 truncate">{it.med.nome}</span>
                      <button
                        onClick={() => removeItem(i)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Remover"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

      </section>


      {/* Seção 3 — Revisar e emitir */}
      <section id="sec-revisar" className="scroll-mt-4">

        <div
          ref={receitaRef}
          className={`rounded-2xl border bg-card ${
            especial ? "border-destructive/60" : "border-border"
          }`}
        >
          {especial && <div className="h-1.5 rounded-t-2xl bg-destructive" />}
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold tracking-wide">
                  {especial
                    ? "RECEITUÁRIO CONTROLE ESPECIAL"
                    : "Prescrição médica"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Paciente:{" "}
                  <span className="font-medium text-foreground">
                    {paciente || "—"}
                  </span>
                  {especial && cpfDigits.length === 11 && (
                    <> · CPF {formatCpf(cpfDigits)}</>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ActionBtn
                  onClick={imprimir}
                  icon={<Printer className="h-4 w-4" />}
                  disabled={!podeEmitir}
                  title="Ctrl+P"
                  disabledReason={
                    pendencias.length > 0
                      ? `Corrija ${pendencias.length} pendência${pendencias.length > 1 ? "s" : ""} antes de imprimir:\n• ${pendencias.map((p) => p.msg).join("\n• ")}`
                      : undefined
                  }
                >
                  Imprimir
                </ActionBtn>
                <ActionBtn
                  onClick={baixarPdf}
                  icon={<Download className="h-4 w-4" />}
                  disabled={!podeEmitir}
                  variant="primary"
                  disabledReason={
                    pendencias.length > 0
                      ? `Corrija ${pendencias.length} pendência${pendencias.length > 1 ? "s" : ""} antes de baixar:\n• ${pendencias.map((p) => p.msg).join("\n• ")}`
                      : undefined
                  }
                >
                  Baixar PDF
                </ActionBtn>
                <ActionBtn
                  onClick={salvarKit}
                  icon={<Save className="h-4 w-4" />}
                  title="Ctrl+S"
                >
                  Salvar Kit
                </ActionBtn>
              </div>
            </div>

            {pendencias.length > 0 && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm">
                <div className="font-semibold text-destructive mb-1">
                  Corrija antes de emitir:
                </div>
                <ul className="space-y-0.5 pl-1">
                  {pendencias.map((p) => (
                    <li key={p.msg}>
                      <button
                        type="button"
                        onClick={() => {
                          const targetId =
                            p.msg.startsWith("Nome") ||
                            p.msg.includes("CPF") ||
                            p.msg.includes("Endereço")
                              ? "sec-paciente"
                              : "sec-medicamentos";
                          document
                            .getElementById(targetId)
                            ?.scrollIntoView({ behavior: "smooth", block: "start" });
                          setTimeout(() => p.focus?.(), 300);
                        }}

                        className="text-left underline-offset-2 hover:underline hover:text-destructive"
                      >
                        → {p.msg}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

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
                      <button
                        type="button"
                        aria-label="Arrastar para reordenar"
                        title="Arraste para reordenar"
                        className="grid place-items-center h-6 w-6 mt-0.5 rounded text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing shrink-0"
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <GripVertical className="h-4 w-4" />
                      </button>
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
                            <textarea
                              value={editingPosValue}
                              onChange={(e) =>
                                setEditingPosValue(e.target.value)
                              }
                              rows={2}
                              autoFocus
                              className={`w-full rounded-lg border bg-background px-2.5 py-2 text-sm focus:outline-none focus:ring-2 ${
                                editCheck?.ok
                                  ? "border-emerald-500/40 focus:ring-emerald-500/40"
                                  : "border-destructive/50 focus:ring-destructive/40"
                              }`}
                            />
                            {editCheck && !editCheck.ok && (
                              <div className="text-[11px] text-destructive">
                                ⚠ {editCheck.mensagem}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={saveEditPos}
                                disabled={!editCheck?.ok}
                                className="rounded-lg bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Salvar
                              </button>
                              <button
                                onClick={cancelEditPos}
                                className="rounded-lg border border-border px-3 py-1 text-xs hover:bg-muted"
                              >
                                Cancelar
                              </button>
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
                              <div className="text-[11px] text-destructive flex items-center gap-2">
                                <span>⚠ {posCheck.mensagem}</span>
                                <button
                                  onClick={() => startEditPos(i)}
                                  className="underline hover:no-underline font-medium"
                                >
                                  Editar posologia
                                </button>
                              </div>
                            )}
                            {posCheck.ok && (
                              <button
                                onClick={() => startEditPos(i)}
                                className="text-[11px] text-muted-foreground hover:text-primary hover:underline"
                              >
                                Editar posologia
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          onClick={() => moveItem(i, i - 1)}
                          disabled={i === 0}
                          className="grid place-items-center h-6 w-6 rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Mover para cima"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => moveItem(i, i + 1)}
                          disabled={i === itens.length - 1}
                          className="grid place-items-center h-6 w-6 rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Mover para baixo"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(i)}
                        className="grid place-items-center h-6 w-6 rounded border border-border text-muted-foreground hover:text-destructive hover:border-destructive/60 shrink-0"
                        aria-label="Remover item"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <p className="text-[11px] text-muted-foreground pt-1">
              Atalhos: <Kbd>Ctrl</Kbd>+<Kbd>P</Kbd> imprime ·{" "}
              <Kbd>Ctrl</Kbd>+<Kbd>S</Kbd> salva como kit.
            </p>
          </div>
        </div>
      </section>

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
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      aria-pressed={active}
      title={effectiveTitle}
      className={`inline-flex items-center rounded-lg border font-medium transition-colors ${sizeCls} ${variantCls} disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent`}
    >
      {icon}
      {children}
    </button>
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
    <div className="rounded-xl border border-primary/50 bg-primary/5 p-4 space-y-3">
      <div>
        <div className="text-sm font-semibold text-primary">Posologia (obrigatória)</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {med.nome.split(" ")[0]} - {med.nome.replace(/^\S+\s*/, "")} -{" "}
          {med.fabricante} - {med.forma}
        </div>
      </div>

      <div className="relative">
        <textarea
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
          className="w-full rounded-lg border border-primary/40 bg-background/60 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
        />
        {showSug && (
          <div className="mt-2 rounded-lg border border-border bg-card max-h-56 overflow-y-auto">
            {sugestoes.map((s, i) => (
              <button
                key={i}
                type="button"
                onMouseEnter={() => setHighlight(i)}
                onClick={() => apply(i)}
                className={`block w-full text-left px-3 py-2 text-sm ${
                  i === highlight
                    ? "bg-primary/15 text-foreground"
                    : "text-foreground/85 hover:bg-muted/50"
                }`}
              >
                {s}
              </button>
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
        <button
          onClick={submit}
          disabled={!check.ok}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          title={!check.ok ? check.mensagem : undefined}
        >
          <Plus className="h-4 w-4" />
          Adicionar à receita
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-mono">
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
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-border accent-primary"
      />
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
    <button
      type="button"
      onClick={onPick}
      onMouseEnter={onHover}
      className={`w-full text-left px-4 py-2.5 transition-colors grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 ${
        highlighted ? "bg-primary/10" : "hover:bg-muted/40"
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          {m.favorito && (
            <span className="text-amber-400 text-sm leading-none shrink-0" title="Favorito">
              ★
            </span>
          )}
          {m.alerta && (
            <span
              className="h-2 w-2 rounded-full bg-destructive shrink-0"
              title="Alerta clínico"
              aria-label="Alerta"
            />
          )}
          <span className="font-medium text-sm text-foreground truncate">{m.nome}</span>
          <span className="text-xs text-muted-foreground truncate hidden sm:inline">
            · {m.forma}
          </span>
        </div>
        <div className="mt-0.5 text-[11px] text-muted-foreground truncate">
          {m.principios}
        </div>
      </div>
      <span
        className="shrink-0 grid place-items-center h-7 w-7 rounded-md border border-border text-muted-foreground hover:text-primary hover:border-primary/60 transition-colors"
        aria-label="Selecionar"
      >
        <Plus className="h-4 w-4" />
      </span>
    </button>
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
    Biológico: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200 border-emerald-500/50 ring-emerald-500/30",
    Similar: "bg-sky-500/15 text-sky-700 dark:text-sky-200 border-sky-500/50 ring-sky-500/30",
    Genérico: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-200 border-fuchsia-500/50 ring-fuchsia-500/30",
    Referência: "bg-primary/15 text-primary border-primary/50 ring-primary/30",
    Fitoterápico: "bg-lime-500/15 text-lime-700 dark:text-lime-200 border-lime-500/50 ring-lime-500/30",
    Oftalmológico: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-200 border-cyan-500/50 ring-cyan-500/30",
    Específico: "bg-orange-500/15 text-orange-700 dark:text-orange-200 border-orange-500/50 ring-orange-500/30",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition ${
        active
          ? `${activeStyles[tipo]} shadow-sm`
          : "border-border/60 bg-background/30 text-muted-foreground hover:text-foreground hover:border-border hover:bg-accent/40"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? "bg-current" : "bg-muted-foreground/40"}`}
      />
      {tipo}
    </button>
  );
}

function Dot() {
  return <span className="text-muted-foreground/60 text-sm">-</span>;
}

function TipoBadge({ tipo }: { tipo: MedType }) {
  const styles: Record<MedType, string> = {
    Biológico: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    Similar: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    Genérico: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
    Referência: "bg-primary/15 text-primary border-primary/30",
    Fitoterápico: "bg-lime-500/15 text-lime-300 border-lime-500/30",
    Oftalmológico: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    Específico: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${styles[tipo]}`}
    >
      {tipo}
    </span>
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
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
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
            <button
              onClick={onLimpar}
              className="text-xs text-destructive hover:underline"
            >
              Limpar tudo
            </button>
          )}
          <button
            onClick={onClose}
            className="grid place-items-center h-6 w-6 rounded border border-border text-muted-foreground hover:text-foreground"
            aria-label="Fechar histórico"
          >
            <X className="h-3.5 w-3.5" />
          </button>
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
                      <span className="text-[10px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5 bg-destructive/15 text-destructive border border-destructive/30">
                        Especial
                      </span>
                    )}
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
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
                  <button
                    onClick={() => onReutilizar(h)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary/50 text-primary px-2.5 py-1.5 text-xs font-medium hover:bg-primary/10"
                    title="Carregar esta prescrição no formulário como base"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Reutilizar
                  </button>
                  <button
                    onClick={() => onRemover(h.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border text-muted-foreground px-2.5 py-1.5 text-xs hover:text-destructive hover:border-destructive/60"
                    title="Remover do histórico"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remover
                  </button>
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
