import { useMemo, useState } from "react";
import {
  BedDouble,
  Building2,
  ClipboardList,
  FileText,
  Hospital,
  Plus,
  Eye,
  Save,
  Stethoscope,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { SectionCard } from "@/components/section-card";
import { FormActionBar } from "@/components/form-action-bar";
import { SignatureField } from "@/components/signature-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { EmptyState } from "@/components/data-state";
import { SelectField } from "@/components/form-field";
import { AppModal } from "@/components/app-modal";
import { InternacaoGuidePreview } from "./internacao-guide-preview";
import { CID_OPTIONS } from "@/lib/cid";
import { TUSS, TUSS_OPTIONS } from "@/lib/tuss";

/** Item do quadro "Procedimentos ou Itens Assistenciais Solicitados" (campos 34 a 38). */
interface RequestedItem {
  id: string;
  table: string;
  code: string;
  description: string;
  requestedQty: number;
}

const CARATER_OPTIONS = [
  { value: "E", label: "E - Eletiva" },
  { value: "U", label: "U - Urgência / Emergência" },
];

const TIPO_INTERNACAO_OPTIONS = [
  { value: "1", label: "1 - Clínica" },
  { value: "2", label: "2 - Cirúrgica" },
  { value: "3", label: "3 - Obstétrica" },
  { value: "4", label: "4 - Pediátrica" },
  { value: "5", label: "5 - Psiquiátrica" },
];

const REGIME_INTERNACAO_OPTIONS = [
  { value: "1", label: "1 - Hospitalar" },
  { value: "2", label: "2 - Hospital-dia" },
  { value: "3", label: "3 - Domiciliar" },
];

const ACOMODACAO_OPTIONS = [
  { value: "1", label: "1 - Enfermaria" },
  { value: "2", label: "2 - Apartamento" },
  { value: "3", label: "3 - UTI" },
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

const CONSELHO_OPTIONS = [
  "CRM",
  "CRO",
  "CRF",
  "COREN",
  "CRP",
  "CREFITO",
  "CRFA",
  "CRN",
].map((c) => ({ value: c, label: c }));

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

function Grid({ cols, children }: { cols: 2 | 3; children: React.ReactNode }) {
  return (
    <div className="@container">
      <div
        className={`grid gap-4 ${
          cols === 2 ? "@md:grid-cols-2" : "@md:grid-cols-2 @3xl:grid-cols-3"
        }`}
      >
        {children}
      </div>
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

export interface InternacaoGuideFormProps {
  /** Número sequencial da guia no prestador (campo 2). */
  numeroGuia: string;
  /** Registro ANS da operadora selecionada (campo 1). */
  registroAns: string;
  /** Slot do cabeçalho (seleção da operadora, pré-visualização etc.). */
  header?: React.ReactNode;
  /** Card de seleção de operadora reaproveitado da tela de emissão. */
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
}: InternacaoGuideFormProps) {
  // 1 a 6 — identificação da guia e autorização
  const [ans, setAns] = useState(registroAns);
  const [guiaPrestador, setGuiaPrestador] = useState(numeroGuia);
  const [guiaOperadora, setGuiaOperadora] = useState("");
  const [dataAutorizacao, setDataAutorizacao] = useState("");
  const [senha, setSenha] = useState("");
  const [validadeSenha, setValidadeSenha] = useState("");

  // 7 a 11 — beneficiário
  const [carteira, setCarteira] = useState("");
  const [validadeCarteira, setValidadeCarteira] = useState("");
  const [atendimentoRn, setAtendimentoRn] = useState("N");
  const [nomeBeneficiario, setNomeBeneficiario] = useState("");
  const [cns, setCns] = useState("");

  // 12 a 18 — contratado solicitante
  const [codigoSolicitante, setCodigoSolicitante] = useState("");
  const [nomeContratado, setNomeContratado] = useState("");
  const [nomeProfissional, setNomeProfissional] = useState("");
  const [conselho, setConselho] = useState("CRM");
  const [numeroConselho, setNumeroConselho] = useState("");
  const [ufConselho, setUfConselho] = useState("");
  const [cbo, setCbo] = useState("");

  // 19 a 28 — hospital/local solicitado e dados da internação
  const [codigoHospital, setCodigoHospital] = useState("");
  const [nomeHospital, setNomeHospital] = useState("");
  const [dataSugerida, setDataSugerida] = useState("");
  const [carater, setCarater] = useState("E");
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

  // 39 a 44 — dados da autorização (operadora)
  const [dataAdmissao, setDataAdmissao] = useState("");
  const [diariasAutorizadas, setDiariasAutorizadas] = useState("");
  const [acomodacaoAutorizada, setAcomodacaoAutorizada] = useState("");
  const [codigoAutorizado, setCodigoAutorizado] = useState("");
  const [hospitalAutorizado, setHospitalAutorizado] = useState("");
  const [cnes, setCnes] = useState("");

  // 45 a 49 — observação, data e assinaturas
  const [observacao, setObservacao] = useState("");
  const [dataSolicitacao, setDataSolicitacao] = useState("");
  const [assinaturaProfissional, setAssinaturaProfissional] = useState("");
  const [assinaturaBeneficiario, setAssinaturaBeneficiario] = useState("");
  const [assinaturaAutorizacao, setAssinaturaAutorizacao] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  /** Dados normalizados enviados à pré-visualização da guia impressa. */
  const previewData = {
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

  const guiaOk = Boolean(ans && guiaPrestador && dataAutorizacao);
  const beneficiarioOk = Boolean(carteira && nomeBeneficiario);
  const solicitanteOk = Boolean(
    codigoSolicitante && nomeContratado && conselho && numeroConselho && cbo,
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
    () => items.length > 0 && items.every((i) => i.code && i.description && i.requestedQty > 0),
    [items],
  );
  const finalOk = Boolean(dataSolicitacao);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!guiaOk || !beneficiarioOk || !solicitanteOk || !internacaoOk || !itemsOk || !finalOk) {
      toast.error("Preencha os campos obrigatórios antes de gerar a guia.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success("Guia de solicitação de internação gerada.");
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
        title="Dados da Guia e Autorização"
        description="Campos 1 a 6 — identificação da guia, autorização e senha."
      >
        <Grid cols={3}>
          <Field label="1 - Registro ANS" required>
            <Input value={ans} onChange={(e) => setAns(e.target.value)} placeholder="000000" />
          </Field>
          <Field label="2 - Nº Guia no Prestador" required>
            <Input
              value={guiaPrestador}
              onChange={(e) => setGuiaPrestador(e.target.value)}
              placeholder="Número no prestador"
            />
          </Field>
          <Field label="3 - Número da Guia Atribuído pela Operadora">
            <Input
              value={guiaOperadora}
              onChange={(e) => setGuiaOperadora(e.target.value)}
              placeholder="Informado pela operadora"
            />
          </Field>
          <Field label="4 - Data da Autorização" required>
            <Input
              type="date"
              value={dataAutorizacao}
              onChange={(e) => setDataAutorizacao(e.target.value)}
            />
          </Field>
          <Field label="5 - Senha">
            <Input value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Senha" />
          </Field>
          <Field label="6 - Data de Validade da Senha">
            <Input
              type="date"
              value={validadeSenha}
              onChange={(e) => setValidadeSenha(e.target.value)}
            />
          </Field>
        </Grid>
      </SectionCard>

      {/* 7 a 11 */}
      <SectionCard
        number={2}
        done={beneficiarioOk}
        icon={<User className="h-4 w-4" />}
        title="Dados do Beneficiário"
        description="Campos 7 a 11 — identificação do beneficiário na operadora."
      >
        <Grid cols={3}>
          <Field label="7 - Número da Carteira" required>
            <Input
              value={carteira}
              onChange={(e) => setCarteira(e.target.value)}
              placeholder="Número da carteira"
            />
          </Field>
          <Field label="8 - Validade da Carteira">
            <Input
              type="date"
              value={validadeCarteira}
              onChange={(e) => setValidadeCarteira(e.target.value)}
            />
          </Field>
          <SelectField
            label="9 - Atendimento a RN"
            required
            labelClassName="text-xs font-medium text-muted-foreground"
            value={atendimentoRn}
            onValueChange={setAtendimentoRn}
            options={SIM_NAO_OPTIONS}
          />
          <Field label="10 - Nome" required>
            <Input
              value={nomeBeneficiario}
              onChange={(e) => setNomeBeneficiario(e.target.value)}
              placeholder="Nome completo do beneficiário"
            />
          </Field>
          <Field label="11 - Cartão Nacional de Saúde">
            <Input value={cns} onChange={(e) => setCns(e.target.value)} placeholder="000 0000 0000 0000" />
          </Field>
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
          <Field label="12 - Código na Operadora" required>
            <Input
              value={codigoSolicitante}
              onChange={(e) => setCodigoSolicitante(e.target.value)}
              placeholder="Código do contratado"
            />
          </Field>
          <Field label="13 - Nome do Contratado" required>
            <Input
              value={nomeContratado}
              onChange={(e) => setNomeContratado(e.target.value)}
              placeholder="Razão social ou nome"
            />
          </Field>
          <Field label="14 - Nome do Profissional Solicitante">
            <Input
              value={nomeProfissional}
              onChange={(e) => setNomeProfissional(e.target.value)}
              placeholder="Nome do profissional"
            />
          </Field>
          <SelectField
            label="15 - Conselho Profissional"
            required
            labelClassName="text-xs font-medium text-muted-foreground"
            value={conselho}
            onValueChange={setConselho}
            options={CONSELHO_OPTIONS}
          />
          <Field label="16 - Número no Conselho" required>
            <Input
              value={numeroConselho}
              onChange={(e) => setNumeroConselho(e.target.value)}
              placeholder="000000"
            />
          </Field>
          <Field label="17 - UF">
            <Input
              value={ufConselho}
              onChange={(e) => setUfConselho(e.target.value.toUpperCase().slice(0, 2))}
              placeholder="RN"
            />
          </Field>
          <Field label="18 - Código CBO" required>
            <Input value={cbo} onChange={(e) => setCbo(e.target.value)} placeholder="225125" />
          </Field>
        </Grid>
      </SectionCard>

      {/* 19 a 28 */}
      <SectionCard
        number={4}
        done={internacaoOk}
        icon={<BedDouble className="h-4 w-4" />}
        title="Dados do Hospital / Local Solicitado e da Internação"
        description="Campos 19 a 28 — local solicitado, regime, diárias e indicação clínica."
      >
        <Grid cols={3}>
          <Field label="19 - Código na Operadora / CNPJ" required>
            <Input
              value={codigoHospital}
              onChange={(e) => setCodigoHospital(e.target.value)}
              placeholder="Código ou CNPJ"
            />
          </Field>
          <Field label="20 - Nome do Hospital / Local Solicitado" required>
            <Input
              value={nomeHospital}
              onChange={(e) => setNomeHospital(e.target.value)}
              placeholder="Nome do hospital"
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
            labelClassName="text-xs font-medium text-muted-foreground"
            value={carater}
            onValueChange={setCarater}
            options={CARATER_OPTIONS}
          />
          <SelectField
            label="23 - Tipo de Internação"
            required
            labelClassName="text-xs font-medium text-muted-foreground"
            value={tipoInternacao}
            onValueChange={setTipoInternacao}
            options={TIPO_INTERNACAO_OPTIONS}
          />
          <SelectField
            label="24 - Regime de Internação"
            required
            labelClassName="text-xs font-medium text-muted-foreground"
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
            labelClassName="text-xs font-medium text-muted-foreground"
            value={previsaoOpme}
            onValueChange={setPrevisaoOpme}
            options={SIM_NAO_OPTIONS}
          />
          <SelectField
            label="27 - Previsão de Uso de Quimioterápico"
            required
            labelClassName="text-xs font-medium text-muted-foreground"
            value={previsaoQuimio}
            onValueChange={setPrevisaoQuimio}
            options={SIM_NAO_OPTIONS}
          />
        </Grid>

        <div className="mt-4">
          <Field label="28 - Indicação Clínica" required>
            <Textarea
              value={indicacaoClinica}
              onChange={(e) => setIndicacaoClinica(e.target.value.slice(0, 500))}
              rows={3}
              placeholder="Indicação clínica que embasa a solicitação (até 500 caracteres)."
            />
          </Field>
        </div>
      </SectionCard>

      {/* 29 a 33 */}
      <SectionCard
        number={5}
        done={diagnosticoOk}
        icon={<ClipboardList className="h-4 w-4" />}
        title="Hipóteses Diagnósticas"
        description="Campos 29 a 33 — CID-10 (opcionais) e indicação de acidente."
      >
        <Grid cols={3}>
          <Field label="29 - CID 10 Principal (opcional)">
            <Combobox
              options={CID_OPTIONS}
              value={cid1}
              onChange={setCid1}
              clearable
              placeholder="Buscar CID-10"
            />
          </Field>
          <Field label="30 - CID 10 (2) (opcional)">
            <Combobox
              options={CID_OPTIONS}
              value={cid2}
              onChange={setCid2}
              clearable
              placeholder="Buscar CID-10"
            />
          </Field>
          <Field label="31 - CID 10 (3) (opcional)">
            <Combobox
              options={CID_OPTIONS}
              value={cid3}
              onChange={setCid3}
              clearable
              placeholder="Buscar CID-10"
            />
          </Field>
          <Field label="32 - CID 10 (4) (opcional)">
            <Combobox
              options={CID_OPTIONS}
              value={cid4}
              onChange={setCid4}
              clearable
              placeholder="Buscar CID-10"
            />
          </Field>
          <SelectField
            label="33 - Indicação de Acidente"
            required
            labelClassName="text-xs font-medium text-muted-foreground"
            value={indicacaoAcidente}
            onValueChange={setIndicacaoAcidente}
            options={ACIDENTE_OPTIONS}
          />
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
            <div className="hidden gap-3 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground @3xl:grid @3xl:grid-cols-[110px_130px_1fr_90px_90px_40px]">
              <span>34 - Tabela</span>
              <span>35 - Código</span>
              <span>36 - Descrição</span>
              <span className="text-center">37 - Qtde Solic.</span>
              <span className="text-center">38 - Qtde Aut.</span>
              <span />
            </div>
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="grid gap-3 rounded-lg border p-3 @3xl:grid-cols-[110px_130px_1fr_90px_90px_40px] @3xl:items-center @3xl:border-0 @3xl:p-0"
              >
                <div className="@3xl:hidden text-xs font-semibold text-muted-foreground">
                  Item {idx + 1}
                </div>
                <Input
                  value={item.table}
                  onChange={(e) => updateItem(item.id, { table: e.target.value })}
                  aria-label="34 - Tabela"
                  list={`tabelas-${item.id}`}
                />
                <datalist id={`tabelas-${item.id}`}>
                  {TABELA_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </datalist>
                <Input
                  value={item.code}
                  onChange={(e) => updateItem(item.id, { code: e.target.value })}
                  placeholder="Código"
                  aria-label="35 - Código do procedimento"
                  className="font-mono"
                />
                <Combobox
                  options={TUSS_OPTIONS}
                  value={item.code}
                  onChange={(code) => {
                    const found = TUSS.find((t) => t.codigo === code);
                    updateItem(item.id, {
                      code,
                      description: found?.descricao ?? item.description,
                    });
                  }}
                  placeholder="Descrição do procedimento"
                  searchPlaceholder="Buscar procedimento (TUSS)"
                />
                <Input
                  type="number"
                  min={1}
                  value={item.requestedQty}
                  onChange={(e) =>
                    updateItem(item.id, {
                      requestedQty: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                  aria-label="37 - Quantidade solicitada"
                  className="text-center"
                />
                <Input
                  disabled
                  placeholder="—"
                  aria-label="38 - Quantidade autorizada (operadora)"
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

      {/* 39 a 44 */}
      <SectionCard
        number={7}
        icon={<Hospital className="h-4 w-4" />}
        title="Dados da Autorização"
        description="Campos 39 a 44 — preenchidos pela operadora em caso de autorização."
      >
        <Grid cols={3}>
          <Field label="39 - Data Provável da Admissão Hospitalar">
            <Input
              type="date"
              value={dataAdmissao}
              onChange={(e) => setDataAdmissao(e.target.value)}
            />
          </Field>
          <Field label="40 - Qtde. Diárias Autorizadas">
            <Input
              type="number"
              min={0}
              value={diariasAutorizadas}
              onChange={(e) => setDiariasAutorizadas(e.target.value)}
              placeholder="Informado pela operadora"
            />
          </Field>
          <SelectField
            label="41 - Tipo da Acomodação Autorizada"
            labelClassName="text-xs font-medium text-muted-foreground"
            value={acomodacaoAutorizada}
            onValueChange={setAcomodacaoAutorizada}
            options={ACOMODACAO_OPTIONS}
          />
          <Field label="42 - Código na Operadora / CNPJ Autorizado">
            <Input
              value={codigoAutorizado}
              onChange={(e) => setCodigoAutorizado(e.target.value)}
              placeholder="Código ou CNPJ"
            />
          </Field>
          <Field label="43 - Nome do Hospital / Local Autorizado">
            <Input
              value={hospitalAutorizado}
              onChange={(e) => setHospitalAutorizado(e.target.value)}
              placeholder="Nome do hospital autorizado"
            />
          </Field>
          <Field label="44 - Código CNES">
            <Input value={cnes} onChange={(e) => setCnes(e.target.value)} placeholder="0000000" />
          </Field>
        </Grid>
      </SectionCard>

      {/* 45 a 49 */}
      <SectionCard
        number={8}
        done={finalOk}
        icon={<FileText className="h-4 w-4" />}
        title="Observação e Assinaturas"
        description="Campos 45 a 49 — justificativa, data da solicitação e assinaturas."
      >
        <Field label="45 - Observação / Justificativa">
          <Textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value.slice(0, 1000))}
            rows={3}
            placeholder="Observações sobre o atendimento (até 1000 caracteres)."
          />
        </Field>

        <div className="mt-4">
          <Grid cols={3}>
            <Field label="46 - Data da Solicitação" required>
              <Input
                type="date"
                value={dataSolicitacao}
                onChange={(e) => setDataSolicitacao(e.target.value)}
              />
            </Field>
          </Grid>
        </div>

        <div className="mt-5 grid gap-4 border-t pt-5 lg:grid-cols-3">
          <SignatureField
            label="47 - Assinatura do Profissional Solicitante"
            value={assinaturaProfissional}
            onChange={setAssinaturaProfissional}
            hint="Opcional: deixe em branco para assinar à mão no papel."
          />
          <SignatureField
            label="48 - Assinatura do Beneficiário ou Responsável"
            value={assinaturaBeneficiario}
            onChange={setAssinaturaBeneficiario}
            hint="Opcional: deixe em branco para assinar à mão no papel."
          />
          <SignatureField
            label="49 - Assinatura do Responsável pela Autorização"
            value={assinaturaAutorizacao}
            onChange={setAssinaturaAutorizacao}
            hint="Preenchida pela operadora em caso de autorização."
          />
        </div>
      </SectionCard>

      <FormActionBar
        stepsLabel="Etapas preenchidas"
        steps={[
          { label: "Guia e autorização", done: guiaOk },
          { label: "Beneficiário", done: beneficiarioOk },
          { label: "Contratado solicitante", done: solicitanteOk },
          { label: "Hospital e internação", done: internacaoOk },
          { label: "Hipóteses diagnósticas", done: diagnosticoOk },
          { label: "Procedimentos solicitados", done: itemsOk },
          { label: "Observação e assinaturas", done: finalOk },
        ]}
        note={
          <>
            Campos com <span className="text-destructive/80">*</span> são obrigatórios e serão
            validados antes da emissão.
          </>
        }
      >
        <Button type="button" variant="outline" size="sm">
          <Save className="h-4 w-4" /> Salvar rascunho
        </Button>
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
        <InternacaoGuidePreview {...previewData} fullSize />
      </AppModal>
    </form>
  );
}
