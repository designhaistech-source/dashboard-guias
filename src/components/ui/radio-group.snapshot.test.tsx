import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

/**
 * Snapshots de layout/estados do RadioGroup do design system.
 * Falhas indicam mudança visual (classes, estrutura ou indicador) e devem ser revisadas.
 */
function Group({
  value,
  disabled,
  itemDisabled,
  className,
}: {
  value?: string;
  disabled?: boolean;
  itemDisabled?: boolean;
  className?: string;
}) {
  return (
    <RadioGroup value={value} disabled={disabled} className={className}>
      <div>
        <RadioGroupItem value="comum" id="comum" disabled={itemDisabled} />
        <Label htmlFor="comum">Receita comum</Label>
      </div>
      <div>
        <RadioGroupItem value="especial" id="especial" />
        <Label htmlFor="especial">Receita especial</Label>
      </div>
    </RadioGroup>
  );
}

describe("RadioGroup (snapshots)", () => {
  it("estado padrão (nenhum selecionado)", () => {
    const { container } = render(<Group />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("estado com item selecionado", () => {
    const { container } = render(<Group value="comum" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("estado com grupo desabilitado", () => {
    const { container } = render(<Group value="comum" disabled />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("estado com item individual desabilitado", () => {
    const { container } = render(<Group itemDisabled />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("com className customizada no grupo", () => {
    const { container } = render(<Group className="grid-cols-2 gap-4" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
