/** Cadastro sintético de profissionais reutilizado pelos formulários do sistema. */
export interface Professional {
  id: string;
  nome: string;
  /** Sigla do conselho profissional (CRM, CRO, ...). */
  conselho: string;
  /** Campo 17 — número de registro no conselho (somente dígitos), ex.: "13955". */
  numero: string;
  especialidade: string;
  /** Campo 18 — UF do conselho profissional (tabela de domínio nº 59). */
  uf: string;
  /** Campo 19 — Código CBO (tabela de domínio nº 24), 6 dígitos. */
  cbo: string;
}

/**
 * Campo 16 da guia TISS (Conselho Profissional) — siglas da tabela de domínio
 * nº 26. Preenchimento obrigatório na guia SP/SADT.
 */
export const COUNCILS = [
  "CRM",
  "CRO",
  "CRF",
  "COREN",
  "CREFITO",
  "CRN",
  "CRP",
  "CRFa",
  "CRBM",
  "CRESS",
  "CREF",
  "CRBio",
  "CRTR",
  "Outros",
] as const;

/**
 * Códigos de 2 dígitos da tabela de domínio TISS nº 26 (campos 16 e 52).
 * O sistema exibe a sigla ao usuário e envia o código na guia.
 */
export const COUNCIL_CODES: Record<string, string> = {
  CRESS: "01",
  COREN: "02",
  CRF: "03",
  CREFONO: "04",
  CRFa: "04",
  CREFITO: "05",
  CRM: "06",
  CRN: "07",
  CRO: "08",
  CRP: "09",
  Outros: "10",
  CRBio: "11",
  CRBM: "12",
  CREF: "13",
  CRMV: "14",
  CRTR: "15",
};


/** Retorna o código de 2 dígitos do conselho (tabela 26) a partir da sigla. */
export function councilCode(sigla: string): string {
  return COUNCIL_CODES[sigla] ?? "";
}

export const PROFESSIONALS: Professional[] = [
  {
    id: "m1",
    nome: "Dra. Ana Beatriz Lima",
    conselho: "CRM",
    numero: "13955",
    especialidade: "Cardiologia",
    uf: "RN",
    cbo: "225120",
  },
  {
    id: "m2",
    nome: "Dr. Carlos Eduardo Rocha",
    conselho: "CRM",
    numero: "45217",
    especialidade: "Ortopedia",
    uf: "RN",
    cbo: "225270",
  },
  {
    id: "m3",
    nome: "Dra. Mariana Torres",
    conselho: "CRM",
    numero: "77881",
    especialidade: "Clínica médica",
    uf: "RN",
    cbo: "225125",
  },
  {
    id: "m4",
    nome: "Dr. Rafael Nogueira",
    conselho: "CRM",
    numero: "90124",
    especialidade: "Neurologia",
    uf: "PB",
    cbo: "225180",
  },
];

/** Valor especial que libera o preenchimento manual. */
export const MANUAL_PROFESSIONAL_ID = "outro";
