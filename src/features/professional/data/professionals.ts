/** Cadastro sintético de profissionais reutilizado pelos formulários do sistema. */
export interface Professional {
  id: string;
  nome: string;
  /** Sigla do conselho profissional (CRM, CRO, ...). */
  conselho: string;
  /** Número do conselho com UF, ex.: "1234/RN". */
  numero: string;
  especialidade: string;
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

export const PROFESSIONALS: Professional[] = [
  {
    id: "m1",
    nome: "Dra. Ana Beatriz Lima",
    conselho: "CRM",
    numero: "1234/RN",
    especialidade: "Cardiologia",
  },
  {
    id: "m2",
    nome: "Dr. Carlos Eduardo Rocha",
    conselho: "CRM",
    numero: "4521/RN",
    especialidade: "Ortopedia",
  },
  {
    id: "m3",
    nome: "Dra. Mariana Torres",
    conselho: "CRM",
    numero: "7788/RN",
    especialidade: "Clínica médica",
  },
  {
    id: "m4",
    nome: "Dr. Rafael Nogueira",
    conselho: "CRM",
    numero: "9012/PB",
    especialidade: "Neurologia",
  },
];

/** Valor especial que libera o preenchimento manual. */
export const MANUAL_PROFESSIONAL_ID = "outro";
