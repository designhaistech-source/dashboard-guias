"use client";

import * as React from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  /** Texto usado na busca; por padrão considera label + value. */
  searchText?: string;
  disabled?: boolean;
}

/* -------- shared trigger (mesma altura/estilos do Select/Input) -------- */

interface TriggerProps extends React.ComponentPropsWithoutRef<"button"> {
  invalid?: boolean;
  placeholder?: boolean;
}

const triggerBase = cn(
  "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors",
  "hover:bg-accent/30",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-ring",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

const ComboboxTrigger = React.forwardRef<HTMLButtonElement, TriggerProps>(
  ({ className, invalid, placeholder, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-invalid={invalid || undefined}
      data-placeholder={placeholder || undefined}
      className={cn(
        triggerBase,
        "data-[placeholder]:text-muted-foreground",
        invalid &&
          "border-destructive/60 focus-visible:ring-destructive/30",
        className,
      )}
      {...props}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2 text-left [&>span]:line-clamp-1">
        {children}
      </span>
      <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
    </button>
  ),
);
ComboboxTrigger.displayName = "ComboboxTrigger";

/* -------------------- Combobox (single, searchable) -------------------- */

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  invalid?: boolean;
  clearable?: boolean;
  className?: string;
  id?: string;
  "aria-describedby"?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum resultado encontrado.",
  disabled,
  invalid,
  clearable,
  className,
  id,
  ...aria
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ComboboxTrigger
          id={id}
          disabled={disabled}
          invalid={invalid}
          placeholder={!selected}
          className={className}
          aria-expanded={open}
          {...aria}
        >
          <span className="truncate">{selected?.label ?? placeholder}</span>
          {clearable && selected && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange?.("");
              }}
              className="ml-auto -mr-1 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
              aria-label="Limpar seleção"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </ComboboxTrigger>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const active = opt.value === value;
                return (
                  <CommandItem
                    key={opt.value}
                    value={opt.searchText ?? `${opt.label} ${opt.value}`}
                    disabled={opt.disabled}
                    onSelect={() => {
                      onChange?.(opt.value);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Check
                      className={cn(
                        "h-4 w-4",
                        active ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{opt.label}</span>
                      {opt.description && (
                        <span className="text-xs text-muted-foreground truncate">
                          {opt.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/* -------------------- MultiSelect (search + multi) -------------------- */

interface MultiSelectProps {
  options: ComboboxOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  allLabel?: string;
  emptyLabel?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  id?: string;
  showActions?: boolean;
  countLabel?: (n: number) => string;
}

export function MultiSelect({
  options,
  values,
  onChange,
  placeholder = "Selecione...",
  allLabel = "Todos",
  emptyLabel = "Nenhum",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum resultado.",
  disabled,
  invalid,
  className,
  id,
  showActions = true,
  countLabel = (n) => `${n} selecionados`,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const set = React.useMemo(() => new Set(values), [values]);

  const toggle = (v: string) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange(Array.from(next));
  };

  const label =
    values.length === 0
      ? emptyLabel
      : values.length === options.length
        ? allLabel
        : values.length === 1
          ? options.find((o) => o.value === values[0])?.label ?? countLabel(1)
          : countLabel(values.length);

  const isPlaceholder = values.length === 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ComboboxTrigger
          id={id}
          disabled={disabled}
          invalid={invalid}
          placeholder={isPlaceholder}
          className={className}
          aria-expanded={open}
        >
          <span className="truncate">
            {isPlaceholder ? placeholder : label}
          </span>
        </ComboboxTrigger>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] p-0"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          {showActions && (
            <div className="flex items-center justify-between border-b border-border px-2 py-1.5 text-[11px]">
              <span className="uppercase tracking-wide text-muted-foreground">
                {values.length}/{options.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onChange(options.map((o) => o.value))}
                  className="rounded-md px-2 py-0.5 text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                >
                  Todos
                </button>
                <span className="text-muted-foreground/40">·</span>
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="rounded-md px-2 py-0.5 text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                >
                  Limpar
                </button>
              </div>
            </div>
          )}
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const active = set.has(opt.value);
                return (
                  <CommandItem
                    key={opt.value}
                    value={opt.searchText ?? `${opt.label} ${opt.value}`}
                    disabled={opt.disabled}
                    onSelect={() => toggle(opt.value)}
                    className="flex items-center gap-2"
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background",
                      )}
                    >
                      {active && <Check className="h-3 w-3" />}
                    </span>
                    <span className="truncate">{opt.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/* Re-export helper for search icon consumers */
export { Search as ComboboxSearchIcon };
