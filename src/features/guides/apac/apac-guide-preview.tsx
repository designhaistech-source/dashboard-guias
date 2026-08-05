import {
  FieldBox,
  FieldBoxDate,
  FieldRow,
  SectionBar,
  splitDate,
} from "@/features/guides/components/guide-print-primitives";

export interface ApacSecondaryProcedure {
  code: string;
  name: string;
  quantity: number;
}

export interface ApacGuidePreviewProps {
  estabelecimentoSolicitante: string;
  cnesSolicitante: string;
  nomePaciente: string;
  prontuario: string;
  cns: string;
  dataNascimento: string;
  sexo: string;
  racaCor: string;
  nomeMae: string;
  telefoneDdd: string;
  telefoneNumero: string;
  nomeResponsavel: string;
  endereco: string;
  municipio: string;
  codIbge: string;
  uf: string;
  cep: string;
  procedimentoPrincipalCodigo: string;
  procedimentoPrincipalNome: string;
  procedimentoPrincipalQtde: number;
  secundarios: ApacSecondaryProcedure[];
  descricaoDiagnostico: string;
  cidPrincipal: string;
  cidSecundario: string;
  cidCausasAssociadas: string;
  observacoes: string;
  profissionalSolicitante: string;
  dataSolicitacao: string;
  documentoSolicitanteTipo: string;
  documentoSolicitanteNumero: string;
  assinaturaSolicitante: string;
  profissionalAutorizador: string;
  codOrgaoEmissor: string;
  documentoAutorizadorTipo: string;
  documentoAutorizadorNumero: string;
  dataAutorizacao: string;
  assinaturaAutorizador: string;
  numeroApac: string;
  validadeInicio: string;
  validadeFim: string;
  estabelecimentoExecutante: string;
  cnesExecutante: string;
  /** Renderiza em tamanho real (dentro de um modal), sem moldura de card. */
  fullSize?: boolean;
}

/** Pares de numeração dos 5 blocos de procedimentos secundários (21 a 35). */
const SECONDARY_NUMBERS: [string, string, string][] = [
  ["21", "22", "23"],
  ["24", "25", "26"],
  ["27", "28", "29"],
  ["30", "31", "32"],
  ["33", "34", "35"],
];

/**
 * Pré-visualização do Laudo para Solicitação/Autorização de Procedimento
 * Ambulatorial (APAC — SUS), com a numeração 1 a 55 do formulário oficial.
 */
export function ApacGuidePreview(props: ApacGuidePreviewProps) {
  return (
    <div className={props.fullSize ? "" : "rounded-xl border bg-card shadow-sm overflow-hidden"}>
      {!props.fullSize && (
        <div className="px-4 py-2.5 border-b bg-muted/40 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Pré-visualização · Laudo de APAC
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
            <div className="grid grid-cols-[140px_1fr_120px] border-b border-foreground">
              <div className="flex items-center justify-center border-r border-foreground px-2 py-2">
                <span className="text-[9px] text-muted-foreground italic">SUS · Ministério da Saúde</span>
              </div>
              <div className="flex items-center justify-center px-2 py-2 text-center">
                <div className="font-bold text-[13px] uppercase leading-tight">
                  Laudo para Solicitação / Autorização de Procedimento Ambulatorial
                </div>
              </div>
              <div className="border-l border-foreground px-2 py-1 flex items-center justify-center">
                <span className="text-[8px] font-bold">fls. 1/2</span>
              </div>
            </div>

            <SectionBar>Identificação do Estabelecimento de Saúde (Solicitante)</SectionBar>
            <FieldRow>
              <FieldBox
                n="1"
                label="Nome do Estabelecimento de Saúde Solicitante"
                value={props.estabelecimentoSolicitante}
                grow
              />
              <FieldBox n="2" label="CNES" value={props.cnesSolicitante} width={180} />
            </FieldRow>

            <SectionBar>Identificação do Paciente</SectionBar>
            <FieldRow>
              <FieldBox n="3" label="Nome do Paciente" value={props.nomePaciente} grow />
              <FieldBox n="4" label="Nº do Prontuário" value={props.prontuario} width={180} />
            </FieldRow>
            <FieldRow>
              <FieldBox n="5" label="Cartão Nacional de Saúde (CNS)" value={props.cns} width={260} />
              <FieldBoxDate
                n="6"
                label="Data de Nascimento"
                {...splitDate(props.dataNascimento)}
                width={190}
              />
              <FieldBox
                n="7"
                label="Sexo"
                value={props.sexo === "F" ? "Fem." : props.sexo === "M" ? "Masc." : ""}
                width={90}
              />
              <FieldBox n="8" label="Raça / Cor" value={props.racaCor} grow />
            </FieldRow>
            <FieldRow>
              <FieldBox n="9" label="Nome da Mãe" value={props.nomeMae} grow />
              <FieldBox
                n="10"
                label="Telefone de Contato"
                value={
                  props.telefoneDdd || props.telefoneNumero
                    ? `(${props.telefoneDdd}) ${props.telefoneNumero}`
                    : ""
                }
                width={220}
              />
            </FieldRow>
            <FieldRow>
              <FieldBox n="11" label="Nome do Responsável" value={props.nomeResponsavel} grow />
              <FieldBox n="13" label="Endereço (Rua, Nº, Bairro)" value={props.endereco} grow />
            </FieldRow>
            <FieldRow>
              <FieldBox n="14" label="Município de Residência" value={props.municipio} grow />
              <FieldBox n="15" label="Cód. IBGE Município" value={props.codIbge} width={180} />
              <FieldBox n="16" label="UF" value={props.uf} width={60} />
              <FieldBox n="17" label="CEP" value={props.cep} width={130} />
            </FieldRow>

            <SectionBar>Procedimento Solicitado</SectionBar>
            <FieldRow>
              <FieldBox
                n="18"
                label="Código do Procedimento Principal"
                value={props.procedimentoPrincipalCodigo}
                width={240}
              />
              <FieldBox
                n="19"
                label="Nome do Procedimento Principal"
                value={props.procedimentoPrincipalNome}
                grow
              />
              <FieldBox
                n="20"
                label="Qtde."
                value={String(props.procedimentoPrincipalQtde || "")}
                width={90}
              />
            </FieldRow>

            <SectionBar>Procedimento(s) Secundário(s) Solicitado(s)</SectionBar>
            {SECONDARY_NUMBERS.map(([nCode, nName, nQty], index) => {
              const item = props.secundarios[index];
              return (
                <FieldRow key={nCode}>
                  <FieldBox
                    n={nCode}
                    label="Código do Procedimento Secundário"
                    value={item?.code ?? ""}
                    width={240}
                  />
                  <FieldBox
                    n={nName}
                    label="Nome do Procedimento Secundário"
                    value={item?.name ?? ""}
                    grow
                  />
                  <FieldBox
                    n={nQty}
                    label="Qtde."
                    value={item?.quantity ? String(item.quantity) : ""}
                    width={90}
                  />
                </FieldRow>
              );
            })}

            <SectionBar>Justificativa do(s) Procedimento(s) Solicitado(s)</SectionBar>
            <FieldRow>
              <FieldBox n="36" label="Descrição do Diagnóstico" value={props.descricaoDiagnostico} grow />
            </FieldRow>
            <FieldRow>
              <FieldBox n="37" label="CID 10 Principal" value={props.cidPrincipal} width={280} />
              <FieldBox n="38" label="CID 10 Secundário" value={props.cidSecundario} width={280} />
              <FieldBox n="39" label="CID 10 Causas Associadas" value={props.cidCausasAssociadas} grow />
            </FieldRow>
            <FieldRow>
              <FieldBox n="40" label="Observações" value={props.observacoes} grow />
            </FieldRow>

            <SectionBar>Solicitação</SectionBar>
            <FieldRow>
              <FieldBox
                n="41"
                label="Nome do Profissional Solicitante"
                value={props.profissionalSolicitante}
                grow
              />
              <FieldBoxDate
                n="42"
                label="Data da Solicitação"
                {...splitDate(props.dataSolicitacao)}
                width={190}
              />
            </FieldRow>
            <FieldRow>
              <FieldBox n="43" label="Documento" value={props.documentoSolicitanteTipo} width={140} />
              <FieldBox
                n="44"
                label="Nº Documento (CNS/CPF) do Profissional Solicitante"
                value={props.documentoSolicitanteNumero}
                grow
              />
              <FieldBox
                n="45"
                label="Assinatura e Carimbo (Nº Registro do Conselho)"
                value=""
                image={props.assinaturaSolicitante}
                grow
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
              <FieldBox n="52" label="Nº da Autorização (APAC)" value={props.numeroApac} width={220} />
            </FieldRow>
            <FieldRow>
              <FieldBox n="48" label="Documento" value={props.documentoAutorizadorTipo} width={140} />
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
              <FieldBox
                n="53"
                label="Período de Validade da APAC"
                value={
                  props.validadeInicio || props.validadeFim
                    ? `${props.validadeInicio || "__/__/____"} a ${props.validadeFim || "__/__/____"}`
                    : ""
                }
                width={320}
              />
            </FieldRow>

            <SectionBar>Identificação do Estabelecimento de Saúde (Executante)</SectionBar>
            <FieldRow>
              <FieldBox
                n="54"
                label="Nome Fantasia do Estabelecimento de Saúde Executante"
                value={props.estabelecimentoExecutante}
                grow
              />
              <FieldBox n="55" label="CNES" value={props.cnesExecutante} width={180} />
            </FieldRow>
          </div>
        </div>
      </div>
    </div>
  );
}
