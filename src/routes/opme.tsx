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
import { Badge } from "@/components/ui/badge";

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
};

type Kit = {
  id: string;
  nome: string;
  justificativa: string;
  especificacao: string;
  materiais: Material[];
};

const KITS_STORAGE = "haisguias.opme.kits";

const DEFAULT_KITS: Kit[] = [
  {
    id: "kit-artroplastia",
    nome: "Artroplastia total de quadril",
    justificativa:
      "Paciente com coxartrose avançada, dor incapacitante refratária ao tratamento conservador. Indicada artroplastia total de quadril não cimentada.",
    especificacao: "Preferência por implantes da linha padrão hospitalar quando disponíveis.",
    materiais: [
      { id: "1", tiss: "70560840", nome: "Prótese total de quadril não cimentada", enq: "Prótese", qtd: 1 },
      { id: "2", tiss: "70560999", nome: "Cimento ósseo com antibiótico 40g", enq: "Material Especial", qtd: 1 },
    ],
  },
  {
    id: "kit-fratura-umero",
    nome: "Osteossíntese úmero proximal",
    justificativa:
      "Fratura desviada de úmero proximal com indicação cirúrgica. Necessária osteossíntese com placa bloqueada.",
    especificacao: "",
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
  const [especificacao, setEspecificacao] = useState("");

  // Materiais
  const [materiais, setMateriais] = useState<Material[]>([
    { id: uid(), tiss: "", nome: "", enq: "", qtd: 1 },
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
    setEspecificacao("");
    toast.success("Materiais e especificação limpos.");
  }

  function carregarKit(kit: Kit) {
    setJustificativa(kit.justificativa);
    setEspecificacao(kit.especificacao);
    setMateriais(kit.materiais.map((m) => ({ ...m, id: uid() })));
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
      especificacao,
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
        <div className="w-full px-6 lg:px-10 py-8 space-y-6 flex-1 pb-24">
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
              <div className="grid gap-4 sm:grid-cols-2">
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

                <Field
                  label={
                    <span className="flex w-full items-center justify-between gap-2">
                      <span>Convênio / Operadora</span>
                      {operadoraSel && (
                        <span className="text-xs/none font-normal text-muted-foreground">
                          ANS <span className="font-mono text-foreground">{registroAns}</span>
                        </span>
                      )}
                    </span>
                  }
                  required
                  labelClassName="w-full"
                  className="lg:col-span-2"
                >
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
                    placeholder="Descreva o quadro clínico, achados diagnósticos e a justificativa técnica para os materiais solicitados..."
                    value={justificativa}
                    onChange={(e) => setJustificativa(e.target.value)}
                  />
                  <span className="absolute right-3 bottom-2 text-[11px] text-muted-foreground tabular-nums">
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
                <div className="flex flex-wrap items-center gap-2">
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
                    variant="outline"
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      limparMateriais();
                    }}
                    disabled={materiaisValidos.length === 0 && !especificacao}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Eraser className="h-4 w-4" />
                    Limpar
                  </Button>
                </div>
              }
            >
              <div className="space-y-3">
                {materiaisValidos.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="primary-soft" size="sm">
                      {materiaisValidos.length}{" "}
                      {materiaisValidos.length === 1 ? "item" : "itens"} · {totalMateriais} un.
                    </Badge>
                  </div>
                )}

                <div className="rounded-lg border overflow-hidden">
                  <div className="hidden lg:grid grid-cols-[120px_1fr_180px_90px_44px] gap-2 px-3 py-2 bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <div>TISS</div>
                    <div>Nome comercial</div>
                    <div>Enquadramento técnico</div>
                    <div className="text-right">Qtd.</div>
                    <div />
                  </div>
                  <div className="divide-y">
                    {materiais.map((m, idx) => (
                      <div
                        key={m.id}
                        className="grid grid-cols-1 lg:grid-cols-[120px_1fr_180px_90px_44px] gap-2 px-3 py-2.5 items-center"
                      >
                        <Input
                          className="h-9 font-mono text-xs"
                          placeholder="TISS"
                          value={m.tiss}
                          onChange={(e) => updateMaterial(m.id, { tiss: e.target.value })}
                        />
                        <Input
                          className="h-9"
                          placeholder="Digite TISS, nome comercial ou técnico..."
                          value={m.nome}
                          onChange={(e) => autoFillFromCatalogo(m.id, e.target.value)}
                          list={`opme-nome-${idx}`}
                        />
                        <datalist id={`opme-nome-${idx}`}>
                          {CATALOGO_OPME.map((c) => (
                            <option key={c.tiss} value={c.nome} />
                          ))}
                        </datalist>
                        <Select
                          value={m.enq || undefined}
                          onValueChange={(v) => updateMaterial(m.id, { enq: v })}
                        >
                          <SelectTrigger className="h-9">
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
                        <Input
                          type="number"
                          min={1}
                          className="h-9 text-right"
                          value={m.qtd}
                          onChange={(e) =>
                            updateMaterial(m.id, {
                              qtd: Math.max(1, parseInt(e.target.value) || 1),
                            })
                          }
                        />
                        <button
                          type="button"
                          aria-label="Remover material"
                          onClick={() => removeMaterial(m.id)}
                          disabled={materiais.length === 1}
                          className="h-9 w-9 rounded-md flex items-center justify-center text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="button" size="sm" onClick={addMaterial}>
                    <Plus className="h-4 w-4" />
                    Adicionar material
                  </Button>
                </div>


                <Field label="Especificação do material (opcional)">
                  <div className="relative">
                    <Textarea
                      rows={3}
                      maxLength={500}
                      placeholder="Informações adicionais sobre os materiais e/ou dados dos fabricantes/distribuidores"
                      value={especificacao}
                      onChange={(e) => setEspecificacao(e.target.value)}
                    />
                    <span className="absolute right-3 bottom-2 text-[11px] text-muted-foreground tabular-nums">
                      {especificacao.length}/500
                    </span>
                  </div>
                </Field>
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_140px_160px_180px]">
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
              Selecione um kit salvo para pré-preencher justificativa, especificação e materiais.
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
                <button
                  type="button"
                  aria-label="Remover kit"
                  onClick={() => removerKit(kit.id)}
                  className="h-8 w-8 rounded-md flex items-center justify-center text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
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

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Voltar ao topo"
        title="Voltar ao topo"
        className={`fixed bottom-6 right-6 z-40 h-10 w-10 rounded-full border border-border bg-card/90 backdrop-blur text-muted-foreground shadow-md hover:text-foreground hover:bg-card transition-all duration-200 flex items-center justify-center ${
          showTopBtn
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        <ArrowUp className="h-4 w-4" />
      </button>
    </div>
  );
}

function SectionCard({
  id,
  number,
  title,
  summary,
  collapsed,
  onToggle,
  done,
  headerRight,
  children,
}: {
  id: string;
  number: number;
  title: string;
  summary: string;
  collapsed: boolean;
  onToggle: () => void;
  done: boolean;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-4">
      <div className="rounded-2xl border border-border bg-card shadow-xs p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <button
            type="button"
            onClick={onToggle}
            className="flex items-start gap-2 text-left group min-w-0 flex-1"
            aria-expanded={!collapsed}
          >
            <ChevronDown
              className={`h-4 w-4 mt-1 text-muted-foreground transition-transform ${
                collapsed ? "-rotate-90" : ""
              }`}
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold group-hover:text-foreground flex items-center gap-2 whitespace-nowrap">
                <span>
                  {number}. {title}
                </span>
                {done && (
                  <CheckCircle2 className="h-4 w-4 text-success-strong" />
                )}
              </h2>
              <p className={`text-xs text-muted-foreground mt-0.5 ${collapsed ? "truncate" : ""}`}>{summary}</p>
            </div>
          </button>
          {headerRight && !collapsed && (
            <div className="w-full lg:w-auto" onClick={(e) => e.stopPropagation()}>{headerRight}</div>
          )}
        </div>
        {!collapsed && <div className="pt-1">{children}</div>}
      </div>
    </section>
  );
}


