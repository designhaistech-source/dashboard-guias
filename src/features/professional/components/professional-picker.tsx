import { useMemo, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";

import { Field, SelectField } from "@/components/form-field";
import { Input } from "@/components/ui/input";
import { useTouchedFields } from "@/hooks/use-touched-fields";
import { cn } from "@/lib/utils";

import { COUNCILS, MANUAL_PROFESSIONAL_ID, PROFESSIONALS } from "../data/professionals";
import type { ProfessionalValue } from "../lib/professional";
import {
  maskCouncilNumber,
  maskProfessionalName,
  validateProfessional,
  type ProfessionalField,
} from "../lib/professional-validation";

interface ProfessionalPickerProps {
  value: ProfessionalValue;
  onChange: (value: ProfessionalValue) => void;
  /** Campos adicionais específicos da página (ex.: data da solicitação). */
  children?: ReactNode;
  /** Sobrescreve os rótulos para casar com a nomenclatura oficial da guia. */
  labels?: {
    nome?: string;
    conselho?: string;
    numero?: string;
  };
}

/**
 * UI única de identificação do profissional responsável.
 * O nome é um campo único com sugestões: escolher um profissional cadastrado
 * preenche conselho, número e especialidade; digitar livremente vale como
 * preenchimento manual, sem duplicar seletor + campo de nome.
 */
export function ProfessionalPicker({ value, onChange, children, labels }: ProfessionalPickerProps) {
  const { markTouched, errorFor, resetTouched } = useTouchedFields<ProfessionalField>();
  const errors = validateProfessional(value);
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const numeroRef = useRef<HTMLInputElement>(null);


  const query = value.nome.trim();
  const suggestions = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return PROFESSIONALS;
    const exact = PROFESSIONALS.some((p) => p.nome.toLowerCase() === q);
    if (exact) return PROFESSIONALS;
    return PROFESSIONALS.filter((p) => p.nome.toLowerCase().includes(q));
  }, [query]);

  const selectProfessional = (id: string) => {
    const found = PROFESSIONALS.find((p) => p.id === id);
    if (!found) return;
    resetTouched();
    onChange({ ...found });
    setOpen(false);
    requestAnimationFrame(() => numeroRef.current?.blur());
  };


  const handleNameChange = (raw: string) => {
    const nome = maskProfessionalName(raw);
    const found = PROFESSIONALS.find((p) => p.nome.toLowerCase() === nome.trim().toLowerCase());
    if (found) {
      onChange({ ...found });
      return;
    }
    onChange({ ...value, id: MANUAL_PROFESSIONAL_ID, nome });
  };


  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1fr_140px_160px_200px]">
        <Field
          id="profissional-nome"
          label={labels?.nome ?? "Nome do profissional"}
          required
          error={errorFor("nome", errors.nome)}
          hint="Digite para buscar um cadastro ou informe um nome novo — conselho e número seguem editáveis."


          className="relative"
        >
          <div id="profissional-nome-wrap" className="relative">
            <Input
              id="profissional-nome"
              aria-invalid={Boolean(errorFor("nome", errors.nome)) || undefined}
              aria-describedby="profissional-nome-msg"
              value={value.nome}

              onChange={(e) => {
                handleNameChange(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => {
                markTouched("nome");
                blurTimer.current = setTimeout(() => setOpen(false), 120);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
              }}
              role="combobox"
              aria-expanded={open}
              aria-autocomplete="list"
              aria-controls="profissional-nome-sugestoes"
              autoComplete="off"
              inputMode="text"
              maxLength={70}
              className="pr-9"
            />
            <ChevronDown
              aria-hidden
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            {open && (
              <ul
                id="profissional-nome-sugestoes"
                role="listbox" /* ds-allow: autocomplete inline ancorado no próprio Input do design system (Select/Command não aceitam texto livre com máscara) */
                aria-label="Profissionais cadastrados"
                className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-md"
              >
                {suggestions.length === 0 && (
                  <li className="px-2 py-1.5 text-xs text-muted-foreground">
                    Nenhum cadastro com esse nome. O nome digitado será usado nesta guia.
                  </li>
                )}

                {suggestions.map((p) => {
                  const active = p.id === value.id;
                  return (
                    <li key={p.id}>
                      <button /* ds-allow: opção de lista de sugestões */
                        type="button"
                        role="option"
                        aria-selected={active}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          if (blurTimer.current) clearTimeout(blurTimer.current);
                          selectProfessional(p.id);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:bg-accent",
                          active && "bg-accent/60",
                        )}
                      >
                        <Check className={cn("h-4 w-4 shrink-0", active ? "opacity-100" : "opacity-0")} />
                        <span className="min-w-0">
                          <span className="block truncate">{p.nome}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {p.conselho} {p.numero} · {p.especialidade}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}

              </ul>

            )}
          </div>
        </Field>
        <SelectField
          id="profissional-conselho"
          label={labels?.conselho ?? "Conselho"}
          value={value.conselho}
          onValueChange={(conselho) => {
            markTouched("conselho");
            onChange({ ...value, conselho });
          }}
          error={errorFor("conselho", errors.conselho)}
          options={COUNCILS.map((c) => ({ value: c, label: c }))}
        />
        <Field
          id="profissional-numero"
          label={labels?.numero ?? "Número do conselho"}
          required
          error={errorFor("numero", errors.numero)}
          hint="Formato 0000/UF."
        >
          <Input
            ref={numeroRef}
            value={value.numero}
            onChange={(e) => onChange({ ...value, numero: maskCouncilNumber(e.target.value) })}
            onBlur={() => markTouched("numero")}
            placeholder="0000/UF"
            inputMode="text"
            maxLength={11}
          />
        </Field>

        <Field id="profissional-especialidade" label="Especialidade">
          <Input
            value={value.especialidade}
            onChange={(e) => onChange({ ...value, especialidade: e.target.value })}
            placeholder="Cardiologia, Ortopedia..."
          />
        </Field>
      </div>

      {children && <div className="grid gap-4 lg:grid-cols-2">{children}</div>}
    </div>
  );
}
