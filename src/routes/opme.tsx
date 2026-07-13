import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Wrench,
  Building2,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import convenioHumanasAsset from "@/assets/convenio-humanas-real.png.asset.json";
import convenioUnimedAsset from "@/assets/convenio-unimed-real.png.asset.json";
import convenioCaurnAsset from "@/assets/convenio-caurn-real.png.asset.json";

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
  const [registroAns, setRegistroAns] = useState<string>("357511");
  const [caraterAtendimento, setCarater] = useState<string>("Eletivo");

  // Paciente / clínico
  const [paciente, setPaciente] = useState("");
  const [cartaoBenef, setCartaoBenef] = useState("");
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
  const [novoKitNome, setNovoKitNome] = useState("");

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

  const totalMateriais = useMemo(
    () => materiais.reduce((acc, m) => acc + (m.nome ? m.qtd || 0 : 0), 0),
    [materiais],
  );
  const materiaisValidos = materiais.filter((m) => m.nome.trim());

  const canSubmit =
    !!operadora && !!paciente.trim() && !!justificativa.trim() && materiaisValidos.length > 0;

  const operadoraSel = OPERADORAS.find((o) => o.value === operadora);

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

  function limpar() {
    setMateriais([{ id: uid(), tiss: "", nome: "", enq: "", qtd: 1 }]);
    setJustificativa("");
    setEspecificacao("");
    toast.success("Formulário limpo.");
  }

  function carregarKit(kit: Kit) {
    setJustificativa(kit.justificativa);
    setEspecificacao(kit.especificacao);
    setMateriais(kit.materiais.map((m) => ({ ...m, id: uid() })));
    setCarregarOpen(false);
    toast.success(`Kit "${kit.nome}" carregado.`);
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

  function enviarPedeGuia(e: React.FormEvent) {
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
        <div className="w-full px-6 lg:px-10 py-8 space-y-6 flex-1 pb-16">
          <PageHeader
            title="Solicitar OPME"
            description="Solicitação de Órteses, Próteses e Materiais Especiais: operadora, paciente, dados clínicos/justificativa técnica e especificação do material."
          />

          <form onSubmit={enviarPedeGuia} className="space-y-6">
            <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="flex items-start gap-3 px-5 py-4 border-b bg-muted/30">
                <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <Wrench className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold">
                    Emitir guias de solicitação de OPME
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Órteses, Próteses e Materiais Especiais
                  </p>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-6">
                {/* Convênio */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <Building2 className="h-3.5 w-3.5" />
                    Convênio / Operadora de saúde
                  </div>
                  <Select
                    value={operadora}
                    onValueChange={(v) => {
                      setOperadora(v);
                      const op = OPERADORAS.find((o) => o.value === v);
                      if (op) setRegistroAns(op.ans);
                    }}
                  >
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
                  {operadoraSel && (
                    <div className="flex items-center gap-3 pt-1">
                      <img
                        src={operadoraSel.logo}
                        alt={operadoraSel.label}
                        className="h-8 w-auto object-contain"
                        loading="lazy"
                      />
                      <span className="text-xs text-muted-foreground">
                        ANS {operadoraSel.ans}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nome do Paciente" required>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                      placeholder="0000 0000 0000 0000"
                      value={cartaoBenef}
                      onChange={(e) => setCartaoBenef(e.target.value)}
                    />
                  </Field>
                  <Field label="Caráter do atendimento">
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
                  <Field label="Registro ANS">
                    <Input
                      value={registroAns}
                      onChange={(e) => setRegistroAns(e.target.value)}
                    />
                  </Field>
                </div>

                <Field label="Dados Clínicos / Justificativa técnica" required>
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

                <Field label="Especificação do material">
                  <div className="relative">
                    <Textarea
                      rows={3}
                      maxLength={500}
                      placeholder="Inclua informações adicionais sobre os materiais e/ou dados dos fabricantes/distribuidores se desejar"
                      value={especificacao}
                      onChange={(e) => setEspecificacao(e.target.value)}
                    />
                    <span className="absolute right-3 bottom-2 text-[11px] text-muted-foreground tabular-nums">
                      {especificacao.length}/500
                    </span>
                  </div>
                </Field>

                {/* Materiais */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <Package className="h-3.5 w-3.5" />
                      Materiais OPME
                      {materiaisValidos.length > 0 && (
                        <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-semibold normal-case tracking-normal">
                          {materiaisValidos.length}{" "}
                          {materiaisValidos.length === 1 ? "item" : "itens"} · {totalMateriais}{" "}
                          un.
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCarregarOpen(true)}
                      >
                        <FolderOpen className="h-4 w-4" />
                        Carregar Kit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSalvarOpen(true)}
                        disabled={materiaisValidos.length === 0}
                      >
                        <Save className="h-4 w-4" />
                        Salvar como Kit
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={limpar}>
                        <Eraser className="h-4 w-4" />
                        Limpar
                      </Button>
                      <Button type="button" size="sm" onClick={addMaterial}>
                        <Plus className="h-4 w-4" />
                        Adicionar
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border overflow-hidden">
                    <div className="hidden md:grid grid-cols-[120px_1fr_180px_90px_44px] gap-2 px-3 py-2 bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <div>TISS</div>
                      <div>Nome comercial</div>
                      <div>Enquadramento técnico</div>
                      <div className="text-right">Quantidade</div>
                      <div />
                    </div>
                    <div className="divide-y">
                      {materiais.map((m, idx) => (
                        <div
                          key={m.id}
                          className="grid grid-cols-1 md:grid-cols-[120px_1fr_180px_90px_44px] gap-2 px-3 py-2.5 items-center"
                        >
                          <Input
                            className="h-9 font-mono text-xs"
                            placeholder="TISS"
                            value={m.tiss}
                            onChange={(e) => updateMaterial(m.id, { tiss: e.target.value })}
                            list={`opme-tiss-${idx}`}
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
                </div>

                {/* Profissional solicitante */}
                <div className="grid gap-4 sm:grid-cols-[1fr_140px_160px_180px] pt-2 border-t">
                  <Field label="Nome do Profissional Solicitante" required>
                    <div className="relative">
                      <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9 uppercase"
                        value={profissional}
                        onChange={(e) => setProfissional(e.target.value)}
                      />
                    </div>
                  </Field>
                  <Field label="Conselho Profissional">
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
                  <Field label="Número do Conselho">
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

                <div className="flex justify-end pt-2">
                  <Button type="submit" size="lg" disabled={!canSubmit}>
                    <Send className="h-4 w-4" />
                    Enviar solicitação
                  </Button>
                </div>
              </div>
            </section>
          </form>
        </div>

        <SiteFooter />
      </main>

      {/* Carregar Kit */}
      <Dialog open={carregarOpen} onOpenChange={setCarregarOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Carregar kit de OPME</DialogTitle>
            <DialogDescription>
              Selecione um kit salvo para pré-preencher justificativa, especificação e materiais.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Salvar como Kit */}
      <Dialog open={salvarOpen} onOpenChange={setSalvarOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Salvar como Kit</DialogTitle>
            <DialogDescription>
              Salve a combinação atual de justificativa e materiais para reutilizar depois.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Nome do kit" required>
              <Input
                autoFocus
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
          </div>
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
