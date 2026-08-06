/** Cadastro sintético de profissionais reutilizado pelos formulários do sistema. */
export interface Professional {
  id: string;
  nome: string;
  /** Sigla do conselho profissional (CRM, CRO, ...). */
  conselho: string;
  /** Campo 17 — número de registro no conselho (somente dígitos), ex.: "13955". */
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
    numero: "13955",
    especialidade: "Cardiologia",
  },
  {
    id: "m2",
    nome: "Dr. Carlos Eduardo Rocha",
    conselho: "CRM",
    numero: "45217",
    especialidade: "Ortopedia",
  },
  {
    id: "m3",
    nome: "Dra. Mariana Torres",
    conselho: "CRM",
    numero: "77881",
    especialidade: "Clínica médica",
  },
  {
    id: "m4",
    nome: "Dr. Rafael Nogueira",
    conselho: "CRM",
    numero: "90124",
    especialidade: "Neurologia",
  },
];

/** Valor especial que libera o preenchimento manual. */
export const MANUAL_PROFESSIONAL_ID = "outro";
