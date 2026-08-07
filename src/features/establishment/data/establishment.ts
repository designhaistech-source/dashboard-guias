/**
 * Cadastro sintético do estabelecimento de saúde do usuário (clínica,
 * consultório ou hospital). Alimenta os campos 13 e 14 da guia TISS, que não
 * são digitados durante a emissão: vêm do cadastro do sistema.
 */
export interface Establishment {
  /** Campo 14 — Nome do Contratado. */
  nome: string;
  cnes: string;
  cnpj: string;
  /**
   * Campo 13 — Código na Operadora. Cada operadora emite um código próprio
   * para o mesmo estabelecimento, por isso é indexado pela operadora.
   */
  codigosNaOperadora: Record<string, string>;
}

export const ESTABLISHMENT: Establishment = {
  nome: "Clínica HaisTech Saúde",
  cnes: "2654321",
  cnpj: "12.345.678/0001-90",
  codigosNaOperadora: {
    Humanas: "004512",
    Unimed: "118023",
    CAURN: "77310",
  },
};

/** Código do estabelecimento na operadora selecionada (campo 13). */
export function operatorEstablishmentCode(operadora: string): string {
  if (!operadora) return "";
  return ESTABLISHMENT.codigosNaOperadora[operadora] ?? "";
}
