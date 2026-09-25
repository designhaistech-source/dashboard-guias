/**
 * Solicitações de exame sintéticas (protótipo) usadas pela Recepção.
 * Datas relativas ao momento atual para que os períodos predefinidos
 * sempre tenham dados.
 */
export type AuthorizationStatus =
  | "pendente"
  | "aguardando"
  | "autorizada"
  | "negada"
  | "pendencia"
  | "realizada";

export const AUTHORIZATION_STATUS_LABEL: Record<AuthorizationStatus, string> = {
  pendente: "Pendente de autorização",
  aguardando: "Aguardando operadora",
  autorizada: "Autorizada",
  negada: "Não autorizada",
  pendencia: "Com pendência",
  realizada: "Realizada",
};

export const AUTHORIZATION_STATUS_ORDER: AuthorizationStatus[] = [
  "pendente",
  "aguardando",
  "autorizada",
  "negada",
  "pendencia",
  "realizada",
];

/** Situações que ainda dependem de ação da recepção ou retorno da operadora. */
export const ATTENTION_STATUSES: AuthorizationStatus[] = ["pendente", "aguardando", "pendencia"];

export interface AuthorizationRequest {
  id: string;
  patient: string;
  procedure: string;
  procedureCode: string;
  doctor: string;
  operadora: string;
  status: AuthorizationStatus;
  /** Quando o profissional enviou a solicitação (ISO). */
  receivedAt: string;
  /** Desde quando está na situação atual (ISO). */
  statusSince: string;
}

export const OPERADORAS = ["Unimed Natal", "Humana Saúde", "CAURN", "Hapvida"];
export const DOCTORS = ["Dr Fulano da Silva", "Dra. Ana Costa", "Dr. Ricardo Lima", "Dra. Beatriz Souza"];
export const PROCEDURES = [
  { code: "40901114", name: "Ultrassonografia de abdome total" },
  { code: "41101014", name: "Ressonância magnética de crânio" },
  { code: "40808041", name: "Mamografia digital bilateral" },
  { code: "41001109", name: "Tomografia de tórax" },
  { code: "40101010", name: "Eletrocardiograma" },
  { code: "40302040", name: "Hemograma completo" },
];
const PATIENTS = [
  "Ana Paula Ferreira", "Bruno Carvalho", "Carla Mendes", "Daniel Rocha", "Eduarda Nunes",
  "Felipe Araújo", "Gabriela Pinto", "Henrique Dias", "Isabela Moura", "João Vitor Alves",
  "Larissa Teixeira", "Marcos Batista", "Natália Freitas", "Otávio Ramos", "Patrícia Gomes",
  "Rafael Martins", "Sabrina Lopes", "Tiago Cunha", "Vanessa Barros", "William Correia",
];

const STATUS_CYCLE: AuthorizationStatus[] = [
  "pendente", "aguardando", "autorizada", "autorizada", "realizada", "pendencia",
  "aguardando", "negada", "autorizada", "pendente", "realizada", "autorizada",
];

const HOUR = 3_600_000;

function build(): AuthorizationRequest[] {
  // Arredondado à hora para que servidor e navegador gerem os mesmos dados.
  const now = Math.floor(Date.now() / HOUR) * HOUR;
  return Array.from({ length: 48 }, (_, i) => {
    const status = STATUS_CYCLE[i % STATUS_CYCLE.length];
    const proc = PROCEDURES[(i * 5) % PROCEDURES.length];
    // Espalha pelos últimos ~40 dias, com mais volume recente.
    const receivedHoursAgo = Math.round((i * i * 0.45 + i * 3 + 1) % (40 * 24));
    const received = now - receivedHoursAgo * HOUR;
    const inStatusHours = Math.max(1, Math.round(receivedHoursAgo * (0.3 + ((i * 7) % 6) / 10)));
    return {
      id: `SOL-${String(2400 + i).padStart(5, "0")}`,
      patient: PATIENTS[i % PATIENTS.length],
      procedure: proc.name,
      procedureCode: proc.code,
      doctor: DOCTORS[(i * 3) % DOCTORS.length],
      operadora: OPERADORAS[(i * 7) % OPERADORAS.length],
      status,
      receivedAt: new Date(received).toISOString(),
      statusSince: new Date(now - Math.min(inStatusHours, receivedHoursAgo) * HOUR).toISOString(),
    };
  });
}

export const AUTHORIZATION_REQUESTS = build();

/** "2h", "1 dia", "3 dias" — tempo desde a última mudança de situação. */
export function formatElapsed(iso: string, now = Date.now()): string {
  const hours = Math.max(0, Math.floor((now - new Date(iso).getTime()) / HOUR));
  if (hours < 1) return "menos de 1h";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "dia" : "dias"}`;
}

/**
 * Próxima ação operacional por situação atual. Ainda não executável: será
 * oferecida na página de detalhes da solicitação.
 */
export const NEXT_ACTION: Record<AuthorizationStatus, string> = {
  pendente: "Solicitar autorização",
  aguardando: "Registrar retorno",
  pendencia: "Resolver pendência",
  autorizada: "Registrar realização",
  negada: "Consultar retorno da operadora",
  realizada: "Somente acompanhamento",
};

/** Mais tempo na situação atual primeiro. */
export function byLongestWaiting(a: AuthorizationRequest, b: AuthorizationRequest) {
  return a.statusSince.localeCompare(b.statusSince);
}
