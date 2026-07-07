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
  FolderCog,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";

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
  const [cpf, setCpf] = useState("");
  const [endereco, setEndereco] = useState("");
  const [query, setQuery] = useState("");
  const [tipos, setTipos] = useState<Set<MedType>>(
    new Set(["Genérico", "Referência", "Específico"]),
  );
  const [itens, setItens] = useState<ItemReceita[]>([]);
  const [especial, setEspecial] = useState(false);
  const [editing, setEditing] = useState<Medicamento | null>(null);

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

  const addItem = (med: Medicamento, posologia: string) => {
    setItens((prev) => [...prev, { med, posologia }]);
    setEditing(null);
    setQuery("");
  };
  const removeItem = (i: number) =>
    setItens((prev) => prev.filter((_, idx) => idx !== i));

  const imprimir = () => {
    if (!paciente.trim()) return toast.error("Informe o paciente.");
    if (itens.length === 0) return toast.error("Adicione ao menos um medicamento.");
    if (especial) {
      if (!cpf.trim()) return toast.error("CPF é obrigatório na receita especial.");
      if (!endereco.trim())
        return toast.error("Endereço é obrigatório na receita especial.");
    }
    toast.success(
      especial ? "Receituário especial enviado para impressão." : "Receita enviada para impressão.",
    );
  };

  const salvarKit = () => {
    if (itens.length === 0) return toast.error("Adicione medicamentos para salvar um kit.");
    toast.success("Kit salvo.");
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Paciente */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Paciente</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={paciente}
              onChange={(e) => setPaciente(e.target.value)}
              placeholder="Digite o nome do beneficiário..."
              className="w-full rounded-xl border border-border bg-background/40 pl-10 pr-3 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Kits disponíveis</div>
          <div className="text-sm text-foreground/80">
            Nenhum kit. Use "Salvar como Kit" na receita para criar.
          </div>
        </div>

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

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Medicamento</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nome comercial do produto ou princípio ativo..."
              className="w-full rounded-xl border border-border bg-background/40 pl-10 pr-10 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
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

        {/* Resultados (apenas quando busca ativa e sem edição) */}
        {query && !editing && (
          <div className="rounded-xl border border-border bg-background/40 divide-y divide-border max-h-[420px] overflow-y-auto">
            {resultados.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">
                Nenhum medicamento encontrado para os filtros atuais.
              </div>
            ) : (
              resultados.map((m, i) => (
                <MedRow key={i} m={m} onPick={() => setEditing(m)} />
              ))
            )}
          </div>
        )}

        {/* Painel de posologia */}
        {editing && (
          <PosologiaPanel
            med={editing}
            onCancel={() => setEditing(null)}
            onAdd={(pos) => addItem(editing, pos)}
          />
        )}
      </div>

      {/* Receita */}
      {itens.length > 0 && (
        <div
          className={`rounded-2xl border bg-card ${
            especial ? "border-destructive/60" : "border-border"
          }`}
        >
          {especial && <div className="h-1.5 rounded-t-2xl bg-destructive" />}
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold tracking-wide">
                  {especial
                    ? "RECEITUÁRIO CONTROLE ESPECIAL"
                    : `Prescrição médica (${itens.length} ${itens.length > 1 ? "medicamentos" : "medicamento"}) - Página única`}
                </h3>
                {especial && (
                  <div className="mt-1 text-xs text-muted-foreground space-x-4">
                    <span>
                      CPF: <span className="text-foreground/80">campo obrigatório</span>
                    </span>
                    <span>
                      Endereço:{" "}
                      <span className="text-foreground/80">endereço do paciente (receita especial)</span>
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 text-sm mr-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={especial}
                    onChange={(e) => setEspecial(e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  Receita especial
                </label>
                <ActionBtn onClick={imprimir} icon={<Printer className="h-4 w-4" />}>
                  Imprimir
                </ActionBtn>
                <ActionBtn
                  onClick={salvarKit}
                  icon={<Save className="h-4 w-4" />}
                  variant="primary"
                >
                  Salvar como Kit
                </ActionBtn>
                <ActionBtn
                  onClick={() => toast.info("Nenhum kit salvo.")}
                  icon={<FolderCog className="h-4 w-4" />}
                >
                  Gerenciar kits
                </ActionBtn>
                <button
                  onClick={() => setItens([])}
                  className="text-sm text-destructive hover:underline"
                >
                  Limpar receita
                </button>
              </div>
            </div>

            {especial && (
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="CPF do paciente"
                  className="w-full rounded-xl border border-destructive/40 bg-background/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-destructive/40"
                />
                <input
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Endereço completo do paciente"
                  className="w-full rounded-xl border border-destructive/40 bg-background/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-destructive/40"
                />
              </div>
            )}

            <ul className="space-y-3">
              {itens.map((it, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-border/70 bg-background/40 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="text-sm font-semibold">
                        <span className="text-muted-foreground mr-1">{i + 1}.</span>
                        {it.med.nome}, {it.med.forma}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {it.med.principios} | {it.med.fabricante} | {it.med.forma} |{" "}
                        {it.med.tipo}
                      </div>
                      <div className="mt-1 flex items-start gap-2 text-sm text-foreground/90">
                        <Link2 className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                        <span>{it.posologia}</span>
                      </div>
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
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({
  onClick,
  icon,
  children,
  variant = "default",
}: {
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  variant?: "default" | "primary";
}) {
  const cls =
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
      : "border-border text-foreground hover:bg-muted";
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${cls}`}
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

  const submit = () => {
    if (!pos.trim()) {
      toast.error("Informe a posologia.");
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

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={submit}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
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

function MedRow({ m, onPick }: { m: Medicamento; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors flex items-start gap-3"
    >
      <div className="flex-1 min-w-0">
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
      </div>
      <span
        className="shrink-0 mt-0.5 grid place-items-center h-7 w-7 rounded-md border border-border text-muted-foreground"
        aria-label="Selecionar"
      >
        <Plus className="h-4 w-4" />
      </span>
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

// unused Check import guard (kept for future added state)
void Check;
