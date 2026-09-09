import { useMemo, useState } from "react";
import {
  BedDouble,
  Building2,
  ChevronRight,
  ClipboardList,
  FileText,
  Loader2,
  Plus,
  Eye,
  
  Stethoscope,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { operadoraLogoUrl } from "@/features/guides/data/operadora-logos";
import { SectionCard } from "@/components/section-card";
import { FormActionBar } from "@/components/form-action-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { EmptyState } from "@/components/data-state";
import { SelectField } from "@/components/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AppModal } from "@/components/app-modal";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Download, Printer } from "lucide-react";
import { addIssuedGuide, downloadIssuedGuide, type IssuedGuide } from "@/features/issued-guides";
import { nextGuiaNumber } from "@/lib/guia-number";
import { ScaledGuideSheet } from "@/components/scaled-guide-sheet";
import { A4_PORTRAIT_SHEET_WIDTH_PX } from "@/lib/guide-sheet";
import { InternacaoGuidePreview } from "./internacao-guide-preview";
import { lookupBeneficiary, normalizeCarteira } from "@/features/beneficiaries";
import { CID_OPTIONS } from "@/lib/cid";
import { UF_SELECT_OPTIONS } from "@/lib/uf-options";
import { CBO_OPTIONS } from "@/lib/cbo-options";


import { TUSS, TUSS_OPTIONS, resolveTissTable } from "@/lib/tuss";

/** Item do quadro "Procedimentos ou Itens Assistenciais Solicitados" (campos 34 a 38). */
interface RequestedItem {
  id: string;
  table: string;
  code: string;
  description: string;
  requestedQty: number;
}

/** Tabela TUSS 23 — Caráter do atendimento (código de 1 caractere). */
const CARATER_OPTIONS = [
  { value: "1", label: "1 - Eletivo" },
  { value: "2", label: "2 - Urgência/Emergência" },
];

/** Tabela TUSS 57 — Tipo de internação (código de 1 caractere). */
const TIPO_INTERNACAO_OPTIONS = [
  { value: "1", label: "1 - Clínica" },
  { value: "2", label: "2 - Cirúrgica" },
  { value: "3", label: "3 - Obstétrica" },
  { value: "4", label: "4 - Pediátrica" },
  { value: "5", label: "5 - Psiquiátrica" },
];

/** Tabela TUSS 41 — Regime de internação (código de 1 caractere). */
const REGIME_INTERNACAO_OPTIONS = [
  { value: "1", label: "1 - Hospitalar" },
  { value: "2", label: "2 - Hospital-dia" },
  { value: "3", label: "3 - Domiciliar" },
];


const SIM_NAO_OPTIONS = [
  { value: "S", label: "S - Sim" },
  { value: "N", label: "N - Não" },
];

const ACIDENTE_OPTIONS = [
  { value: "0", label: "0 - Trabalho" },
  { value: "1", label: "1 - Trânsito" },
  { value: "2", label: "2 - Outros acidentes" },
  { value: "9", label: "9 - Não acidente" },
];

/** Tabela 26 TISS — conselhos profissionais. O valor gravado na guia é o código. */
const CONSELHO_OPTIONS = [
  { value: "01", label: "01 - Conselho Regional de Serviço Social (CRESS)" },
  { value: "02", label: "02 - Conselho Regional de Enfermagem (COREN)" },
  { value: "03", label: "03 - Conselho Regional de Farmácia (CRF)" },
  { value: "04", label: "04 - Conselho Regional de Fonoaudiologia (CREFONO)" },
  {
    value: "05",
    label: "05 - Conselho Regional de Fisioterapia e Terapia Ocupacional (CREFITO)",
  },
  { value: "06", label: "06 - Conselho Regional de Medicina (CRM)" },
  { value: "07", label: "07 - Conselho Regional de Nutrição (CRN)" },
  { value: "08", label: "08 - Conselho Regional de Odontologia (CRO)" },
  { value: "09", label: "09 - Conselho Regional de Psicologia (CRP)" },
  { value: "10", label: "10 - Outros Conselhos" },
  { value: "11", label: "11 - Conselho Regional de Biologia (CRBio)" },
  { value: "12", label: "12 - Conselho Regional de Biomedicina (CRBM)" },
  { value: "13", label: "13 - Conselho Regional de Educação Física (CREF)" },
  { value: "14", label: "14 - Conselho Regional de Medicina Veterinária (CRMV)" },
  { value: "15", label: "15 - Conselho Regional de Técnicos em Radiologia (CRTR)" },
];


const TABELA_OPTIONS = [
  { value: "22", label: "22 - TUSS Procedimentos" },
  { value: "18", label: "18 - Medicamentos" },
  { value: "19", label: "19 - Materiais / OPME" },
  { value: "20", label: "20 - Taxas e diárias" },
];

function newItem(): RequestedItem {
  return {
    id: crypto.randomUUID(),
    table: "22",
    code: "",
    description: "",
    requestedQty: 1,
  };
}

function Grid({ cols, children }: { cols: 2 | 3 | 12; children: React.ReactNode }) {
  // Mesmas escalas usadas no formulário SP/SADT, para que as duas guias
  // tenham exatamente o mesmo ritmo de grade e espaçamento.
  const colsClass =
    cols === 2
      ? "grid-cols-1 @md:grid-cols-2"
      : cols === 3
        ? "grid-cols-1 @md:grid-cols-2 @3xl:grid-cols-3"
        : "grid-cols-1 @md:grid-cols-6 @3xl:grid-cols-12";
  return (
    <div className="@container">
      <div className={`grid items-start gap-x-4 gap-y-3 ${colsClass}`}>{children}</div>
    </div>
  );
}


function Field({
  label,
  required,
  span,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  /** Classes de coluna aplicadas quando o Grid usa 12 colunas. */
  span?: string;
  /** Texto auxiliar exibido abaixo do campo. */
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={`min-w-0 space-y-1.5 ${span ?? ""}`}>
      <Label className="text-xs font-medium text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs leading-snug text-muted-foreground">{hint}</p>}
    </div>
  );
}


export interface OperadoraOption {
  value: string;
  label: string;
  logo?: string;
  /** Registro ANS (campo 1) da operadora. */
  ans: string;
}

export interface InternacaoGuideFormProps {
  /** Número sequencial da guia no prestador (campo 2). */
  numeroGuia: string;
  /** Registro ANS da operadora selecionada (campo 1). */
  registroAns: string;
  /** Slot do cabeçalho (seleção da operadora, pré-visualização etc.). */
  header?: React.ReactNode;
  /** Operadora / convênio selecionado na seção Convênio. */
  operadora?: string;
  /** Operadoras disponíveis para seleção. */
  operadoras?: readonly OperadoraOption[];
  /** Notifica a seleção de operadora (valor + registro ANS). */
  onOperadoraChange?: (value: string, ans: string) => void;
  onSubmitGuide?: () => void;
}

/**
 * Guia de Solicitação de Internação (padrão TISS — Dezembro/2017).
 * Campos 1 a 49, na mesma ordem e com a mesma nomenclatura do formulário oficial.
 */
export function InternacaoGuideForm({
  numeroGuia,
  registroAns,
  header,
  operadora,
  operadoras = [],
  onOperadoraChange,
}: InternacaoGuideFormProps) {
  // 1 a 6 — identificação da guia e autorização
  const [operadoraValue, setOperadoraValue] = useState(operadora ?? "");
  const [autorizacaoOpen, setAutorizacaoOpen] = useState(false);
  const [ans, setAns] = useState(registroAns);
  /** Campo 2 — gerado pelo sistema; apenas repassado para a pré-visualização. */
  const guiaPrestador = numeroGuia;
  const [guiaOperadora, setGuiaOperadora] = useState("");
  const [dataAutorizacao, setDataAutorizacao] = useState("");
  const [senha, setSenha] = useState("");
  const [validadeSenha, setValidadeSenha] = useState("");

  // 7 a 11 — beneficiário
  const [carteira, setCarteira] = useState("");
  /** 8 — condicional no TISS: preenchido pelo cadastro e enviado quando aplicável. */
  const [validadeCarteira, setValidadeCarteira] = useState("");
  const [atendimentoRn, setAtendimentoRn] = useState("N");
  const [nomeBeneficiario, setNomeBeneficiario] = useState("");
  const [cns, setCns] = useState("");
  /** 50 — condicional: preenchido quando requerido pelo beneficiário (Decreto 8.727/2016). */
  const [nomeSocial, setNomeSocial] = useState("");
  const [beneficiarioStatus, setBeneficiarioStatus] = useState<
    "idle" | "loading" | "found" | "not-found"
  >("idle");
  const [carteiraConsultada, setCarteiraConsultada] = useState("");

  /**
   * Consulta o beneficiário pela carteira (campo 7) e preenche automaticamente
   * nome (10), CNS (11) e validade da carteira (8) quando existirem no cadastro.
   */
  async function buscarBeneficiario() {
    const digits = normalizeCarteira(carteira);
    if (!digits) {
      setBeneficiarioStatus("idle");
      setCarteiraConsultada("");
      return;
    }
    if (digits === carteiraConsultada && beneficiarioStatus !== "idle") return;

    setBeneficiarioStatus("loading");
    const found = await lookupBeneficiary(digits);
    setCarteiraConsultada(digits);

    if (!found) {
      setBeneficiarioStatus("not-found");
      return;
    }

    setNomeBeneficiario(found.nome);
    setCns(found.cns ?? "");
    setValidadeCarteira(found.validadeCarteira ?? "");
    setBeneficiarioStatus("found");
    toast.success("Beneficiário encontrado", { description: found.nome });
  }


  // 12 a 18 — contratado solicitante
  const [codigoSolicitante, setCodigoSolicitante] = useState("");
  const [nomeContratado, setNomeContratado] = useState("");
  const [nomeProfissional, setNomeProfissional] = useState("");
  const [conselho, setConselho] = useState("06");
  const [numeroConselho, setNumeroConselho] = useState("");
  const [ufConselho, setUfConselho] = useState("");
  const [cbo, setCbo] = useState("");

  // 19 a 28 — hospital/local solicitado e dados da internação
  const [codigoHospital, setCodigoHospital] = useState("");
  const [nomeHospital, setNomeHospital] = useState("");
  const [dataSugerida, setDataSugerida] = useState("");
  const [carater, setCarater] = useState("1");
  const [tipoInternacao, setTipoInternacao] = useState("1");
  const [regimeInternacao, setRegimeInternacao] = useState("1");
  const [diariasSolicitadas, setDiariasSolicitadas] = useState(1);
  const [previsaoOpme, setPrevisaoOpme] = useState("N");
  const [previsaoQuimio, setPrevisaoQuimio] = useState("N");
  const [indicacaoClinica, setIndicacaoClinica] = useState("");

  // 29 a 33 — diagnósticos e acidente
  const [cid1, setCid1] = useState("");
  const [cid2, setCid2] = useState("");
  const [cid3, setCid3] = useState("");
  const [cid4, setCid4] = useState("");
  const [indicacaoAcidente, setIndicacaoAcidente] = useState("9");

  // 34 a 38 — procedimentos solicitados
  const [items, setItems] = useState<RequestedItem[]>([newItem()]);

  // 39 a 44 — dados da autorização: preenchidos apenas pela operadora, por isso
  // não aparecem no formulário e saem vazios na guia da solicitação inicial.
  const dataAdmissao = "";
  const diariasAutorizadas = "";
  const acomodacaoAutorizada = "";
  const codigoAutorizado = "";
  const hospitalAutorizado = "";
  const cnes = "";

  // 45 — observação (único campo desta seção preenchido no formulário)
  const [observacao, setObservacao] = useState("");

  /**
   * 46 — Data da Solicitação: preenchida automaticamente pelo sistema na emissão.
   * 47 a 49 — assinaturas: permanecem vazias na guia para assinatura manual após a
   * impressão (49 depende da autorização da operadora).
   */
  const dataSolicitacao = new Date().toISOString().slice(0, 10);
  const assinaturaProfissional = "";
  const assinaturaBeneficiario = "";
  const assinaturaAutorizacao = "";


  const [submitting, setSubmitting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  /** Guia emitida e salva — abre o modal de confirmação da emissão. */
  const [issuedGuide, setIssuedGuide] = useState<IssuedGuide | null>(null);
  const navigate = useNavigate();

  /** Dados normalizados enviados à pré-visualização da guia impressa. */
  const previewData = {
    operadoraLogo: operadoraLogoUrl(
      operadoras.find((o) => o.value === operadoraValue)?.label ?? operadoraValue,
    ),
    ans,
    guiaPrestador,
    guiaOperadora,
    dataAutorizacao,
    senha,
    validadeSenha,
    carteira,
    validadeCarteira,
    atendimentoRn,
    nomeBeneficiario,
    cns,
    nomeSocial,
    codigoSolicitante,
    nomeContratado,
    nomeProfissional,
    conselho,
    numeroConselho,
    ufConselho,
    cbo,
    codigoHospital,
    nomeHospital,
    dataSugerida,
    carater,
    tipoInternacao,
    regimeInternacao,
    diariasSolicitadas,
    previsaoOpme,
    previsaoQuimio,
    indicacaoClinica,
    cid1,
    cid2,
    cid3,
    cid4,
    indicacaoAcidente,
    items,
    dataAdmissao,
    diariasAutorizadas,
    acomodacaoAutorizada,
    codigoAutorizado,
    hospitalAutorizado,
    cnes,
    observacao,
    dataSolicitacao,
    assinaturaProfissional,
    assinaturaBeneficiario,
    assinaturaAutorizacao,
  };

  const updateItem = (id: string, patch: Partial<RequestedItem>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const guiaOk = Boolean(operadoraValue && ans);
  const beneficiarioOk = Boolean(carteira && nomeBeneficiario);
  const solicitanteOk = Boolean(
    codigoSolicitante &&
      nomeContratado &&
      conselho &&
      numeroConselho &&
      ufConselho &&
      cbo,
  );
  const internacaoOk = Boolean(
    codigoHospital &&
      nomeHospital &&
      dataSugerida &&
      carater &&
      tipoInternacao &&
      regimeInternacao &&
      diariasSolicitadas > 0 &&
      indicacaoClinica,
  );
  const diagnosticoOk = Boolean(indicacaoAcidente);
  const itemsOk = useMemo(
    () =>
      items.length > 0 &&
      items.every((i) => i.table && i.code && i.description && i.requestedQty > 0),

    [items],
  );
  // Seção 45 não possui campos obrigatórios.
  const finalOk = true;

  const operadoraLabel =
    operadoras.find((o) => o.value === operadoraValue)?.label ?? operadoraValue;

  /** Documento da guia emitida, agrupado por seção (mesmo formato do SP/SADT). */
  const buildIssuedGuide = (numero: string, issuedAt: Date): IssuedGuide => ({
    numero,
    issuedAt: issuedAt.toISOString(),
    patient: nomeBeneficiario,
    operadora: operadoraLabel,
    type: "Internação",
    status: "Emitida",
    professional: nomeProfissional
      ? `${nomeProfissional} (${conselho} ${numeroConselho}/${ufConselho})`
      : "—",
    procedure: items[0] ? `${items[0].code} — ${items[0].description}` : "—",
    total: 0,
    sections: [
      {
        title: "Convênio e autorização",
        items: [
          { label: "1 - Registro ANS", value: ans },
          { label: "2 - Nº da guia no prestador", value: numero },
          { label: "3 - Nº da guia na operadora", value: guiaOperadora },
          { label: "4 - Data da autorização", value: dataAutorizacao },
          { label: "5 - Senha", value: senha },
          { label: "6 - Validade da senha", value: validadeSenha },
        ],
      },
      {
        title: "Dados do beneficiário",
        items: [
          { label: "7 - Número da carteira", value: carteira },
          { label: "8 - Validade da carteira", value: validadeCarteira },
          { label: "9 - Atendimento a RN", value: atendimentoRn },
          { label: "10 - Nome", value: nomeBeneficiario },
          { label: "11 - CNS", value: cns },
          { label: "50 - Nome social", value: nomeSocial },
        ],
      },
      {
        title: "Dados do contratado solicitante",
        items: [
          { label: "12 - Código do contratado", value: codigoSolicitante },
          { label: "13 - Nome do contratado", value: nomeContratado },
          { label: "14 - Profissional solicitante", value: nomeProfissional },
          { label: "15 - Conselho", value: conselho },
          { label: "16 - Número no conselho", value: numeroConselho },
          { label: "17 - UF", value: ufConselho },
          { label: "18 - Código CBO", value: cbo },
        ],
      },
      {
        title: "Hospital e internação",
        items: [
          { label: "19 - Código na operadora / CNPJ", value: codigoHospital },
          { label: "20 - Nome do hospital", value: nomeHospital },
          { label: "21 - Data sugerida", value: dataSugerida },
          { label: "22 - Caráter do atendimento", value: carater },
          { label: "23 - Tipo de internação", value: tipoInternacao },
          { label: "24 - Regime de internação", value: regimeInternacao },
          { label: "25 - Diárias solicitadas", value: String(diariasSolicitadas) },
          { label: "26 - Previsão de OPME", value: previsaoOpme },
          { label: "27 - Previsão de quimioterápico", value: previsaoQuimio },
          { label: "28 - Indicação clínica", value: indicacaoClinica },
          { label: "33 - Indicação de acidente", value: indicacaoAcidente },
        ],
      },
      {
        title: "Diagnósticos",
        items: [
          { label: "29 - CID 10 principal", value: cid1 },
          { label: "30 - CID 10 (2)", value: cid2 },
          { label: "31 - CID 10 (3)", value: cid3 },
          { label: "32 - CID 10 (4)", value: cid4 },
        ],
      },
      {
        title: "Procedimentos solicitados",
        items: items.map((item, index) => ({
          label: `Item ${String(index + 1).padStart(2, "0")}`,
          value: `${item.table} · ${item.code} — ${item.description} (qtde. ${item.requestedQty})`,
        })),
      },
      {
        title: "Observação",
        items: [
          { label: "45 - Observação / Justificativa", value: observacao },
          { label: "46 - Data da solicitação", value: dataSolicitacao },
        ],
      },
    ],
  });

  /** Volta o formulário aos valores iniciais, mantendo a operadora selecionada. */
  const handleReset = () => {
    setAns(registroAns);
    setGuiaOperadora("");
    setDataAutorizacao("");
    setSenha("");
    setValidadeSenha("");
    setAutorizacaoOpen(false);
    setCarteira("");
    setValidadeCarteira("");
    setAtendimentoRn("N");
    setNomeBeneficiario("");
    setCns("");
    setNomeSocial("");
    setBeneficiarioStatus("idle");
    setCarteiraConsultada("");
    setCodigoSolicitante("");
    setNomeContratado("");
    setNomeProfissional("");
    setConselho("06");
    setNumeroConselho("");
    setUfConselho("");
    setCbo("");
    setCodigoHospital("");
    setNomeHospital("");
    setDataSugerida("");
    setCarater("1");
    setTipoInternacao("1");
    setRegimeInternacao("1");
    setDiariasSolicitadas(1);
    setPrevisaoOpme("N");
    setPrevisaoQuimio("N");
    setIndicacaoClinica("");
    setCid1("");
    setCid2("");
    setCid3("");
    setCid4("");
    setIndicacaoAcidente("9");
    setItems([newItem()]);
    setObservacao("");
    toast.success("Formulário limpo");
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!guiaOk || !beneficiarioOk || !solicitanteOk || !internacaoOk || !itemsOk) {
      toast.error("Preencha os campos obrigatórios antes de gerar a guia.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      // Campo 2 gerado no momento da emissão; a guia é salva automaticamente.
      const numero = nextGuiaNumber(operadoraLabel);
      const saved = addIssuedGuide(buildIssuedGuide(numero, new Date()));
      setIssuedGuide(saved);
      toast.success("Guia gerada e salva em Guias emitidas", {
        description: `Nº ${numero} — Solicitação de Internação`,
      });
    }, 700);
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in space-y-6">
      {header ? (
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">{header}</div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPreviewOpen(true)}
          >
            <Eye className="h-4 w-4" /> Pré-visualizar
          </Button>
        </div>
      ) : null}

      {/* 1 a 6 */}
      <SectionCard
        number={1}
        done={guiaOk}
        icon={<Building2 className="h-4 w-4" />}
        title="Convênio"
        description="Campos 1 a 6 — operadora responsável, autorização e senha."
      >
        <Grid cols={12}>
          <Field
            label="Operadora / Convênio"
            required
            span="@md:col-span-6 @3xl:col-span-7"
          >
            <Select
              value={operadoraValue}
              onValueChange={(v) => {
                setOperadoraValue(v);
                const op = operadoras.find((o) => o.value === v);
                if (op) {
                  setAns(op.ans);
                  onOperadoraChange?.(v, op.ans);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o convênio">
                  {(() => {
                    const selected = operadoras.find((o) => o.value === operadoraValue);
                    if (!selected) return null;
                    return (
                      <span className="flex min-w-0 items-center gap-2">
                        {selected.logo && (
                          <img
                            src={selected.logo}
                            alt=""
                            aria-hidden
                            loading="lazy"
                            className="h-4 w-auto max-w-14 shrink-0 object-contain"
                          />
                        )}
                        <span className="truncate">{selected.label}</span>
                      </span>
                    );
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {operadoras.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    <span className="flex min-w-0 items-center gap-2">
                      {o.logo && (
                        <img
                          src={o.logo}
                          alt=""
                          aria-hidden
                          loading="lazy"
                          className="h-4 w-auto max-w-14 shrink-0 object-contain"
                        />
                      )}
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
              value={ans}
              readOnly
              aria-readonly="true"
              tabIndex={-1}
              placeholder="—"
              className="font-mono bg-muted text-muted-foreground cursor-default focus-visible:ring-0"
            />
          </Field>
        </Grid>

        {/* Campo 2 (Nº Guia no Prestador) é gerado pelo sistema ao salvar a guia. */}
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
              <Field
                label="4 - Data da Autorização"
                span="@md:col-span-6 @6xl:col-span-3"
              >
                <Input
                  type="date"
                  value={dataAutorizacao}
                  onChange={(e) => setDataAutorizacao(e.target.value)}
                />
              </Field>
              <Field label="5 - Senha" span="@md:col-span-6 @6xl:col-span-2">
                <Input
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  maxLength={20}
                  placeholder="Senha de autorização"
                />
              </Field>
              <Field
                label="6 - Data de Validade da Senha"
                span="@md:col-span-6 @6xl:col-span-3"
              >
                <Input
                  type="date"
                  value={validadeSenha}
                  onChange={(e) => setValidadeSenha(e.target.value)}
                />
              </Field>
              <Field
                label="3 - Número da Guia Atribuído pela Operadora"
                span="@md:col-span-6 @6xl:col-span-4"
              >
                <Input
                  value={guiaOperadora}
                  onChange={(e) => setGuiaOperadora(e.target.value)}
                  maxLength={20}
                  placeholder="Informado pela operadora"
                />
              </Field>
            </Grid>

          </CollapsibleContent>
        </Collapsible>
      </SectionCard>


      {/* 7 a 11 */}
      <SectionCard
        number={2}
        done={beneficiarioOk}
        icon={<User className="h-4 w-4" />}
        title="Dados do Beneficiário"
        description="Campos 7 a 11 e 50 da guia — identificação do beneficiário na operadora."
      >
        {/* Grade de 3 colunas: 1 campo por linha no mobile, 2 em larguras
            intermediárias e 3 em telas largas — mesma lógica do SP/SADT. */}
        <Grid cols={3}>
          <Field
            label="7 - Número da Carteira"
            required
            hint={
              beneficiarioStatus === "not-found"
                ? "Beneficiário não encontrado — informe o nome manualmente."
                : "Informe o número da carteira do beneficiário."
            }
          >
            <div className="relative">
              <Input
                value={carteira}
                onChange={(e) => setCarteira(e.target.value)}
                onBlur={() => buscarBeneficiario()}
                placeholder="0000 0000 0000 0000"
                inputMode="numeric"
                maxLength={20}
                className="font-mono"
              />
              {beneficiarioStatus === "loading" && (
                <Loader2
                  aria-hidden
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
                />
              )}
            </div>
          </Field>

          <Field
            label="8 - Validade da Carteira"
            hint="Condicionado — informe quando a operadora exigir autorização prévia."
          >
            <Input
              type="date"
              value={validadeCarteira}
              onChange={(e) => setValidadeCarteira(e.target.value)}
            />
          </Field>


          <Field
            label="10 - Nome"
            required
            hint={
              beneficiarioStatus === "found"
                ? "Preenchido pelo cadastro do beneficiário."
                : undefined
            }
          >
            <Input
              value={nomeBeneficiario}
              onChange={(e) => setNomeBeneficiario(e.target.value)}
              placeholder="Nome completo do beneficiário"
              maxLength={70}
              readOnly={beneficiarioStatus === "found"}
              aria-readonly={beneficiarioStatus === "found"}
              className={
                beneficiarioStatus === "found" ? "bg-muted/50 text-foreground" : undefined
              }
            />
          </Field>

          <Field
            label="50 - Nome Social"
            hint="Preencha apenas quando solicitado pelo beneficiário (Decreto nº 8.727/2016)."
          >
            <Input
              value={nomeSocial}
              onChange={(e) => setNomeSocial(e.target.value)}
              placeholder="Nome social do beneficiário"
              maxLength={70}
            />
          </Field>

          <SelectField
            label="9 - Atendimento a RN"
            required
            value={atendimentoRn}
            onValueChange={setAtendimentoRn}
            options={SIM_NAO_OPTIONS}
          />

          {/* 11 é condicional: só aparece quando existe no cadastro. */}
          {cns && (
            <Field
              label="11 - Cartão Nacional de Saúde"
              hint="Preenchido pelo cadastro do beneficiário."
            >
              <Input
                value={cns}
                onChange={(e) => setCns(e.target.value)}
                placeholder="000 0000 0000 0000"
                maxLength={15}
                className="font-mono"
              />
            </Field>
          )}
        </Grid>
      </SectionCard>


      {/* 12 a 18 */}
      <SectionCard
        number={3}
        done={solicitanteOk}
        icon={<Stethoscope className="h-4 w-4" />}
        title="Dados do Contratado Solicitante"
        description="Campos 12 a 18 — prestador e profissional que solicita a internação."
      >
        <Grid cols={3}>
          <Field label="13 - Nome do Contratado" required>
            <Input
              value={nomeContratado}
              onChange={(e) => setNomeContratado(e.target.value)}
              maxLength={70}
              placeholder="Razão social ou nome"
            />
          </Field>


          <Field label="12 - Código do Contratado" required>
            <Input
              value={codigoSolicitante}
              onChange={(e) => setCodigoSolicitante(e.target.value)}
              maxLength={14}
              placeholder="Código do contratado"
            />
          </Field>

          <Field label="14 - Nome do Profissional Solicitante">
            <Input
              value={nomeProfissional}
              onChange={(e) => setNomeProfissional(e.target.value)}
              maxLength={70}
              placeholder="Nome do profissional"
            />
          </Field>

          <SelectField
            label="15 - Conselho Profissional"
            required
            value={conselho}
            onValueChange={setConselho}
            options={CONSELHO_OPTIONS}
          />
          <Field label="16 - Número no Conselho" required>
            <Input
              value={numeroConselho}
              onChange={(e) => setNumeroConselho(e.target.value)}
              maxLength={15}
              placeholder="000000"
            />

          </Field>
          <SelectField
            label="17 - UF"
            required
            value={ufConselho}
            onValueChange={setUfConselho}
            options={UF_SELECT_OPTIONS}
            placeholder="Selecione a UF"
          />

          <SelectField
            label="18 - Código CBO"
            required
            value={cbo}
            onValueChange={setCbo}
            options={CBO_OPTIONS}
            placeholder="Selecione o CBO"
          />

        </Grid>
      </SectionCard>

      {/* 19 a 28 */}
      <SectionCard
        number={4}
        done={internacaoOk}
        icon={<BedDouble className="h-4 w-4" />}
        title="Dados do Hospital / Local Solicitado e da Internação"
        description="Campos 19 a 28 e 33 — local solicitado e informações da internação."
      >
        <Grid cols={3}>
          <Field label="20 - Nome do Hospital / Local Solicitado" required>
            <Input
              value={nomeHospital}
              onChange={(e) => setNomeHospital(e.target.value)}
              placeholder="Nome do hospital"
            />
          </Field>
          <Field label="19 - Código na Operadora / CNPJ" required>
            <Input
              value={codigoHospital}
              onChange={(e) => setCodigoHospital(e.target.value)}
              placeholder="Código ou CNPJ"
              maxLength={14}
            />
          </Field>
          <Field label="21 - Data Sugerida para Internação" required>
            <Input
              type="date"
              value={dataSugerida}
              onChange={(e) => setDataSugerida(e.target.value)}
            />
          </Field>
          <SelectField
            label="22 - Caráter do Atendimento"
            required
            value={carater}
            onValueChange={setCarater}
            options={CARATER_OPTIONS}
          />
          <SelectField
            label="23 - Tipo de Internação"
            required
            value={tipoInternacao}
            onValueChange={setTipoInternacao}
            options={TIPO_INTERNACAO_OPTIONS}
          />
          <SelectField
            label="24 - Regime de Internação"
            required
            value={regimeInternacao}
            onValueChange={setRegimeInternacao}
            options={REGIME_INTERNACAO_OPTIONS}
          />
          <Field label="25 - Qtde. Diárias Solicitadas" required>
            <Input
              type="number"
              min={1}
              value={diariasSolicitadas}
              onChange={(e) => setDiariasSolicitadas(Math.max(1, Number(e.target.value) || 1))}
            />
          </Field>
          <SelectField
            label="26 - Previsão de Uso de OPME"
            required
            value={previsaoOpme}
            onValueChange={setPrevisaoOpme}
            options={SIM_NAO_OPTIONS}
          />
          <SelectField
            label="27 - Previsão de Uso de Quimioterápico"
            required
            value={previsaoQuimio}
            onValueChange={setPrevisaoQuimio}
            options={SIM_NAO_OPTIONS}
          />
          <SelectField
            label="33 - Indicação de Acidente"
            required
            value={indicacaoAcidente}
            onValueChange={setIndicacaoAcidente}
            options={ACIDENTE_OPTIONS}
          />
        </Grid>

        <div className="mt-4">
          <Field
            label="28 - Indicação Clínica"
            required
            hint={`${indicacaoClinica.length}/500 caracteres.`}
          >
            <Textarea
              value={indicacaoClinica}
              onChange={(e) => setIndicacaoClinica(e.target.value.slice(0, 500))}
              maxLength={500}
              rows={3}
              placeholder="Indicação clínica que embasa a solicitação (até 500 caracteres)."
            />
          </Field>

        </div>
      </SectionCard>

      {/* 29 a 32 */}
      <SectionCard
        number={5}
        done={diagnosticoOk}
        icon={<ClipboardList className="h-4 w-4" />}
        title="Diagnósticos"
        description="Campos 29 a 32 — diagnósticos CID-10."
      >
        <Grid cols={3}>
          <Field label="29 - CID 10 Principal">
            <Combobox
              options={CID_OPTIONS}
              value={cid1}
              onChange={setCid1}
              clearable
              placeholder="Buscar CID-10"
            />
          </Field>
          <Field label="30 - CID 10 (2)">
            <Combobox
              options={CID_OPTIONS}
              value={cid2}
              onChange={setCid2}
              clearable
              placeholder="Buscar CID-10"
            />
          </Field>
          <Field label="31 - CID 10 (3)">
            <Combobox
              options={CID_OPTIONS}
              value={cid3}
              onChange={setCid3}
              clearable
              placeholder="Buscar CID-10"
            />
          </Field>
          <Field label="32 - CID 10 (4)">
            <Combobox
              options={CID_OPTIONS}
              value={cid4}
              onChange={setCid4}
              clearable
              placeholder="Buscar CID-10"
            />
          </Field>
        </Grid>
      </SectionCard>

      {/* 34 a 38 */}
      <SectionCard
        number={6}
        done={itemsOk}
        icon={<ClipboardList className="h-4 w-4" />}
        title="Procedimentos ou Itens Assistenciais Solicitados"
        description="Campos 34 a 38 — tabela, código, descrição e quantidades."
        actions={
          <Button type="button" size="sm" onClick={() => setItems((p) => [...p, newItem()])}>
            <Plus className="h-4 w-4" /> Adicionar item
          </Button>
        }
      >
        {items.length === 0 ? (
          <EmptyState
            size="sm"
            title="Nenhum item solicitado"
            description="Adicione ao menos um procedimento ou item assistencial."
            icon={<ClipboardList className="h-8 w-8" />}
          />
        ) : (
          <div className="space-y-3 @container">
            <div className="hidden gap-3 px-1 text-xs font-medium text-muted-foreground @3xl:grid @3xl:grid-cols-[1fr_130px_110px_90px_40px]">
              <span>
                36 - Descrição <span className="text-destructive">*</span>
              </span>
              <span>
                35 - Código <span className="text-destructive">*</span>
              </span>
              <span>
                34 - Tabela <span className="text-destructive">*</span>
              </span>
              <span className="text-center">
                37 - Qtde Solic. <span className="text-destructive">*</span>
              </span>

              <span />
            </div>
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="grid gap-3 rounded-lg border p-3 @3xl:grid-cols-[1fr_130px_110px_90px_40px] @3xl:items-center @3xl:border-0 @3xl:p-0"
              >
                <div className="@3xl:hidden text-xs font-semibold text-muted-foreground">
                  Item {idx + 1}
                </div>
                <Combobox
                  options={TUSS_OPTIONS}
                  value={item.code}
                  onChange={(code) => {
                    const found = TUSS.find((t) => t.codigo === code);
                    updateItem(item.id, {
                      code,
                      description: found?.descricao ?? item.description,
                      table: code ? resolveTissTable(code) : item.table,
                    });
                  }}
                  placeholder="Descrição do procedimento"
                  searchPlaceholder="Buscar procedimento (TUSS)"
                />
                <Input
                  readOnly
                  value={item.code}
                  placeholder="—"
                  aria-label="35 - Código do procedimento (automático)"
                  className="bg-muted font-mono"
                />
                <Input
                  readOnly
                  value={
                    TABELA_OPTIONS.find((t) => t.value === item.table)?.value ?? item.table
                  }
                  placeholder="—"
                  aria-label="34 - Tabela (automático)"
                  className="bg-muted font-mono"
                />
                <Input
                  type="number"
                  min={1}
                  max={999}
                  step={1}
                  value={item.requestedQty}
                  onChange={(e) =>
                    updateItem(item.id, {
                      requestedQty: Math.min(
                        999,
                        Math.max(1, Math.trunc(Number(e.target.value)) || 1),
                      ),
                    })
                  }
                  aria-label="37 - Quantidade solicitada"
                  className="text-center"
                />


                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setItems((p) => p.filter((i) => i.id !== item.id))}
                    aria-label={`Remover item ${idx + 1}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* 45 */}
      <SectionCard
        number={7}
        done={finalOk}
        icon={<FileText className="h-4 w-4" />}
        title="Observação"
        description="Campo 45 — observação ou justificativa."
      >
        <Field label="45 - Observação / Justificativa">
          <Textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value.slice(0, 1000))}
            rows={3}
            placeholder="Observações sobre o atendimento (até 1000 caracteres)."
          />
        </Field>
      </SectionCard>


      <FormActionBar
        stepsLabel="Etapas preenchidas"
        steps={[
          { label: "Convênio", done: guiaOk },
          { label: "Beneficiário", done: beneficiarioOk },
          { label: "Contratado solicitante", done: solicitanteOk },
          { label: "Hospital e internação", done: internacaoOk },
          { label: "Procedimentos solicitados", done: itemsOk },

        ]}
        note={
          <>
            Campos com <span className="text-destructive/80">*</span> são obrigatórios e serão
            validados antes da emissão.
          </>
        }
      >
        <Button type="submit" size="sm" disabled={submitting}>
          <FileText className="h-4 w-4" />
          {submitting ? "Gerando..." : "Gerar guia"}
        </Button>
      </FormActionBar>

      <AppModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title="Pré-visualização da guia"
        description="Guia de Solicitação de Internação — padrão TISS."
        size="xl"
      >
        <ScaledGuideSheet fit="width" sheetWidth={A4_PORTRAIT_SHEET_WIDTH_PX}>
          <InternacaoGuidePreview {...previewData} fullSize />
        </ScaledGuideSheet>
      </AppModal>

      <AppModal
        open={!!issuedGuide}
        onOpenChange={(open) => !open && setIssuedGuide(null)}
        title="Guia gerada e salva automaticamente"
        description="Guia de Solicitação de Internação — padrão TISS."
        descriptionHidden
        icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
        bodyClassName="space-y-3 text-sm"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/guias-emitidas" })}
            >
              <FileText className="h-4 w-4" /> Ver em Guias emitidas
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!issuedGuide) return;
                downloadIssuedGuide(issuedGuide);
                toast.success("Download da guia iniciado");
              }}
            >
              <Download className="h-4 w-4" /> Baixar guia
            </Button>
          </>
        }
      >
        {issuedGuide && (
          <>
            <IssuedRow label="Número da guia" value={issuedGuide.numero} mono />
            <IssuedRow label="Convênio" value="Guias Padronizadas TISS" />
            <IssuedRow label="Tipo" value="Solicitação de Internação" />
            <IssuedRow label="Paciente" value={issuedGuide.patient} />
            <IssuedRow label="Operadora" value={issuedGuide.operadora} />
            <IssuedRow
              label="Emitida em"
              value={new Date(issuedGuide.issuedAt).toLocaleString("pt-BR")}
            />
            <IssuedRow label="Diárias solicitadas" value={String(diariasSolicitadas)} />
            <IssuedRow label="Procedimentos" value={String(items.length)} />
          </>
        )}
      </AppModal>
    </form>
  );
}

/** Linha rótulo/valor do resumo da guia emitida. */
function IssuedRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
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
