import { useSyncExternalStore } from "react";
import { CURRENT_USER } from "@/lib/current-user";
import {
  AUTHORIZATION_REQUESTS,
  AUTHORIZATION_STATUS_LABEL,
  PROCEDURES,
  type AuthorizationRequest,
  type AuthorizationStatus,
} from "./authorization-requests";

/**
 * Protótipo: fonte única das solicitações de exame compartilhada entre
 * Profissional de saúde (acompanha) e Recepção (gerencia). Persistida no
 * navegador para que a troca de perfil reflita as mudanças.
 */
export interface HistoryEntry {
  at: string;
  stage: string;
  by: string;
  note?: string;
}

/** Dados registrados ao solicitar a autorização à operadora. */
export interface AuthorizationData {
  /** yyyy-MM-dd */
  requestedAt: string;
  protocol?: string;
  notes?: string;
}

export type OperatorResult = "autorizada" | "negada" | "pendencia";

/** Retorno da operadora registrado pela Recepção. */
export interface OperatorResponse {
  result: OperatorResult;
  number?: string;
  /** yyyy-MM-dd */
  date?: string;
  validity?: string;
  reason?: string;
  notes?: string;
  registeredAt: string;
  registeredBy: string;
}

export interface ExecutionData {
  /** yyyy-MM-dd */
  date: string;
  notes?: string;
  registeredBy: string;
}

export interface TrackedRequest extends AuthorizationRequest {
  /** Funcionário da Recepção que assumiu; null enquanto ninguém assumiu. */
  assignee: string | null;
  history: HistoryEntry[];
  authorization?: AuthorizationData;
  response?: OperatorResponse;
  execution?: ExecutionData;
}

export const SYSTEM_ACTOR = "Guias+ (automático)";
const RECEPTIONISTS = ["Maria Oliveira", "Juliana Castro"];
// v2: inclui dados de autorização, retorno e realização.
const STORAGE_KEY = "guiasplus:exam-requests:v2";
const MIN = 60_000;
const DAY = 24 * 60 * MIN;

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const clean = (v?: string) => v?.trim() || undefined;
const recep = (name: string) => `${name} — Recepção`;

function seed(): TrackedRequest[] {
  return AUTHORIZATION_REQUESTS.map((r, i) => {
    const assignee = r.status === "pendente" && i % 2 === 0 ? null : RECEPTIONISTS[i % RECEPTIONISTS.length];
    const received = new Date(r.receivedAt).getTime();
    const since = new Date(r.statusSince).getTime();
    const history: HistoryEntry[] = [
      { at: r.receivedAt, stage: "Solicitação recebida", by: `${r.doctor} — Profissional de saúde` },
    ];
    let authorization: AuthorizationData | undefined;
    let response: OperatorResponse | undefined;
    let execution: ExecutionData | undefined;
    if (r.status !== "pendente" && assignee) {
      const askedAt = received + Math.max(2 * MIN, (since - received) / 3);
      authorization = { requestedAt: isoDay(askedAt), protocol: `PRT-${String(880000 + i * 37)}` };
      history.push({ at: new Date(askedAt).toISOString(), stage: "Autorização solicitada", by: recep(assignee) });
      if (r.status !== "aguardando") {
        const respAt = r.status === "realizada" ? askedAt + (since - askedAt) / 2 : since;
        const result: OperatorResult = r.status === "realizada" ? "autorizada" : (r.status as OperatorResult);
        response = {
          result,
          registeredAt: new Date(respAt).toISOString(),
          registeredBy: recep(assignee),
          ...(result === "autorizada"
            ? { number: `AUT-${String(550000 + i * 13)}`, date: isoDay(respAt), validity: isoDay(respAt + 30 * DAY) }
            : result === "pendencia"
              ? { reason: "Operadora solicitou relatório médico complementar." }
              : { reason: "Procedimento fora da cobertura contratual." }),
        };
        history.push({
          at: response.registeredAt,
          stage: `Retorno da operadora: ${AUTHORIZATION_STATUS_LABEL[result]}`,
          by: recep(assignee),
          note: response.number ? `Autorização nº ${response.number}` : response.reason,
        });
        if (r.status === "realizada") {
          execution = { date: isoDay(since), registeredBy: recep(assignee) };
          history.push({ at: r.statusSince, stage: "Realização registrada", by: recep(assignee) });
        }
      }
    }
    return { ...r, assignee, history, authorization, response, execution };
  });
}


const SEED = seed();
let current: TrackedRequest[] = SEED;
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) current = JSON.parse(saved) as TrackedRequest[];
  } catch {
    current = SEED;
  }
}

function commit(next: TrackedRequest[]) {
  current = next;
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  hydrate();
  listeners.add(listener);
  listener();
  return () => listeners.delete(listener);
}

export function useExamRequests(): TrackedRequest[] {
  return useSyncExternalStore(subscribe, () => current, () => SEED);
}

export function useExamRequest(id: string): TrackedRequest | undefined {
  return useExamRequests().find((r) => r.id === id);
}

function update(id: string, fn: (r: TrackedRequest) => TrackedRequest) {
  hydrate();
  commit(current.map((r) => (r.id === id ? fn(r) : r)));
}

export function assignRequest(id: string, by: string) {
  const at = new Date().toISOString();
  update(id, (r) => ({
    ...r,
    assignee: by,
    history: [...r.history, { at, stage: r.assignee ? `Responsabilidade transferida de ${r.assignee}` : "Assumida pela Recepção", by }],
  }));
}

export function updateRequestStatus(id: string, status: AuthorizationStatus, by: string, note?: string) {
  const at = new Date().toISOString();
  update(id, (r) => ({
    ...r,
    status,
    statusSince: at,
    history: [...r.history, { at, stage: AUTHORIZATION_STATUS_LABEL[status], by, note: note?.trim() || undefined }],
  }));
}

/** Actor as recorded in history: "Maria Oliveira — Recepção". */
export interface Actor {
  name: string;
  roleLabel: string;
}
const label = (a: Actor) => `${a.name} — ${a.roleLabel}`;

function transition(
  id: string,
  from: AuthorizationStatus,
  to: AuthorizationStatus,
  actor: Actor,
  patch: (r: TrackedRequest, at: string) => Partial<TrackedRequest>,
  entries: (r: TrackedRequest, at: string) => HistoryEntry[],
): boolean {
  hydrate();
  const target = current.find((r) => r.id === id);
  // Guards against stale screens acting on a request that already moved on.
  if (!target || target.status !== from) return false;
  const at = new Date().toISOString();
  update(id, (r) => ({
    ...r,
    ...patch(r, at),
    status: to,
    statusSince: at,
    assignee: actor.name,
    history: [...r.history, ...entries(r, at)],
  }));
  return true;
}

export function requestAuthorization(id: string, data: AuthorizationData, actor: Actor) {
  const authorization = { requestedAt: data.requestedAt, protocol: clean(data.protocol), notes: clean(data.notes) };
  return transition(id, "pendente", "aguardando", actor, () => ({ authorization }), (_r, at) => [
    {
      at,
      stage: "Autorização solicitada",
      by: label(actor),
      note: [authorization.protocol && `Protocolo ${authorization.protocol}`, authorization.notes].filter(Boolean).join(" · ") || undefined,
    },
  ]);
}

export function registerOperatorResponse(
  id: string,
  data: Omit<OperatorResponse, "registeredAt" | "registeredBy">,
  actor: Actor,
) {
  return transition(
    id,
    "aguardando",
    data.result,
    actor,
    (_r, at) => ({
      response: {
        result: data.result,
        number: clean(data.number),
        date: data.date,
        validity: clean(data.validity),
        reason: clean(data.reason),
        notes: clean(data.notes),
        registeredAt: at,
        registeredBy: label(actor),
      },
    }),
    (r, at) => {
      const detail = data.result === "autorizada" ? `Autorização nº ${data.number?.trim()}` : clean(data.reason);
      const entries: HistoryEntry[] = [
        {
          at,
          stage: `Retorno da operadora: ${AUTHORIZATION_STATUS_LABEL[data.result]}`,
          by: label(actor),
          note: [detail, clean(data.notes)].filter(Boolean).join(" · ") || undefined,
        },
      ];
      if (data.result === "autorizada") {
        entries.push({
          at,
          stage: "Confirmação enviada ao profissional solicitante",
          by: SYSTEM_ACTOR,
          note: `${r.procedure} de ${r.patient} autorizado pela ${r.operadora} (nº ${data.number?.trim()}). Registrado por ${label(actor)}.`,
        });
      }
      return entries;
    },
  );
}

export function registerExecution(id: string, data: { date: string; notes?: string }, actor: Actor) {
  return transition(
    id,
    "autorizada",
    "realizada",
    actor,
    () => ({ execution: { date: data.date, notes: clean(data.notes), registeredBy: label(actor) } }),
    (_r, at) => [{ at, stage: "Realização registrada", by: label(actor), note: clean(data.notes) }],
  );
}

/** First billing step only; AI validation and sending to the operator come later. */
export function prepareBilling(id: string, notes: string | undefined, actor: Actor) {
  return transition(id, "realizada", "faturar", actor, () => ({}), (_r, at) => [
    { at, stage: "Faturamento preparado", by: label(actor), note: clean(notes) },
  ]);
}

/** Fluxo provisório: a resolução por tipo de pendência será definida depois. */
export function resolveIssue(id: string, notes: string, actor: Actor) {
  return transition(id, "pendencia", "aguardando", actor, () => ({}), (_r, at) => [
    { at, stage: "Pendência resolvida e reenviada à operadora", by: label(actor), note: clean(notes) },
  ]);
}

/** Records a follow-up with the operator; status stays "aguardando". */
export function chargeOperator(id: string, actor: Actor) {
  hydrate();
  const target = current.find((r) => r.id === id);
  if (!target || target.status !== "aguardando") return false;
  const at = new Date().toISOString();
  update(id, (r) => ({ ...r, history: [...r.history, { at, stage: "Operadora cobrada", by: label(actor) }] }));
  return true;
}

/** Cria a solicitação a partir de uma guia de Solicitação de exame processada. */
export function submitExamRequest(input: { patient: string }): TrackedRequest {
  hydrate();
  const at = Date.now();
  const nextNumber = Math.max(...current.map((r) => Number(r.id.slice(4)) || 0)) + 1;
  const proc = PROCEDURES[nextNumber % PROCEDURES.length];
  const request: TrackedRequest = {
    id: `SOL-${String(nextNumber).padStart(5, "0")}`,
    patient: input.patient,
    procedure: proc.name,
    procedureCode: proc.code,
    doctor: CURRENT_USER.name,
    operadora: "Unimed Natal",
    status: "pendente",
    receivedAt: new Date(at).toISOString(),
    statusSince: new Date(at).toISOString(),
    assignee: null,
    history: [
      { at: new Date(at).toISOString(), stage: "Solicitação recebida", by: `${CURRENT_USER.name} — Profissional de saúde` },
    ],
  };
  commit([request, ...current]);
  return request;
}

/** Status simplificado exibido ao Profissional de saúde. */
export const TRACKING_STATUS_LABEL: Record<AuthorizationStatus, string> = {
  pendente: "Aguardando recepção",
  aguardando: "Aguardando operadora",
  autorizada: "Autorizada",
  pendencia: "Pendente",
  negada: "Negada",
  realizada: "Realizada",
  // Billing is internal to the reception; the professional still sees the exam as done.
  faturar: "Realizada",
};
