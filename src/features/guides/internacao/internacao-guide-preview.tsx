import {
  FieldBox,
  FieldBoxDate,
  FieldRow,
  SectionBar,
  splitDate,
} from "@/features/guides/components/guide-print-primitives";

export interface InternacaoPreviewItem {
  table: string;
  code: string;
  description: string;
  requestedQty: number;
}

export interface InternacaoGuidePreviewProps {
  ans: string;
  guiaPrestador: string;
  guiaOperadora: string;
  dataAutorizacao: string;
  senha: string;
  validadeSenha: string;
  carteira: string;
  validadeCarteira: string;
  atendimentoRn: string;
  nomeBeneficiario: string;
  cns: string;
  /** 50 - Nome social do beneficiário (condicional). */
  nomeSocial?: string;
  codigoSolicitante: string;
  nomeContratado: string;
  nomeProfissional: string;
  conselho: string;
  numeroConselho: string;
  ufConselho: string;
  cbo: string;
  codigoHospital: string;
  nomeHospital: string;
  dataSugerida: string;
  carater: string;
  tipoInternacao: string;
  regimeInternacao: string;
  diariasSolicitadas: number;
  previsaoOpme: string;
  previsaoQuimio: string;
  indicacaoClinica: string;
  cid1: string;
  cid2: string;
  cid3: string;
  cid4: string;
  indicacaoAcidente: string;
  items: InternacaoPreviewItem[];
  dataAdmissao: string;
  diariasAutorizadas: string;
  acomodacaoAutorizada: string;
  codigoAutorizado: string;
  hospitalAutorizado: string;
  cnes: string;
  observacao: string;
  dataSolicitacao: string;
  assinaturaProfissional: string;
  assinaturaBeneficiario: string;
  assinaturaAutorizacao: string;
  /** Renderiza em tamanho real (dentro de um modal), sem moldura de card. */
  fullSize?: boolean;
}

/**
 * Pré-visualização da Guia de Solicitação de Internação (TISS Dez/2017),
 * com os quadros e a numeração 1 a 49 na ordem do formulário oficial.
 */
export function InternacaoGuidePreview(props: InternacaoGuidePreviewProps) {
  const rows = Array.from({ length: 6 }, (_, i) => props.items?.[i]);

  return (
    <div className={props.fullSize ? "" : "rounded-xl border bg-card shadow-sm overflow-hidden"}>
      {!props.fullSize && (
        <div className="px-4 py-2.5 border-b bg-muted/40 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Pré-visualização · Solicitação de Internação
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
            <div className="grid grid-cols-[140px_1fr_260px] border-b border-foreground">
              <div className="flex items-center justify-center border-r border-foreground px-2 py-2">
                <span className="text-[9px] text-muted-foreground italic">Logo da Operadora</span>
              </div>
              <div className="flex items-center justify-center px-2 py-2 text-center">
                <div className="font-bold text-[13px] uppercase leading-tight">
                  Guia de Solicitação de Internação
                </div>
              </div>
              <div className="border-l border-foreground px-2 py-1 flex flex-col justify-center">
                <div className="text-[8px] font-bold">2 - Nº Guia no Prestador</div>
                <div className="font-mono font-bold text-[11px] mt-0.5">
                  {props.guiaPrestador || "\u00A0"}
                </div>
              </div>
            </div>

            <FieldRow>
              <FieldBox n="1" label="Registro ANS" value={props.ans} width={140} />
              <FieldBox
                n="3"
                label="Número da Guia Atribuído pela Operadora"
                value={props.guiaOperadora}
                grow
              />
            </FieldRow>
            <FieldRow>
              <FieldBoxDate
                n="4"
                label="Data da Autorização"
                {...splitDate(props.dataAutorizacao)}
                width={190}
              />
              <FieldBox n="5" label="Senha" value={props.senha} grow />
              <FieldBoxDate
                n="6"
                label="Data de Validade da Senha"
                {...splitDate(props.validadeSenha)}
                width={220}
              />
            </FieldRow>

            <SectionBar>Dados do Beneficiário</SectionBar>
            <FieldRow>
              <FieldBox n="7" label="Número da Carteira" value={props.carteira} width={220} />
              <FieldBoxDate
                n="8"
                label="Validade da Carteira"
                {...splitDate(props.validadeCarteira)}
                width={180}
              />
              <FieldBox
                n="9"
                label="Atendimento a RN"
                value={props.atendimentoRn === "S" ? "Sim" : "Não"}
                width={110}
              />
              <FieldBox n="10" label="Nome" value={props.nomeBeneficiario} grow />
              <FieldBox n="11" label="Cartão Nacional de Saúde" value={props.cns} width={200} />
            </FieldRow>

            <SectionBar>Dados do Contratado Solicitante</SectionBar>
            <FieldRow>
              <FieldBox n="12" label="Código na Operadora" value={props.codigoSolicitante} width={200} />
              <FieldBox n="13" label="Nome do Contratado" value={props.nomeContratado} grow />
            </FieldRow>
            <FieldRow>
              <FieldBox n="14" label="Nome do Profissional Solicitante" value={props.nomeProfissional} grow />
              <FieldBox n="15" label="Conselho Profissional" value={props.conselho} width={110} />
              <FieldBox n="16" label="Número no Conselho" value={props.numeroConselho} width={150} />
              <FieldBox n="17" label="UF" value={props.ufConselho} width={50} />
              <FieldBox n="18" label="Código CBO" value={props.cbo} width={140} />
            </FieldRow>

            <SectionBar>Dados do Hospital / Local Solicitado e da Internação</SectionBar>
            <FieldRow>
              <FieldBox n="19" label="Código na Operadora" value={props.codigoHospital} width={200} />
              <FieldBox n="20" label="Nome do Hospital / Local Solicitado" value={props.nomeHospital} grow />
              <FieldBoxDate
                n="21"
                label="Data Sugerida para Internação"
                {...splitDate(props.dataSugerida)}
                width={200}
              />
            </FieldRow>
            <FieldRow>
              <FieldBox n="22" label="Caráter do Atendimento" value={props.carater} width={150} />
              <FieldBox n="23" label="Tipo de Internação" value={props.tipoInternacao} width={130} />
              <FieldBox n="24" label="Regime de Internação" value={props.regimeInternacao} width={140} />
              <FieldBox
                n="25"
                label="Qtde. de Diárias Solicitadas"
                value={String(props.diariasSolicitadas || "")}
                width={170}
              />
              <FieldBox
                n="26"
                label="Previsão de Uso de OPME"
                value={props.previsaoOpme === "S" ? "Sim" : "Não"}
                width={150}
              />
              <FieldBox
                n="27"
                label="Previsão de Uso de Quimioterápico"
                value={props.previsaoQuimio === "S" ? "Sim" : "Não"}
                grow
              />
            </FieldRow>
            <FieldRow>
              <FieldBox n="28" label="Indicação Clínica" value={props.indicacaoClinica} grow />
            </FieldRow>

            <SectionBar>Hipóteses Diagnósticas</SectionBar>
            <FieldRow>
              <FieldBox n="29" label="CID 10 Principal" value={props.cid1} width={200} />
              <FieldBox n="30" label="CID 10 (2)" value={props.cid2} width={200} />
              <FieldBox n="31" label="CID 10 (3)" value={props.cid3} width={200} />
              <FieldBox n="32" label="CID 10 (4)" value={props.cid4} width={200} />
              <FieldBox n="33" label="Indicação de Acidente" value={props.indicacaoAcidente} grow />
            </FieldRow>

            <SectionBar>Procedimentos ou Itens Assistenciais Solicitados</SectionBar>
            <div className="flex border-b border-foreground bg-secondary text-[8px] font-bold">
              <div className="w-[70px] border-r border-foreground px-1 py-0.5 text-center">34 - Tabela</div>
              <div className="w-[160px] border-r border-foreground px-1 py-0.5">35 - Código</div>
              <div className="flex-1 border-r border-foreground px-1 py-0.5">36 - Descrição</div>
              <div className="w-[110px] border-r border-foreground px-1 py-0.5 text-center">
                37 - Qtde. Solic.
              </div>
              <div className="w-[110px] px-1 py-0.5 text-center">38 - Qtde. Autoriz.</div>
            </div>
            {rows.map((item, index) => (
              <div key={index} className="flex border-b border-foreground">
                <div className="w-[70px] border-r border-foreground px-1 py-0.5 text-center font-mono min-h-[14px]">
                  {item?.table ?? ""}
                </div>
                <div className="w-[160px] border-r border-foreground px-1 py-0.5 font-mono min-h-[14px]">
                  {item?.code ?? ""}
                </div>
                <div className="flex-1 border-r border-foreground px-1 py-0.5 truncate min-h-[14px]">
                  {item?.description ?? ""}
                </div>
                <div className="w-[110px] border-r border-foreground px-1 py-0.5 text-center font-mono min-h-[14px]">
                  {item ? item.requestedQty : ""}
                </div>
                <div className="w-[110px] px-1 py-0.5 min-h-[14px]" />
              </div>
            ))}

            <SectionBar>Dados da Autorização</SectionBar>
            <FieldRow>
              <FieldBoxDate
                n="39"
                label="Data Provável da Admissão Hospitalar"
                {...splitDate(props.dataAdmissao)}
                width={240}
              />
              <FieldBox
                n="40"
                label="Qtde. de Diárias Autorizadas"
                value={props.diariasAutorizadas}
                width={190}
              />
              <FieldBox
                n="41"
                label="Tipo de Acomodação Autorizada"
                value={props.acomodacaoAutorizada}
                grow
              />
            </FieldRow>
            <FieldRow>
              <FieldBox n="42" label="Código na Operadora" value={props.codigoAutorizado} width={200} />
              <FieldBox n="43" label="Nome do Hospital / Local Autorizado" value={props.hospitalAutorizado} grow />
              <FieldBox n="44" label="Código CNES" value={props.cnes} width={160} />
            </FieldRow>

            <SectionBar>Observação e Assinaturas</SectionBar>
            <FieldRow>
              <FieldBox n="45" label="Observação / Justificativa" value={props.observacao} grow />
            </FieldRow>
            <FieldRow>
              <FieldBoxDate
                n="46"
                label="Data da Solicitação"
                {...splitDate(props.dataSolicitacao)}
                width={200}
              />
              <FieldBox
                n="47"
                label="Assinatura do Profissional Solicitante"
                value=""
                image={props.assinaturaProfissional}
                grow
              />
              <FieldBox
                n="48"
                label="Assinatura do Beneficiário ou Responsável"
                value=""
                image={props.assinaturaBeneficiario}
                grow
              />
              <FieldBox
                n="49"
                label="Assinatura do Responsável pela Autorização"
                value=""
                image={props.assinaturaAutorizacao}
                grow
              />
            </FieldRow>
          </div>
        </div>
      </div>
    </div>
  );
}
