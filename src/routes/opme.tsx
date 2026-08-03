import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  User,
  ClipboardList,
  Package,
  Plus,
  Trash2,
  Save,
  FolderOpen,
  Eraser,
  Send,
  Stethoscope,
  ChevronDown,
  ArrowUp,
  CheckCircle2,
  CircleDashed,
} from "lucide-react";
import { toast } from "sonner";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { Field } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  DialogBody,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import convenioHumanasAsset from "@/assets/convenio-humanas-real.png.asset.json";
import convenioUnimedAsset from "@/assets/convenio-unimed-real.png.asset.json";
import convenioCaurnAsset from "@/assets/convenio-caurn-real.png.asset.json";
import { Chip } from "@/components/ui/chip";
import { StatusPill } from "@/components/status-pill";


const OPERADORAS = [
  { value: "Humanas", label: "Humanas", logo: convenioHumanasAsset.url, ans: "357511" },
  { value: "Unimed", label: "Unimed Natal/RN", logo: convenioUnimedAsset.url, ans: "335592" },
  { value: "CAURN", label: "CAURN", logo: convenioCaurnAsset.url, ans: "31425-1" },
] as const;

const ENQUADRAMENTOS = [
  "Órtese",
  "Prótese",
  "Material Especial",
  "Sintético",
  "Instrumental",
] as const;

const CATALOGO_OPME = [
  { tiss: "70560416", nome: "Placa bloqueada úmero proximal 3 furos", enq: "Órtese" },
  { tiss: "70560319", nome: "Parafuso cortical 3.5mm x 30mm", enq: "Material Especial" },
  { tiss: "70560840", nome: "Prótese total de quadril não cimentada", enq: "Prótese" },
  { tiss: "70560450", nome: "Haste intramedular femoral bloqueada", enq: "Órtese" },
  { tiss: "70560700", nome: "Âncora metálica 5.5mm com fio", enq: "Material Especial" },
  { tiss: "70560221", nome: "Fio de Kirschner 2.0mm", enq: "Material Especial" },
  { tiss: "70560999", nome: "Cimento ósseo com antibiótico 40g", enq: "Material Especial" },
  { tiss: "70560515", nome: "Placa reta LCP 4.5 8 furos", enq: "Órtese" },
] as const;

type Material = {
  id: string;
  tiss: string;
  nome: string;
  enq: string;
  qtd: number;
  spec?: string;
};

type Kit = {
  id: string;
  nome: string;
  justificativa: string;
  materiais: Material[];
};

const KITS_STORAGE = "haisguias.opme.kits";

const DEFAULT_KITS: Kit[] = [
  {
    id: "kit-artroplastia",
    nome: "Artroplastia total de quadril",
    justificativa:
      "Paciente com coxartrose avançada, dor incapacitante refratária ao tratamento conservador. Indicada artroplastia total de quadril não cimentada.",
    materiais: [
      { id: "1", tiss: "70560840", nome: "Prótese total de quadril não cimentada", enq: "Prótese", qtd: 1, spec: "Preferência por implantes da linha padrão hospitalar quando disponíveis." },
      { id: "2", tiss: "70560999", nome: "Cimento ósseo com antibiótico 40g", enq: "Material Especial", qtd: 1 },
    ],
  },
  {
    id: "kit-fratura-umero",
    nome: "Osteossíntese úmero proximal",
    justificativa:
      "Fratura desviada de úmero proximal com indicação cirúrgica. Necessária osteossíntese com placa bloqueada.",
    materiais: [
      { id: "1", tiss: "70560416", nome: "Placa bloqueada úmero proximal 3 furos", enq: "Órtese", qtd: 1 },
      { id: "2", tiss: "70560319", nome: "Parafuso cortical 3.5mm x 30mm", enq: "Material Especial", qtd: 6 },
    ],
  },
];

export const Route = createFileRoute("/opme")({
  head: () => ({
    meta: [
      { title: "HaisGuias — Solicitar OPME" },
      {
        name: "description",
        content:
          "Solicite Órteses, Próteses e Materiais Especiais com justificativa técnica, especificação e envio direto à operadora.",
      },
    ],
  }),
  component: OpmePage,
});

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function OpmePage() {
  // Convênio
  const [operadora, setOperadora] = useState<string>("Humanas");
  const [caraterAtendimento, setCarater] = useState<string>("Eletivo");

  // Paciente
  const [paciente, setPaciente] = useState("");
  const [cartaoBenef, setCartaoBenef] = useState("");

  // Clínico
  const [justificativa, setJustificativa] = useState("");

  // Materiais
  // Stable initial id keeps SSR and client markup identical (no hydration mismatch).
  const [materiais, setMateriais] = useState<Material[]>([
    { id: "material-1", tiss: "", nome: "", enq: "", qtd: 1 },
  ]);

  // Profissional
  const [profissional, setProfissional] = useState("RAQUEL AMORIM DUARTE");
  const [conselho, setConselho] = useState("CRM");
  const [numeroConselho, setNumeroConselho] = useState("4723");
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));

  // Kits
  const [kits, setKits] = useState<Kit[]>(DEFAULT_KITS);
  const [carregarOpen, setCarregarOpen] = useState(false);
  const [salvarOpen, setSalvarOpen] = useState(false);
  const nomeKitRef = useRef<HTMLInputElement>(null);
  const [novoKitNome, setNovoKitNome] = useState("");

  // Collapse state
  const [convenioCollapsed, setConvenioCollapsed] = useState(false);
  const [clinicoCollapsed, setClinicoCollapsed] = useState(false);
  const [materiaisCollapsed, setMateriaisCollapsed] = useState(false);
  const [profCollapsed, setProfCollapsed] = useState(true);
  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KITS_STORAGE);
      if (raw) {
        const parsed = JSON.parse(raw) as Kit[];
        if (Array.isArray(parsed) && parsed.length) setKits(parsed);
      }
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KITS_STORAGE, JSON.stringify(kits));
    } catch {
      /* noop */
    }
  }, [kits]);

  useEffect(() => {
    const onScroll = () => setShowTopBtn(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const totalMateriais = useMemo(
    () => materiais.reduce((acc, m) => acc + (m.nome ? m.qtd || 0 : 0), 0),
    [materiais],
  );
  const materiaisValidos = materiais.filter((m) => m.nome.trim());

  const operadoraSel = OPERADORAS.find((o) => o.value === operadora);
  const registroAns = operadoraSel?.ans ?? "";

  const convenioOk = !!operadora && !!paciente.trim();
  const clinicoOk = !!justificativa.trim();
  const materiaisOk = materiaisValidos.length > 0;
  const profOk = !!profissional.trim() && !!numeroConselho.trim();

  const canSubmit = convenioOk && clinicoOk && materiaisOk && profOk;

  function addMaterial() {
    setMateriais((prev) => [...prev, { id: uid(), tiss: "", nome: "", enq: "", qtd: 1 }]);
  }
  function removeMaterial(id: string) {
    setMateriais((prev) => (prev.length === 1 ? prev : prev.filter((m) => m.id !== id)));
  }
  function updateMaterial(id: string, patch: Partial<Material>) {
    setMateriais((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }
  function autoFillFromCatalogo(id: string, valor: string) {
    const found = CATALOGO_OPME.find(
      (c) => c.tiss === valor || c.nome.toLowerCase() === valor.toLowerCase(),
    );
    if (found) {
      updateMaterial(id, { tiss: found.tiss, nome: found.nome, enq: found.enq });
    } else {
      updateMaterial(id, { nome: valor });
    }
  }

  function limparMateriais() {
    setMateriais([{ id: uid(), tiss: "", nome: "", enq: "", qtd: 1 }]);
    
    toast.success("Materiais limpos.");
  }

  function carregarKit(kit: Kit) {
    setJustificativa(kit.justificativa);
    const novos = kit.materiais.map((m) => ({ ...m, id: uid() }));
    setMateriais(novos);
    setCarregarOpen(false);
    setClinicoCollapsed(false);
    setMateriaisCollapsed(false);
    toast.success(`Kit "${kit.nome}" carregado.`);
    setTimeout(() => {
      document
        .getElementById("sec-materiais")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  function salvarKit() {
    if (!novoKitNome.trim()) {
      toast.error("Dê um nome para o kit.");
      return;
    }
    const novo: Kit = {
      id: uid(),
      nome: novoKitNome.trim(),
      justificativa,
      materiais: materiaisValidos.map((m) => ({ ...m })),
    };
    setKits((prev) => [novo, ...prev]);
    setNovoKitNome("");
    setSalvarOpen(false);
    toast.success(`Kit "${novo.nome}" salvo.`);
  }

  function removerKit(id: string) {
    setKits((prev) => prev.filter((k) => k.id !== id));
    toast.success("Kit removido.");
  }

  function enviarSolicitacao(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      toast.error("Preencha operadora, paciente, justificativa e ao menos um material.");
      return;
    }
    toast.success(
      `Solicitação de OPME enviada (${materiaisValidos.length} ${materiaisValidos.length === 1 ? "item" : "itens"}).`,
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <AppSidebar activeKey="opme" />

      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <div className="w-full flex-1 space-y-6 px-6 py-8 pb-16 lg:px-10">
          <AppBreadcrumb />
          <PageHeader
            title="Solicitar OPME"
            description="Solicite autorização de órteses, próteses e materiais especiais junto à operadora, com justificativa clínica e lista de materiais."
          />

          <form onSubmit={enviarSolicitacao} className="space-y-5">
            {/* 1. Convênio & Paciente */}
            <SectionCard
              id="sec-convenio"
              number={1}
              title="Paciente e convênio"
              collapsed={convenioCollapsed}
              onToggle={() => setConvenioCollapsed((v) => !v)}
              done={convenioOk}
              summary={
                convenioCollapsed && convenioOk
                  ? `${paciente} · ${operadoraSel?.label ?? operadora} · ${caraterAtendimento}`
                  : "Informe o paciente, o convênio e o caráter do atendimento."
              }
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label="Nome do paciente" required>
                  <div className="relative">
                    <User className="icon-optical absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="Digite o nome do beneficiário..."
                      value={paciente}
                      onChange={(e) => setPaciente(e.target.value)}
                    />
                  </div>
                </Field>

                <Field label="Cartão do beneficiário">
                  <Input
                    inputMode="numeric"
                    placeholder="0000 0000 0000 0000"
                    value={cartaoBenef}
                    maxLength={19}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
                      const masked = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
                      setCartaoBenef(masked);
                    }}
                  />
                </Field>

                <Field label="Convênio / Operadora" required>
                  <Select value={operadora} onValueChange={setOperadora}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o convênio" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERADORAS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          <span className="flex min-w-0 items-center gap-2">
                            <img
                              src={o.logo}
                              alt=""
                              aria-hidden
                              className="h-4 w-8 shrink-0 object-contain"
                              loading="lazy"
                            />
                            <span className="truncate">{o.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Registro ANS">
                  <Input
                    readOnly
                    className="font-mono bg-muted/50 text-muted-foreground"
                    value={operadoraSel ? registroAns : ""}
                    placeholder="—"
                    tabIndex={-1}
                  />
                </Field>



                <Field label="Caráter do atendimento" required>
                  <Select value={caraterAtendimento} onValueChange={setCarater}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Eletivo", "Urgência", "Emergência"].map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

            </SectionCard>

            {/* 2. Justificativa técnica */}
            <SectionCard
              id="sec-clinico"
              number={2}
              title="Justificativa clínica"
              collapsed={clinicoCollapsed}
              onToggle={() => setClinicoCollapsed((v) => !v)}
              done={clinicoOk}
              summary={
                clinicoCollapsed && clinicoOk
                  ? `${justificativa.length} caracteres · ${justificativa.slice(0, 80)}${
                      justificativa.length > 80 ? "…" : ""
                    }`
                  : "Descreva o quadro clínico e a indicação técnica dos materiais."
              }
            >
              <Field label="Dados clínicos / justificativa técnica" required>
                <div className="relative">
                  <Textarea
                    rows={6}
                    maxLength={1500}
                    className="pb-7"
                    placeholder="Ex.: paciente com lesão do LCA confirmada por RM, indicado enxerto e sistema de fixação femoral..."
                    value={justificativa}
                    onChange={(e) => setJustificativa(e.target.value)}
                  />
                  <span className="pointer-events-none absolute right-3 bottom-2.5 text-xs text-muted-foreground tabular-nums">
                    {justificativa.length}/1500
                  </span>
                </div>
              </Field>
            </SectionCard>

            {/* 3. Materiais OPME */}
            <SectionCard
              id="sec-materiais"
              number={3}
              title="Materiais OPME"
              collapsed={materiaisCollapsed}
              onToggle={() => setMateriaisCollapsed((v) => !v)}
              done={materiaisOk}
              summary={
                materiaisCollapsed && materiaisOk
                  ? `${materiaisValidos.length} ${
                      materiaisValidos.length === 1 ? "item" : "itens"
                    } · ${totalMateriais} un.`
                  : "Liste os materiais, quantidade e enquadramento técnico. Use kits para reaproveitar combinações."
              }
              headerRight={
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      limparMateriais();
                    }}
                    disabled={materiaisValidos.length === 0}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Eraser className="h-4 w-4" />
                    Limpar
                  </Button>
                  <div className="hidden sm:block h-5 w-px bg-border mx-0.5" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCarregarOpen(true);
                    }}
                  >
                    <FolderOpen className="h-4 w-4" />
                    Carregar kit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSalvarOpen(true);
                    }}
                    disabled={materiaisValidos.length === 0}
                  >
                    <Save className="h-4 w-4" />
                    Salvar kit
                  </Button>
                </div>
              }
            >
              <div className="space-y-4">
                <div className="rounded-lg border overflow-hidden">
                  <div className="hidden lg:grid grid-cols-[120px_minmax(0,1fr)_180px_88px_36px] gap-x-3 px-4 py-2 bg-muted/50 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <div>TISS</div>
                    <div>Nome comercial</div>
                    <div>Enquadramento técnico</div>
                    <div className="text-center">Qtd.</div>
                    <div />
                  </div>
                  <div className="divide-y">
                    {materiais.map((m, idx) => {
                      const spec = m.spec ?? "";
                      return (
                      <div key={m.id} className="transition-colors hover:bg-muted/30">
                        <div className="grid grid-cols-1 lg:grid-cols-[120px_minmax(0,1fr)_180px_88px_36px] gap-x-3 gap-y-3 px-4 pt-3 lg:pt-2.5 lg:items-center">
                        <div className="space-y-1 lg:space-y-0">
                          <label
                            htmlFor={`tiss-${m.id}`}
                            className="block whitespace-nowrap text-xs font-medium text-muted-foreground lg:hidden"
                          >
                            Código TISS
                          </label>
                          {/* text-base on mobile avoids iOS Safari's focus zoom (which shifts the layout). */}
                          <Input
                            id={`tiss-${m.id}`}
                            inputMode="numeric"
                            maxLength={12}
                            className="h-9 w-full min-w-0 px-2.5 font-mono text-base tracking-tight lg:text-xs"
                            placeholder="TISS"
                            value={m.tiss}
                            onChange={(e) => updateMaterial(m.id, { tiss: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1 lg:space-y-0">
                          <label
                            htmlFor={`nome-${m.id}`}
                            className="block whitespace-nowrap text-xs font-medium text-muted-foreground lg:hidden"
                          >
                            Nome comercial
                          </label>
                          <Input
                            id={`nome-${m.id}`}
                            className="h-9 w-full min-w-0 px-2.5 text-base text-ellipsis lg:text-sm"
                            placeholder="Buscar material..."
                            value={m.nome}
                            onChange={(e) => autoFillFromCatalogo(m.id, e.target.value)}
                            list={`opme-nome-${idx}`}
                          />
                          <datalist id={`opme-nome-${idx}`}>
                            {CATALOGO_OPME.map((c) => (
                              <option key={c.tiss} value={c.nome} />
                            ))}
                          </datalist>
                        </div>
                        <div className="space-y-1 lg:space-y-0">
                          <span className="block whitespace-nowrap text-xs font-medium text-muted-foreground lg:hidden">
                            Enquadramento técnico
                          </span>
                          <Select
                            value={m.enq || undefined}
                            onValueChange={(v) => updateMaterial(m.id, { enq: v })}
                          >
                            <SelectTrigger
                              className="h-9 w-full min-w-0 px-2.5 text-base [&>span]:truncate lg:text-sm"
                              aria-label="Enquadramento técnico"
                            >
                              <SelectValue placeholder="—" />
                            </SelectTrigger>
                            <SelectContent>
                              {ENQUADRAMENTOS.map((e) => (
                                <SelectItem key={e} value={e}>
                                  {e}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end gap-3 lg:block">
                          <div className="w-24 space-y-1 lg:w-auto lg:space-y-0">
                            <label
                              htmlFor={`qtd-${m.id}`}
                              className="block whitespace-nowrap text-xs font-medium text-muted-foreground lg:hidden"
                            >
                              Qtd.
                            </label>
                            <Input
                              id={`qtd-${m.id}`}
                              type="number"
                              min={1}
                              className="h-9 w-full min-w-0 px-1.5 text-center font-mono text-base lg:text-sm"
                              value={m.qtd}
                              onChange={(e) =>
                                updateMaterial(m.id, {
                                  qtd: Math.max(1, parseInt(e.target.value) || 1),
                                })
                              }
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Remover material"
                            onClick={() => removeMaterial(m.id)}
                            disabled={materiais.length === 1}
                            className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:hover:bg-transparent lg:hidden"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Remover material"
                          onClick={() => removeMaterial(m.id)}
                          disabled={materiais.length === 1}
                          className="hidden h-8 w-8 justify-self-center shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:hover:bg-transparent lg:flex"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        </div>

                        <div className="px-4 pb-3 pt-2">
                          <div className="relative">
                            <label
                              htmlFor={`spec-${m.id}`}
                              className="mb-1 block truncate text-xs font-medium text-muted-foreground"
                            >
                              Especificação de{" "}
                              {m.nome.trim() || `material ${idx + 1}`} (opcional)
                            </label>
                            <Textarea
                              id={`spec-${m.id}`}
                              rows={2}
                              maxLength={300}
                              className="bg-muted/30 pb-7 text-base focus:bg-background lg:text-sm"
                              placeholder="Ex.: fabricante/distribuidor, modelo, dimensões ou marca de referência"
                              value={spec}
                              onChange={(e) => updateMaterial(m.id, { spec: e.target.value })}
                            />
                            <span className="pointer-events-none absolute right-3 bottom-2.5 text-xs text-muted-foreground tabular-nums">
                              {spec.length}/300
                            </span>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>


                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t bg-muted/30 px-4 py-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addMaterial}
                      className="-ml-2 justify-self-start text-primary hover:text-primary"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar material
                    </Button>
                    {materiaisValidos.length > 0 && (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {materiaisValidos.length}{" "}
                        {materiaisValidos.length === 1 ? "item" : "itens"} · {totalMateriais} un.
                      </span>
                    )}
                  </div>
                </div>

              </div>

            </SectionCard>

            {/* 4. Profissional solicitante */}
            <SectionCard
              id="sec-profissional"
              number={4}
              title="Profissional solicitante"
              collapsed={profCollapsed}
              onToggle={() => setProfCollapsed((v) => !v)}
              done={profOk}
              summary={
                profCollapsed && profOk
                  ? `${profissional} · ${conselho} ${numeroConselho}`
                  : "Identificação profissional responsável pela solicitação."
              }
            >
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1fr_140px_160px_180px]">
                <Field label="Nome do profissional" required>
                  <div className="relative">
                    <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9 uppercase"
                      value={profissional}
                      onChange={(e) => setProfissional(e.target.value)}
                    />
                  </div>
                </Field>
                <Field label="Conselho">
                  <Select value={conselho} onValueChange={setConselho}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["CRM", "CRO", "CREFITO", "COREN"].map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Número do conselho" required>
                  <Input
                    value={numeroConselho}
                    onChange={(e) => setNumeroConselho(e.target.value)}
                  />
                </Field>
                <Field label="Data">
                  <Input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                  />
                </Field>
              </div>
            </SectionCard>

            {/* Ação final */}
            <div>
              <div className="rounded-xl border bg-card/95 backdrop-blur shadow-md px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <StatusPill done={convenioOk} label="Convênio" />
                  <StatusPill done={clinicoOk} label="Justificativa" />
                  <StatusPill done={materiaisOk} label="Materiais" />
                  <StatusPill done={profOk} label="Profissional" />
                </div>
                <Button type="submit" size="sm" disabled={!canSubmit}>
                  <Send />
                  Enviar solicitação
                </Button>
              </div>
            </div>
          </form>
        </div>

        <SiteFooter />
      </main>

      {/* Carregar Kit */}
      <Dialog open={carregarOpen} onOpenChange={setCarregarOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Carregar kit de OPME</DialogTitle>
            <DialogDescription>
              Selecione um kit salvo para pré-preencher justificativa e materiais.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-2">
            {kits.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-8">
                Nenhum kit salvo ainda.
              </div>
            )}
            {kits.map((kit) => (
              <div
                key={kit.id}
                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/40 transition-colors"
              >
                <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Package className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{kit.nome}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {kit.materiais.length}{" "}
                    {kit.materiais.length === 1 ? "material" : "materiais"}
                  </div>
                </div>
                <Button type="button" size="sm" onClick={() => carregarKit(kit)}>
                  Carregar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remover kit"
                  onClick={() => removerKit(kit.id)}
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCarregarOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Salvar como Kit */}
      <Dialog open={salvarOpen} onOpenChange={setSalvarOpen}>
        <DialogContent size="sm" initialFocusRef={nomeKitRef}>
          <DialogHeader>
            <DialogTitle>Salvar como Kit</DialogTitle>
            <DialogDescription>
              Salve a combinação atual de justificativa e materiais para reutilizar depois.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <Field label="Nome do kit" required>
              <Input
                ref={nomeKitRef}
                placeholder="Ex.: Artroplastia total de joelho"
                value={novoKitNome}
                onChange={(e) => setNovoKitNome(e.target.value)}
              />
            </Field>
            <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
              <div>
                <span className="font-semibold text-foreground">
                  {materiaisValidos.length}
                </span>{" "}
                {materiaisValidos.length === 1 ? "material" : "materiais"} incluídos
              </div>
              {justificativa && (
                <div className="line-clamp-2">
                  <ClipboardList className="inline h-3 w-3 mr-1" />
                  {justificativa}
                </div>
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSalvarOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={salvarKit}>
              <Save className="h-4 w-4" />
              Salvar kit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Voltar ao topo"
        title="Voltar ao topo"
        className={`fixed bottom-6 right-6 z-40 h-10 w-10 rounded-full bg-card/90 backdrop-blur transition-all duration-200 ${
          showTopBtn
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
    </div>
  );
}

function SectionCard({
  id,
  number,
  title,
  summary,
  done,
  headerRight,
  children,
}: {
  id: string;
  number: number;
  title: string;
  summary: string;
  /** Mantido por compatibilidade: as seções são sempre visíveis. */
  collapsed?: boolean;
  onToggle?: () => void;
  done: boolean;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-4">
      <div className="rounded-2xl border border-border bg-card shadow-xs p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <span className="min-w-0">
                {number}. {title}
              </span>
              {done && <CheckCircle2 className="h-4 w-4 shrink-0 text-success-strong" />}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{summary}</p>
          </div>
          {headerRight && <div className="w-full lg:w-auto">{headerRight}</div>}
        </div>
        <div className="pt-1">{children}</div>
      </div>
    </section>
  );
}



