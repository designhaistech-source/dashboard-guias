import * as React from "react";

import {
  FieldBox,
  FieldBoxDate,
  FieldRow,
  SectionBar,
  fmtDate,
} from "@/features/guides/components/guide-print-primitives";
import { councilCode } from "@/features/professional";
import { resolveTissTable } from "@/lib/tuss";
import guiasPlusLogo from "@/assets/guiasplus-logo.png.asset.json";

export interface SadtPreviewProcedure {
  code: string;
  description: string;
  quantity: number;
  table?: string;
}

export interface SadtPreviewOpmeItem {
  code?: string;
  description?: string;
  quantity?: number;
}

export interface SadtGuidePreviewProps {
  numeroGuia?: string;
  guideKind?: string | null;
  guideLabel?: string;
  guideHeaderTitle?: string;
  convenioId?: string;
  operadora?: string;
  operadoraLogo?: string;
  registroAns?: string;
  character?: string;
  dataSolicitacao?: string;
  susEstabelecimento?: string;
  susCnes?: string;
  pacienteNome?: string;
  pacienteCarteira?: string;
  pacienteCpf?: string;
  pacienteNascimento?: string;
  pacienteSexo?: string;
  medicoNome?: string;
  medicoCrm?: string;
  medicoConselho?: string;
  medicoEspecialidade?: string;
  cidPrincipal?: string;
  indicacaoClinica?: string;
  observacoes?: string;
  procedures?: SadtPreviewProcedure[];
  opmeItems?: SadtPreviewOpmeItem[];
  internacaoTipo?: string;
  internacaoRegime?: string;
  internacaoDias?: number;
  internacaoAcomodacao?: string;
  apacCompetencia?: string;
  apacTipo?: string;
  aihMotivo?: string;
  aihCaraterEntry?: string;
  guiaPrincipal?: string;
  dataAutorizacao?: string;
  senha?: string;
  validadeSenha?: string;
  guiaOperadora?: string;
  codigoSolicitante?: string;
  contratadoSolicitante?: string;
  conselhoUf?: string;
  codigoCbo?: string;
  codigoExecutante?: string;
  contratadoExecutante?: string;
  cnesExecutante?: string;
  tipoAtendimento?: string;
  indicacaoAcidente?: string;
  tipoConsulta?: string;
  motivoEncerramento?: string;
  pacienteValidadeCarteira?: string;
  pacienteCns?: string;
  pacienteRn?: string;
  assinaturaSolicitante?: string;
  totais?: string[];
  assinaturaAutorizacao?: string;
  assinaturaBeneficiarioFinal?: string;
  assinaturaContratado?: string;
  fullSize?: boolean;
}

export function SadtGuidePreview(input: SadtGuidePreviewProps) {
  const props = input as Required<SadtGuidePreviewProps>;

  const {
    numeroGuia, operadora, operadoraLogo,
    registroAns, character, dataSolicitacao,
    pacienteNome, pacienteCarteira, pacienteCpf,
    medicoNome, medicoCrm, medicoConselho, medicoEspecialidade, cidPrincipal, indicacaoClinica,
    observacoes, procedures, opmeItems,
    guiaPrincipal, dataAutorizacao, senha, validadeSenha, guiaOperadora,
    codigoSolicitante, contratadoSolicitante, conselhoUf, codigoCbo,
    codigoExecutante, contratadoExecutante, cnesExecutante,
    tipoAtendimento, indicacaoAcidente, tipoConsulta, motivoEncerramento,
    pacienteValidadeCarteira, pacienteCns, pacienteRn, assinaturaSolicitante,
    totais = [], assinaturaAutorizacao = "", assinaturaBeneficiarioFinal = "",
    assinaturaContratado = "",
  } = props;


  const dd = (iso: string) => {
    const f = fmtDate(iso);
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(f);
    return m ? { d: m[1], m: m[2], y: m[3] } : { d: "", m: "", y: "" };
  };

  const dataSol = dd(dataSolicitacao);
  const rows = Array.from({ length: 5 }, (_, i) => procedures[i]);
  const execRows = rows;
  const profRows = Array.from({ length: 4 }, () => null);

  const fullSize = props.fullSize;

  return (
    <div className={fullSize ? "" : "rounded-xl border bg-card shadow-sm overflow-hidden"}>
      {!fullSize && (
        <div className="px-4 py-2.5 border-b bg-muted/40 flex items-center justify-between">
          <p className="text-eyebrow">
            Pré-visualização · Modelo TISS SP/SADT
          </p>
          <span className="text-[10px] text-muted-foreground">Atualiza em tempo real</span>
        </div>
      )}

      <div className={fullSize ? "bg-muted p-4 overflow-auto" : "bg-muted p-2 overflow-hidden"}>
        <div
          className="origin-top-left"
          style={
            fullSize
              ? { width: 1100 }
              : { transform: "scale(0.4)", width: 1100, height: 820, transformOrigin: "top left" }
          }
        >

          <div className="w-[1100px] bg-surface text-foreground font-sans text-[9px] leading-tight border border-foreground">
            {/* Header */}
            <div className="grid grid-cols-[140px_1fr_260px] border-b border-foreground">
              <div className="flex items-center justify-center border-r border-foreground px-2 py-2">
                {operadoraLogo ? (
                  <img src={operadoraLogo} alt={operadora} className="max-h-10 max-w-[120px] object-contain" />
                ) : (
                  <img src={guiasPlusLogo.url} alt="Guias+" className="max-h-10 max-w-[120px] object-contain" />
                )}
              </div>
              <div className="flex items-center justify-center px-2 py-2 text-center">
                <div className="font-bold text-[13px] uppercase leading-tight">
                  Guia de Serviço Profissional / Serviço Auxiliar de<br />Diagnóstico e Terapia — SP/SADT
                </div>
              </div>
              <div className="border-l border-foreground px-2 py-1 flex flex-col justify-center">
                <div className="text-[8px] font-bold">2 - Nº Guia no Prestador</div>
                <div className="font-mono font-bold text-[11px] mt-0.5">{numeroGuia || "\u00A0"}</div>
              </div>
            </div>

            <FieldRow>
              <FieldBox n="1" label="Registro ANS" value={registroAns} width={140} />
              <FieldBox n="3" label="Número da Guia Principal" value={guiaPrincipal} grow />
            </FieldRow>

            <FieldRow>
              <FieldBoxDate n="4" label="Data da Autorização" {...dd(dataAutorizacao)} width={170} />
              <FieldBox n="5" label="Senha" value={senha} grow />
              <FieldBoxDate n="6" label="Data de Validade da Senha" {...dd(validadeSenha)} width={190} />
              <FieldBox n="7" label="Número da Guia Atribuído pela Operadora" value={guiaOperadora} width={280} />
            </FieldRow>

            <SectionBar>Dados do Beneficiário</SectionBar>
            <FieldRow>
              <FieldBox n="8" label="Número da Carteira" value={pacienteCarteira} width={230} />
              <FieldBoxDate n="9" label="Validade da Carteira" {...dd(pacienteValidadeCarteira)} width={170} />
              <FieldBox n="10" label="Nome" value={pacienteNome} grow />
              <FieldBox n="11" label="Cartão Nacional de Saúde" value={pacienteCns} width={200} />
              <FieldBox n="12" label="Atendimento a RN" value={pacienteRn === "S" ? "S" : "N"} width={118} />
            </FieldRow>

            <SectionBar>Dados do Solicitante</SectionBar>
            <FieldRow>
              <FieldBox n="13" label="Código na Operadora" value={codigoSolicitante} width={190} />
              <FieldBox n="14" label="Nome do Contratado" value={contratadoSolicitante || operadora} grow />
            </FieldRow>
            <FieldRow>
              <FieldBox n="15" label="Nome do Profissional Solicitante" value={medicoNome} grow />
              <FieldBox n="16" label="Conselho Profissional" value={medicoCrm ? councilCode(medicoConselho) : ""} width={90} />
              <FieldBox n="17" label="Número no Conselho" value={medicoCrm} width={140} />
              <FieldBox n="18" label="UF" value={conselhoUf} width={50} />
              <FieldBox n="19" label="Código CBO" value={codigoCbo} width={140} />
              <FieldBox n="20" label="Assinatura do Profissional Solicitante" value="" image={assinaturaSolicitante} width={220} />
            </FieldRow>


            <SectionBar>Dados da Solicitação / Procedimentos ou Itens Assistenciais Solicitados</SectionBar>
            <FieldRow>
              <FieldBox n="21" label="Caráter do Atendimento" value={character} width={140} />
              <FieldBoxDate n="22" label="Data da Solicitação" d={dataSol.d} m={dataSol.m} y={dataSol.y} width={180} />
              <FieldBox n="23" label="Indicação Clínica" value={`${cidPrincipal ? cidPrincipal + " · " : ""}${indicacaoClinica}`} grow />
            </FieldRow>

            <div className="border-b border-foreground">
              <div className="grid grid-cols-[38px_60px_140px_1fr_60px_60px] text-[8px] font-bold border-b border-foreground bg-surface-subtle">
                <div className="px-1 py-0.5 border-r border-foreground">&nbsp;</div>
                <div className="px-1 py-0.5 border-r border-foreground">24 - Tabela</div>
                <div className="px-1 py-0.5 border-r border-foreground">25 - Código do Procedimento ou Item Assistencial</div>
                <div className="px-1 py-0.5 border-r border-foreground">26 - Descrição</div>
                <div className="px-1 py-0.5 border-r border-foreground text-center">27 - Qtde. Solic.</div>
                <div className="px-1 py-0.5 text-center">28 - Qtde. Aut.</div>
              </div>
              {rows.map((p, i) => (
                <div key={i} className="grid grid-cols-[38px_60px_140px_1fr_60px_60px] text-[10px] border-b last:border-b-0 border-border min-h-[16px]">
                  <div className="px-1 py-0.5 border-r border-border font-mono">{i + 1} -</div>
                  <div className="px-1 py-0.5 border-r border-border font-mono">{p ? (p.table ?? resolveTissTable(p.code)) : ""}</div>
                  <div className="px-1 py-0.5 border-r border-border font-mono">{p?.code ?? ""}</div>
                  <div className="px-1 py-0.5 border-r border-border truncate">{p?.description ?? ""}</div>
                  <div className="px-1 py-0.5 border-r border-border text-center font-mono">{p?.quantity ?? ""}</div>
                  <div className="px-1 py-0.5 text-center font-mono">&nbsp;</div>
                </div>
              ))}
            </div>

            <SectionBar>Dados do Contratado Executante</SectionBar>
            <FieldRow>
              <FieldBox n="29" label="Código na Operadora" value={codigoExecutante} width={190} />
              <FieldBox n="30" label="Nome do Contratado" value={contratadoExecutante || operadora} grow />
              <FieldBox n="31" label="Código CNES" value={cnesExecutante} width={160} />
            </FieldRow>

            <SectionBar>Dados do Atendimento</SectionBar>
            <FieldRow>
              <FieldBox n="32" label="Tipo de Atendimento" value={tipoAtendimento} width={160} />
              <FieldBox n="33" label="Indicação de Acidente (acidente ou doença relacionada)" value={indicacaoAcidente} width={200} />
              <FieldBox n="34" label="Tipo de Consulta" value={tipoConsulta} width={140} />
              <FieldBox n="35" label="Motivo de Encerramento do Atendimento" value={motivoEncerramento} grow />
            </FieldRow>


            <SectionBar>Dados da Execução / Procedimentos e Exames Realizados</SectionBar>
            <div className="border-b border-foreground">
              <div className="grid grid-cols-[24px_80px_50px_50px_50px_70px_1fr_40px_40px_40px_60px_70px_70px] text-[8px] font-bold border-b border-foreground bg-surface-subtle">
                <div className="px-1 py-0.5 border-r border-foreground">&nbsp;</div>
                <div className="px-1 py-0.5 border-r border-foreground">36 - Data</div>
                <div className="px-1 py-0.5 border-r border-foreground">37 - Hora Inicial</div>
                <div className="px-1 py-0.5 border-r border-foreground">38 - Hora Final</div>
                <div className="px-1 py-0.5 border-r border-foreground text-center">39 - Tabela</div>
                <div className="px-1 py-0.5 border-r border-foreground">40 - Código do Procedimento</div>
                <div className="px-1 py-0.5 border-r border-foreground">41 - Descrição</div>
                <div className="px-1 py-0.5 border-r border-foreground text-center">42 - Qtde.</div>
                <div className="px-1 py-0.5 border-r border-foreground text-center">43 - Via</div>
                <div className="px-1 py-0.5 border-r border-foreground text-center">44 - Tec.</div>
                <div className="px-1 py-0.5 border-r border-foreground text-center">45 - Fator Red./Acresc.</div>
                <div className="px-1 py-0.5 border-r border-foreground text-center">46 - Valor Unitário (R$)</div>
                <div className="px-1 py-0.5 text-center">47 - Valor Total (R$)</div>
              </div>
              {execRows.map((p, i) => (
                <div key={i} className="grid grid-cols-[24px_80px_50px_50px_50px_70px_1fr_40px_40px_40px_60px_70px_70px] text-[10px] border-b last:border-b-0 border-border min-h-[16px]">
                  <div className="px-1 py-0.5 border-r border-border font-mono">{i + 1}-</div>
                  <div className="px-1 py-0.5 border-r border-border font-mono">{p ? fmtDate(dataSolicitacao) : ""}</div>
                  <div className="px-1 py-0.5 border-r border-border font-mono text-center"></div>
                  <div className="px-1 py-0.5 border-r border-border font-mono text-center"></div>

                  <div className="px-1 py-0.5 border-r border-border text-center font-mono">{p ? (p.table ?? resolveTissTable(p.code)) : ""}</div>
                  <div className="px-1 py-0.5 border-r border-border font-mono truncate">{p?.code ?? ""}</div>
                  <div className="px-1 py-0.5 border-r border-border truncate">{p?.description ?? ""}</div>
                  <div className="px-1 py-0.5 border-r border-border text-center font-mono">{p?.quantity ?? ""}</div>
                  <div className="px-1 py-0.5 border-r border-border"></div>
                  <div className="px-1 py-0.5 border-r border-border"></div>
                  <div className="px-1 py-0.5 border-r border-border"></div>
                  <div className="px-1 py-0.5 border-r border-border"></div>
                  <div className="px-1 py-0.5"></div>
                </div>
              ))}
            </div>

            <SectionBar>Identificação do(s) Profissional(is) Executante(s)</SectionBar>
            <div className="border-b border-foreground">
              <div className="grid grid-cols-[50px_60px_110px_1fr_90px_90px_40px_80px] text-[8px] font-bold border-b border-foreground bg-surface-subtle">
                <div className="px-1 py-0.5 border-r border-foreground">48 - Seq. Ref.</div>
                <div className="px-1 py-0.5 border-r border-foreground">49 - Grau Part.</div>
                <div className="px-1 py-0.5 border-r border-foreground">50 - Código na Operadora / CPF</div>
                <div className="px-1 py-0.5 border-r border-foreground">51 - Nome do Profissional</div>
                <div className="px-1 py-0.5 border-r border-foreground">52 - Conselho Profissional</div>
                <div className="px-1 py-0.5 border-r border-foreground">53 - Número no Conselho</div>
                <div className="px-1 py-0.5 border-r border-foreground">54 - UF</div>
                <div className="px-1 py-0.5">55 - Código CBO</div>
              </div>
              {profRows.map((_, i) => (
                <div key={i} className="grid grid-cols-[50px_60px_110px_1fr_90px_90px_40px_80px] text-[10px] border-b last:border-b-0 border-border min-h-[16px]">
                  <div className="px-1 py-0.5 border-r border-border"></div>
                  <div className="px-1 py-0.5 border-r border-border"></div>
                  <div className="px-1 py-0.5 border-r border-border"></div>
                  <div className="px-1 py-0.5 border-r border-border truncate">{i === 0 ? medicoNome : ""}</div>
                  <div className="px-1 py-0.5 border-r border-border font-mono">{i === 0 && medicoCrm ? councilCode(medicoConselho) : ""}</div>
                  <div className="px-1 py-0.5 border-r border-border font-mono">{i === 0 ? medicoCrm : ""}</div>
                  <div className="px-1 py-0.5 border-r border-border"></div>
                  <div className="px-1 py-0.5"></div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-[1fr_260px] border-b border-foreground">
              <div className="border-r border-foreground">
                <div className="px-1 py-0.5 text-[8px] font-bold bg-surface-subtle border-b border-border">
                  56 - Data de Realização de Procedimentos em Série
                </div>
                <div className="px-1 py-1 grid grid-cols-5 gap-1 text-[9px] font-mono">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i}>{i + 1}- __/__/____</div>
                  ))}
                </div>
              </div>
              <div>
                <div className="px-1 py-0.5 text-[8px] font-bold bg-surface-subtle border-b border-border">
                  57 - Assinatura do Beneficiário ou Responsável
                </div>
                <div className="h-10"></div>
              </div>
            </div>

            <div className="border-b border-foreground">
              <div className="px-1 py-0.5 text-[8px] font-bold bg-secondary">58 - Observação / Justificativa</div>
              <div className="px-1 py-1 min-h-[24px] text-[10px] whitespace-pre-wrap">{observacoes}</div>
            </div>

            <div className="grid grid-cols-7 border-b border-foreground text-[9px]">
              {[
                ["59", "Total de Procedimentos (R$)"],
                ["60", "Total de Taxas e Aluguéis (R$)"],
                ["61", "Total de Materiais (R$)"],
                ["62", "Total de OPME (R$)"],
                ["63", "Total de Medicamentos (R$)"],
                ["64", "Total de Gases Medicinais (R$)"],
                ["65", "Total Geral (R$)"],
              ].map(([n, l], i) => (
                <div key={n} className="border-r last:border-r-0 border-border-strong px-1 py-0.5">
                  <div className="text-[8px] font-bold">{n} - {l}</div>
                  <div className="font-mono text-right min-h-[12px]">{totais[i] ?? ""}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 text-[9px]">
              {[
                ["66 - Assinatura do Responsável pela Autorização", assinaturaAutorizacao],
                ["67 - Assinatura do Beneficiário ou Responsável", assinaturaBeneficiarioFinal],
                ["68 - Assinatura do Contratado", assinaturaContratado],
              ].map(([l, img]) => (
                <div key={l} className="border-r last:border-r-0 border-border-strong px-1 py-1">
                  <div className="text-[8px] font-bold">{l}</div>
                  <div className="h-8 flex items-end">
                    {img ? (
                      <img src={img} alt="" className="max-h-8 object-contain" />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
