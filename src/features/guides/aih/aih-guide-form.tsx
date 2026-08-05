import { useState } from "react";
import {
  AlertTriangle,
  Building2,
  Eye,
  FileText,
  Save,
  ShieldCheck,
  Stethoscope,
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
import { SelectField } from "@/components/form-field";
import { AppModal } from "@/components/app-modal";
import { AihGuidePreview } from "./aih-guide-preview";
import { CID_OPTIONS } from "@/lib/cid";

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

const CLINICA_OPTIONS = [
  { value: "01 - Cirúrgica", label: "01 - Cirúrgica" },
  { value: "02 - Obstétrica", label: "02 - Obstétrica" },
  { value: "03 - Clínica médica", label: "03 - Clínica médica" },
  { value: "04 - Crônicos", label: "04 - Crônicos" },
  { value: "05 - Psiquiatria", label: "05 - Psiquiatria" },
  { value: "06 - Pneumologia sanitária (tisiologia)", label: "06 - Pneumologia sanitária (tisiologia)" },
  { value: "07 - Pediatria", label: "07 - Pediatria" },
  { value: "08 - Reabilitação", label: "08 - Reabilitação" },
  { value: "09 - Hospital-dia (cirúrgico)", label: "09 - Hospital-dia (cirúrgico)" },
];

const CARATER_OPTIONS = [
  { value: "01 - Eletivo", label: "01 - Eletivo" },
  { value: "02 - Urgência", label: "02 - Urgência" },
  { value: "03 - Acidente no local de trabalho ou a serviço da empresa", label: "03 - Acidente no local de trabalho" },
  { value: "04 - Acidente no trajeto para o trabalho", label: "04 - Acidente no trajeto para o trabalho" },
  { value: "05 - Outros tipos de acidente de trânsito", label: "05 - Outros tipos de acidente de trânsito" },
  { value: "06 - Outros tipos de lesões e envenenamentos", label: "06 - Outras lesões e envenenamentos" },
];

const CAUSA_EXTERNA_OPTIONS = [
  { value: "", label: "Não se aplica" },
  { value: "36 - Acidente de trânsito", label: "36 - Acidente de trânsito" },
  { value: "37 - Acidente de trabalho típico", label: "37 - Acidente de trabalho típico" },
  { value: "38 - Acidente de trabalho de trajeto", label: "38 - Acidente de trabalho de trajeto" },
];

const VINCULO_OPTIONS = [
  { value: "Empregado", label: "Empregado" },
  { value: "Empregador", label: "Empregador" },
  { value: "Autônomo", label: "Autônomo" },
  { value: "Desempregado", label: "Desempregado" },
  { value: "Aposentado", label: "Aposentado" },
  { value: "Não segurado", label: "Não segurado" },
];

const UF_OPTIONS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
].map((uf) => ({ value: uf, label: uf }));

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

export interface AihGuideFormProps {
  /** Slot do cabeçalho (título da guia selecionada). */
  header?: React.ReactNode;
}

/**
 * Laudo para Solicitação de Autorização de Internação Hospitalar (AIH — SUS).
 * Campos 1 a 52, na mesma ordem e nomenclatura do formulário oficial (Anexo I).
 */
export function AihGuideForm({ header }: AihGuideFormProps) {
  // 1 a 4 — estabelecimentos
  const [estabelecimentoSolicitante, setEstabelecimentoSolicitante] = useState("");
  const [cnesSolicitante, setCnesSolicitante] = useState("");
  const [estabelecimentoExecutante, setEstabelecimentoExecutante] = useState("");
  const [cnesExecutante, setCnesExecutante] = useState("");

  // 5 a 19 — paciente
  const [nomePaciente, setNomePaciente] = useState("");
  const [prontuario, setProntuario] = useState("");
  const [cns, setCns] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [sexo, setSexo] = useState("");
  const [racaCor, setRacaCor] = useState("");
  const [etnia, setEtnia] = useState("");
  const [nomeMae, setNomeMae] = useState("");
  const [telefonePacienteDdd, setTelefonePacienteDdd] = useState("");
  const [telefonePacienteNumero, setTelefonePacienteNumero] = useState("");
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [telefoneResponsavelDdd, setTelefoneResponsavelDdd] = useState("");
  const [telefoneResponsavelNumero, setTelefoneResponsavelNumero] = useState("");
  const [endereco, setEndereco] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [codIbge, setCodIbge] = useState("");
  const [uf, setUf] = useState("");
  const [cep, setCep] = useState("");

  // 20 a 26 — justificativa
  const [sinaisSintomas, setSinaisSintomas] = useState("");
  const [condicoesJustificam, setCondicoesJustificam] = useState("");
  const [resultadosProvas, setResultadosProvas] = useState("");
  const [diagnosticoInicial, setDiagnosticoInicial] = useState("");
  const [cidPrincipal, setCidPrincipal] = useState("");
  const [cidSecundario, setCidSecundario] = useState("");
  const [cidCausasAssociadas, setCidCausasAssociadas] = useState("");

  // 27 a 35 — procedimento solicitado
  const [descricaoProcedimento, setDescricaoProcedimento] = useState("");
  const [codigoProcedimento, setCodigoProcedimento] = useState("");
  const [clinica, setClinica] = useState("");
  const [caraterInternacao, setCaraterInternacao] = useState("");
  const [documentoSolicitanteTipo, setDocumentoSolicitanteTipo] = useState("CNS");
  const [documentoSolicitanteNumero, setDocumentoSolicitanteNumero] = useState("");
  const [profissionalSolicitante, setProfissionalSolicitante] = useState("");
  const [dataSolicitacao, setDataSolicitacao] = useState("");
  const [assinaturaSolicitante, setAssinaturaSolicitante] = useState("");

  // 36 a 45 — causas externas
  const [causaExterna, setCausaExterna] = useState("");
  const [cnpjSeguradora, setCnpjSeguradora] = useState("");
  const [numeroBilhete, setNumeroBilhete] = useState("");
  const [serie, setSerie] = useState("");
  const [cnpjEmpresa, setCnpjEmpresa] = useState("");
  const [cnaeEmpresa, setCnaeEmpresa] = useState("");
  const [cbor, setCbor] = useState("");
  const [vinculoPrevidencia, setVinculoPrevidencia] = useState("");

  // 46 a 52 — autorização
  const [profissionalAutorizador, setProfissionalAutorizador] = useState("");
  const [codOrgaoEmissor, setCodOrgaoEmissor] = useState("");
  const [numeroAih, setNumeroAih] = useState("");
  const [documentoAutorizadorTipo, setDocumentoAutorizadorTipo] = useState("CNS");
  const [documentoAutorizadorNumero, setDocumentoAutorizadorNumero] = useState("");
  const [dataAutorizacao, setDataAutorizacao] = useState("");
  const [assinaturaAutorizador, setAssinaturaAutorizador] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const estabelecimentosOk = Boolean(
    estabelecimentoSolicitante && cnesSolicitante && estabelecimentoExecutante && cnesExecutante,
  );
  const pacienteOk = Boolean(nomePaciente && cns && dataNascimento && sexo && nomeMae);
  const justificativaOk = Boolean(
    sinaisSintomas && condicoesJustificam && diagnosticoInicial && cidPrincipal,
  );
  const procedimentoOk = Boolean(
    descricaoProcedimento &&
      codigoProcedimento &&
      clinica &&
      caraterInternacao &&
      profissionalSolicitante &&
      dataSolicitacao &&
      documentoSolicitanteNumero,
  );
  const causasOk = Boolean(causaExterna);

  const previewData = {
    estabelecimentoSolicitante,
    cnesSolicitante,
    estabelecimentoExecutante,
    cnesExecutante,
    nomePaciente,
    prontuario,
    cns,
    dataNascimento,
    sexo,
    racaCor,
    etnia,
    nomeMae,
    telefonePacienteDdd,
    telefonePacienteNumero,
    nomeResponsavel,
    telefoneResponsavelDdd,
    telefoneResponsavelNumero,
    endereco,
    municipio,
    codIbge,
    uf,
    cep,
    sinaisSintomas,
    condicoesJustificam,
    resultadosProvas,
    diagnosticoInicial,
    cidPrincipal,
    cidSecundario,
    cidCausasAssociadas,
    descricaoProcedimento,
    codigoProcedimento,
    clinica,
    caraterInternacao,
    documentoSolicitanteTipo,
    documentoSolicitanteNumero,
    profissionalSolicitante,
    dataSolicitacao,
    assinaturaSolicitante,
    causaExterna,
    cnpjSeguradora,
    numeroBilhete,
    serie,
    cnpjEmpresa,
    cnaeEmpresa,
    cbor,
    vinculoPrevidencia,
    profissionalAutorizador,
    codOrgaoEmissor,
    numeroAih,
    documentoAutorizadorTipo,
    documentoAutorizadorNumero,
    dataAutorizacao,
    assinaturaAutorizador,
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!estabelecimentosOk || !pacienteOk || !justificativaOk || !procedimentoOk) {
      toast.error("Preencha os campos obrigatórios antes de gerar o laudo.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success("Laudo de solicitação de AIH gerado.");
    }, 700);
  };

  const onlyDigits = (value: string, max: number) => value.replace(/\D/g, "").slice(0, max);

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

      {/* 1 a 4 */}
      <SectionCard
        number={1}
        done={estabelecimentosOk}
        icon={<Building2 className="h-4 w-4" />}
        title="Identificação do Estabelecimento de Saúde"
        description="Campos 1 a 4 — estabelecimentos solicitante e executante."
      >
        <Grid cols={2}>
          <Field label="1 - Nome do Estabelecimento Solicitante" required>
            <Input
              value={estabelecimentoSolicitante}
              onChange={(e) => setEstabelecimentoSolicitante(e.target.value)}
              placeholder="Nome do estabelecimento"
            />
          </Field>
          <Field label="2 - CNES" required>
            <Input
              value={cnesSolicitante}
              onChange={(e) => setCnesSolicitante(onlyDigits(e.target.value, 7))}
              placeholder="0000000"
              className="font-mono"
            />
          </Field>
          <Field label="3 - Nome do Estabelecimento Executante" required>
            <Input
              value={estabelecimentoExecutante}
              onChange={(e) => setEstabelecimentoExecutante(e.target.value)}
              placeholder="Nome do estabelecimento"
            />
          </Field>
          <Field label="4 - CNES" required>
            <Input
              value={cnesExecutante}
              onChange={(e) => setCnesExecutante(onlyDigits(e.target.value, 7))}
              placeholder="0000000"
              className="font-mono"
            />
          </Field>
        </Grid>
      </SectionCard>

      {/* 5 a 19 */}
      <SectionCard
        number={2}
        done={pacienteOk}
        icon={<User className="h-4 w-4" />}
        title="Identificação do Paciente"
        description="Campos 5 a 19 — dados pessoais, contatos e endereço."
      >
        <Grid cols={3}>
          <Field label="5 - Nome do Paciente" required>
            <Input
              value={nomePaciente}
              onChange={(e) => setNomePaciente(e.target.value)}
              placeholder="Nome completo"
            />
          </Field>
          <Field label="6 - Nº do Prontuário">
            <Input
              value={prontuario}
              onChange={(e) => setProntuario(e.target.value)}
              placeholder="Número do prontuário"
              className="font-mono"
            />
          </Field>
          <Field label="7 - Cartão Nacional de Saúde (CNS)" required>
            <Input
              value={cns}
              onChange={(e) => setCns(onlyDigits(e.target.value, 15))}
              placeholder="000000000000000"
              className="font-mono"
            />
          </Field>
          <Field label="8 - Data de Nascimento" required>
            <Input
              type="date"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
            />
          </Field>
          <SelectField
            label="9 - Sexo"
            required
            labelClassName="text-xs font-medium text-muted-foreground"
            value={sexo}
            onValueChange={setSexo}
            options={SEXO_OPTIONS}
            placeholder="Selecione"
          />
          <SelectField
            label="10 - Raça / Cor"
            labelClassName="text-xs font-medium text-muted-foreground"
            value={racaCor}
            onValueChange={setRacaCor}
            options={RACA_COR_OPTIONS}
            placeholder="Selecione"
          />
          <Field label="10.1 - Etnia">
            <Input
              value={etnia}
              onChange={(e) => setEtnia(e.target.value)}
              placeholder="Preencher se raça/cor for indígena"
            />
          </Field>
          <Field label="11 - Nome da Mãe" required>
            <Input
              value={nomeMae}
              onChange={(e) => setNomeMae(e.target.value)}
              placeholder="Nome completo da mãe"
            />
          </Field>
          <Field label="12 - Telefone de Contato (paciente)">
            <div className="flex gap-2">
              <Input
                value={telefonePacienteDdd}
                onChange={(e) => setTelefonePacienteDdd(onlyDigits(e.target.value, 2))}
                placeholder="DDD"
                className="w-20 font-mono"
                aria-label="12 - DDD do paciente"
              />
              <Input
                value={telefonePacienteNumero}
                onChange={(e) => setTelefonePacienteNumero(onlyDigits(e.target.value, 9))}
                placeholder="Nº do telefone"
                className="font-mono"
                aria-label="12 - Número do telefone do paciente"
              />
            </div>
          </Field>
          <Field label="13 - Nome do Responsável">
            <Input
              value={nomeResponsavel}
              onChange={(e) => setNomeResponsavel(e.target.value)}
              placeholder="Responsável legal (se aplicável)"
            />
          </Field>
          <Field label="14 - Telefone de Contato (responsável)">
            <div className="flex gap-2">
              <Input
                value={telefoneResponsavelDdd}
                onChange={(e) => setTelefoneResponsavelDdd(onlyDigits(e.target.value, 2))}
                placeholder="DDD"
                className="w-20 font-mono"
                aria-label="14 - DDD do responsável"
              />
              <Input
                value={telefoneResponsavelNumero}
                onChange={(e) => setTelefoneResponsavelNumero(onlyDigits(e.target.value, 9))}
                placeholder="Nº do telefone"
                className="font-mono"
                aria-label="14 - Número do telefone do responsável"
              />
            </div>
          </Field>
          <Field label="15 - Endereço (Rua, Nº, Bairro)">
            <Input
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua, número e bairro"
            />
          </Field>
          <Field label="16 - Município de Residência">
            <Input
              value={municipio}
              onChange={(e) => setMunicipio(e.target.value)}
              placeholder="Município"
            />
          </Field>
          <Field label="17 - Cód. IBGE Município">
            <Input
              value={codIbge}
              onChange={(e) => setCodIbge(onlyDigits(e.target.value, 7))}
              placeholder="0000000"
              className="font-mono"
            />
          </Field>
          <SelectField
            label="18 - UF"
            labelClassName="text-xs font-medium text-muted-foreground"
            value={uf}
            onValueChange={setUf}
            options={UF_OPTIONS}
            placeholder="UF"
          />
          <Field label="19 - CEP">
            <Input
              value={cep}
              onChange={(e) => setCep(onlyDigits(e.target.value, 8))}
              placeholder="00000000"
              className="font-mono"
            />
          </Field>
        </Grid>
      </SectionCard>

      {/* 20 a 26 */}
      <SectionCard
        number={3}
        done={justificativaOk}
        icon={<FileText className="h-4 w-4" />}
        title="Justificativa da Internação"
        description="Campos 20 a 26 — quadro clínico, exames e diagnósticos."
      >
        <div className="space-y-4">
          <Field label="20 - Principais Sinais e Sintomas Clínicos" required>
            <Textarea
              value={sinaisSintomas}
              onChange={(e) => setSinaisSintomas(e.target.value)}
              rows={3}
              placeholder="Descreva os sinais e sintomas apresentados."
            />
          </Field>
          <Field label="21 - Condições que Justificam a Internação" required>
            <Textarea
              value={condicoesJustificam}
              onChange={(e) => setCondicoesJustificam(e.target.value)}
              rows={3}
              placeholder="Justifique a necessidade da internação hospitalar."
            />
          </Field>
          <Field label="22 - Principais Resultados de Provas Diagnósticas">
            <Textarea
              value={resultadosProvas}
              onChange={(e) => setResultadosProvas(e.target.value)}
              rows={3}
              placeholder="Resultados de exames já realizados."
            />
          </Field>
        </div>
        <div className="mt-4">
          <Grid cols={2}>
            <Field label="23 - Diagnóstico Inicial" required>
              <Input
                value={diagnosticoInicial}
                onChange={(e) => setDiagnosticoInicial(e.target.value)}
                placeholder="Diagnóstico inicial"
              />
            </Field>
            <Field label="24 - CID 10 Principal" required>
              <Combobox
                options={CID_OPTIONS}
                value={cidPrincipal}
                onChange={setCidPrincipal}
                clearable
                placeholder="Buscar CID-10"
              />
            </Field>
            <Field label="25 - CID 10 Secundário">
              <Combobox
                options={CID_OPTIONS}
                value={cidSecundario}
                onChange={setCidSecundario}
                clearable
                placeholder="Buscar CID-10"
              />
            </Field>
            <Field label="26 - CID 10 Causas Associadas">
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
      </SectionCard>

      {/* 27 a 35 */}
      <SectionCard
        number={4}
        done={procedimentoOk}
        icon={<Stethoscope className="h-4 w-4" />}
        title="Procedimento Solicitado"
        description="Campos 27 a 35 — procedimento, clínica, caráter e solicitante."
      >
        <Grid cols={3}>
          <Field label="27 - Descrição do Procedimento Solicitado" required>
            <Input
              value={descricaoProcedimento}
              onChange={(e) => setDescricaoProcedimento(e.target.value)}
              placeholder="Descrição do procedimento"
            />
          </Field>
          <Field label="28 - Código do Procedimento" required>
            <Input
              value={codigoProcedimento}
              onChange={(e) => setCodigoProcedimento(onlyDigits(e.target.value, 10))}
              placeholder="0000000000"
              className="font-mono"
            />
          </Field>
          <SelectField
            label="29 - Clínica"
            required
            labelClassName="text-xs font-medium text-muted-foreground"
            value={clinica}
            onValueChange={setClinica}
            options={CLINICA_OPTIONS}
            placeholder="Selecione a clínica"
          />
          <SelectField
            label="30 - Caráter da Internação"
            required
            labelClassName="text-xs font-medium text-muted-foreground"
            value={caraterInternacao}
            onValueChange={setCaraterInternacao}
            options={CARATER_OPTIONS}
            placeholder="Selecione o caráter"
          />
          <SelectField
            label="31 - Documento"
            labelClassName="text-xs font-medium text-muted-foreground"
            value={documentoSolicitanteTipo}
            onValueChange={setDocumentoSolicitanteTipo}
            options={DOCUMENTO_OPTIONS}
          />
          <Field label="32 - Nº Documento (CNS/CPF) do Profissional Solicitante / Assistente" required>
            <Input
              value={documentoSolicitanteNumero}
              onChange={(e) => setDocumentoSolicitanteNumero(onlyDigits(e.target.value, 15))}
              placeholder="Somente números"
              className="font-mono"
            />
          </Field>
          <Field label="33 - Nome do Profissional Solicitante / Assistente" required>
            <Input
              value={profissionalSolicitante}
              onChange={(e) => setProfissionalSolicitante(e.target.value)}
              placeholder="Nome completo"
            />
          </Field>
          <Field label="34 - Data da Solicitação" required>
            <Input
              type="date"
              value={dataSolicitacao}
              onChange={(e) => setDataSolicitacao(e.target.value)}
            />
          </Field>
        </Grid>
        <div className="mt-5 grid gap-4 border-t pt-5 lg:grid-cols-2">
          <SignatureField
            label="35 - Assinatura e Carimbo (Nº do Registro do Conselho)"
            value={assinaturaSolicitante}
            onChange={setAssinaturaSolicitante}
            hint="Opcional: deixe em branco para assinar à mão no papel."
          />
        </div>
      </SectionCard>

      {/* 36 a 45 */}
      <SectionCard
        number={5}
        done={causasOk}
        icon={<AlertTriangle className="h-4 w-4" />}
        title="Preencher em Caso de Causas Externas (Acidentes ou Violências)"
        description="Campos 36 a 45 — preencher somente quando houver causa externa."
      >
        <Grid cols={3}>
          <SelectField
            label="36 a 38 - Tipo de Causa Externa"
            labelClassName="text-xs font-medium text-muted-foreground"
            value={causaExterna}
            onValueChange={setCausaExterna}
            options={CAUSA_EXTERNA_OPTIONS}
            placeholder="Não se aplica"
          />
          <Field label="39 - CNPJ da Seguradora">
            <Input
              value={cnpjSeguradora}
              onChange={(e) => setCnpjSeguradora(onlyDigits(e.target.value, 14))}
              placeholder="00000000000000"
              className="font-mono"
            />
          </Field>
          <Field label="40 - Nº do Bilhete">
            <Input
              value={numeroBilhete}
              onChange={(e) => setNumeroBilhete(e.target.value)}
              placeholder="Número do bilhete"
              className="font-mono"
            />
          </Field>
          <Field label="41 - Série">
            <Input
              value={serie}
              onChange={(e) => setSerie(e.target.value)}
              placeholder="Série"
              className="font-mono"
            />
          </Field>
          <Field label="42 - CNPJ Empresa">
            <Input
              value={cnpjEmpresa}
              onChange={(e) => setCnpjEmpresa(onlyDigits(e.target.value, 14))}
              placeholder="00000000000000"
              className="font-mono"
            />
          </Field>
          <Field label="43 - CNAE da Empresa">
            <Input
              value={cnaeEmpresa}
              onChange={(e) => setCnaeEmpresa(e.target.value)}
              placeholder="Código CNAE"
              className="font-mono"
            />
          </Field>
          <Field label="44 - CBOR">
            <Input
              value={cbor}
              onChange={(e) => setCbor(e.target.value)}
              placeholder="Ocupação do paciente (CBO-R)"
              className="font-mono"
            />
          </Field>
          <SelectField
            label="45 - Vínculo com a Previdência"
            labelClassName="text-xs font-medium text-muted-foreground"
            value={vinculoPrevidencia}
            onValueChange={setVinculoPrevidencia}
            options={VINCULO_OPTIONS}
            placeholder="Selecione"
          />
        </Grid>
      </SectionCard>

      {/* 46 a 52 */}
      <SectionCard
        number={6}
        icon={<ShieldCheck className="h-4 w-4" />}
        title="Autorização"
        description="Campos 46 a 52 — preenchidos pelo órgão autorizador (gestor)."
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
          <Field label="52 - Nº da Autorização de Internação Hospitalar">
            <Input
              value={numeroAih}
              onChange={(e) => setNumeroAih(e.target.value)}
              placeholder="Número da AIH"
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
              onChange={(e) => setDocumentoAutorizadorNumero(onlyDigits(e.target.value, 15))}
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
        </Grid>
        <div className="mt-5 grid gap-4 border-t pt-5 lg:grid-cols-2">
          <SignatureField
            label="51 - Assinatura e Carimbo (Nº do Registro do Conselho)"
            value={assinaturaAutorizador}
            onChange={setAssinaturaAutorizador}
            hint="Preenchida pelo órgão autorizador."
          />
        </div>
      </SectionCard>

      <FormActionBar
        stepsLabel="Etapas preenchidas"
        steps={[
          { label: "Estabelecimentos", done: estabelecimentosOk },
          { label: "Paciente", done: pacienteOk },
          { label: "Justificativa da internação", done: justificativaOk },
          { label: "Procedimento solicitado", done: procedimentoOk },
          { label: "Causas externas", done: causasOk },
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
        description="Laudo para Solicitação de Autorização de Internação Hospitalar (AIH)."
        size="xl"
      >
        <AihGuidePreview {...previewData} fullSize />
      </AppModal>
    </form>
  );
}
