import { formatGuiaNumber } from "@/lib/guia-number";

export type IssuedGuideStatus =
  | "Emitida"
  | "Autorizada"
  | "Pendente"
  | "Cancelada";

export type IssuedGuideType =
  | "SP/SADT"
  | "Internação"
  | "APAC (SUS)"
  | "AIH (SUS)";

export interface IssuedGuideSection {
  title: string;
  items: { label: string; value: string }[];
}

export interface IssuedGuide {
  /** Campo 2 — Nº da guia no prestador, gerado pelo sistema. */
  numero: string;
  /** Data/hora de emissão em ISO (usada para filtro por período). */
  issuedAt: string;
  patient: string;
  operadora: string;
  type: IssuedGuideType;
  status: IssuedGuideStatus;
  /** Profissional solicitante responsável pela emissão. */
  professional: string;
  /** Procedimento principal informado na guia. */
  procedure: string;
  /** Valor total da guia (campo 65). */
  total: number;
  /** Conteúdo completo da guia gerada, agrupado por seção. */
  sections?: IssuedGuideSection[];
}

/** Histórico fictício de guias emitidas (dados sintéticos de protótipo). */
export const ISSUED_GUIDES: IssuedGuide[] = [
  {
    numero: formatGuiaNumber("Humanas", 128),
    issuedAt: "2026-08-06T14:32:00",
    patient: "Ana Beatriz Silva Rodrigues",
    operadora: "Humanas",
    type: "SP/SADT",
    status: "Autorizada",
    professional: "Dra. Marina Alves (CRM 13955/RN)",
    procedure: "40901114 — Ressonância magnética de crânio",
    total: 1280.5,
  },
  {
    numero: formatGuiaNumber("Unimed", 341),
    issuedAt: "2026-08-06T11:15:00",
    patient: "Carlos Eduardo Mendes",
    operadora: "Unimed Natal/RN",
    type: "SP/SADT",
    status: "Emitida",
    professional: "Dr. Rafael Lima (CRM 20871/RN)",
    procedure: "40304361 — Ultrassonografia de abdome total",
    total: 320,
  },
  {
    numero: formatGuiaNumber("CAURN", 57),
    issuedAt: "2026-08-05T16:44:00",
    patient: "Juliana Ferreira Costa",
    operadora: "CAURN",
    type: "Internação",
    status: "Pendente",
    professional: "Dra. Marina Alves (CRM 13955/RN)",
    procedure: "31003010 — Colecistectomia videolaparoscópica",
    total: 4890,
  },
  {
    numero: formatGuiaNumber("Humanas", 127),
    issuedAt: "2026-08-05T10:28:00",
    patient: "Roberto Almeida Souza",
    operadora: "Humanas",
    type: "SP/SADT",
    status: "Cancelada",
    professional: "Dr. Rafael Lima (CRM 20871/RN)",
    procedure: "40808010 — Hemograma completo",
    total: 48.9,
  },
  {
    numero: formatGuiaNumber("Unimed", 340),
    issuedAt: "2026-08-04T15:53:00",
    patient: "Patrícia Oliveira Lima",
    operadora: "Unimed Natal/RN",
    type: "APAC (SUS)",
    status: "Autorizada",
    professional: "Dra. Helena Duarte (CRM 30112/RN)",
    procedure: "0301070024 — Fisioterapia em transtornos motores",
    total: 210,
  },
  {
    numero: formatGuiaNumber("CAURN", 56),
    issuedAt: "2026-08-03T17:09:00",
    patient: "Fernando Batista Nogueira",
    operadora: "CAURN",
    type: "AIH (SUS)",
    status: "Emitida",
    professional: "Dra. Helena Duarte (CRM 30112/RN)",
    procedure: "0407040064 — Herniorrafia inguinal unilateral",
    total: 1560,
  },
  {
    numero: formatGuiaNumber("Humanas", 126),
    issuedAt: "2026-08-03T09:47:00",
    patient: "Mariana Santos Pereira",
    operadora: "Humanas",
    type: "SP/SADT",
    status: "Autorizada",
    professional: "Dra. Marina Alves (CRM 13955/RN)",
    procedure: "40302016 — Ecocardiograma transtorácico",
    total: 460,
  },
  {
    numero: formatGuiaNumber("Unimed", 339),
    issuedAt: "2026-07-31T19:12:00",
    patient: "Lucas Henrique Barbosa",
    operadora: "Unimed Natal/RN",
    type: "Internação",
    status: "Pendente",
    professional: "Dr. Rafael Lima (CRM 20871/RN)",
    procedure: "30731075 — Artroscopia de joelho",
    total: 7320,
  },
  {
    numero: formatGuiaNumber("CAURN", 55),
    issuedAt: "2026-07-30T08:20:00",
    patient: "Beatriz Nunes Carvalho",
    operadora: "CAURN",
    type: "SP/SADT",
    status: "Emitida",
    professional: "Dra. Helena Duarte (CRM 30112/RN)",
    procedure: "40901165 — Tomografia de tórax",
    total: 890,
  },
  {
    numero: formatGuiaNumber("Humanas", 125),
    issuedAt: "2026-07-29T13:05:00",
    patient: "Tiago Moreira Fontes",
    operadora: "Humanas",
    type: "APAC (SUS)",
    status: "Cancelada",
    professional: "Dra. Marina Alves (CRM 13955/RN)",
    procedure: "0304050024 — Quimioterapia paliativa",
    total: 2150,
  },
];

export const ISSUED_GUIDE_OPERADORAS = [
  "Humanas",
  "Unimed Natal/RN",
  "CAURN",
] as const;

/** Tipos de guia disponíveis no sistema (usados no filtro e na emissão). */
export const ISSUED_GUIDE_TYPES: IssuedGuideType[] = [
  "SP/SADT",
  "Internação",
  "APAC (SUS)",
  "AIH (SUS)",
];



export const ISSUED_GUIDE_STATUSES: IssuedGuideStatus[] = [
  "Emitida",
  "Autorizada",
  "Pendente",
  "Cancelada",
];

/** Formata data/hora ISO no padrão brasileiro usado nas listagens. */
export function formatIssuedAt(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
