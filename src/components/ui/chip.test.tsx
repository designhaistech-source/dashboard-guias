import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Chip, chipVariants } from "@/components/ui/chip";

describe("Chip", () => {
  it("renderiza como botão do tipo button por padrão", () => {
    render(<Chip>Favoritos</Chip>);

    const chip = screen.getByRole("button", { name: "Favoritos" });
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveAttribute("type", "button");
    expect(chip).toHaveClass("cursor-pointer");
  });

  it("aplica as classes da variante default e do tamanho md", () => {
    render(<Chip>Todos</Chip>);

    const chip = screen.getByRole("button", { name: "Todos" });
    expect(chip.className).toContain("bg-background");
    expect(chip.className).toContain("text-muted-foreground");
    expect(chip.className).toContain("px-3");
  });

  it.each([
    ["selected", "bg-primary"],
    ["soft", "bg-primary/10"],
    ["warning", "bg-warning/15"],
    ["outline", "bg-card"],
  ] as const)("aplica o token semântico da variante %s", (variant, token) => {
    render(<Chip variant={variant}>Item</Chip>);

    expect(screen.getByRole("button", { name: "Item" }).className).toContain(token);
  });

  it.each([
    ["sm", "px-2.5"],
    ["md", "px-3"],
  ] as const)("aplica o espaçamento do tamanho %s", (size, token) => {
    render(<Chip size={size}>Item</Chip>);

    expect(screen.getByRole("button", { name: "Item" }).className).toContain(token);
  });

  it("renderiza como span sem papel de botão quando asSpan é true", () => {
    render(<Chip asSpan>Estático</Chip>);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    const chip = screen.getByText("Estático");
    expect(chip.tagName).toBe("SPAN");
    expect(chip.className).toContain("rounded-full");
    expect(chip.className).not.toContain("cursor-pointer");
  });

  it("ignora onClick e disabled quando renderizado como span", async () => {
    const onClick = vi.fn();
    render(
      <Chip asSpan disabled onClick={onClick}>
        Estático
      </Chip>,
    );

    const chip = screen.getByText("Estático");
    expect(chip).not.toHaveAttribute("disabled");
    await userEvent.click(chip);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("dispara onClick ao ser clicado", async () => {
    const onClick = vi.fn();
    render(<Chip onClick={onClick}>Clicável</Chip>);

    await userEvent.click(screen.getByRole("button", { name: "Clicável" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("não dispara onClick quando desabilitado", async () => {
    const onClick = vi.fn();
    render(
      <Chip disabled onClick={onClick}>
        Desabilitado
      </Chip>,
    );

    const chip = screen.getByRole("button", { name: "Desabilitado" });
    expect(chip).toBeDisabled();
    await userEvent.click(chip);
    expect(onClick).not.toHaveBeenCalled();
    expect(chip.className).toContain("disabled:opacity-50");
  });

  it("mantém as classes customizadas passadas via className", () => {
    render(<Chip className="py-1.5">Custom</Chip>);

    expect(screen.getByRole("button", { name: "Custom" }).className).toContain("py-1.5");
  });

  it("expõe chipVariants com os defaults do design system", () => {
    expect(chipVariants()).toContain("bg-background");
    expect(chipVariants({ variant: "selected" })).toContain("text-primary-foreground");
  });
});
