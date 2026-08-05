import {
  FieldBox,
  FieldBoxDate,
  FieldRow,
  SectionBar,
  splitDate,
} from "@/features/guides/components/guide-print-primitives";

export interface AihGuidePreviewProps {
  estabelecimentoSolicitante: string;
  cnesSolicitante: string;
  estabelecimentoExecutante: string;
  cnesExecutante: string;
  nomePaciente: string;
  prontuario: string;
  cns: string;
  dataNascimento: string;
  sexo: string;
  racaCor: string;
  etnia: string;
  nomeMae: string;
  telefonePacienteDdd: string;
  telefonePacienteNumero: string;
  nomeResponsavel: string;
  telefoneResponsavelDdd: string;
  telefoneResponsavelNumero: string;
  endereco: string;
  municipio: string;
  codIbge: string;
  uf: string;
  cep: string;
  sinaisSintomas: string;
  condicoesJustificam: string;
  resultadosProvas: string;
  diagnosticoInicial: string;
  cidPrincipal: string;
  cidSecundario: string;
  cidCausasAssociadas: string;
  descricaoProcedimento: string;
  codigoProcedimento: string;
  clinica: string;
  caraterInternacao: string;
  documentoSolicitanteTipo: string;
  documentoSolicitanteNumero: string;
  profissionalSolicitante: string;
  dataSolicitacao: string;
  assinaturaSolicitante: string;
  causaExterna: string;
  cnpjSeguradora: string;
  numeroBilhete: string;
  serie: string;
  cnpjEmpresa: string;
  cnaeEmpresa: string;
  cbor: string;
  vinculoPrevidencia: string;
  profissionalAutorizador: string;
  codOrgaoEmissor: string;
  numeroAih: string;
  documentoAutorizadorTipo: string;
  documentoAutorizadorNumero: string;
  dataAutorizacao: string;
  assinaturaAutorizador: string;
  /** Renderiza em tamanho real (dentro de um modal), sem moldura de card. */
  fullSize?: boolean;
}

/**
 * Pré-visualização do Laudo para Solicitação de Autorização de Internação
 * Hospitalar (AIH — SUS), com a numeração 1 a 52 do formulário oficial.
 */
export function AihGuidePreview(props: AihGuidePreviewProps) {
  const phone = (ddd: string, num: string) => (ddd || num ? `(${ddd}) ${num}` : "");

  return (
    <div className={props.fullSize ? "" : "rounded-xl border bg-card shadow-sm overflow-hidden"}>
      {!props.fullSize && (
        <div className="px-4 py-2.5 border-b bg-muted/40 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Pré-visualização · Laudo de AIH
          </p>
          <span className="text-[10px] text-muted-foreground">Atualiza em tempo real</span>
        </div>
      )}

      <div className={props.fullSize ? "bg-muted p-4 overflow-auto" : "bg-muted p-2 overflow-hidden"}>
        <div
          className="origin-top-left"
          style={
            props.fullSize
              ? { width: 1100 }
              : { transform: "scale(0.4)", width: 1100, height: 820, transformOrigin: "top left" }
          }
        >
          <div className="w-[1100px] bg-surface text-foreground font-sans text-[9px] leading-tight border border-foreground">
            {/* Cabeçalho */}
            <div className="grid grid-cols-[160px_1fr_100px] border-b border-foreground">
              <div className="flex items-center justify-center border-r border-foreground px-2 py-2">
                <span className="text-[9px] text-muted-foreground italic">
                  SUS · Ministério da Saúde
                </span>
              </div>
              <div className="flex items-center justify-center px-2 py-2 text-center">
                <div className="font-bold text-[13px] uppercase leading-tight">
                  Laudo para Solicitação de Autorização de Internação Hospitalar
                </div>
              </div>
              <div className="border-l border-foreground px-2 py-1 flex items-center justify-center">
                <span className="text-[8px] font-bold">Anexo I</span>
              </div>
            </div>

            <SectionBar>Identificação do Estabelecimento de Saúde</SectionBar>
            <FieldRow>
              <FieldBox
                n="1"
                label="Nome do Estabelecimento Solicitante"
                value={props.estabelecimentoSolicitante}
                grow
              />
              <FieldBox n="2" label="CNES" value={props.cnesSolicitante} width={180} />
            </FieldRow>
            <FieldRow>
              <FieldBox
                n="3"
                label="Nome do Estabelecimento Executante"
                value={props.estabelecimentoExecutante}
                grow
              />
              <FieldBox n="4" label="CNES" value={props.cnesExecutante} width={180} />
            </FieldRow>

            <SectionBar>Identificação do Paciente</SectionBar>
            <FieldRow>
              <FieldBox n="5" label="Nome do Paciente" value={props.nomePaciente} grow />
              <FieldBox n="6" label="Nº do Prontuário" value={props.prontuario} width={180} />
            </FieldRow>
            <FieldRow>
              <FieldBox n="7" label="Cartão Nacional de Saúde (CNS)" value={props.cns} width={230} />
              <FieldBoxDate
                n="8"
                label="Data de Nascimento"
                {...splitDate(props.dataNascimento)}
                width={180}
              />
              <FieldBox
                n="9"
                label="Sexo"
                value={props.sexo === "F" ? "Fem." : props.sexo === "M" ? "Masc." : ""}
                width={80}
              />
              <FieldBox n="10" label="Raça / Cor" value={props.racaCor} grow />
              <FieldBox n="10.1" label="Etnia" value={props.etnia} width={160} />
            </FieldRow>
            <FieldRow>
              <FieldBox n="11" label="Nome da Mãe" value={props.nomeMae} grow />
              <FieldBox
                n="12"
                label="Telefone de Contato"
                value={phone(props.telefonePacienteDdd, props.telefonePacienteNumero)}
                width={220}
              />
            </FieldRow>
            <FieldRow>
              <FieldBox n="13" label="Nome do Responsável" value={props.nomeResponsavel} grow />
              <FieldBox
                n="14"
                label="Telefone de Contato"
                value={phone(props.telefoneResponsavelDdd, props.telefoneResponsavelNumero)}
                width={220}
              />
            </FieldRow>
            <FieldRow>
              <FieldBox n="15" label="Endereço (Rua, Nº, Bairro)" value={props.endereco} grow />
            </FieldRow>
            <FieldRow>
              <FieldBox n="16" label="Município de Residência" value={props.municipio} grow />
              <FieldBox n="17" label="Cód. IBGE Município" value={props.codIbge} width={180} />
              <FieldBox n="18" label="UF" value={props.uf} width={60} />
              <FieldBox n="19" label="CEP" value={props.cep} width={130} />
            </FieldRow>

            <SectionBar>Justificativa da Internação</SectionBar>
            <FieldRow>
              <FieldBox
                n="20"
                label="Principais Sinais e Sintomas Clínicos"
                value={props.sinaisSintomas}
                grow
              />
            </FieldRow>
            <FieldRow>
              <FieldBox
                n="21"
                label="Condições que Justificam a Internação"
                value={props.condicoesJustificam}
                grow
              />
            </FieldRow>
            <FieldRow>
              <FieldBox
                n="22"
                label="Principais Resultados de Provas Diagnósticas"
                value={props.resultadosProvas}
                grow
              />
            </FieldRow>
            <FieldRow>
              <FieldBox n="23" label="Diagnóstico Inicial" value={props.diagnosticoInicial} grow />
              <FieldBox n="24" label="CID 10 Principal" value={props.cidPrincipal} width={190} />
              <FieldBox n="25" label="CID 10 Secundário" value={props.cidSecundario} width={190} />
              <FieldBox
                n="26"
                label="CID 10 Causas Associadas"
                value={props.cidCausasAssociadas}
                width={210}
              />
            </FieldRow>

            <SectionBar>Procedimento Solicitado</SectionBar>
            <FieldRow>
              <FieldBox
                n="27"
                label="Descrição do Procedimento Solicitado"
                value={props.descricaoProcedimento}
                grow
              />
              <FieldBox
                n="28"
                label="Código do Procedimento"
                value={props.codigoProcedimento}
                width={220}
              />
            </FieldRow>
            <FieldRow>
              <FieldBox n="29" label="Clínica" value={props.clinica} width={230} />
              <FieldBox
                n="30"
                label="Caráter da Internação"
                value={props.caraterInternacao}
                width={220}
              />
              <FieldBox n="31" label="Documento" value={props.documentoSolicitanteTipo} width={130} />
              <FieldBox
                n="32"
                label="Nº Documento (CNS/CPF) do Profissional Solicitante / Assistente"
                value={props.documentoSolicitanteNumero}
                grow
              />
            </FieldRow>
            <FieldRow>
              <FieldBox
                n="33"
                label="Nome do Profissional Solicitante / Assistente"
                value={props.profissionalSolicitante}
                grow
              />
              <FieldBoxDate
                n="34"
                label="Data da Solicitação"
                {...splitDate(props.dataSolicitacao)}
                width={190}
              />
              <FieldBox
                n="35"
                label="Assinatura e Carimbo (Nº do Registro do Conselho)"
                value=""
                image={props.assinaturaSolicitante}
                grow
              />
            </FieldRow>

            <SectionBar>Preencher em Caso de Causas Externas (Acidentes ou Violências)</SectionBar>
            <FieldRow>
              <FieldBox
                n="36 a 38"
                label="Tipo de Causa Externa"
                value={props.causaExterna}
                width={300}
              />
              <FieldBox n="39" label="CNPJ da Seguradora" value={props.cnpjSeguradora} grow />
              <FieldBox n="40" label="Nº do Bilhete" value={props.numeroBilhete} width={180} />
              <FieldBox n="41" label="Série" value={props.serie} width={110} />
            </FieldRow>
            <FieldRow>
              <FieldBox n="42" label="CNPJ Empresa" value={props.cnpjEmpresa} grow />
              <FieldBox n="43" label="CNAE da Empresa" value={props.cnaeEmpresa} width={200} />
              <FieldBox n="44" label="CBOR" value={props.cbor} width={160} />
              <FieldBox
                n="45"
                label="Vínculo com a Previdência"
                value={props.vinculoPrevidencia}
                width={230}
              />
            </FieldRow>

            <SectionBar>Autorização</SectionBar>
            <FieldRow>
              <FieldBox
                n="46"
                label="Nome do Profissional Autorizador"
                value={props.profissionalAutorizador}
                grow
              />
              <FieldBox n="47" label="Cód. Órgão Emissor" value={props.codOrgaoEmissor} width={180} />
              <FieldBox
                n="52"
                label="Nº da Autorização de Internação Hospitalar"
                value={props.numeroAih}
                width={260}
              />
            </FieldRow>
            <FieldRow>
              <FieldBox n="48" label="Documento" value={props.documentoAutorizadorTipo} width={130} />
              <FieldBox
                n="49"
                label="Nº Documento (CNS/CPF) do Profissional Autorizador"
                value={props.documentoAutorizadorNumero}
                grow
              />
              <FieldBoxDate
                n="50"
                label="Data da Autorização"
                {...splitDate(props.dataAutorizacao)}
                width={190}
              />
            </FieldRow>
            <FieldRow>
              <FieldBox
                n="51"
                label="Assinatura e Carimbo (Nº do Registro do Conselho)"
                value=""
                image={props.assinaturaAutorizador}
                grow
              />
            </FieldRow>
          </div>
        </div>
      </div>
    </div>
  );
}
