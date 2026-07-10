import * as React from "react";
import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

/* ---------------- Field ---------------- */

interface FieldProps {
  id?: string;
  label?: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
  labelClassName?: string;
  rightAdornment?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Wrapper padrão para campos de formulário.
 * Renderiza label + indicador (obrigatório/opcional) + input + hint/erro.
 * Vincula `htmlFor`/`aria-describedby` automaticamente quando `id` é informado.
 */
export function Field({
  id,
  label,
  required,
  optional,
  hint,
  error,
  className,
  labelClassName,
  children,
}: FieldProps) {
  const messageId = id ? `${id}-msg` : undefined;

  // Injeta id + aria-describedby + aria-invalid no primeiro filho quando possível.
  const child = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<any>, {
        id: (children as React.ReactElement<any>).props.id ?? id,
        "aria-invalid":
          (children as React.ReactElement<any>).props["aria-invalid"] ?? Boolean(error),
        "aria-describedby":
          (children as React.ReactElement<any>).props["aria-describedby"] ?? messageId,
      })
    : children;

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label
          htmlFor={id}
          className={cn(
            "flex items-center gap-1 text-sm font-medium text-foreground",
            labelClassName,
          )}
        >
          <span>{label}</span>
          {required && (
            <span aria-hidden className="text-destructive">
              *
            </span>
          )}
          {optional && !required && (
            <span className="text-xs font-normal text-muted-foreground">
              (opcional)
            </span>
          )}
        </label>
      )}
      {child}
      {(error || hint) && (
        <p
          id={messageId}
          className={cn(
            "flex items-center gap-1 text-xs",
            error ? "text-destructive" : "text-muted-foreground",
          )}
          role={error ? "alert" : undefined}
        >
          {error && <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
          <span>{error ?? hint}</span>
        </p>
      )}
    </div>
  );
}

/* ---------------- SearchInput ---------------- */

interface SearchInputProps
  extends Omit<React.ComponentProps<typeof Input>, "type"> {
  leftIcon?: React.ReactNode;
}

/**
 * Input de busca padronizado com ícone à esquerda.
 * Usa <Input> por baixo, então herda todos os estados (focus, erro, disabled).
 */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, leftIcon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {leftIcon ?? <SearchIcon />}
        </span>
        <Input
          ref={ref}
          type="search"
          className={cn("pl-9", className)}
          {...props}
        />
      </div>
    );
  },
);
SearchInput.displayName = "SearchInput";

function SearchIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
