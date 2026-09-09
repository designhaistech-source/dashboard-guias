/**
 * Tabela de UF do padrão TISS/ANS: código de 2 caracteres + nome da unidade
 * federativa. Na guia impressa apenas o código é preenchido (2 caracteres).
 */
export interface UfOption {
  code: string;
  name: string;
}

export const UF_TABLE: readonly UfOption[] = [
  { code: "11", name: "Rondônia" },
  { code: "12", name: "Acre" },
  { code: "13", name: "Amazonas" },
  { code: "14", name: "Roraima" },
  { code: "15", name: "Pará" },
  { code: "16", name: "Amapá" },
  { code: "17", name: "Tocantins" },
  { code: "21", name: "Maranhão" },
  { code: "22", name: "Piauí" },
  { code: "23", name: "Ceará" },
  { code: "24", name: "Rio Grande do Norte" },
  { code: "25", name: "Paraíba" },
  { code: "26", name: "Pernambuco" },
  { code: "27", name: "Alagoas" },
  { code: "28", name: "Sergipe" },
  { code: "29", name: "Bahia" },
  { code: "31", name: "Minas Gerais" },
  { code: "32", name: "Espírito Santo" },
  { code: "33", name: "Rio de Janeiro" },
  { code: "35", name: "São Paulo" },
  { code: "41", name: "Paraná" },
  { code: "42", name: "Santa Catarina" },
  { code: "43", name: "Rio Grande do Sul" },
  { code: "50", name: "Mato Grosso do Sul" },
  { code: "51", name: "Mato Grosso" },
  { code: "52", name: "Goiás" },
  { code: "53", name: "Distrito Federal" },
  { code: "98", name: "Países Estrangeiros" },
];

/** Opções para `SelectField`: valor é o código de 2 caracteres. */
export const UF_SELECT_OPTIONS = UF_TABLE.map((uf) => ({
  value: uf.code,
  label: `${uf.code} — ${uf.name}`,
}));
