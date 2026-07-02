import { useMemo, useState } from "react";
import {
  Building2,
  User,
  Stethoscope,
  ClipboardList,
  Hospital,
  CalendarClock,
  Users,
  Calculator,
  MessageSquare,
  Plus,
  Trash2,
  Search,
  FileText,
  Save,
} from "lucide-react";
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
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ============ Máscaras ============
const onlyDigits = (v: string) => v.replace(/\D/g, "");

const maskCPF = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};
const maskCNS = (v: string) => {
  const d = onlyDigits(v).slice(0, 15);
  return d.replace(/(\d{3})(\d{4})(\d{4})(\d{0,4})/, "$1 $2 $3 $4").trim();
};
const maskANS = (v: string) => onlyDigits(v).slice(0, 6);
const maskCNES = (v: string) => onlyDigits(v).slice(0, 7);
const maskHora = (v: string) => {
  const d = onlyDigits(v).slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}:${d.slice(2)}`;
};
const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ============ Mock data (autocomplete) ============
const MOCK_BENEFICIARIOS = [
  { carteira: "0064 8823 4477 0011", nome: "Maria Aparecida da Silva", cns: "700 1234 5678 9012" },
  { carteira: "0064 1122 3344 5566", nome: "João Batista Nogueira", cns: "702 9876 5432 1098" },
  { carteira: "0064 9988 7766 5544", nome: "Ana Beatriz Souza", cns: "704 5555 4444 3333" },
  { carteira: "0064 5544 3322 1100", nome: "Carlos Eduardo Lima", cns: "706 1111 2222 3333" },
];

const MOCK_PRESTADORES = [
  { nome: "Hospital São Lucas", cnes: "2077469" },
  { nome: "Clínica Vida Nova", cnes: "6543210" },
  { nome: "Laboratório Central", cnes: "1234567" },
  { nome: "Hospital das Clínicas", cnes: "9876543" },
];

const MOCK_PROFISSIONAIS = [
  { nome: "Dr. Fernando Almeida", conselho: "CRM", numero: "12345", uf: "RN", cbo: "225125" },
  { nome: "Dra. Juliana Prado", conselho: "CRM", numero: "54321", uf: "SP", cbo: "225133" },
  { nome: "Dr. Ricardo Menezes", conselho: "CRM", numero: "67890", uf: "RJ", cbo: "225255" },
  { nome: "Dra. Patrícia Rocha", conselho: "CRO", numero: "24680", uf: "MG", cbo: "223208" },
];

const MOCK_PROCEDIMENTOS = [
  { code: "10101012", description: "Consulta em consultório (no horário normal ou preestabelecido)", valor: 120 },
  { code: "40101010", description: "Eletrocardiograma convencional de até 12 derivações", valor: 65 },
  { code: "40901037", description: "Ecocardiograma transtorácico", valor: 280 },
  { code: "40304361", description: "Hemograma com contagem de plaquetas ou frações", valor: 45 },
  { code: "40302143", description: "Colesterol total", valor: 25 },
  { code: "30306030", description: "Facectomia com implante de lente intraocular", valor: 1850 },
  { code: "41301218", description: "Ultrassonografia abdominal total", valor: 195 },
  { code: "40102030", description: "Teste ergométrico computadorizado", valor: 320 },
];

// ============ Tipos ============
type Solicitado = {
  id: string;
  code: string;
  description: string;
  qtdSolicitada: number;
  qtdAutorizada: number;
};

type Execucao = {
  id: string;
  data: string;
  horaIni: string;
  horaFim: string;
  code: string;
  description: string;
  quantidade: number;
  viaAcesso: string;
  tecnica: string;
  valor: number;
};

type ProfExec = {
  id: string;
  nome: string;
  conselho: string;
  numero: string;
  uf: string;
  cbo: string;
  grau: string;
};

const VIAS_ACESSO = ["Única", "Mesma via", "Diferentes vias"];
const TECNICAS = ["Convencional", "Videolaparoscopia", "Robótica", "Endoscópica"];
const TIPOS_ATENDIMENTO = [
  "Remoção",
  "Pequena cirurgia",
  "Terapias",
  "Consulta",
  "Exames",
  "Atendimento domiciliar",
  "SADT internado",
  "Quimioterapia",
  "Radioterapia",
  "Terapia renal substitutiva",
];
const TIPOS_CONSULTA = [
  "Primeira",
  "Seguimento",
  "Pré-natal",
  "Por encaminhamento",
  "Retorno",
];
const MOTIVOS_ENCERRAMENTO = [
  "Alta curado",
  "Alta melhorado",
  "Alta administrativa",
  "Alta a pedido",
  "Alta com previsão de retorno",
  "Alta por evasão",
  "Permanência (características da doença)",
  "Permanência (intercorrência)",
  "Permanência (impossibilidade sócio-familiar)",
  "Óbito com declaração pelo médico assistente",
  "Óbito com declaração pelo IML",
];
const GRAUS_PART = ["Cirurgião", "Primeiro auxiliar", "Segundo auxiliar", "Anestesista", "Instrumentador", "Perfusionista", "Consultor", "Pediatra", "Auxiliar SADT"];

export function SadtForm() {
  // ============ Card 1 — Operadora ============
  const [registroAns, setRegistroAns] = useState("");
  const [numeroGuia, setNumeroGuia] = useState("");
  const [senha, setSenha] = useState("");
  const [dataAutorizacao, setDataAutorizacao] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [validadeSenha, setValidadeSenha] = useState("");

  // ============ Card 2 — Beneficiário ============
  const [carteira, setCarteira] = useState("");
  const [nomeBenef, setNomeBenef] = useState("");
  const [cns, setCns] = useState("");
  const [atendimentoRN, setAtendimentoRN] = useState("N");
  const [openBenef, setOpenBenef] = useState(false);

  // ============ Card 3 — Solicitante ============
  const [contratadoSol, setContratadoSol] = useState("");
  const [cnesContratadoSol, setCnesContratadoSol] = useState("");
  const [profSol, setProfSol] = useState("");
  const [conselhoSol, setConselhoSol] = useState("CRM");
  const [numeroConselhoSol, setNumeroConselhoSol] = useState("");
  const [ufSol, setUfSol] = useState("RN");
  const [cboSol, setCboSol] = useState("");
  const [dataSolicitacao, setDataSolicitacao] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [openSolProf, setOpenSolProf] = useState(false);
  const [openSolPrest, setOpenSolPrest] = useState(false);

  // ============ Card 4 — Procedimentos solicitados ============
  const [solicitados, setSolicitados] = useState<Solicitado[]>([]);
  const [procQuery, setProcQuery] = useState("");
  const [openProcSearch, setOpenProcSearch] = useState(false);

  const addSolicitado = (p: typeof MOCK_PROCEDIMENTOS[number]) => {
    setSolicitados((prev) => {
      if (prev.some((x) => x.code === p.code)) {
        toast.info("Procedimento já adicionado");
        return prev;
      }
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          code: p.code,
          description: p.description,
          qtdSolicitada: 1,
          qtdAutorizada: 1,
        },
      ];
    });
    setOpenProcSearch(false);
    setProcQuery("");
  };
  const updateSolicitado = (id: string, patch: Partial<Solicitado>) =>
    setSolicitados((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const removeSolicitado = (id: string) =>
    setSolicitados((prev) => prev.filter((x) => x.id !== id));

  // ============ Card 5 — Executante ============
  const [prestadorExec, setPrestadorExec] = useState("");
  const [cnesExec, setCnesExec] = useState("");
  const [tipoAtendimento, setTipoAtendimento] = useState("");
  const [tipoConsulta, setTipoConsulta] = useState("");
  const [motivoEncerramento, setMotivoEncerramento] = useState("");
  const [openExecPrest, setOpenExecPrest] = useState(false);

  const isConsulta = tipoAtendimento === "Consulta";

  // ============ Card 6 — Execução ============
  const [execucoes, setExecucoes] = useState<Execucao[]>([]);
  const addExec = () =>
    setExecucoes((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        data: new Date().toISOString().slice(0, 10),
        horaIni: "",
        horaFim: "",
        code: "",
        description: "",
        quantidade: 1,
        viaAcesso: "Única",
        tecnica: "Convencional",
        valor: 0,
      },
    ]);
  const updateExec = (id: string, patch: Partial<Execucao>) =>
    setExecucoes((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const removeExec = (id: string) =>
    setExecucoes((prev) => prev.filter((x) => x.id !== id));

  // ============ Card 7 — Profissionais executantes ============
  const [profissionais, setProfissionais] = useState<ProfExec[]>([]);
  const addProf = (base?: typeof MOCK_PROFISSIONAIS[number]) =>
    setProfissionais((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        nome: base?.nome ?? "",
        conselho: base?.conselho ?? "CRM",
        numero: base?.numero ?? "",
        uf: base?.uf ?? "RN",
        cbo: base?.cbo ?? "",
        grau: "Cirurgião",
      },
    ]);
  const updateProf = (id: string, patch: Partial<ProfExec>) =>
    setProfissionais((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const removeProf = (id: string) =>
    setProfissionais((prev) => prev.filter((x) => x.id !== id));

  // ============ Card 8 — Totais ============
  const [totalTaxas, setTotalTaxas] = useState(0);
  const [totalMateriais, setTotalMateriais] = useState(0);
  const [totalOpme, setTotalOpme] = useState(0);
  const [totalMedicamentos, setTotalMedicamentos] = useState(0);
  const [totalGases, setTotalGases] = useState(0);

  const totalProcedimentos = useMemo(
    () => execucoes.reduce((s, e) => s + (e.valor || 0) * (e.quantidade || 0), 0),
    [execucoes],
  );
  const totalGeral =
    totalProcedimentos + totalTaxas + totalMateriais + totalOpme + totalMedicamentos + totalGases;

  // ============ Card 9 — Observações ============
  const [observacoes, setObservacoes] = useState("");

  // ============ Autocomplete beneficiário ============
  const applyBenef = (b: typeof MOCK_BENEFICIARIOS[number]) => {
    setCarteira(b.carteira);
    setNomeBenef(b.nome);
    setCns(b.cns);
    setOpenBenef(false);
  };

  const applyProfSol = (p: typeof MOCK_PROFISSIONAIS[number]) => {
    setProfSol(p.nome);
    setConselhoSol(p.conselho);
    setNumeroConselhoSol(p.numero);
    setUfSol(p.uf);
    setCboSol(p.cbo);
    setOpenSolProf(false);
  };

  return (
    <div className="space-y-6">
      {/* Card 1 — Operadora */}
      <Card
        icon={<Building2 className="h-4 w-4" />}
        title="Dados da operadora"
        description="Identificação da autorização e senha emitida pela operadora."
      >
        <Grid>
          <Field label="Registro ANS" required span={3}>
            <Input
              value={registroAns}
              onChange={(e) => setRegistroAns(maskANS(e.target.value))}
              placeholder="000000"
              inputMode="numeric"
            />
          </Field>
          <Field label="Nº da guia" required span={3}>
            <Input
              value={numeroGuia}
              onChange={(e) => setNumeroGuia(e.target.value)}
              placeholder="Ex.: 20250001"
            />
          </Field>
          <Field label="Senha" span={3}>
            <Input
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Nº da senha de autorização"
            />
          </Field>
          <Field label="Data da autorização" span={3}>
            <Input
              type="date"
              value={dataAutorizacao}
              onChange={(e) => setDataAutorizacao(e.target.value)}
            />
          </Field>
          <Field label="Validade da senha" span={3}>
            <Input
              type="date"
              value={validadeSenha}
              onChange={(e) => setValidadeSenha(e.target.value)}
            />
          </Field>
        </Grid>
      </Card>

      {/* Card 2 — Beneficiário */}
      <Card
        icon={<User className="h-4 w-4" />}
        title="Beneficiário"
        description="Identificação do beneficiário na operadora e no SUS."
      >
        <Grid>
          <Field label="Nº da carteira" required span={4}>
            <Popover open={openBenef} onOpenChange={setOpenBenef}>
              <PopoverTrigger asChild>
                <Input
                  value={carteira}
                  onChange={(e) => setCarteira(e.target.value)}
                  onFocus={() => setOpenBenef(true)}
                  placeholder="Buscar por carteira ou nome"
                />
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[420px]" align="start">
                <Command>
                  <CommandInput placeholder="Digite carteira ou nome..." />
                  <CommandList>
                    <CommandEmpty>Nenhum beneficiário.</CommandEmpty>
                    <CommandGroup heading="Beneficiários">
                      {MOCK_BENEFICIARIOS.map((b) => (
                        <CommandItem
                          key={b.carteira}
                          value={`${b.carteira} ${b.nome}`}
                          onSelect={() => applyBenef(b)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{b.nome}</span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {b.carteira}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </Field>
          <Field label="Nome" required span={5}>
            <Input
              value={nomeBenef}
              onChange={(e) => setNomeBenef(e.target.value)}
              placeholder="Nome completo do beneficiário"
            />
          </Field>
          <Field label="CNS" span={3}>
            <Input
              value={cns}
              onChange={(e) => setCns(maskCNS(e.target.value))}
              placeholder="000 0000 0000 0000"
              inputMode="numeric"
            />
          </Field>
          <Field label="Atendimento a RN" span={3}>
            <Select value={atendimentoRN} onValueChange={setAtendimentoRN}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="S">Sim</SelectItem>
                <SelectItem value="N">Não</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </Grid>
      </Card>

      {/* Card 3 — Solicitante */}
      <Card
        icon={<Stethoscope className="h-4 w-4" />}
        title="Solicitante"
        description="Contratado e profissional que solicita o procedimento."
      >
        <Grid>
          <Field label="Contratado solicitante" required span={8}>
            <Popover open={openSolPrest} onOpenChange={setOpenSolPrest}>
              <PopoverTrigger asChild>
                <Input
                  value={contratadoSol}
                  onChange={(e) => setContratadoSol(e.target.value)}
                  onFocus={() => setOpenSolPrest(true)}
                  placeholder="Buscar contratado / prestador"
                />
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[420px]" align="start">
                <Command>
                  <CommandInput placeholder="Buscar prestador..." />
                  <CommandList>
                    <CommandEmpty>Nenhum prestador.</CommandEmpty>
                    <CommandGroup heading="Prestadores">
                      {MOCK_PRESTADORES.map((p) => (
                        <CommandItem
                          key={p.cnes}
                          value={`${p.nome} ${p.cnes}`}
                          onSelect={() => {
                            setContratadoSol(p.nome);
                            setCnesContratadoSol(p.cnes);
                            setOpenSolPrest(false);
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{p.nome}</span>
                            <span className="text-xs text-muted-foreground font-mono">
                              CNES {p.cnes}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </Field>
          <Field label="CNES" span={4}>
            <Input
              value={cnesContratadoSol}
              onChange={(e) => setCnesContratadoSol(maskCNES(e.target.value))}
              placeholder="0000000"
              inputMode="numeric"
            />
          </Field>

          <Field label="Profissional solicitante" required span={6}>
            <Popover open={openSolProf} onOpenChange={setOpenSolProf}>
              <PopoverTrigger asChild>
                <Input
                  value={profSol}
                  onChange={(e) => setProfSol(e.target.value)}
                  onFocus={() => setOpenSolProf(true)}
                  placeholder="Buscar profissional"
                />
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[420px]" align="start">
                <Command>
                  <CommandInput placeholder="Buscar profissional..." />
                  <CommandList>
                    <CommandEmpty>Nenhum profissional.</CommandEmpty>
                    <CommandGroup heading="Profissionais">
                      {MOCK_PROFISSIONAIS.map((p) => (
                        <CommandItem
                          key={p.numero}
                          value={`${p.nome} ${p.conselho} ${p.numero}`}
                          onSelect={() => applyProfSol(p)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{p.nome}</span>
                            <span className="text-xs text-muted-foreground">
                              {p.conselho} {p.numero}/{p.uf} · CBO {p.cbo}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </Field>
          <Field label="Conselho" required span={2}>
            <Select value={conselhoSol} onValueChange={setConselhoSol}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["CRM", "CRO", "COREN", "CREFITO", "CRP", "Outros"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Nº do conselho" required span={2}>
            <Input
              value={numeroConselhoSol}
              onChange={(e) => setNumeroConselhoSol(onlyDigits(e.target.value).slice(0, 10))}
              placeholder="00000"
              inputMode="numeric"
            />
          </Field>
          <Field label="UF" required span={1}>
            <Select value={ufSol} onValueChange={setUfSol}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map((uf) => (
                  <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="CBO" span={1}>
            <Input
              value={cboSol}
              onChange={(e) => setCboSol(onlyDigits(e.target.value).slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
            />
          </Field>

          <Field label="Data da solicitação" required span={3}>
            <Input
              type="date"
              value={dataSolicitacao}
              onChange={(e) => setDataSolicitacao(e.target.value)}
            />
          </Field>
        </Grid>
      </Card>

      {/* Card 4 — Procedimentos solicitados */}
      <Card
        icon={<ClipboardList className="h-4 w-4" />}
        title="Procedimentos solicitados"
        description="Pesquise, adicione e ajuste as quantidades solicitadas e autorizadas."
        action={
          <Popover open={openProcSearch} onOpenChange={setOpenProcSearch}>
            <PopoverTrigger asChild>
              <Button type="button" size="sm">
                <Plus className="h-4 w-4" /> Adicionar procedimento
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[520px]" align="end">
              <Command>
                <CommandInput
                  placeholder="Buscar por código ou descrição TUSS..."
                  value={procQuery}
                  onValueChange={setProcQuery}
                />
                <CommandList>
                  <CommandEmpty>Nenhum procedimento encontrado.</CommandEmpty>
                  <CommandGroup heading="Procedimentos TUSS">
                    {MOCK_PROCEDIMENTOS.map((p) => (
                      <CommandItem
                        key={p.code}
                        value={`${p.code} ${p.description}`}
                        onSelect={() => addSolicitado(p)}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{p.description}</span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {p.code} · {brl(p.valor)}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        }
      >
        {solicitados.length === 0 ? (
          <EmptyState
            icon={<Search className="h-5 w-5" />}
            title="Nenhum procedimento adicionado"
            description="Use “Adicionar procedimento” para pesquisar na tabela TUSS."
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-[130px]">Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-[130px] text-right">Qtd. solicitada</TableHead>
                  <TableHead className="w-[130px] text-right">Qtd. autorizada</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {solicitados.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.code}</TableCell>
                    <TableCell className="text-sm">{s.description}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        value={s.qtdSolicitada}
                        onChange={(e) =>
                          updateSolicitado(s.id, {
                            qtdSolicitada: Math.max(1, Number(e.target.value) || 1),
                          })
                        }
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        value={s.qtdAutorizada}
                        onChange={(e) =>
                          updateSolicitado(s.id, {
                            qtdAutorizada: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSolicitado(s.id)}
                        aria-label="Remover"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Card 5 — Executante */}
      <Card
        icon={<Hospital className="h-4 w-4" />}
        title="Executante"
        description="Prestador executor e tipo de atendimento realizado."
      >
        <Grid>
          <Field label="Prestador executante" required span={8}>
            <Popover open={openExecPrest} onOpenChange={setOpenExecPrest}>
              <PopoverTrigger asChild>
                <Input
                  value={prestadorExec}
                  onChange={(e) => setPrestadorExec(e.target.value)}
                  onFocus={() => setOpenExecPrest(true)}
                  placeholder="Buscar prestador executante"
                />
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[420px]" align="start">
                <Command>
                  <CommandInput placeholder="Buscar prestador..." />
                  <CommandList>
                    <CommandEmpty>Nenhum prestador.</CommandEmpty>
                    <CommandGroup heading="Prestadores">
                      {MOCK_PRESTADORES.map((p) => (
                        <CommandItem
                          key={p.cnes}
                          value={`${p.nome} ${p.cnes}`}
                          onSelect={() => {
                            setPrestadorExec(p.nome);
                            setCnesExec(p.cnes);
                            setOpenExecPrest(false);
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{p.nome}</span>
                            <span className="text-xs text-muted-foreground font-mono">
                              CNES {p.cnes}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </Field>
          <Field label="CNES" span={4}>
            <Input
              value={cnesExec}
              onChange={(e) => setCnesExec(maskCNES(e.target.value))}
              placeholder="0000000"
              inputMode="numeric"
            />
          </Field>
          <Field label="Tipo de atendimento" required span={4}>
            <Select value={tipoAtendimento} onValueChange={setTipoAtendimento}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_ATENDIMENTO.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {/* Condicional: Tipo de consulta só aparece se o atendimento for Consulta */}
          {isConsulta && (
            <Field label="Tipo de consulta" required span={4}>
              <Select value={tipoConsulta} onValueChange={setTipoConsulta}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_CONSULTA.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
          <Field label="Motivo do encerramento" span={isConsulta ? 4 : 8}>
            <Select value={motivoEncerramento} onValueChange={setMotivoEncerramento}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS_ENCERRAMENTO.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </Grid>
      </Card>

      {/* Card 6 — Execução */}
      <Card
        icon={<CalendarClock className="h-4 w-4" />}
        title="Execução"
        description="Registre a execução de cada procedimento realizado."
        action={
          <Button type="button" size="sm" onClick={addExec}>
            <Plus className="h-4 w-4" /> Adicionar execução
          </Button>
        }
      >
        {execucoes.length === 0 ? (
          <EmptyState
            icon={<CalendarClock className="h-5 w-5" />}
            title="Nenhuma execução registrada"
            description="Adicione uma execução para preencher data, horário e valor."
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-[140px]">Data</TableHead>
                  <TableHead className="w-[90px]">Hora ini.</TableHead>
                  <TableHead className="w-[90px]">Hora fim</TableHead>
                  <TableHead>Procedimento</TableHead>
                  <TableHead className="w-[80px] text-right">Qtd.</TableHead>
                  <TableHead className="w-[130px]">Via de acesso</TableHead>
                  <TableHead className="w-[130px]">Técnica</TableHead>
                  <TableHead className="w-[130px] text-right">Valor</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {execucoes.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <Input type="date" value={e.data} onChange={(ev) => updateExec(e.id, { data: ev.target.value })} />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={e.horaIni}
                        onChange={(ev) => updateExec(e.id, { horaIni: maskHora(ev.target.value) })}
                        placeholder="hh:mm"
                        inputMode="numeric"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={e.horaFim}
                        onChange={(ev) => updateExec(e.id, { horaFim: maskHora(ev.target.value) })}
                        placeholder="hh:mm"
                        inputMode="numeric"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={e.code}
                        onValueChange={(v) => {
                          const proc = MOCK_PROCEDIMENTOS.find((p) => p.code === v);
                          if (proc)
                            updateExec(e.id, {
                              code: proc.code,
                              description: proc.description,
                              valor: proc.valor,
                            });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Procedimento" />
                        </SelectTrigger>
                        <SelectContent>
                          {MOCK_PROCEDIMENTOS.map((p) => (
                            <SelectItem key={p.code} value={p.code}>
                              {p.code} — {p.description.slice(0, 40)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        value={e.quantidade}
                        onChange={(ev) =>
                          updateExec(e.id, {
                            quantidade: Math.max(1, Number(ev.target.value) || 1),
                          })
                        }
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Select value={e.viaAcesso} onValueChange={(v) => updateExec(e.id, { viaAcesso: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {VIAS_ACESSO.map((o) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select value={e.tecnica} onValueChange={(v) => updateExec(e.id, { tecnica: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TECNICAS.map((o) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={e.valor}
                        onChange={(ev) => updateExec(e.id, { valor: Number(ev.target.value) || 0 })}
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeExec(e.id)} aria-label="Remover">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Card 7 — Profissionais executantes */}
      <Card
        icon={<Users className="h-4 w-4" />}
        title="Profissionais executantes"
        description="Adicione todos os profissionais que participaram da execução."
        action={
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" size="sm" variant="outline">
                  <Search className="h-4 w-4" /> Buscar
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[420px]" align="end">
                <Command>
                  <CommandInput placeholder="Buscar profissional..." />
                  <CommandList>
                    <CommandEmpty>Nenhum profissional.</CommandEmpty>
                    <CommandGroup heading="Profissionais">
                      {MOCK_PROFISSIONAIS.map((p) => (
                        <CommandItem
                          key={p.numero}
                          value={`${p.nome} ${p.numero}`}
                          onSelect={() => addProf(p)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{p.nome}</span>
                            <span className="text-xs text-muted-foreground">
                              {p.conselho} {p.numero}/{p.uf}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button type="button" size="sm" onClick={() => addProf()}>
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>
        }
      >
        {profissionais.length === 0 ? (
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title="Nenhum profissional adicionado"
            description="Adicione profissionais executantes ou busque no cadastro."
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-[110px]">Conselho</TableHead>
                  <TableHead className="w-[130px]">Nº do conselho</TableHead>
                  <TableHead className="w-[80px]">UF</TableHead>
                  <TableHead className="w-[110px]">CBO</TableHead>
                  <TableHead className="w-[180px]">Grau de participação</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {profissionais.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Input value={p.nome} onChange={(e) => updateProf(p.id, { nome: e.target.value })} placeholder="Nome" />
                    </TableCell>
                    <TableCell>
                      <Select value={p.conselho} onValueChange={(v) => updateProf(p.id, { conselho: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["CRM","CRO","COREN","CREFITO","CRP","Outros"].map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input value={p.numero} onChange={(e) => updateProf(p.id, { numero: onlyDigits(e.target.value).slice(0, 10) })} inputMode="numeric" />
                    </TableCell>
                    <TableCell>
                      <Select value={p.uf} onValueChange={(v) => updateProf(p.id, { uf: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map((uf) => (<SelectItem key={uf} value={uf}>{uf}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input value={p.cbo} onChange={(e) => updateProf(p.id, { cbo: onlyDigits(e.target.value).slice(0, 6) })} inputMode="numeric" />
                    </TableCell>
                    <TableCell>
                      <Select value={p.grau} onValueChange={(v) => updateProf(p.id, { grau: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {GRAUS_PART.map((g) => (<SelectItem key={g} value={g}>{g}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeProf(p.id)} aria-label="Remover">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Card 8 — Totais */}
      <Card
        icon={<Calculator className="h-4 w-4" />}
        title="Totais"
        description="Valores consolidados da guia. Procedimentos é calculado automaticamente."
      >
        <Grid>
          <TotalField label="Procedimentos" value={totalProcedimentos} readOnly />
          <TotalField label="Taxas" value={totalTaxas} onChange={setTotalTaxas} />
          <TotalField label="Materiais" value={totalMateriais} onChange={setTotalMateriais} />
          <TotalField label="OPME" value={totalOpme} onChange={setTotalOpme} />
          <TotalField label="Medicamentos" value={totalMedicamentos} onChange={setTotalMedicamentos} />
          <TotalField label="Gases medicinais" value={totalGases} onChange={setTotalGases} />
        </Grid>
        <div className="mt-4 flex items-center justify-between rounded-lg border-2 border-primary/30 bg-primary/5 px-5 py-4">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-primary">
              Total geral da guia
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Soma automática de procedimentos, taxas, materiais, OPME, medicamentos e gases.
            </p>
          </div>
          <p className="text-2xl font-bold text-primary tabular-nums">{brl(totalGeral)}</p>
        </div>
      </Card>

      {/* Card 9 — Observações */}
      <Card
        icon={<MessageSquare className="h-4 w-4" />}
        title="Observações / Justificativa"
        description="Informações complementares sobre a guia."
      >
        <Textarea
          rows={5}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Descreva justificativas, intercorrências ou informações relevantes para a auditoria."
        />
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-2 sticky bottom-0 bg-background/80 backdrop-blur py-3 border-t">
        <Button type="button" variant="ghost">Limpar</Button>
        <Button type="button" variant="outline">
          <Save className="h-4 w-4" /> Salvar rascunho
        </Button>
        <Button type="submit">
          <FileText className="h-4 w-4" /> Gerar guia SADT
        </Button>
      </div>
    </div>
  );
}

// ============ Subcomponentes ============
function Card({
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
      <div className="flex items-start justify-between gap-4 px-6 py-4 border-b">
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
      <div className="p-6">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-12 gap-4">{children}</div>;
}

function Field({
  label,
  required,
  span = 12,
  children,
}: {
  label: string;
  required?: boolean;
  span?: number;
  children: React.ReactNode;
}) {
  const spanClass: Record<number, string> = {
    1: "col-span-6 sm:col-span-3 md:col-span-1",
    2: "col-span-6 sm:col-span-4 md:col-span-2",
    3: "col-span-6 md:col-span-3",
    4: "col-span-12 sm:col-span-6 md:col-span-4",
    5: "col-span-12 sm:col-span-6 md:col-span-5",
    6: "col-span-12 md:col-span-6",
    7: "col-span-12 md:col-span-7",
    8: "col-span-12 md:col-span-8",
    9: "col-span-12 md:col-span-9",
    10: "col-span-12 md:col-span-10",
    11: "col-span-12 md:col-span-11",
    12: "col-span-12",
  };
  return (
    <div className={cn("space-y-1.5", spanClass[span] ?? "col-span-12")}>
      <Label className="text-xs font-medium text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function TotalField({
  label,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="col-span-12 sm:col-span-6 md:col-span-4 space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {readOnly ? (
        <div className="h-9 flex items-center rounded-md border bg-muted/40 px-3 text-sm font-semibold tabular-nums">
          {brl(value)}
        </div>
      ) : (
        <Input
          type="number"
          min={0}
          step="0.01"
          value={value}
          onChange={(e) => onChange?.(Number(e.target.value) || 0)}
          className="text-right tabular-nums"
        />
      )}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center">
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
        {icon}
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm">{description}</p>
    </div>
  );
}
