import type { ReactNode } from "react";

import { Field, SelectField } from "@/components/form-field";
import { Input } from "@/components/ui/input";

import { COUNCILS, MANUAL_PROFESSIONAL_ID, PROFESSIONALS } from "../data/professionals";
import { isManual, type ProfessionalValue } from "../lib/professional";

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
 * UI única de seleção do profissional responsável.
 * Mostra apenas o seletor para profissionais cadastrados e libera os campos
 * de identificação somente no modo manual, evitando dados repetidos na tela.
 */
export function ProfessionalPicker({ value, onChange, children, labels }: ProfessionalPickerProps) {
  const manual = isManual(value);

  const handleSelect = (id: string) => {
    const found = PROFESSIONALS.find((p) => p.id === id);
    if (found) {
      onChange({ ...found });
      return;
    }
    onChange({
      id: MANUAL_PROFESSIONAL_ID,
      nome: "",
      conselho: COUNCILS[0],
      numero: "",
      especialidade: "",
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <SelectField
          id="profissional-select"
          label="Selecionar profissional"
          placeholder="Escolha o profissional"
          value={value.id}
          onValueChange={handleSelect}
          options={[
            ...PROFESSIONALS.map((p) => ({
              value: p.id,
              label: `${p.nome} — ${p.conselho} ${p.numero} · ${p.especialidade}`,
            })),
            { value: MANUAL_PROFESSIONAL_ID, label: "Outro (informar manualmente)" },
          ]}
          hint="Troque o profissional responsável a qualquer momento."
        />
        {children}
      </div>

      {manual && (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1fr_140px_160px_200px]">
          <Field id="profissional-nome" label={labels?.nome ?? "Nome do profissional"} required>
            <Input
              value={value.nome}
              onChange={(e) => onChange({ ...value, nome: e.target.value })}
              autoComplete="name"
            />
          </Field>
          <SelectField
            id="profissional-conselho"
            label={labels?.conselho ?? "Conselho"}
            value={value.conselho}
            onValueChange={(conselho) => onChange({ ...value, conselho })}
            options={COUNCILS.map((c) => ({ value: c, label: c }))}
          />
          <Field id="profissional-numero" label={labels?.numero ?? "Número do conselho"} required>
            <Input
              value={value.numero}
              onChange={(e) => onChange({ ...value, numero: e.target.value })}
              placeholder="0000/UF"
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
      )}
    </div>
  );
}
