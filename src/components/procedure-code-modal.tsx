import { useMemo, useState } from "react";
import { AppModal } from "@/components/app-modal";
import { Checkbox } from "@/components/ui/checkbox";
import {
  REFERENCE_LABELS,
  searchProcedures,
  type ProcedureReference,
} from "@/features/procedure-search/data/procedures";

const REFERENCES: ProcedureReference[] = ["SIGTAP", "TUSS"];

export interface ProcedureCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Termo usado para calcular a similaridade dos códigos sugeridos. */
  term?: string;
}

/** Modal de sugestões de código de procedimento por referência (Sigtap/Tuss). */
export function ProcedureCodeModal({ open, onOpenChange, term = "" }: ProcedureCodeModalProps) {
  const [selected, setSelected] = useState<ProcedureReference[]>(REFERENCES);

  const allSelected = selected.length === REFERENCES.length;

  function toggle(reference: ProcedureReference) {
    setSelected((current) =>
      current.includes(reference)
        ? current.filter((r) => r !== reference)
        : [...current, reference],
    );
  }

  const rows = useMemo(() => {
    if (selected.length === 0) return [];
    return searchProcedures(term, "todas")
      .filter((p) => selected.includes(p.referencia))
      .slice(0, 30);
  }, [selected, term]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Código de Procedimento</DialogTitle>
          <DialogDescription className="sr-only">
            Sugestões de códigos de procedimento por referência.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <fieldset className="rounded-xl border border-border bg-muted/30 p-3 sm:p-4">
            <legend className="px-1 text-sm font-semibold text-foreground">
              Selecione uma referência:
            </legend>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-3 sm:gap-x-6">
              {REFERENCES.map((reference) => (
                <label key={reference} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={selected.includes(reference)}
                    onCheckedChange={() => toggle(reference)}
                  />
                  {REFERENCE_LABELS[reference]}
                </label>
              ))}
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => setSelected(checked ? REFERENCES : [])}
                />
                Selecionar todos
              </label>
            </div>
          </fieldset>

          {/* Mobile: lista em cartões para evitar rolagem horizontal da tabela. */}
          <div className="max-h-[45vh] space-y-2 overflow-y-auto md:hidden">
            {rows.length === 0 ? (
              <p className="rounded-xl border border-border px-4 py-10 text-center text-sm text-muted-foreground">
                {selected.length === 0
                  ? "Selecione ao menos uma referência."
                  : "Nenhum código encontrado."}
              </p>
            ) : (
              rows.map((p) => (
                <div
                  key={`${p.referencia}-${p.codigo}`}
                  className="rounded-xl border border-border p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm tabular-nums">{p.codigo}</span>
                    <span className="text-xs text-muted-foreground">
                      {REFERENCE_LABELS[p.referencia]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-foreground">{p.descricao}</p>
                  <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                    Similaridade: {p.similaridade.toFixed(2)}%
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="hidden overflow-hidden rounded-xl border border-border md:block">
            <div className="max-h-[45vh] overflow-y-auto">
              <table className="w-full table-fixed text-sm">
                <thead className="sticky top-0 bg-muted/40 text-left text-muted-foreground">
                  <tr>
                    <th className="w-[20%] px-4 py-3 font-medium">Código</th>
                    <th className="w-[48%] px-4 py-3 font-medium">Procedimento</th>
                    <th className="w-[16%] px-4 py-3 text-right font-medium">Similaridade</th>
                    <th className="w-[16%] px-4 py-3 text-right font-medium">Referência</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                        {selected.length === 0
                          ? "Selecione ao menos uma referência."
                          : "Nenhum código encontrado."}
                      </td>
                    </tr>
                  ) : (
                    rows.map((p) => (
                      <tr key={`${p.referencia}-${p.codigo}`} className="border-t border-border">
                        <td className="px-4 py-3 font-mono tabular-nums">{p.codigo}</td>
                        <td className="px-4 py-3">{p.descricao}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {p.similaridade.toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {REFERENCE_LABELS[p.referencia]}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
