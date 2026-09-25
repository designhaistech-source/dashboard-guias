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

export interface TrackedRequest extends AuthorizationRequest {
  /** Funcionário da Recepção que assumiu; null enquanto ninguém assumiu. */
  assignee: string | null;
  history: HistoryEntry[];
}

export const SYSTEM_ACTOR = "Guias+ (automático)";
const RECEPTIONISTS = ["Maria Oliveira", "Juliana Castro"];
const STORAGE_KEY = "guiasplus:exam-requests";
const MIN = 60_000;

function seed(): TrackedRequest[] {
  return AUTHORIZATION_REQUESTS.map((r, i) => {
    const assignee = r.status === "pendente" && i % 2 === 0 ? null : RECEPTIONISTS[i % RECEPTIONISTS.length];
    const received = new Date(r.receivedAt).getTime();
    const since = new Date(r.statusSince).getTime();
    const history: HistoryEntry[] = [
      { at: r.receivedAt, stage: "Solicitação enviada", by: r.doctor },
      { at: new Date(received + MIN).toISOString(), stage: "Encaminhada para a Recepção", by: SYSTEM_ACTOR },
    ];
    if (assignee) {
      const assumedAt = r.status === "pendente" ? since : received + Math.max(2 * MIN, (since - received) / 3);
      history.push({ at: new Date(assumedAt).toISOString(), stage: "Assumida pela Recepção", by: assignee });
      if (r.status === "realizada") {
        history.push({
          at: new Date(assumedAt + (since - assumedAt) / 2).toISOString(),
          stage: AUTHORIZATION_STATUS_LABEL.autorizada,
          by: assignee,
        });
      }
      if (r.status !== "pendente") {
        history.push({ at: r.statusSince, stage: AUTHORIZATION_STATUS_LABEL[r.status], by: assignee });
      }
    }
    return { ...r, assignee, history };
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
      { at: new Date(at).toISOString(), stage: "Solicitação enviada", by: CURRENT_USER.name },
      { at: new Date(at).toISOString(), stage: "Encaminhada para a Recepção", by: SYSTEM_ACTOR },
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
};
