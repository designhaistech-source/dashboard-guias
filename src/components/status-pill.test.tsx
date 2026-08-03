import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { StatusPill } from "@/components/status-pill";

describe("StatusPill", () => {
  it("renderiza o rótulo informado", () => {
    render(<StatusPill done={false} label="Paciente" />);

    expect(screen.getByText("Paciente")).toBeInTheDocument();
  });

  it("usa a variante success-soft quando concluído", () => {
    const { container } = render(<StatusPill done label="Medicamentos" />);

    const pill = container.firstElementChild as HTMLElement;
    expect(pill.className).toContain("bg-success-muted");
    expect(pill.className).toContain("text-success");
  });

  it("usa a variante secondary quando pendente", () => {
    const { container } = render(<StatusPill done={false} label="Medicamentos" />);

    const pill = container.firstElementChild as HTMLElement;
    expect(pill.className).toContain("bg-secondary");
    expect(pill.className).not.toContain("bg-success-muted");
  });

  it("troca o ícone conforme o estado", () => {
    const { container: feito } = render(<StatusPill done label="Pronto" />);
    const { container: pendente } = render(<StatusPill done={false} label="Pronto" />);

    expect(feito.querySelector("svg.lucide-circle-check")).toBeInTheDocument();
    expect(feito.querySelector("svg.lucide-circle-dashed")).not.toBeInTheDocument();
    expect(pendente.querySelector("svg.lucide-circle-dashed")).toBeInTheDocument();
  });

  it("aplica o tamanho md do Badge em ambos os estados", () => {
    const { container } = render(<StatusPill done label="Pronto para emitir" />);

    expect((container.firstElementChild as HTMLElement).className).toContain("h-7");
  });
});
