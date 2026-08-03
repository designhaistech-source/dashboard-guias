import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { Switch } from "@/components/ui/switch";

/**
 * Snapshots de layout/estados do Switch do design system.
 * Falhas indicam mudança visual (trilha, thumb ou transições) e devem ser revisadas.
 */
describe("Switch (snapshots)", () => {
  it("estado desligado", () => {
    const { container } = render(<Switch aria-label="Notificações" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("estado ligado", () => {
    const { container } = render(<Switch aria-label="Notificações" checked />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("estado desabilitado e desligado", () => {
    const { container } = render(<Switch aria-label="Notificações" disabled />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("estado desabilitado e ligado", () => {
    const { container } = render(<Switch aria-label="Notificações" checked disabled />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("com className customizada", () => {
    const { container } = render(<Switch aria-label="Notificações" className="h-6 w-11" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
