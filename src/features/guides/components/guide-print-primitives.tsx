import * as React from "react";

/**
 * Primitivas de desenho dos "quadros" das guias TISS impressas.
 * Compartilhadas pelas pré-visualizações (SP/SADT e Solicitação de Internação)
 * para que ambas tenham exatamente a mesma aparência de formulário oficial.
 */

export function SectionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 py-0.5 bg-secondary border-y border-foreground text-[9px] font-bold">
      {children}
    </div>
  );
}

export function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="flex border-b border-foreground">{children}</div>;
}

export function FieldBox({
  n,
  label,
  value,
  image,
  width,
  grow,
}: {
  n: string;
  label: string;
  value: string;
  /** Data URL opcional renderizado no lugar do texto (ex.: assinatura). */
  image?: string;
  width?: number;
  grow?: boolean;
}) {
  return (
    <div
      className="border-r last:border-r-0 border-foreground px-1 py-0.5"
      style={{ width: grow ? undefined : width, flex: grow ? 1 : undefined, minWidth: 0 }}
    >
      <div className="text-[8px] font-bold">
        {n} - {label}
      </div>
      {image ? (
        <img src={image} alt={label} className="h-6 w-auto max-w-full object-contain" />
      ) : (
        <div className="text-[10px] font-mono truncate min-h-[12px]">{value}</div>
      )}
    </div>
  );
}

export function FieldBoxDate({
  n,
  label,
  d,
  m,
  y,
  width,
}: {
  n: string;
  label: string;
  d: string;
  m: string;
  y: string;
  width?: number;
}) {
  return (
    <div className="border-r border-foreground px-1 py-0.5" style={{ width }}>
      <div className="text-[8px] font-bold">
        {n} - {label}
      </div>
      <div className="text-[10px] font-mono min-h-[12px]">
        {d || "__"}/{m || "__"}/{y || "____"}
      </div>
    </div>
  );
}

export function fmtDate(iso: string) {
  if (!iso) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }
  if (/^\d{4}-\d{2}$/.test(iso)) {
    const [y, m] = iso.split("-");
    return `${m}/${y}`;
  }
  return iso;
}

/** Quebra uma data ISO nos componentes dia/mês/ano usados nos quadros. */
export function splitDate(iso: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(fmtDate(iso));
  return match ? { d: match[1], m: match[2], y: match[3] } : { d: "", m: "", y: "" };
}
