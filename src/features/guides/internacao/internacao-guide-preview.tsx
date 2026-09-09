import {
  FieldBox,
  FieldBoxDate,
  FieldRow,
  SectionBar,
  splitDate,
} from "@/features/guides/components/guide-print-primitives";
import { A4_PORTRAIT_SHEET_WIDTH_PX } from "@/lib/guide-sheet";

export interface InternacaoPreviewItem {
  table: string;
  code: string;
  description: string;
  requestedQty: number;
}

export interface InternacaoGuidePreviewProps {
  /** URL da logo da operadora exibida no cabeçalho da guia. */
  operadoraLogo?: string;
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
 * Campos 29 a 32 aceitam no máximo 4 caracteres na guia: o ponto separador do
 * CID-10 é removido e o código é truncado (ex.: "I20.0" -> "I200").
 */
function cid4Chars(value: string) {
  return (value ?? "").replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase();
}

/** Linhas do quadro de procedimentos, numeradas 01 a 12 como no modelo oficial. */
const ITEM_ROWS = 12;

/**
 * Pré-visualização da Guia de Solicitação de Internação (TISS), em folha A4
 * retrato, reproduzindo a ordem e a distribuição dos campos 1 a 50 do modelo
 * oficial — inclusive quando a ordem numérica não é sequencial (50 antes de 10,
 * 33 ao lado dos CIDs).
 */
export function InternacaoGuidePreview(props: InternacaoGuidePreviewProps) {
  const rows = Array.from({ length: ITEM_ROWS }, (_, i) => props.items?.[i]);

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

      <div className={props.fullSize ? "bg-muted" : "bg-muted p-2 overflow-hidden"}>
        <div
          className="origin-top-left"
          style={
            props.fullSize
              ? { width: A4_PORTRAIT_SHEET_WIDTH_PX }
              : {
                  transform: "scale(0.4)",
                  width: A4_PORTRAIT_SHEET_WIDTH_PX,
                  height: 1120,
                  transformOrigin: "top left",
                }
          }
        >
          <div
            className="bg-surface text-foreground font-sans text-[9px] leading-tight border border-foreground"
            style={{ width: A4_PORTRAIT_SHEET_WIDTH_PX }}
          >
            {/* Cabeçalho: logo · título · campo 2 */}
            <div className="grid grid-cols-[130px_1fr_230px] border-b border-foreground">
              <div className="flex items-center justify-center border-r border-foreground px-2 py-2">
                {props.operadoraLogo ? (
                  <img
                    src={props.operadoraLogo}
                    alt="Logo da operadora"
                    className="max-h-10 w-auto max-w-full object-contain"
                  />
                ) : (
                  <span className="text-[9px] text-muted-foreground italic">Logo da Operadora</span>
                )}
              </div>
              <div className="flex items-center justify-center px-2 py-2 text-center">
                <div className="font-bold text-[12px] uppercase leading-tight">
                  Guia de Solicitação de Internação
                </div>
              </div>
              <div className="border-l border-foreground px-2 py-1 flex flex-col justify-center">
                <div className="text-[8px] font-bold">2 - Nº Guia no Prestador</div>
                <div className="font-mono font-bold text-[11px] mt-0.5 truncate">
                  {props.guiaPrestador || "\u00A0"}
                </div>
              </div>
            </div>

            {/* Campos 1 a 6 */}
            <FieldRow>
              <FieldBox n="1" label="Registro ANS" value={props.ans} width={190} />
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
                width={190}
              />
            </FieldRow>

            <SectionBar>Dados do Beneficiário</SectionBar>
            <FieldRow>
              <FieldBox n="7" label="Número da Carteira" value={props.carteira} grow />
              <FieldBoxDate
                n="8"
                label="Validade da Carteira"
                {...splitDate(props.validadeCarteira)}
                width={180}
              />
              <FieldBox n="9" label="Atendimento a RN" value={props.atendimentoRn} width={110} />
            </FieldRow>
            <FieldRow>
              <FieldBox n="50" label="Nome Social" value={props.nomeSocial ?? ""} grow minHeight={22} />
            </FieldRow>
            <FieldRow>
              <FieldBox n="10" label="Nome" value={props.nomeBeneficiario} grow minHeight={22} />
              <FieldBox
                n="11"
                label="Cartão Nacional de Saúde"
                value={props.cns}
                width={230}
                minHeight={22}
              />
            </FieldRow>

            <SectionBar>Dados do Contratado Solicitante</SectionBar>
            <FieldRow>
              <FieldBox n="12" label="Código do Contratado" value={props.codigoSolicitante} width={250} />
              <FieldBox n="13" label="Nome do Contratado" value={props.nomeContratado} grow />
            </FieldRow>
            <FieldRow>
              <FieldBox
                n="14"
                label="Nome do Profissional Solicitante"
                value={props.nomeProfissional}
                grow
              />
              <FieldBox n="15" label="Conselho Profissional" value={props.conselho} width={92} />
              <FieldBox n="16" label="Número no Conselho" value={props.numeroConselho} width={130} />
              <FieldBox n="17" label="UF" value={props.ufConselho} width={44} />
              <FieldBox n="18" label="Código CBO" value={props.cbo} width={86} />
            </FieldRow>

            <SectionBar>Dados do Hospital / Local Solicitado / Dados da Internação</SectionBar>
            <FieldRow>
              <FieldBox
                n="19"
                label="Código na Operadora / CNPJ"
                value={props.codigoHospital}
                width={230}
              />
              <FieldBox n="20" label="Nome do Hospital / Local Solicitado" value={props.nomeHospital} grow />
              <FieldBoxDate
                n="21"
                label="Data sugerida para internação"
                {...splitDate(props.dataSugerida)}
                width={180}
              />
            </FieldRow>
            <FieldRow>
              <FieldBox n="22" label="Caráter do Atendimento" value={props.carater} width={132} />
              <FieldBox n="23" label="Tipo de Internação" value={props.tipoInternacao} width={116} />
              <FieldBox n="24" label="Regime de Internação" value={props.regimeInternacao} width={124} />
              <FieldBox
                n="25"
                label="Qtde. Diárias Solicitadas"
                value={String(props.diariasSolicitadas || "")}
                width={130}
              />
              <FieldBox n="26" label="Previsão de uso de OPME" value={props.previsaoOpme} width={132} />
              <FieldBox
                n="27"
                label="Previsão de uso de quimioterápico"
                value={props.previsaoQuimio}
                grow
              />
            </FieldRow>

            {/* 28 - Indicação clínica: bloco alto, como no modelo impresso */}
            <FieldRow>
              <FieldBox
                n="28"
                label="Indicação Clínica"
                value={props.indicacaoClinica}
                grow
                minHeight={150}
                wrap
              />
            </FieldRow>

            {/* CIDs e indicação de acidente na mesma linha, conforme o modelo */}
            <FieldRow>
              <FieldBox n="29" label="CID 10 Principal" value={cid4Chars(props.cid1)} width={132} />
              <FieldBox n="30" label="CID 10 (2)" value={cid4Chars(props.cid2)} width={116} />
              <FieldBox n="31" label="CID 10 (3)" value={cid4Chars(props.cid3)} width={116} />
              <FieldBox n="32" label="CID 10 (4)" value={cid4Chars(props.cid4)} width={116} />
              <FieldBox
                n="33"
                label="Indicação de Acidente (acidente ou doença relacionada)"
                value={props.indicacaoAcidente}
                grow
              />
            </FieldRow>

            <SectionBar>Procedimentos ou Itens Assistenciais Solicitados</SectionBar>
            <div className="flex border-b border-foreground bg-secondary text-[8px] font-bold">
              <div className="w-[26px] border-r border-foreground px-1 py-0.5" />
              <div className="w-[62px] border-r border-foreground px-1 py-0.5 text-center">34 - Tabela</div>
              <div className="w-[128px] border-r border-foreground px-1 py-0.5">
                35 - Código do Procedimento ou Item Assistencial
              </div>
              <div className="flex-1 border-r border-foreground px-1 py-0.5">36 - Descrição</div>
              <div className="w-[86px] border-r border-foreground px-1 py-0.5 text-center">
                37 - Qtde Solic
              </div>
              <div className="w-[86px] px-1 py-0.5 text-center">38 - Qtde Aut</div>
            </div>
            {rows.map((item, index) => (
              <div key={index} className="flex border-b border-foreground">
                <div className="w-[26px] border-r border-foreground px-1 py-0.5 text-center font-mono text-[8px]">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="w-[62px] border-r border-foreground px-1 py-0.5 text-center font-mono min-h-[14px]">
                  {item?.table ?? ""}
                </div>
                <div className="w-[128px] border-r border-foreground px-1 py-0.5 font-mono min-h-[14px] truncate">
                  {item?.code ?? ""}
                </div>
                <div className="flex-1 border-r border-foreground px-1 py-0.5 truncate min-h-[14px]">
                  {item?.description ?? ""}
                </div>
                <div className="w-[86px] border-r border-foreground px-1 py-0.5 text-center font-mono min-h-[14px]">
                  {item ? item.requestedQty : ""}
                </div>
                <div className="w-[86px] px-1 py-0.5 min-h-[14px]" />
              </div>
            ))}

            <SectionBar>Dados da Autorização</SectionBar>
            <FieldRow>
              <FieldBoxDate
                n="39"
                label="Data Provável da Admissão Hospitalar"
                {...splitDate(props.dataAdmissao)}
                width={250}
              />
              <FieldBox
                n="40"
                label="Qtde. Diárias Autorizadas"
                value={props.diariasAutorizadas}
                width={170}
              />
              <FieldBox
                n="41"
                label="Tipo da Acomodação Autorizada"
                value={props.acomodacaoAutorizada}
                grow
              />
            </FieldRow>
            <FieldRow>
              <FieldBox
                n="42"
                label="Código na Operadora / CNPJ autorizado"
                value={props.codigoAutorizado}
                width={250}
              />
              <FieldBox
                n="43"
                label="Nome do Hospital / Local Autorizado"
                value={props.hospitalAutorizado}
                grow
              />
              <FieldBox n="44" label="Código CNES" value={props.cnes} width={140} />
            </FieldRow>

            <FieldRow>
              <FieldBox
                n="45"
                label="Observação / Justificativa"
                value={props.observacao}
                grow
                minHeight={56}
                wrap
              />
            </FieldRow>

            <FieldRow>
              <FieldBoxDate
                n="46"
                label="Data da Solicitação"
                {...splitDate(props.dataSolicitacao)}
                width={170}
              />
              <FieldBox
                n="47"
                label="Assinatura do Profissional Solicitante"
                value=""
                image={props.assinaturaProfissional}
                grow
                minHeight={34}
              />
              <FieldBox
                n="48"
                label="Assinatura do Beneficiário ou Responsável"
                value=""
                image={props.assinaturaBeneficiario}
                grow
                minHeight={34}
              />
              <FieldBox
                n="49"
                label="Assinatura do Responsável pela Autorização"
                value=""
                image={props.assinaturaAutorizacao}
                grow
                minHeight={34}
              />
            </FieldRow>
          </div>
        </div>
      </div>
    </div>
  );
}
