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
import { TRACKING_STATUS_LABEL, type TrackedRequest } from "../data/requests-store";
import { formatDateTime } from "./request-timeline";

export function TrackingStatus({ request }: { request: TrackedRequest }) {
  return (
    <Badge variant="outline" size="sm" className="whitespace-nowrap">
      {TRACKING_STATUS_LABEL[request.status]}
    </Badge>
  );
}

function Assignee({ name }: { name: string | null }) {
  return name ? <>{name}</> : <span className="text-muted-foreground" aria-label="Nenhum responsável">—</span>;
}

/** Acompanhamento do Profissional de saúde: somente leitura. */
export function TrackingTable({
  rows,
  emptyLabel,
  onView,
}: {
  rows: TrackedRequest[];
  emptyLabel: string;
  onView: (request: TrackedRequest) => void;
}) {
  return (
    <DataTable>
      <DataTableDesktop breakpoint="md">
        <DataTableRoot className="min-w-200">
          <DataTableHeader>
            <DataTableRow>
              <DataTableHead>Paciente</DataTableHead>
              <DataTableHead>Procedimento</DataTableHead>
              <DataTableHead>Data da solicitação</DataTableHead>
              <DataTableHead>Responsável pela autorização</DataTableHead>
              <DataTableHead>Status</DataTableHead>
              <DataTableHead className="text-right">Ações</DataTableHead>
            </DataTableRow>
          </DataTableHeader>
          <DataTableBody>
            {rows.length === 0 ? (
              <DataTableEmptyRow colSpan={6}>{emptyLabel}</DataTableEmptyRow>
            ) : (
              rows.map((r) => (
                <DataTableRow key={r.id}>
                  <DataTableCell className="font-medium">{r.patient}</DataTableCell>
                  <DataTableCell title={r.procedure}>{r.procedure}</DataTableCell>
                  <DataTableCell className="font-mono tabular-nums whitespace-nowrap" suppressHydrationWarning>{formatDateTime(r.receivedAt)}</DataTableCell>
                  <DataTableCell><Assignee name={r.assignee} /></DataTableCell>
                  <DataTableCell><TrackingStatus request={r} /></DataTableCell>
                  <DataTableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => onView(r)} aria-label={`Ver solicitação de ${r.patient}`}>
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      Ver
                    </Button>
                  </DataTableCell>
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
              <DataTableCardHeader title={r.patient} subtitle={r.procedure} trailing={<TrackingStatus request={r} />} />
              <DataTableCardFields
                fields={[
                  { label: "Data da solicitação", value: formatDateTime(r.receivedAt) },
                  { label: "Responsável pela autorização", value: r.assignee ?? "—" },
                ]}
              />
              <Button variant="outline" size="sm" className="w-full" onClick={() => onView(r)}>
                <Eye className="h-4 w-4" aria-hidden="true" />
                Ver
              </Button>
            </DataTableCard>
          ))
        )}
      </DataTableCardList>
    </DataTable>
  );
}
