import { AlarmClock, AlertTriangle, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { byLongestWaiting, formatElapsed, type AuthorizationStatus } from "../data/authorization-requests";
import type { TrackedRequest } from "../data/requests-store";

type Lane = { id: string; label: string; statuses: AuthorizationStatus[]; tone: string };

// Requests with an issue stay in the operator lane, flagged on the card.
export const FLOW_LANES: Lane[] = [
  { id: "pendente", label: "Para autorizar", statuses: ["pendente"], tone: "bg-warning-muted text-warning-strong" },
  { id: "aguardando", label: "Aguardando operadora", statuses: ["aguardando", "pendencia"], tone: "bg-info/15 text-info" },
  { id: "autorizada", label: "Autorizados", statuses: ["autorizada"], tone: "bg-success/15 text-success" },
  { id: "realizada", label: "Realizados", statuses: ["realizada"], tone: "bg-muted text-foreground" },
];

export const laneIdOf = (status: AuthorizationStatus) => FLOW_LANES.find((l) => l.statuses.includes(status))?.id;

// Prototype-only sample threshold; not a system rule.
const SAMPLE_OVERDUE_MS = 3 * 24 * 60 * 60 * 1000;

export function RequestsFlow({ rows, onOpen }: { rows: TrackedRequest[]; onOpen: (r: TrackedRequest) => void }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <div className="grid min-w-max grid-flow-col auto-cols-[minmax(13rem,1fr)] gap-3 lg:min-w-0">
        {FLOW_LANES.map((lane, index) => {
          const items = rows.filter((r) => lane.statuses.includes(r.status)).sort(byLongestWaiting);
          const headingId = `lane-${lane.id}`;
          return (
            <section
              key={lane.id}
              id={`raia-${lane.id}`}
              aria-labelledby={headingId}
              className="relative flex scroll-mt-6 flex-col rounded-2xl border border-border bg-muted/40"
            >
              <header className={cn("flex items-center justify-between gap-2 rounded-t-2xl px-4 py-3", lane.tone)}>
                <h2 id={headingId} className="text-sm font-semibold">{lane.label}</h2>
                <span className="rounded-md bg-card px-2 py-0.5 font-mono text-xs font-semibold tabular-nums text-foreground" aria-label={`${items.length} solicitações`}>
                  {items.length}
                </span>
              </header>
              {index < FLOW_LANES.length - 1 && (
                <ChevronRight
                  className="pointer-events-none absolute -right-3 top-3 z-10 h-5 w-3 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
              {items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhuma solicitação nesta etapa.</p>
              ) : (
                <ul className="flex flex-col gap-2 p-3">
                  {items.map((r) => (
                    <li key={r.id}>
                      <FlowCard request={r} onOpen={() => onOpen(r)} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function FlowCard({ request: r, onOpen }: { request: TrackedRequest; onOpen: () => void }) {
  const issue = r.status === "pendencia";
  const overdue = r.status === "aguardando" && Date.now() - new Date(r.statusSince).getTime() > SAMPLE_OVERDUE_MS;
  const TimeIcon = overdue ? AlarmClock : Clock;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "w-full rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        issue ? "border-warning" : "border-border",
      )}
    >
      {issue && (
        <span className="mb-2 inline-flex items-center gap-1 rounded-md bg-warning-muted px-2 py-0.5 text-xs font-semibold text-warning-strong">
          <AlertTriangle className="h-3 w-3" aria-hidden="true" />
          Com pendência
        </span>
      )}
      <span className="block text-sm font-semibold text-foreground">{r.patient}</span>
      <span className="block text-xs text-muted-foreground">{r.procedure}</span>
      {issue && r.response?.reason && (
        <span className="mt-2 line-clamp-2 block text-xs text-foreground">{r.response.reason}</span>
      )}
      <span className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{r.operadora}</span>
        <span
          className={cn("inline-flex items-center gap-1 tabular-nums", overdue && "font-semibold text-warning-strong")}
          title={overdue ? "Aguardando há mais tempo — cobrar operadora" : undefined}
        >
          <TimeIcon className="h-3 w-3" aria-hidden="true" />
          <span className="sr-only">{overdue ? "Aguardando há mais tempo, cobrar operadora. Tempo na etapa:" : "Tempo na etapa:"}</span>
          {formatElapsed(r.statusSince)}
        </span>
      </span>
    </button>
  );
}
