/**
 * Cadastro sintético de beneficiários usado para simular a consulta do
 * número da carteira (campo 8 da guia TISS). Em produção este dado viria
 * da elegibilidade da operadora.
 */
export interface Beneficiary {
  /** 8 - Número da Carteira (somente dígitos). */
  carteira: string;
  /** 10 - Nome do beneficiário. */
  nome: string;
  /** 11 - Cartão Nacional de Saúde, quando cadastrado. */
  cns?: string;
  /** 9 - Validade da Carteira (ISO), quando cadastrada. */
  validadeCarteira?: string;
  cpf?: string;
}

export const BENEFICIARIES: Beneficiary[] = [
  {
    carteira: "0001000200030004",
    nome: "Ana Beatriz Silva Rodrigues",
    cns: "708 4021 5566 0013",
    validadeCarteira: "2027-12-31",
    cpf: "123.456.789-00",
  },
  {
    carteira: "0002000300040005",
    nome: "Carlos Eduardo Mendes",
    cns: "702 3398 1120 0007",
    cpf: "234.567.890-11",
  },
  {
    carteira: "0003000400050006",
    nome: "Juliana Ferreira Costa",
    validadeCarteira: "2026-10-15",
    cpf: "345.678.901-22",
  },
  {
    carteira: "0004000500060007",
    nome: "Roberto Almeida Souza",
    cns: "701 5567 8890 0002",
    validadeCarteira: "2028-03-01",
    cpf: "456.789.012-33",
  },
  {
    carteira: "0005000600070008",
    nome: "Patrícia Oliveira Lima",
    cpf: "567.890.123-44",
  },
];

/** Remove máscara para comparar apenas dígitos. */
export function normalizeCarteira(value: string) {
  return value.replace(/\D/g, "");
}

/**
 * Consulta o beneficiário pelo número da carteira.
 * A latência simulada mantém os estados de carregamento visíveis na UI.
 */
export async function lookupBeneficiary(
  carteira: string,
): Promise<Beneficiary | null> {
  const digits = normalizeCarteira(carteira);
  await new Promise((resolve) => setTimeout(resolve, 450));
  if (digits.length < 8) return null;
  return (
    BENEFICIARIES.find((b) => normalizeCarteira(b.carteira) === digits) ?? null
  );
}
