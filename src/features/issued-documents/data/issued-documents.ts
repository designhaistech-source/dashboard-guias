/** Tipos de documento clínico emitidos pela página "Relatórios e documentos". */
export type IssuedDocumentType =
  | "Relatório"
  | "Atestado"
  | "Declaração de comparecimento";

export interface IssuedDocument {
  id: string;
  type: IssuedDocumentType;
  patient: string;
  /** Data/hora de emissão em ISO (usada no filtro por período). */
  issuedAt: string;
  /** Documento assinado digitalmente (ICP-Brasil) ou apenas emitido. */
  signed: boolean;
  /** Conteúdo do documento em HTML simples. */
  body: string;
}

/** Histórico fictício de documentos emitidos (dados sintéticos de protótipo). */
export const ISSUED_DOCUMENTS: IssuedDocument[] = [
  {
    id: "DOC-2026-0148",
    type: "Relatório",
    patient: "Ana Beatriz Silva Rodrigues",
    issuedAt: "2026-08-07T09:12:00",
    signed: true,
    body: "<p>Paciente Ana Beatriz Silva Rodrigues, avaliada em 07/08/2026, apresenta quadro compatível com cefaleia tensional (CID G44.2).</p><p>Exame físico sem alterações agudas. Mantida conduta ambulatorial com reavaliação em 30 dias.</p>",
  },
  {
    id: "DOC-2026-0147",
    type: "Atestado",
    patient: "Carlos Eduardo Mendes",
    issuedAt: "2026-08-06T15:40:00",
    signed: true,
    body: "<p>Atesto para os devidos fins que o(a) Sr.(a) Carlos Eduardo Mendes esteve sob cuidados médicos e necessita de afastamento de suas atividades pelo período de 3 dias, a partir de 06/08/2026. CID: J11.1.</p><p>Natal, 6 de agosto de 2026.</p>",
  },
  {
    id: "DOC-2026-0146",
    type: "Declaração de comparecimento",
    patient: "Juliana Ferreira Costa",
    issuedAt: "2026-08-06T11:05:00",
    signed: false,
    body: "<p>Declaro, para os devidos fins, que a Sr.ª Juliana Ferreira Costa compareceu a esta clínica no dia 06/08/2026.</p><p>A interessada esteve presente das 09:30 às 11:00.</p><p>Natal, 6 de agosto de 2026.</p>",
  },
  {
    id: "DOC-2026-0145",
    type: "Relatório",
    patient: "Roberto Almeida Souza",
    issuedAt: "2026-08-05T17:22:00",
    signed: false,
    body: "<p>Encaminho o paciente Roberto Almeida Souza para avaliação especializada em razão de hipertensão arterial de difícil controle (CID I10).</p><p>Solicito avaliação e conduta conforme necessidade.</p>",
  },
  {
    id: "DOC-2026-0144",
    type: "Atestado",
    patient: "Patrícia Oliveira Lima",
    issuedAt: "2026-08-04T08:58:00",
    signed: true,
    body: "<p>Atesto para os devidos fins que a Sr.ª Patrícia Oliveira Lima esteve sob cuidados médicos e necessita de afastamento de suas atividades pelo período de 1 dia, a partir de 04/08/2026.</p><p>Natal, 4 de agosto de 2026.</p>",
  },
  {
    id: "DOC-2026-0143",
    type: "Declaração de comparecimento",
    patient: "Fernando Batista Nogueira",
    issuedAt: "2026-08-03T14:31:00",
    signed: false,
    body: "<p>Declaro, para os devidos fins, que o Sr. Fernando Batista Nogueira compareceu a esta clínica no dia 03/08/2026.</p><p>O interessado esteve presente das 13:45 às 14:30.</p><p>Natal, 3 de agosto de 2026.</p>",
  },
  {
    id: "DOC-2026-0142",
    type: "Relatório",
    patient: "Mariana Santos Pereira",
    issuedAt: "2026-07-31T10:17:00",
    signed: true,
    body: "<p>Paciente Mariana Santos Pereira segue em acompanhamento regular desde o diagnóstico de asma persistente leve (CID J45.0).</p><p>Evolução estável, com boa adesão ao tratamento proposto.</p>",
  },
  {
    id: "DOC-2026-0141",
    type: "Atestado",
    patient: "Lucas Henrique Barbosa",
    issuedAt: "2026-07-29T16:49:00",
    signed: false,
    body: "<p>Atesto para os devidos fins que o Sr. Lucas Henrique Barbosa esteve sob cuidados médicos e necessita de afastamento de suas atividades pelo período de 5 dias, a partir de 29/07/2026. CID: S93.4.</p><p>Natal, 29 de julho de 2026.</p>",
  },
];

export const ISSUED_DOCUMENT_TYPES: IssuedDocumentType[] = [
  "Relatório",
  "Atestado",
  "Declaração de comparecimento",
];

/** Formata data/hora ISO no padrão brasileiro usado nas listagens. */
export function formatIssuedDocumentDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
