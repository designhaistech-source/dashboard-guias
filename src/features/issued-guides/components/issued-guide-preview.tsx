import {
  AihGuidePreview,
  ApacGuidePreview,
  InternacaoGuidePreview,
  type AihGuidePreviewProps,
  type ApacGuidePreviewProps,
  type InternacaoGuidePreviewProps,
} from "@/features/guides";
import { SadtGuidePreview } from "@/features/guides/sadt/sadt-guide-preview";
import { operadoraLogoUrl } from "@/features/guides/data/operadora-logos";
import { ESTABLISHMENT } from "@/features/establishment";
import { formatCurrency, type IssuedGuide } from "../data/issued-guides";

/**
 * Renderiza a guia emitida no mesmo modelo impresso usado na pré-visualização
 * de "Emitir guia", escolhendo o formulário conforme o tipo da guia.
 *
 * Como o protótipo guarda apenas um resumo de cada emissão, os campos não
 * armazenados são derivados de dados sintéticos determinísticos.
 */
export function IssuedGuidePreview({ guide }: { guide: IssuedGuide }) {
  const derived = deriveGuideData(guide);

  if (guide.type === "Internação") {
    return (
      <InternacaoGuidePreview
        fullSize
        {...({
          ans: derived.registroAns,
          guiaPrestador: guide.numero,
          guiaOperadora: derived.guiaOperadora,
          senha: derived.senha,
          dataAutorizacao: derived.dataIso,
          validadeSenha: derived.validadeSenha,
          carteira: derived.carteira,
          validadeCarteira: derived.validadeCarteira,
          atendimentoRn: "N",
          nomeBeneficiario: guide.patient,
          cns: derived.cns,
          codigoSolicitante: derived.codigoOperadora,
          nomeContratado: ESTABLISHMENT.nome,
          nomeProfissional: derived.profissionalNome,
          conselho: derived.conselho,
          numeroConselho: derived.numeroConselho,
          ufConselho: derived.ufConselho,
          cbo: "225125",
          codigoHospital: derived.codigoOperadora,
          nomeHospital: ESTABLISHMENT.nome,
          dataSugerida: derived.dataIso,
          carater: "1",
          tipoInternacao: "1",
          regimeInternacao: "1",
          diariasSolicitadas: 2,
          indicacaoClinica: guide.procedure,
          cid1: derived.cid,
          items: [derived.procedimento],
          observacoes: `Guia ${guide.status.toLowerCase()} · total ${formatCurrency(guide.total)}`,
        } as unknown as InternacaoGuidePreviewProps)}
      />
    );
  }

  if (guide.type === "APAC (SUS)") {
    return (
      <ApacGuidePreview
        fullSize
        {...({
          estabelecimentoSolicitante: ESTABLISHMENT.nome,
          cnesSolicitante: ESTABLISHMENT.cnes,
          nomePaciente: guide.patient,
          prontuario: derived.prontuario,
          cns: derived.cns,
          dataNascimento: derived.nascimentoIso,
          sexo: derived.sexo,
          racaCor: "Parda",
          nomeMae: derived.nomeMae,
          telefoneDdd: "84",
          telefoneNumero: derived.telefone,
          nomeResponsavel: "",
          endereco: "Av. Prudente de Morais, 1200 — Tirol",
          municipio: "Natal",
          codIbge: "2408102",
          uf: "RN",
          cep: "59020-000",
          procedimentoPrincipalCodigo: derived.procedimento.code,
          procedimentoPrincipalNome: derived.procedimento.description,
          procedimentoPrincipalQtde: 1,
          secundarios: [],
          descricaoDiagnostico: guide.procedure,
          cidPrincipal: derived.cid,
          cidSecundario: "",
          cidCausasAssociadas: "",
          observacoes: `Guia ${guide.status.toLowerCase()} · total ${formatCurrency(guide.total)}`,
          profissionalSolicitante: derived.profissionalNome,
          dataSolicitacao: derived.dataIso,
          documentoSolicitanteTipo: "CNS",
          documentoSolicitanteNumero: derived.cns,
          assinaturaSolicitante: "",
          profissionalAutorizador: "",
          codOrgaoEmissor: "",
          documentoAutorizadorTipo: "",
          documentoAutorizadorNumero: "",
          dataAutorizacao: guide.status === "Autorizada" ? derived.dataIso : "",
          assinaturaAutorizador: "",
          numeroApac: guide.numero,
          validadeInicio: "",
          validadeFim: "",
          estabelecimentoExecutante: ESTABLISHMENT.nome,
          cnesExecutante: ESTABLISHMENT.cnes,
        } as unknown as ApacGuidePreviewProps)}
      />
    );
  }

  if (guide.type === "AIH (SUS)") {
    return (
      <AihGuidePreview
        fullSize
        {...({
          estabelecimentoSolicitante: ESTABLISHMENT.nome,
          cnesSolicitante: ESTABLISHMENT.cnes,
          estabelecimentoExecutante: ESTABLISHMENT.nome,
          cnesExecutante: ESTABLISHMENT.cnes,
          nomePaciente: guide.patient,
          prontuario: derived.prontuario,
          cns: derived.cns,
          dataNascimento: derived.nascimentoIso,
          sexo: derived.sexo,
          racaCor: "Parda",
          nomeMae: derived.nomeMae,
          telefonePacienteDdd: "84",
          telefonePacienteNumero: derived.telefone,
          endereco: "Av. Prudente de Morais, 1200 — Tirol",
          municipio: "Natal",
          codIbge: "2408102",
          uf: "RN",
          cep: "59020-000",
          diagnosticoInicial: guide.procedure,
          cidPrincipal: derived.cid,
          descricaoProcedimento: derived.procedimento.description,
          codigoProcedimento: derived.procedimento.code,
          clinica: "Cirúrgica",
          caraterInternacao: "1",
          documentoSolicitanteTipo: "CNS",
          documentoSolicitanteNumero: derived.cns,
          profissionalSolicitante: derived.profissionalNome,
          dataSolicitacao: derived.dataIso,
          numeroAih: guide.numero,
          dataAutorizacao: guide.status === "Autorizada" ? derived.dataIso : "",
        } as unknown as AihGuidePreviewProps)}
      />
    );
  }

  return (
    <SadtGuidePreview
      fullSize
      numeroGuia={guide.numero}
      guideLabel="SP/SADT"
      operadora={guide.operadora}
      operadoraLogo={operadoraLogoUrl(guide.operadora)}
      registroAns={derived.registroAns}
      character="E"
      dataSolicitacao={derived.dataIso}
      pacienteNome={guide.patient}
      pacienteCarteira={derived.carteira}
      pacienteValidadeCarteira={derived.validadeCarteira}
      pacienteNascimento={derived.nascimentoIso}
      pacienteSexo={derived.sexo}
      pacienteNomeSocial=""
      coberturaEspecial=""
      regimeAtendimento="01"
      saudeOcupacional=""
      pacienteRn="N"
      medicoNome={derived.profissionalNome}
      medicoConselho={derived.conselho}
      medicoCrm={derived.numeroConselho}
      conselhoUf={derived.ufConselho}
      codigoCbo="225125"
      cidPrincipal={derived.cid}
      indicacaoClinica={guide.procedure}
      codigoSolicitante={derived.codigoOperadora}
      contratadoSolicitante={ESTABLISHMENT.nome}
      codigoExecutante={derived.codigoOperadora}
      contratadoExecutante={ESTABLISHMENT.nome}
      cnesExecutante={ESTABLISHMENT.cnes}
      tipoAtendimento="23"
      indicacaoAcidente="9"
      tipoConsulta=""
      motivoEncerramento=""
      guiaOperadora={derived.guiaOperadora}
      senha={derived.senha}
      validadeSenha={derived.validadeSenha}
      dataAutorizacao={guide.status === "Autorizada" ? derived.dataIso : ""}
      procedures={[
        {
          code: derived.procedimento.code,
          description: derived.procedimento.description,
          quantity: 1,
          table: derived.procedimento.table,
        },
      ]}
      opmeItems={[]}
      totais={["", "", "", "", "", "", "", formatCurrency(guide.total)]}
    />
  );
}

/** Deriva os campos não persistidos a partir do resumo da guia emitida. */
function deriveGuideData(guide: IssuedGuide) {
  const [code = "", description = ""] = guide.procedure.split(" — ");
  const digits = guide.numero.replace(/\D/g, "").padStart(6, "0");
  const conselhoMatch = /\(([A-Z]+)\s*([\d.]+)\/([A-Z]{2})\)/.exec(guide.professional);

  return {
    dataIso: guide.issuedAt.slice(0, 10),
    registroAns: "417092",
    carteira: `00${digits}0012${digits.slice(-2)}`,
    validadeCarteira: "2027-12-31",
    cns: `7080 0${digits} ${digits.slice(0, 4)} 000${digits.slice(-1)}`,
    prontuario: digits,
    nascimentoIso: "1987-04-19",
    sexo: "F",
    nomeMae: "Maria das Graças Silva",
    telefone: `9${digits.slice(-4)}-${digits.slice(0, 4)}`,
    cid: "M54.5",
    senha: `A${digits}`,
    validadeSenha: "2026-12-31",
    guiaOperadora: `OP-${digits}`,
    codigoOperadora: `${digits.slice(0, 4)}-9`,
    profissionalNome: guide.professional.replace(/\s*\(.*\)$/, ""),
    conselho: conselhoMatch?.[1] ?? "CRM",
    numeroConselho: conselhoMatch?.[2] ?? "13955",
    ufConselho: conselhoMatch?.[3] ?? "RN",
    procedimento: {
      table: "22",
      code,
      description,
      requestedQty: 1,
    },
  };
}
