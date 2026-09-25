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
}: {
  rows: AuthorizationRequest[];
  emptyLabel: string;
  onView?: (request: AuthorizationRequest) => void;
}) {
  const cols = onView ? 7 : 6;
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
              <DataTableHead>Situação</DataTableHead>
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
                  <DataTableCell className="font-medium">{r.patient}</DataTableCell>
                  <DataTableCell title={r.procedure}>{r.procedure}</DataTableCell>
                  <DataTableCell>{r.doctor}</DataTableCell>
                  <DataTableCell>{r.operadora}</DataTableCell>
                  <DataTableCell><StatusLabel request={r} /></DataTableCell>
                  <DataTableCell className="tabular-nums whitespace-nowrap">
                    {formatElapsed(r.statusSince)}
                  </DataTableCell>
                  {onView && (
                    <DataTableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(r)}
                        aria-label={`Visualizar solicitação de ${r.patient}`}
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        Visualizar
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
                title={r.patient}
                subtitle={r.procedure}
                trailing={<StatusLabel request={r} />}
              />
              <DataTableCardFields
                fields={[
                  { label: "Profissional solicitante", value: r.doctor },
                  { label: "Operadora", value: r.operadora },
                  { label: "Tempo", value: formatElapsed(r.statusSince) },
                ]}
              />
              {onView && (
                <Button variant="outline" size="sm" className="w-full" onClick={() => onView(r)}>
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  Visualizar
                </Button>
              )}
            </DataTableCard>
          ))
        )}
      </DataTableCardList>
    </DataTable>
  );
}
