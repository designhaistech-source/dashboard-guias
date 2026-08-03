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
  /** Quantidade de filtros ativos, exibida no gatilho e no cabeçalho. */
  activeCount?: number;
  /** Rótulo do gatilho de abertura. */
  toggleLabel?: string;
  /**
   * `inline` (padrão): campos em linha, recolhidos apenas no mobile.
   * `panel`: painel com cabeçalho, campos empilhados e rodapé de ações,
   * controlado externamente (usado no dashboard).
   */
  variant?: "inline" | "panel";
  /** Título do painel (apenas `variant="panel"`). */
  title?: string;
  /** Texto auxiliar do painel (apenas `variant="panel"`). */
  description?: React.ReactNode;
  /** Estado controlado de abertura; sem ele o card gerencia o próprio estado. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Oculta o gatilho — útil quando a página já tem um botão de filtros. */
  hideToggle?: boolean;
  /** Ações à direita do rodapé (ex.: Cancelar / Aplicar filtros). */
  footerActions?: React.ReactNode;
  className?: string;
}

/**
 * Card de filtros padronizado — mesma estrutura, contador de filtros ativos
 * e botão "Limpar filtros" em todas as superfícies com filtros
 * (Dashboard, Histórico de guias, Buscar procedimento, Buscar CID-10).
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
  variant = "inline",
  title,
  description,
  open: openProp,
  onOpenChange,
  hideToggle = false,
  footerActions,
  className,
}: FilterCardProps) {
  const [openState, setOpenState] = React.useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : openState;
  const setOpen = (next: boolean) => {
    if (!isControlled) setOpenState(next);
    onOpenChange?.(next);
  };

  const isPanel = variant === "panel";
  const showToggle = !hideToggle;

  const clearButton = onClear ? (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClear}
      disabled={clearDisabled}
      className={cn(
        "w-full justify-center lg:w-auto",
        !isPanel && "sm:col-span-2",
      )}
    >
      {clearLabel}
    </Button>
  ) : null;

  if (isPanel && !open) {
    return showToggle ? (
      <div className="flex">
        <FilterToggle
          id={id}
          open={open}
          setOpen={setOpen}
          label={toggleLabel}
          activeCount={activeCount}
        />
      </div>
    ) : null;
  }

  return (
    <div className="space-y-3">
      {showToggle && (
        <div className={cn("flex", !isPanel && "lg:hidden")}>
          <FilterToggle
            id={id}
            open={open}
            setOpen={setOpen}
            label={toggleLabel}
            activeCount={activeCount}
          />
        </div>
      )}

      {isPanel ? (
        <section
          id={id}
          role="region"
          aria-label={title ?? toggleLabel}
          className={cn(
            "space-y-5 rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-6",
            className,
          )}
        >
          {(title || description) && (
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base font-semibold tracking-tight text-foreground">
                    {title ?? toggleLabel}
                  </h3>
                  {activeCount ? (
                    <Badge variant="secondary" size="sm">
                      {activeCount}
                    </Badge>
                  ) : null}
                </div>
                {description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                )}
              </div>
            </header>
          )}

          {children}

          {(clearButton || footerActions) && (
            <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              {clearButton}
              {footerActions && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  {footerActions}
                </div>
              )}
            </div>
          )}
        </section>
      ) : (
        <div
          id={id}
          className={cn(
            "flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs sm:grid sm:grid-cols-2 sm:items-center lg:flex lg:flex-row lg:flex-wrap lg:items-center",
            open ? "flex" : "hidden lg:flex",
            className,
          )}
        >
          {children}
          {clearButton}
        </div>
      )}
    </div>
  );
}

function FilterToggle({
  id,
  open,
  setOpen,
  label,
  activeCount,
}: {
  id: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  label: string;
  activeCount?: number;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-expanded={open}
      aria-controls={id}
      onClick={() => setOpen(!open)}
    >
      <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
      {label}
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
  );
}
