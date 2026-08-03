import * as React from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface FilterCardProps {
  id?: string;
  /** Campos de filtro — dispostos em linha no desktop. */
  children: React.ReactNode;
  /** Ação de limpeza; quando informada, renderiza o botão padronizado. */
  onClear?: () => void;
  clearLabel?: string;
  clearDisabled?: boolean;
  /** Quantidade de filtros ativos, exibida no gatilho mobile. */
  activeCount?: number;
  /** Rótulo do gatilho mobile. */
  toggleLabel?: string;
  className?: string;
}

/**
 * Card de filtros padronizado — mesma estrutura em todas as listagens
 * (Histórico de guias, Buscar procedimento, Buscar CID-10).
 *
 * No mobile os campos ficam recolhidos atrás de um gatilho "Filtros"
 * para que a listagem continue visível.
 */
export function FilterCard({
  id = "filter-card",
  children,
  onClear,
  clearLabel = "Limpar filtros",
  clearDisabled,
  activeCount,
  toggleLabel = "Filtros",
  className,
}: FilterCardProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="space-y-3">
      <div className="flex lg:hidden">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          {toggleLabel}
          {activeCount ? (
            <Badge variant="secondary" size="sm">
              {activeCount}
            </Badge>
          ) : null}
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
            aria-hidden="true"
          />
        </Button>
      </div>

      <div
        id={id}
        className={cn(
          "flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs sm:grid sm:grid-cols-2 sm:items-center lg:flex lg:flex-row lg:flex-wrap lg:items-center",
          open ? "flex" : "hidden lg:flex",
          className,
        )}
      >
        {children}
        {onClear && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClear}
            disabled={clearDisabled}
            className="w-full justify-center sm:col-span-2 lg:w-auto"
          >
            {clearLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
