/**
 * Nomenclatura canônica (curta) das etapas/seções da guia SP/SADT.
 *
 * Um único nome por seção é usado em todas as telas relacionadas:
 * cards do formulário (Emitir guia), pills de progresso ("Etapas preenchidas"),
 * detalhes da guia emitida (modal e PDF) e listagens.
 * Alterar um rótulo aqui propaga a mudança para todas as superfícies.
 */
export const SADT_SECTION_TITLES = {
  convenio: "Convênio",
  estabelecimento: "Estabelecimento (SUS)",
  beneficiario: "Beneficiário",
  solicitante: "Solicitante",
  solicitacao: "Solicitação",
  clinico: "Dados clínicos",
  procedimentos: "Procedimentos solicitados",
  atendimento: "Atendimento",
  execucao: "Execução",
  executante: "Profissional executante",
  observacao: "Observação",
  totais: "Totais",
} as const;

export type SadtSectionKey = keyof typeof SADT_SECTION_TITLES;

/** Título curto de uma seção da guia SP/SADT. */
export function sadtSectionTitle(key: SadtSectionKey): string {
  return SADT_SECTION_TITLES[key];
}
