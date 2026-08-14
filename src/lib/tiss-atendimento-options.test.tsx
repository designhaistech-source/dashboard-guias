import { beforeAll, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SelectField } from "@/components/form-field";
import {
  COBERTURA_ESPECIAL_OPTIONS,
  REGIME_ATENDIMENTO_OPTIONS,
  SAUDE_OCUPACIONAL_NONE,
  SAUDE_OCUPACIONAL_OPTIONS,
  findOptionLabel,
  isSaudeOcupacionalValid,
  normalizeSaudeOcupacional,
} from "./tiss-atendimento-options";

beforeAll(() => {
  // Radix Select depende de APIs ausentes no jsdom
  Element.prototype.scrollIntoView = vi.fn();
  window.HTMLElement.prototype.hasPointerCapture = vi.fn();
  window.HTMLElement.prototype.releasePointerCapture = vi.fn();
});

/** Harness mínimo que reproduz o comportamento controlado usado em Emitir guia. */
function SelectHarness({
  label,
  options,
  optionalNone,
  onChange,
}: {
  label: string;
  options: readonly { value: string; label: string }[];
  optionalNone?: boolean;
  onChange?: (value: string) => void;
}) {
  const [value, setValue] = useState("");
  return (
    <>
      <SelectField
        id="campo"
        label={label}
        placeholder="Selecione"
        value={optionalNone && value === "" ? SAUDE_OCUPACIONAL_NONE : value}
        onValueChange={(v) => {
          const next = optionalNone ? normalizeSaudeOcupacional(v) : v;
          setValue(next);
          onChange?.(next);
        }}
        options={
          optionalNone
            ? [{ value: SAUDE_OCUPACIONAL_NONE, label: "Não se aplica" }, ...options]
            : [...options]
        }
      />
      <output data-testid="valor">{value}</output>
    </>
  );
}

async function openSelect() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("combobox"));
  return user;
}

describe("Campo 90 — Indicador de Cobertura Especial", () => {
  it("renderiza as três opções do domínio 75", async () => {
    render(
      <SelectHarness
        label="90 - Indicador de Cobertura Especial"
        options={COBERTURA_ESPECIAL_OPTIONS}
      />,
    );
    await openSelect();
    for (const option of COBERTURA_ESPECIAL_OPTIONS) {
      expect(await screen.findByRole("option", { name: option.label })).toBeTruthy();
    }
  });

  it("salva o código escolhido", async () => {
    const onChange = vi.fn();
    render(
      <SelectHarness
        label="90 - Indicador de Cobertura Especial"
        options={COBERTURA_ESPECIAL_OPTIONS}
        onChange={onChange}
      />,
    );
    const user = await openSelect();
    await user.click(await screen.findByRole("option", { name: "02 - Pré-operatório" }));
    await waitFor(() => expect(screen.getByTestId("valor").textContent).toBe("02"));
    expect(onChange).toHaveBeenCalledWith("02");
  });
});

describe("Campo 91 — Regime de atendimento", () => {
  it("renderiza as cinco opções do domínio 76", async () => {
    render(
      <SelectHarness
        label="91 - Regime de atendimento"
        options={REGIME_ATENDIMENTO_OPTIONS}
      />,
    );
    await openSelect();
    const options = await screen.findAllByRole("option");
    expect(options).toHaveLength(REGIME_ATENDIMENTO_OPTIONS.length);
  });

  it("salva o código escolhido e resolve o texto exibido na guia", async () => {
    render(
      <SelectHarness
        label="91 - Regime de atendimento"
        options={REGIME_ATENDIMENTO_OPTIONS}
      />,
    );
    const user = await openSelect();
    await user.click(await screen.findByRole("option", { name: "05 - Telessaúde" }));
    await waitFor(() => expect(screen.getByTestId("valor").textContent).toBe("05"));
    expect(findOptionLabel(REGIME_ATENDIMENTO_OPTIONS, "05")).toBe("05 - Telessaúde");
  });
});

describe("Campo 92 — Saúde Ocupacional", () => {
  it("renderiza as seis opções do domínio 77 mais 'Não se aplica'", async () => {
    render(
      <SelectHarness
        label="92 - Saúde Ocupacional"
        options={SAUDE_OCUPACIONAL_OPTIONS}
        optionalNone
      />,
    );
    await openSelect();
    const options = await screen.findAllByRole("option");
    expect(options).toHaveLength(SAUDE_OCUPACIONAL_OPTIONS.length + 1);
    expect(screen.getByRole("option", { name: "Não se aplica" })).toBeTruthy();
  });

  it("salva o código escolhido", async () => {
    render(
      <SelectHarness
        label="92 - Saúde Ocupacional"
        options={SAUDE_OCUPACIONAL_OPTIONS}
        optionalNone
      />,
    );
    const user = await openSelect();
    await user.click(await screen.findByRole("option", { name: "04 - Retorno ao trabalho" }));
    await waitFor(() => expect(screen.getByTestId("valor").textContent).toBe("04"));
  });

  it("limpa o valor ao escolher 'Não se aplica'", async () => {
    render(
      <SelectHarness
        label="92 - Saúde Ocupacional"
        options={SAUDE_OCUPACIONAL_OPTIONS}
        optionalNone
      />,
    );
    const user = await openSelect();
    await user.click(await screen.findByRole("option", { name: "03 - Periódico" }));
    await waitFor(() => expect(screen.getByTestId("valor").textContent).toBe("03"));
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Não se aplica" }));
    await waitFor(() => expect(screen.getByTestId("valor").textContent).toBe(""));
  });

  it("valida apenas códigos do domínio 77 (vazio é permitido)", () => {
    expect(isSaudeOcupacionalValid("")).toBe(true);
    expect(isSaudeOcupacionalValid("06")).toBe(true);
    expect(isSaudeOcupacionalValid("99")).toBe(false);
    expect(normalizeSaudeOcupacional(SAUDE_OCUPACIONAL_NONE)).toBe("");
  });
});
