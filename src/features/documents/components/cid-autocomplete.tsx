import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Check, ChevronDown, Loader2, Search, X } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cidSearchQueryOptions } from "@/lib/cid-api";
import type { CidItem } from "@/lib/cid";
import { cn } from "@/lib/utils";

/** Debounce simples para evitar uma requisição por tecla digitada. */
function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

interface CidAutocompleteProps {
  id: string;
  /** Código selecionado (ex.: I10). */
  value: string;
  /** Descrição do código selecionado. */
  description: string;
  onSelect: (item: CidItem | null) => void;
  placeholder?: string;
  /** Sinaliza estado inválido no gatilho do combobox. */
  invalid?: boolean;
  /** Id da mensagem de erro/dica associada ao campo. */
  describedById?: string;
}

/** Autocomplete de CID-10 com busca assíncrona na API. */
export function CidAutocomplete({
  id,
  value,
  description,
  onSelect,
  placeholder = "Busque por código ou descrição...",
  invalid = false,
  describedById,
}: CidAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const debouncedTerm = useDebouncedValue(term);

  const query = useQuery({
    ...cidSearchQueryOptions(debouncedTerm),
    enabled: open,
  });

  const items = useMemo(() => query.data ?? [], [query.data]);
  const label = value ? `${value} — ${description}` : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button /* ds-allow: trigger do combobox Radix (asChild) */
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-label="Buscar CID-10"
          aria-invalid={invalid || undefined}
          aria-describedby={describedById}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors sm:h-9 sm:text-sm",
            "hover:bg-accent/30 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
            invalid && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/40",
          )}
        >
          <span className={cn("truncate text-left", !label && "text-muted-foreground")}>
            {label || placeholder}
          </span>
          {value ? (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Limpar CID"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onSelect(null);
              }}
              className="shrink-0 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </span>
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <div className="relative border-b border-border">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              autoFocus
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Digite o código ou a descrição..."
              aria-label="Termo de busca da CID-10"
              className="h-10 border-0 pl-9 shadow-none focus-visible:ring-0"
            />
            {query.isFetching ? (
              <Loader2
                aria-hidden
                className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
              />
            ) : null}
          </div>

          <CommandList>
            {query.isError ? (
              <div className="flex items-start gap-2 px-4 py-6 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>Não foi possível consultar a CID-10. Tente novamente em instantes.</span>
              </div>
            ) : query.isLoading ? (
              <div className="px-4 py-6 text-sm text-muted-foreground">Buscando códigos...</div>
            ) : (
              <>
                <CommandEmpty>Nenhum CID encontrado.</CommandEmpty>
                <CommandGroup>
                  {items.map((item) => (
                    <CommandItem
                      key={item.codigo}
                      value={item.codigo}
                      onSelect={() => {
                        onSelect(item);
                        setOpen(false);
                      }}
                      className="flex items-start gap-2"
                    >
                      <Check
                        aria-hidden
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          item.codigo === value ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div className="min-w-0">
                        <span className="block font-mono text-xs font-semibold">{item.codigo}</span>
                        <span className="block truncate text-sm text-muted-foreground">
                          {item.descricao}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
