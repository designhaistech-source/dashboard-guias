import { Lock } from "lucide-react";

import { Field, SelectField } from "@/components/form-field";
import { Input } from "@/components/ui/input";
import { Grid } from "@/components/form-field";

import { PROFESSIONALS } from "../data/professionals";
import type { ProfessionalValue } from "../lib/professional";

interface ProfessionalRegistryFieldProps {
  value: ProfessionalValue;
  onChange: (value: ProfessionalValue) => void;
  /** Rótulos oficiais da guia (campos 15 a 19). */
  labels?: {
    nome?: string;
    conselho?: string;
    numero?: string;
    uf?: string;
    cbo?: string;
  };
}

/** Campo somente leitura derivado do cadastro do profissional. */
function ReadOnlyField({
  label,
  value,
  span,
  mono,
}: {
  label: string;
  value: string;
  span?: string;
  mono?: boolean;
}) {
  return (
    <Field label={label} span={span}>
      <Input
        value={value}
        readOnly
        aria-readonly
        tabIndex={-1}
        placeholder="—"
        className={`bg-muted/50 text-foreground ${mono ? "font-mono" : ""}`}
      />
    </Field>
  );
}

/**
 * Seleção do profissional solicitante a partir do cadastro do sistema.
 * Conselho, número, especialidade, UF e CBO (campos 16 a 19) são derivados do
 * registro escolhido e não podem ser editados na emissão da guia — a alteração
 * é feita no cadastro do profissional.
 */
export function ProfessionalRegistryField({
  value,
  onChange,
  labels,
}: ProfessionalRegistryFieldProps) {
  const selected = PROFESSIONALS.find((p) => p.id === value.id);

  return (
    <div className="space-y-3">
      <Grid cols={12}>
        <SelectField
          id="profissional-cadastrado"
          label={labels?.nome ?? "15 - Nome do Profissional Solicitante"}
          required
          className="@md:col-span-6 @3xl:col-span-5"
          labelClassName="text-xs font-medium text-muted-foreground"
          value={selected ? selected.id : ""}
          onValueChange={(id) => {
            const found = PROFESSIONALS.find((p) => p.id === id);
            if (found) onChange({ ...found });
          }}
          placeholder="Selecione o profissional"
          options={PROFESSIONALS.map((p) => ({
            value: p.id,
            label: `${p.nome} — ${p.conselho} ${p.numero}`,
          }))}
        />

        <ReadOnlyField
          label={labels?.conselho ?? "16 - Conselho Profissional"}
          value={value.conselho}
          span="@md:col-span-3 @3xl:col-span-2"
        />
        <ReadOnlyField
          label={labels?.numero ?? "17 - Número no Conselho"}
          value={value.numero}
          span="@md:col-span-3 @3xl:col-span-2"
          mono
        />
        <ReadOnlyField
          label="Especialidade"
          value={value.especialidade}
          span="@md:col-span-6 @3xl:col-span-3"
        />
        <ReadOnlyField
          label={labels?.uf ?? "18 - UF"}
          value={value.uf}
          span="@md:col-span-3 @3xl:col-span-2"
        />
        <ReadOnlyField
          label={labels?.cbo ?? "19 - Código CBO"}
          value={value.cbo}
          span="@md:col-span-3 @3xl:col-span-2"
          mono
        />
      </Grid>

      <p className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          Campos 16 a 19 e especialidade vêm do cadastro do profissional. Para alterá-los,
          edite o cadastro.
        </span>
      </p>
    </div>
  );
}
