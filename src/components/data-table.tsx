import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Wrappers finos sobre <table> nativa para manter a mesma hierarquia visual
 * (cabeçalho muted, hover, bordas horizontais, padding tabular) em todas as
 * listagens do sistema.
 */

export function DataTable({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card",
        className,
      )}
      {...props}
    >
      <div className="w-full overflow-x-auto">{children}</div>
    </div>
  );
}

export function DataTableRoot({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <table className={cn("w-full text-sm", className)} {...props} />
  );
}

export function DataTableHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        "bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function DataTableBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-border", className)} {...props} />;
}

export function DataTableRow({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("transition-colors hover:bg-muted/40", className)}
      {...props}
    />
  );
}

export function DataTableHead({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left font-medium first:pl-6 last:pr-6",
        className,
      )}
      {...props}
    />
  );
}

export function DataTableCell({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "px-4 py-3 align-middle text-foreground first:pl-6 last:pr-6",
        className,
      )}
      {...props}
    />
  );
}

interface EmptyRowProps {
  colSpan: number;
  children?: React.ReactNode;
  className?: string;
}

export function DataTableEmptyRow({ colSpan, children, className }: EmptyRowProps) {
  return (
    <tr>
      <td colSpan={colSpan} className={cn("p-0", className)}>
        {children}
      </td>
    </tr>
  );
}
