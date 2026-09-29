import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DataTable,
  DataTableBody,
  DataTableCard,
  DataTableCardFields,
  DataTableCardHeader,
  DataTableCardList,
  DataTableCell,
  DataTableDesktop,
  DataTableEmptyRow,
  DataTableHead,
  DataTableHeader,
  DataTableRoot,
  DataTableRow,
} from "@/components/data-table";
import {
  AUTHORIZATION_STATUS_LABEL,
  formatElapsed,
  type AuthorizationRequest,
} from "../data/authorization-requests";

/** Situação sempre escrita por extenso; o badge neutro não depende de cor. */
export function StatusLabel({ request }: { request: AuthorizationRequest }) {
  return (
    <Badge variant="outline" size="sm" className="whitespace-nowrap">
      {AUTHORIZATION_STATUS_LABEL[request.status]}
    </Badge>
  );
}

export function RequestsTable({
  rows,
  emptyLabel,
  onView,
  actionLabel = "Visualizar",
  getActionLabel,
  onOpenDetails,
  showStatus = true,
  getSecondaryAction,
}: {
  /** Optional low-emphasis action shown next to the main one. */
  getSecondaryAction?: (request: AuthorizationRequest) => { label: string; onClick: () => void } | null;
  actionLabel?: string;
  rows: AuthorizationRequest[];
  emptyLabel: string;
  onView?: (request: AuthorizationRequest) => void;
  /** Per-row action label; falls back to `actionLabel`. */
  getActionLabel?: (request: AuthorizationRequest) => string;
  /** Makes the patient name a link to the full request details. */
  onOpenDetails?: (request: AuthorizationRequest) => void;
  showStatus?: boolean;
}) {
  const cols = 5 + (showStatus ? 1 : 0) + (onView ? 1 : 0);
  const labelOf = (r: AuthorizationRequest) => getActionLabel?.(r) ?? actionLabel;
  const patient = (r: AuthorizationRequest) =>
    onOpenDetails ? (
      <button
        type="button"
        onClick={() => onOpenDetails(r)}
        className="rounded-sm text-left font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Ver detalhes da solicitação de ${r.patient}`}
      >
        {r.patient}
      </button>
    ) : (
      r.patient
    );
  return (
    <DataTable>
      <DataTableDesktop breakpoint="md">
        <DataTableRoot className="min-w-200">
          <DataTableHeader>
            <DataTableRow>
              <DataTableHead>Paciente</DataTableHead>
              <DataTableHead>Procedimento</DataTableHead>
              <DataTableHead>Profissional solicitante</DataTableHead>
              <DataTableHead>Operadora</DataTableHead>
              {showStatus && <DataTableHead>Situação</DataTableHead>}
              <DataTableHead>Tempo</DataTableHead>
              {onView && <DataTableHead className="text-right">Ações</DataTableHead>}
            </DataTableRow>
          </DataTableHeader>
          <DataTableBody>
            {rows.length === 0 ? (
              <DataTableEmptyRow colSpan={cols}>{emptyLabel}</DataTableEmptyRow>
            ) : (
              rows.map((r) => (
                <DataTableRow key={r.id}>
                  <DataTableCell className="font-medium">{patient(r)}</DataTableCell>
                  <DataTableCell title={r.procedure}>{r.procedure}</DataTableCell>
                  <DataTableCell>{r.doctor}</DataTableCell>
                  <DataTableCell>{r.operadora}</DataTableCell>
                  {showStatus && <DataTableCell><StatusLabel request={r} /></DataTableCell>}
                  <DataTableCell className="tabular-nums whitespace-nowrap">
                    {formatElapsed(r.statusSince)}
                  </DataTableCell>
                  {onView && (
                    <DataTableCell className="text-right">
                      <div className="flex flex-col items-end gap-0.5">
                      {(() => {
                        const sec = getSecondaryAction?.(r);
                        return sec ? (
                          <Button variant="link" size="sm" className="text-muted-foreground" onClick={sec.onClick} aria-label={`${sec.label}: ${r.patient}`}>
                            {sec.label}
                          </Button>
                        ) : null;
                      })()}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(r)}
                        aria-label={`${labelOf(r)}: ${r.patient}`}
                      >
                        {!getActionLabel && <Eye className="h-4 w-4" aria-hidden="true" />}
                        {labelOf(r)}
                      </Button>
                    </DataTableCell>
                  )}
                </DataTableRow>
              ))
            )}
          </DataTableBody>
        </DataTableRoot>
      </DataTableDesktop>

      <DataTableCardList breakpoint="md" divided>
        {rows.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-muted-foreground">{emptyLabel}</li>
        ) : (
          rows.map((r) => (
            <DataTableCard key={r.id} flat>
              <DataTableCardHeader
                title={patient(r)}
                subtitle={r.procedure}
                trailing={showStatus ? <StatusLabel request={r} /> : undefined}
              />
              <DataTableCardFields
                fields={[
                  { label: "Profissional solicitante", value: r.doctor },
                  { label: "Operadora", value: r.operadora },
                  { label: "Tempo", value: formatElapsed(r.statusSince) },
                ]}
              />
              {(() => {
                const sec = getSecondaryAction?.(r);
                return sec ? (
                  <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={sec.onClick} aria-label={`${sec.label}: ${r.patient}`}>
                    {sec.label}
                  </Button>
                ) : null;
              })()}
              {onView && (
                <Button variant="outline" size="sm" className="w-full" onClick={() => onView(r)} aria-label={`${labelOf(r)}: ${r.patient}`}>
                  {!getActionLabel && <Eye className="h-4 w-4" aria-hidden="true" />}
                  {labelOf(r)}
                </Button>
              )}
            </DataTableCard>
          ))
        )}
      </DataTableCardList>
    </DataTable>
  );
}
