/**
 * Classes padronizadas para as abas do sistema.
 *
 * Mantém todos os gatilhos com a mesma largura mínima, altura mínima e
 * alinhamento de ícone/rótulo, evitando que rótulos longos (ex.:
 * "Comparecimento") fiquem mais baixos ou desalinhados que os demais.
 */

/** Container das abas. Colunas de largura igual em todos os breakpoints. */
export const appTabsListClass =
  "grid w-full h-auto auto-cols-fr grid-flow-col gap-0.5 rounded-xl border border-border bg-muted p-0.5 shadow-inner sm:gap-1 sm:p-1";

/** Gatilho de aba: ícone acima do rótulo no mobile, em linha no desktop. */
export const appTabsTriggerClass =
  "flex min-w-0 min-h-[3.25rem] flex-col border border-transparent items-center justify-center gap-1 rounded-lg px-0.5 py-2 font-medium text-muted-foreground transition-all hover:text-foreground sm:px-1.5 lg:min-h-11 lg:flex-row lg:gap-2.5 lg:px-6 lg:py-3 data-[state=active]:border-border/60 data-[state=active]:bg-background data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:shadow-sm";

/** Ícone do gatilho de aba. */
export const appTabsIconClass = "icon-optical h-4 w-4 shrink-0";

/** Rótulo do gatilho de aba. */
export const appTabsLabelClass =
  "max-w-full text-center text-[11px] leading-tight tracking-tight whitespace-nowrap sm:text-xs lg:truncate lg:text-sm";
