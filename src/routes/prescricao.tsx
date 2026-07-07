import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pill, Settings2, Search, User, X } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/prescricao")({
  head: () => ({
    meta: [
      { title: "HaisGuias — Prescrição médica" },
      {
        name: "description",
        content:
          "Prescreva medicamentos e substâncias controladas com busca inteligente por nome, princípio ativo ou fabricante.",
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
  dose: string;
  forma: string;
  fabricante: string;
  tipo: MedType;
  preco: number;
  principios: string;
  classe: string;
  favorito?: boolean;
  alerta?: boolean;
};

const MEDICAMENTOS: Medicamento[] = [
  {
    nome: "APRACUR 1mg + 100mg + 50mg",
    dose: "",
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
    dose: "",
    forma: "comprimidos revestidos",
    fabricante: "COSMED INDUSTRIA DE COSMETICOS E MEDICAMENTOS",
    tipo: "Referência",
    preco: 27.47,
    principios: "MALEATO DE CLORFENIRAMINA + DIPIRONA MONOIDRATADA + CAFEÍNA ANIDRA",
    classe: "ANTIGRIPAIS SEM ANTIINFECCIOSOS",
    favorito: true,
  },
  {
    nome: "BENEGRIP 250mg + 30mg + 250mg + 2mg",
    dose: "",
    forma: "comprimidos revestidos",
    fabricante: "COSMED INDUSTRIA DE COSMETICOS E MEDICAMENTOS",
    tipo: "Referência",
    preco: 44.25,
    principios: "MALEATO DE CLORFENIRAMINA + DIPIRONA MONOIDRATADA + CAFEÍNA ANIDRA",
    classe: "ANTIGRIPAIS SEM ANTIINFECCIOSOS",
    favorito: true,
  },
  {
    nome: "BENEGRIP 250mg + 30mg + 250mg + 2mg",
    dose: "",
    forma: "comprimidos revestidos",
    fabricante: "COSMED INDUSTRIA DE COSMETICOS E MEDICAMENTOS",
    tipo: "Referência",
    preco: 386.48,
    principios: "MALEATO DE CLORFENIRAMINA + DIPIRONA MONOIDRATADA + CAFEÍNA ANIDRA",
    classe: "ANTIGRIPAIS SEM ANTIINFECCIOSOS",
    favorito: true,
  },
  {
    nome: "BROMETO DE N-BUTIL ESCOPOLAMINA + DIPIRONA SODICA 6.67mg/ml + 333.4mg/ml",
    dose: "",
    forma: "Solução, 20 ML",
    fabricante: "EMS",
    tipo: "Genérico",
    preco: 11.59,
    principios: "BUTILBROMETO DE ESCOPOLAMINA + DIPIRONA",
    classe: "ASSOCIAÇÕES DE ANTIESPASMÓDICOS COM ANALGÉSICOS",
  },
  {
    nome: "BUSCOPAN COMPOSTO",
    dose: "",
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
    dose: "",
    forma: "comprimidos, 10 un",
    fabricante: "MEDLEY",
    tipo: "Genérico",
    preco: 7.9,
    principios: "DIPIRONA MONOIDRATADA",
    classe: "ANALGÉSICOS NÃO OPIOIDES",
  },
  {
    nome: "NOVALGINA 500mg/ml",
    dose: "",
    forma: "Solução oral, 10 ML",
    fabricante: "SANOFI MEDLEY FARMACÊUTICA LTDA",
    tipo: "Referência",
    preco: 14.6,
    principios: "DIPIRONA SÓDICA",
    classe: "ANALGÉSICOS NÃO OPIOIDES",
    favorito: true,
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

function PrescricaoPage() {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <AppSidebar activeKey="prescricao" />
      <main className="flex-1 px-8 py-8 flex flex-col min-h-screen">
        <div className="w-full max-w-5xl mx-auto space-y-6 flex-1">
          <Header />
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
      <button
        className="grid place-items-center h-9 w-9 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
        aria-label="Configurações da prescrição"
      >
        <Settings2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function PrescricaoForm() {
  const [paciente, setPaciente] = useState("");
  const [query, setQuery] = useState("");
  const [tipos, setTipos] = useState<Set<MedType>>(
    new Set(["Genérico", "Referência", "Específico"]),
  );
  const todos = tipos.size === TIPOS.length;

  const toggleTipo = (t: MedType) => {
    setTipos((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };
  const toggleTodos = () => {
    setTipos(todos ? new Set() : new Set(TIPOS));
  };

  const resultados = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MEDICAMENTOS.filter((m) => tipos.has(m.tipo)).filter((m) => {
      if (!q) return true;
      return (
        m.nome.toLowerCase().includes(q) ||
        m.principios.toLowerCase().includes(q) ||
        m.fabricante.toLowerCase().includes(q) ||
        m.classe.toLowerCase().includes(q)
      );
    });
  }, [query, tipos]);

  return (
    <div className="space-y-5">
      {/* Paciente */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Paciente</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={paciente}
            onChange={(e) => setPaciente(e.target.value)}
            placeholder="Digite o nome do beneficiário..."
            className="w-full rounded-xl border border-border bg-card pl-10 pr-3 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
      </div>

      {/* Kits */}
      <div className="space-y-1">
        <div className="text-sm text-muted-foreground">Kits disponíveis</div>
        <div className="text-sm text-foreground/80">
          Nenhum kit. Use "Salvar kit" na receita para criar.
        </div>
      </div>

      {/* Tipos */}
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">Tipos de medicamentos</div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {TIPOS.map((t) => (
            <TipoCheckbox
              key={t}
              label={t}
              checked={tipos.has(t)}
              onChange={() => toggleTipo(t)}
            />
          ))}
          <TipoCheckbox label="Todos" checked={todos} onChange={toggleTodos} bold />
        </div>
      </div>

      {/* Medicamento search */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Medicamento</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, princípio ativo ou fabricante"
            className="w-full rounded-xl border border-border bg-card pl-10 pr-10 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Limpar busca"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Resultados */}
      <div className="rounded-xl border border-border bg-card divide-y divide-border max-h-[520px] overflow-y-auto">
        {resultados.length === 0 && (
          <div className="p-6 text-sm text-muted-foreground text-center">
            Nenhum medicamento encontrado para os filtros atuais.
          </div>
        )}
        {resultados.map((m, i) => (
          <MedRow key={i} m={m} />
        ))}
      </div>
    </div>
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

function MedRow({ m }: { m: Medicamento }) {
  return (
    <button
      type="button"
      className="w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors"
    >
      <div className="flex items-start gap-2 flex-wrap">
        <span className="font-semibold text-sm text-foreground">{m.nome}</span>
        {m.favorito && <span className="text-amber-400 text-sm leading-none">★</span>}
        <Dot />
        <span className="text-sm text-foreground/80">{m.forma}</span>
        <Dot />
        <span className="text-sm text-foreground/80">{m.fabricante}</span>
        <Dot />
        <TipoBadge tipo={m.tipo} />
        {m.alerta && (
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm bg-destructive"
            aria-label="Alerta"
          />
        )}
        <Dot />
        <span className="text-sm text-foreground/80">
          R$ {m.preco.toFixed(2).replace(".", ",")}
        </span>
      </div>
      <div className="mt-1 text-xs text-muted-foreground uppercase tracking-wide">
        {m.principios} · {m.classe}
      </div>
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
