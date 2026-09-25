import type { HistoryEntry } from "../data/requests-store";

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

/** Histórico do andamento, do mais recente para o mais antigo. */
export function RequestTimeline({ history }: { history: HistoryEntry[] }) {
  const items = [...history].sort((a, b) => b.at.localeCompare(a.at));
  return (
    <ol className="relative space-y-6 border-l border-border pl-6" aria-label="Histórico do andamento">
      {items.map((h, i) => {
        const d = new Date(h.at);
        return (
          <li key={`${h.at}-${i}`} className="relative">
            <span
              aria-hidden="true"
              className={
                i === 0
                  ? "absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-primary bg-primary"
                  : "absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-border bg-card"
              }
            />
            <p className="text-sm font-medium text-foreground">
              {h.stage}
              {i === 0 && <span className="sr-only"> (etapa atual)</span>}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              <time dateTime={h.at} className="font-mono tabular-nums" suppressHydrationWarning>
                {dateFmt.format(d)} às {timeFmt.format(d)}
              </time>
              {" · "}
              {h.by}
            </p>
            {h.note && <p className="mt-1 text-sm text-muted-foreground">{h.note}</p>}
          </li>
        );
      })}
    </ol>
  );
}

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${dateFmt.format(d)}, ${timeFmt.format(d)}`;
}
