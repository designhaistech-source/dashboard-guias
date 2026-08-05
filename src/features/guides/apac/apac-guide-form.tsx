import { useMemo, useState } from "react";
import {
  Building2,
  ClipboardList,
  Eye,
  FileText,
  Plus,
  Save,
  ShieldCheck,
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
import { ApacGuidePreview } from "./apac-guide-preview";
import { CID_OPTIONS } from "@/lib/cid";

/** Procedimento secundário solicitado (campos 21 a 35 — até 5 itens). */
interface SecondaryProcedure {
  id: string;
  code: string;
  name: string;
  quantity: number;
}

const MAX_SECONDARY = 5;

const SEXO_OPTIONS = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Feminino" },
];

const RACA_COR_OPTIONS = [
  { value: "01 - Branca", label: "01 - Branca" },
  { value: "02 - Preta", label: "02 - Preta" },
  { value: "03 - Parda", label: "03 - Parda" },
  { value: "04 - Amarela", label: "04 - Amarela" },
  { value: "05 - Indígena", label: "05 - Indígena" },
  { value: "99 - Sem informação", label: "99 - Sem informação" },
];

const DOCUMENTO_OPTIONS = [
  { value: "CNS", label: "CNS" },
  { value: "CPF", label: "CPF" },
];

const UF_OPTIONS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
].map((uf) => ({ value: uf, label: uf }));

function newSecondary(): SecondaryProcedure {
  return { id: crypto.randomUUID(), code: "", name: "", quantity: 1 };
}

function Grid({ cols, children }: { cols: 2 | 3; children: React.ReactNode }) {
  return (
    <div
      className={`@container grid gap-4 ${cols === 2 ? "@md:grid-cols-2" : "@md:grid-cols-2 @3xl:grid-cols-3"}`}
    >
      {children}
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

export interface ApacGuideFormProps {
  /** Slot do cabeçalho (título da guia selecionada). */
  header?: React.ReactNode;
}

/**
 * Laudo para Solicitação / Autorização de Procedimento Ambulatorial (APAC — SUS).
 * Campos 1 a 55, na mesma ordem e nomenclatura do formulário oficial do SUS.
 */
export function ApacGuideForm({ header }: ApacGuideFormProps) {
  // 1 e 2 — estabelecimento solicitante
  const [estabelecimentoSolicitante, setEstabelecimentoSolicitante] = useState("");
  const [cnesSolicitante, setCnesSolicitante] = useState("");

  // 3 a 17 — paciente
  const [nomePaciente, setNomePaciente] = useState("");
  const [prontuario, setProntuario] = useState("");
  const [cns, setCns] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [sexo, setSexo] = useState("");
  const [racaCor, setRacaCor] = useState("");
  const [nomeMae, setNomeMae] = useState("");
  const [telefoneDdd, setTelefoneDdd] = useState("");
  const [telefoneNumero, setTelefoneNumero] = useState("");
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [endereco, setEndereco] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [codIbge, setCodIbge] = useState("");
  const [uf, setUf] = useState("");
  const [cep, setCep] = useState("");

  // 18 a 20 — procedimento principal
  const [procedimentoPrincipalCodigo, setProcedimentoPrincipalCodigo] = useState("");
  const [procedimentoPrincipalNome, setProcedimentoPrincipalNome] = useState("");
  const [procedimentoPrincipalQtde, setProcedimentoPrincipalQtde] = useState(1);

  // 21 a 35 — procedimentos secundários
  const [secundarios, setSecundarios] = useState<SecondaryProcedure[]>([]);

  // 36 a 40 — justificativa
  const [descricaoDiagnostico, setDescricaoDiagnostico] = useState("");
  const [cidPrincipal, setCidPrincipal] = useState("");
  const [cidSecundario, setCidSecundario] = useState("");
  const [cidCausasAssociadas, setCidCausasAssociadas] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // 41 a 45 — solicitação
  const [profissionalSolicitante, setProfissionalSolicitante] = useState("");
  const [dataSolicitacao, setDataSolicitacao] = useState("");
  const [documentoSolicitanteTipo, setDocumentoSolicitanteTipo] = useState("CNS");
  const [documentoSolicitanteNumero, setDocumentoSolicitanteNumero] = useState("");
  const [assinaturaSolicitante, setAssinaturaSolicitante] = useState("");

  // 46 a 53 — autorização
  const [profissionalAutorizador, setProfissionalAutorizador] = useState("");
  const [codOrgaoEmissor, setCodOrgaoEmissor] = useState("");
  const [documentoAutorizadorTipo, setDocumentoAutorizadorTipo] = useState("CNS");
  const [documentoAutorizadorNumero, setDocumentoAutorizadorNumero] = useState("");
  const [dataAutorizacao, setDataAutorizacao] = useState("");
  const [assinaturaAutorizador, setAssinaturaAutorizador] = useState("");
  const [numeroApac, setNumeroApac] = useState("");
  const [validadeInicio, setValidadeInicio] = useState("");
  const [validadeFim, setValidadeFim] = useState("");

  // 54 e 55 — estabelecimento executante
  const [estabelecimentoExecutante, setEstabelecimentoExecutante] = useState("");
  const [cnesExecutante, setCnesExecutante] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const updateSecondary = (id: string, patch: Partial<SecondaryProcedure>) =>
    setSecundarios((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const estabelecimentoOk = Boolean(estabelecimentoSolicitante && cnesSolicitante);
  const pacienteOk = Boolean(nomePaciente && cns && dataNascimento && sexo && nomeMae);
  const procedimentoOk = Boolean(
    procedimentoPrincipalCodigo && procedimentoPrincipalNome && procedimentoPrincipalQtde > 0,
  );
  const secundariosOk = useMemo(
    () => secundarios.every((i) => i.code && i.name && i.quantity > 0),
    [secundarios],
  );
  const justificativaOk = Boolean(descricaoDiagnostico && cidPrincipal);
  const solicitacaoOk = Boolean(
    profissionalSolicitante && dataSolicitacao && documentoSolicitanteNumero,
  );
  const executanteOk = Boolean(estabelecimentoExecutante && cnesExecutante);

  const previewData = {
    estabelecimentoSolicitante,
    cnesSolicitante,
    nomePaciente,
    prontuario,
    cns,
    dataNascimento,
    sexo,
    racaCor,
    nomeMae,
    telefoneDdd,
    telefoneNumero,
    nomeResponsavel,
    endereco,
    municipio,
    codIbge,
    uf,
    cep,
    procedimentoPrincipalCodigo,
    procedimentoPrincipalNome,
    procedimentoPrincipalQtde,
    secundarios: secundarios.map(({ code, name, quantity }) => ({ code, name, quantity })),
    descricaoDiagnostico,
    cidPrincipal,
    cidSecundario,
    cidCausasAssociadas,
    observacoes,
    profissionalSolicitante,
    dataSolicitacao,
    documentoSolicitanteTipo,
    documentoSolicitanteNumero,
    assinaturaSolicitante,
    profissionalAutorizador,
    codOrgaoEmissor,
    documentoAutorizadorTipo,
    documentoAutorizadorNumero,
    dataAutorizacao,
    assinaturaAutorizador,
    numeroApac,
    validadeInicio,
    validadeFim,
    estabelecimentoExecutante,
    cnesExecutante,
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (
      !estabelecimentoOk ||
      !pacienteOk ||
      !procedimentoOk ||
      !secundariosOk ||
      !justificativaOk ||
      !solicitacaoOk
    ) {
      toast.error("Preencha os campos obrigatórios antes de gerar o laudo.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success("Laudo de APAC gerado.");
    }, 700);
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in space-y-6">
      {header ? (
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">{header}</div>
          <Button type="button" variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-4 w-4" /> Pré-visualizar
          </Button>
        </div>
      ) : null}

      {/* 1 e 2 */}
      <SectionCard
        number={1}
        done={estabelecimentoOk}
        icon={<Building2 className="h-4 w-4" />}
        title="Identificação do Estabelecimento de Saúde (Solicitante)"
        description="Campos 1 e 2 — unidade que solicita o procedimento."
      >
        <Grid cols={2}>
          <Field label="1 - Nome do Estabelecimento de Saúde Solicitante" required>
            <Input
              value={estabelecimentoSolicitante}
              onChange={(e) => setEstabelecimentoSolicitante(e.target.value)}
              placeholder="Nome do estabelecimento"
            />
          </Field>
          <Field label="2 - CNES" required>
            <Input
              value={cnesSolicitante}
              onChange={(e) => setCnesSolicitante(e.target.value.replace(/\D/g, "").slice(0, 7))}
              placeholder="0000000"
              className="font-mono"
            />
          </Field>
        </Grid>
      </SectionCard>

      {/* 3 a 17 */}
      <SectionCard
        number={2}
        done={pacienteOk}
        icon={<User className="h-4 w-4" />}
        title="Identificação do Paciente"
        description="Campos 3 a 17 — dados pessoais, contato e endereço do paciente."
      >
        <Grid cols={3}>
          <Field label="3 - Nome do Paciente" required>
            <Input
              value={nomePaciente}
              onChange={(e) => setNomePaciente(e.target.value)}
              placeholder="Nome completo"
            />
          </Field>
          <Field label="4 - Nº do Prontuário">
            <Input
              value={prontuario}
              onChange={(e) => setProntuario(e.target.value)}
              placeholder="Número do prontuário"
              className="font-mono"
            />
          </Field>
          <Field label="5 - Cartão Nacional de Saúde (CNS)" required>
            <Input
              value={cns}
              onChange={(e) => setCns(e.target.value.replace(/\D/g, "").slice(0, 15))}
              placeholder="000000000000000"
              className="font-mono"
            />
          </Field>
          <Field label="6 - Data de Nascimento" required>
            <Input
              type="date"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
            />
          </Field>
          <SelectField
            label="7 - Sexo"
            required
            labelClassName="text-xs font-medium text-muted-foreground"
            value={sexo}
            onValueChange={setSexo}
            options={SEXO_OPTIONS}
            placeholder="Selecione"
          />
          <SelectField
            label="8 - Raça / Cor"
            labelClassName="text-xs font-medium text-muted-foreground"
            value={racaCor}
            onValueChange={setRacaCor}
            options={RACA_COR_OPTIONS}
            placeholder="Selecione"
          />
          <Field label="9 - Nome da Mãe" required>
            <Input
              value={nomeMae}
              onChange={(e) => setNomeMae(e.target.value)}
              placeholder="Nome completo da mãe"
            />
          </Field>
          <Field label="10 - Telefone de Contato (DDD)">
            <div className="flex gap-2">
              <Input
                value={telefoneDdd}
                onChange={(e) => setTelefoneDdd(e.target.value.replace(/\D/g, "").slice(0, 2))}
                placeholder="DDD"
                className="w-20 font-mono"
                aria-label="10 - DDD"
              />
              <Input
                value={telefoneNumero}
                onChange={(e) => setTelefoneNumero(e.target.value.replace(/\D/g, "").slice(0, 9))}
                placeholder="Nº do telefone"
                className="font-mono"
                aria-label="10 - Número do telefone"
              />
            </div>
          </Field>
          <Field label="11 - Nome do Responsável">
            <Input
              value={nomeResponsavel}
              onChange={(e) => setNomeResponsavel(e.target.value)}
              placeholder="Responsável legal (se aplicável)"
            />
          </Field>
          <Field label="13 - Endereço (Rua, Nº, Bairro)">
            <Input
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua, número e bairro"
            />
          </Field>
          <Field label="14 - Município de Residência">
            <Input
              value={municipio}
              onChange={(e) => setMunicipio(e.target.value)}
              placeholder="Município"
            />
          </Field>
          <Field label="15 - Cód. IBGE Município">
            <Input
              value={codIbge}
              onChange={(e) => setCodIbge(e.target.value.replace(/\D/g, "").slice(0, 7))}
              placeholder="0000000"
              className="font-mono"
            />
          </Field>
          <SelectField
            label="16 - UF"
            labelClassName="text-xs font-medium text-muted-foreground"
            value={uf}
            onValueChange={setUf}
            options={UF_OPTIONS}
            placeholder="UF"
          />
          <Field label="17 - CEP">
            <Input
              value={cep}
              onChange={(e) => setCep(e.target.value.replace(/\D/g, "").slice(0, 8))}
              placeholder="00000000"
              className="font-mono"
            />
          </Field>
        </Grid>
      </SectionCard>

      {/* 18 a 20 */}
      <SectionCard
        number={3}
        done={procedimentoOk}
        icon={<Stethoscope className="h-4 w-4" />}
        title="Procedimento Solicitado"
        description="Campos 18 a 20 — procedimento principal (tabela SIGTAP)."
      >
        <Grid cols={3}>
          <Field label="18 - Código do Procedimento Principal" required>
            <Input
              value={procedimentoPrincipalCodigo}
              onChange={(e) =>
                setProcedimentoPrincipalCodigo(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="0000000000"
              className="font-mono"
            />
          </Field>
          <Field label="19 - Nome do Procedimento Principal" required>
            <Input
              value={procedimentoPrincipalNome}
              onChange={(e) => setProcedimentoPrincipalNome(e.target.value)}
              placeholder="Descrição do procedimento"
            />
          </Field>
          <Field label="20 - Qtde." required>
            <Input
              type="number"
              min={1}
              value={procedimentoPrincipalQtde}
              onChange={(e) =>
                setProcedimentoPrincipalQtde(Math.max(1, Number(e.target.value) || 1))
              }
              className="text-center"
            />
          </Field>
        </Grid>
      </SectionCard>

      {/* 21 a 35 */}
      <SectionCard
        number={4}
        done={secundariosOk && secundarios.length > 0}
        icon={<ClipboardList className="h-4 w-4" />}
        title="Procedimento(s) Secundário(s) Solicitado(s)"
        description="Campos 21 a 35 — até 5 procedimentos secundários."
        actions={
          <Button
            type="button"
            size="sm"
            disabled={secundarios.length >= MAX_SECONDARY}
            onClick={() => setSecundarios((p) => [...p, newSecondary()])}
          >
            <Plus className="h-4 w-4" /> Adicionar procedimento
          </Button>
        }
      >
        {secundarios.length === 0 ? (
          <EmptyState
            size="sm"
            title="Nenhum procedimento secundário"
            description="Opcional: adicione até 5 procedimentos secundários."
            icon={<ClipboardList className="h-8 w-8" />}
          />
        ) : (
          <div className="space-y-3">
            <div className="hidden gap-3 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground @3xl:grid @3xl:grid-cols-[160px_1fr_90px_40px]">
              <span>Código</span>
              <span>Nome do procedimento</span>
              <span className="text-center">Qtde.</span>
              <span />
            </div>
            {secundarios.map((item, idx) => (
              <div
                key={item.id}
                className="grid gap-3 rounded-lg border p-3 @3xl:grid-cols-[160px_1fr_90px_40px] @3xl:items-center @3xl:border-0 @3xl:p-0"
              >
                <div className="text-xs font-semibold text-muted-foreground @3xl:hidden">
                  Procedimento secundário {idx + 1}
                </div>
                <Input
                  value={item.code}
                  onChange={(e) =>
                    updateSecondary(item.id, { code: e.target.value.replace(/\D/g, "").slice(0, 10) })
                  }
                  placeholder="Código"
                  aria-label={`Código do procedimento secundário ${idx + 1}`}
                  className="font-mono"
                />
                <Input
                  value={item.name}
                  onChange={(e) => updateSecondary(item.id, { name: e.target.value })}
                  placeholder="Nome do procedimento"
                  aria-label={`Nome do procedimento secundário ${idx + 1}`}
                />
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) =>
                    updateSecondary(item.id, { quantity: Math.max(1, Number(e.target.value) || 1) })
                  }
                  aria-label={`Quantidade do procedimento secundário ${idx + 1}`}
                  className="text-center"
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSecundarios((p) => p.filter((i) => i.id !== item.id))}
                    aria-label={`Remover procedimento secundário ${idx + 1}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* 36 a 40 */}
      <SectionCard
        number={5}
        done={justificativaOk}
        icon={<FileText className="h-4 w-4" />}
        title="Justificativa do(s) Procedimento(s) Solicitado(s)"
        description="Campos 36 a 40 — diagnóstico, CID-10 e observações."
      >
        <Field label="36 - Descrição do Diagnóstico" required>
          <Textarea
            value={descricaoDiagnostico}
            onChange={(e) => setDescricaoDiagnostico(e.target.value)}
            rows={3}
            placeholder="Descreva o diagnóstico que justifica o procedimento."
          />
        </Field>
        <div className="mt-4">
          <Grid cols={3}>
            <Field label="37 - CID 10 Principal" required>
              <Combobox
                options={CID_OPTIONS}
                value={cidPrincipal}
                onChange={setCidPrincipal}
                clearable
                placeholder="Buscar CID-10"
              />
            </Field>
            <Field label="38 - CID 10 Secundário">
              <Combobox
                options={CID_OPTIONS}
                value={cidSecundario}
                onChange={setCidSecundario}
                clearable
                placeholder="Buscar CID-10"
              />
            </Field>
            <Field label="39 - CID 10 Causas Associadas">
              <Combobox
                options={CID_OPTIONS}
                value={cidCausasAssociadas}
                onChange={setCidCausasAssociadas}
                clearable
                placeholder="Buscar CID-10"
              />
            </Field>
          </Grid>
        </div>
        <div className="mt-4">
          <Field label="40 - Observações">
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value.slice(0, 1000))}
              rows={3}
              placeholder="Observações complementares (até 1000 caracteres)."
            />
          </Field>
        </div>
      </SectionCard>

      {/* 41 a 45 */}
      <SectionCard
        number={6}
        done={solicitacaoOk}
        icon={<Stethoscope className="h-4 w-4" />}
        title="Solicitação"
        description="Campos 41 a 45 — profissional solicitante, documento e assinatura."
      >
        <Grid cols={3}>
          <Field label="41 - Nome do Profissional Solicitante" required>
            <Input
              value={profissionalSolicitante}
              onChange={(e) => setProfissionalSolicitante(e.target.value)}
              placeholder="Nome completo"
            />
          </Field>
          <Field label="42 - Data da Solicitação" required>
            <Input
              type="date"
              value={dataSolicitacao}
              onChange={(e) => setDataSolicitacao(e.target.value)}
            />
          </Field>
          <SelectField
            label="43 - Documento"
            labelClassName="text-xs font-medium text-muted-foreground"
            value={documentoSolicitanteTipo}
            onValueChange={setDocumentoSolicitanteTipo}
            options={DOCUMENTO_OPTIONS}
          />
          <Field label="44 - Nº Documento (CNS/CPF) do Profissional Solicitante" required>
            <Input
              value={documentoSolicitanteNumero}
              onChange={(e) =>
                setDocumentoSolicitanteNumero(e.target.value.replace(/\D/g, "").slice(0, 15))
              }
              placeholder="Somente números"
              className="font-mono"
            />
          </Field>
        </Grid>
        <div className="mt-5 grid gap-4 border-t pt-5 @3xl:grid-cols-2">
          <SignatureField
            label="45 - Assinatura e Carimbo (Nº Registro do Conselho)"
            value={assinaturaSolicitante}
            onChange={setAssinaturaSolicitante}
            hint="Opcional: deixe em branco para assinar à mão no papel."
          />
        </div>
      </SectionCard>

      {/* 46 a 53 */}
      <SectionCard
        number={7}
        icon={<ShieldCheck className="h-4 w-4" />}
        title="Autorização"
        description="Campos 46 a 53 — preenchidos pelo órgão autorizador (gestor)."
      >
        <Grid cols={3}>
          <Field label="46 - Nome do Profissional Autorizador">
            <Input
              value={profissionalAutorizador}
              onChange={(e) => setProfissionalAutorizador(e.target.value)}
              placeholder="Nome completo"
            />
          </Field>
          <Field label="47 - Cód. Órgão Emissor">
            <Input
              value={codOrgaoEmissor}
              onChange={(e) => setCodOrgaoEmissor(e.target.value)}
              placeholder="Código do órgão"
              className="font-mono"
            />
          </Field>
          <SelectField
            label="48 - Documento"
            labelClassName="text-xs font-medium text-muted-foreground"
            value={documentoAutorizadorTipo}
            onValueChange={setDocumentoAutorizadorTipo}
            options={DOCUMENTO_OPTIONS}
          />
          <Field label="49 - Nº Documento (CNS/CPF) do Profissional Autorizador">
            <Input
              value={documentoAutorizadorNumero}
              onChange={(e) =>
                setDocumentoAutorizadorNumero(e.target.value.replace(/\D/g, "").slice(0, 15))
              }
              placeholder="Somente números"
              className="font-mono"
            />
          </Field>
          <Field label="50 - Data da Autorização">
            <Input
              type="date"
              value={dataAutorizacao}
              onChange={(e) => setDataAutorizacao(e.target.value)}
            />
          </Field>
          <Field label="52 - Nº da Autorização (APAC)">
            <Input
              value={numeroApac}
              onChange={(e) => setNumeroApac(e.target.value)}
              placeholder="Número da APAC"
              className="font-mono"
            />
          </Field>
          <Field label="53 - Período de Validade da APAC (início)">
            <Input
              type="date"
              value={validadeInicio}
              onChange={(e) => setValidadeInicio(e.target.value)}
            />
          </Field>
          <Field label="53 - Período de Validade da APAC (fim)">
            <Input
              type="date"
              value={validadeFim}
              onChange={(e) => setValidadeFim(e.target.value)}
            />
          </Field>
        </Grid>
        <div className="mt-5 grid gap-4 border-t pt-5 @3xl:grid-cols-2">
          <SignatureField
            label="51 - Assinatura e Carimbo (Nº do Registro do Conselho)"
            value={assinaturaAutorizador}
            onChange={setAssinaturaAutorizador}
            hint="Preenchida pelo órgão autorizador."
          />
        </div>
      </SectionCard>

      {/* 54 e 55 */}
      <SectionCard
        number={8}
        done={executanteOk}
        icon={<Building2 className="h-4 w-4" />}
        title="Identificação do Estabelecimento de Saúde (Executante)"
        description="Campos 54 e 55 — unidade que executará o procedimento."
      >
        <Grid cols={2}>
          <Field label="54 - Nome Fantasia do Estabelecimento de Saúde Executante">
            <Input
              value={estabelecimentoExecutante}
              onChange={(e) => setEstabelecimentoExecutante(e.target.value)}
              placeholder="Nome fantasia"
            />
          </Field>
          <Field label="55 - CNES">
            <Input
              value={cnesExecutante}
              onChange={(e) => setCnesExecutante(e.target.value.replace(/\D/g, "").slice(0, 7))}
              placeholder="0000000"
              className="font-mono"
            />
          </Field>
        </Grid>
      </SectionCard>

      <FormActionBar
        stepsLabel="Etapas preenchidas"
        steps={[
          { label: "Estabelecimento solicitante", done: estabelecimentoOk },
          { label: "Paciente", done: pacienteOk },
          { label: "Procedimento principal", done: procedimentoOk },
          { label: "Justificativa", done: justificativaOk },
          { label: "Solicitação", done: solicitacaoOk },
          { label: "Estabelecimento executante", done: executanteOk },
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
          {submitting ? "Gerando..." : "Gerar laudo"}
        </Button>
      </FormActionBar>

      <AppModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title="Pré-visualização do laudo"
        description="Laudo para Solicitação / Autorização de Procedimento Ambulatorial (APAC)."
        size="xl"
      >
        <ApacGuidePreview {...previewData} fullSize />
      </AppModal>
    </form>
  );
}
