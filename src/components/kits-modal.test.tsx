import { describe, expect, it, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { KitsModal } from "./kits-modal";
import type { Kit } from "@/lib/kits";

const NOME_LONGO =
  "Kit pós-operatório ortopédico com analgesia multimodal prolongada";

const kits: Kit[] = [
  {
    id: "k1",
    nome: NOME_LONGO,
    categoria: "Cirurgia",
    descricao:
      "Descrição longa o suficiente para exigir line-clamp em telas estreitas do modal de kits.",
    favorito: true,
    usos: 12,
    atualizadoEm: Date.now() - 86400000,
    itens: [{ med: { nome: "Dipirona 500mg" }, posologia: "1cp 6/6h" }],
  } as unknown as Kit,
];

vi.mock("@/lib/kits", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/kits")>();
  return {
    ...actual,
    loadKits: () => kits,
    deleteKit: vi.fn(),
    toggleFavorito: vi.fn(),
    upsertKit: vi.fn(),
  };
});

beforeAll(() => {
  // Radix usa APIs que o jsdom não implementa
  Element.prototype.scrollIntoView = vi.fn();
  window.HTMLElement.prototype.hasPointerCapture = vi.fn();
});

function renderModal() {
  return render(
    <KitsModal open onClose={() => {}} onAplicar={() => {}} currentCount={0} />,
  );
}

describe("KitsModal — responsividade", () => {
  it("trunca o título do kit em vez de quebrar o layout", () => {
    renderModal();
    const titulo = screen.getByRole("heading", { name: NOME_LONGO });
    expect(titulo.className).toContain("truncate");
    expect(titulo.className).toContain("text-sm");
  });

  it("mantém a descrição limitada a duas linhas", () => {
    renderModal();
    const descricao = screen.getByText(/Descrição longa o suficiente/i);
    expect(descricao.className).toContain("line-clamp-2");
  });

  it("permite que o cartão quebre em linhas no mobile", () => {
    renderModal();
    const titulo = screen.getByRole("heading", { name: NOME_LONGO });
    const conteudo = titulo.parentElement!.parentElement!;
    const cartao = conteudo.parentElement!;

    expect(cartao.className).toContain("flex-wrap");
    // Conteúdo ocupa a largura toda no mobile e volta a dividir a linha em sm
    expect(conteudo.className).toContain("min-w-0");
    expect(conteudo.className).toContain("basis-[calc(100%-3rem)]");
    expect(conteudo.className).toContain("sm:basis-auto");
  });

  it("alinha os botões em linha própria abaixo de sm e ao lado em sm+", () => {
    renderModal();
    const aplicar = screen.getByRole("button", { name: /aplicar/i });
    const acoes = aplicar.parentElement!;

    expect(acoes.className).toContain("w-full");
    expect(acoes.className).toContain("justify-end");
    expect(acoes.className).toContain("sm:w-auto");
    expect(acoes.className).toContain("shrink-0");

    // Duplicar e excluir permanecem na mesma linha do botão primário
    expect(acoes).toContainElement(
      screen.getByRole("button", { name: /duplicar/i }),
    );
    expect(acoes).toContainElement(
      screen.getByRole("button", { name: /excluir/i }),
    );
  });

  it("evita quebra dentro dos metadados do kit", () => {
    renderModal();
    const meds = screen.getByText(/1 medicamento/i);
    expect(meds.className).toContain("whitespace-nowrap");
    expect(screen.getByText(/12 usos/i).className).toContain(
      "whitespace-nowrap",
    );
  });

  it("mantém a categoria como chip que não encolhe", () => {
    renderModal();
    const categoria = screen.getByText("Cirurgia", {
      selector: "span.rounded-full",
    });
    expect(categoria.className).toContain("shrink-0");
  });
});
