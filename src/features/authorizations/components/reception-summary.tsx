import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExamRequests } from "../data/requests-store";

// Prototype-only sample threshold; not a system rule.
const SAMPLE_OVERDUE_MS = 3 * 24 * 60 * 60 * 1000;

/** Alert shown above the Exames flow for authorizations waiting on the operator for longer. */
export function ReceptionSummary() {
  const all = useExamRequests();
  const now = Date.now();
  const overdue = all.filter((r) => r.status === "aguardando" && now - new Date(r.statusSince).getTime() > SAMPLE_OVERDUE_MS).length;

  if (overdue === 0) return null;
  return (
    <div role="status" className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Clock className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm text-foreground">
          {overdue === 1 ? "1 autorização aguardando" : `${overdue} autorizações aguardando`} retorno da operadora há mais tempo
        </span>
      </div>
      <Button asChild variant="ghost" size="sm">
        <Link to="/autorizacoes" search={(prev) => ({ ...prev, status: "aguardando" })}>Cobrar operadora</Link>
      </Button>
    </div>
  );
}
