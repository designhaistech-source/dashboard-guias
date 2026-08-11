import { afterEach, describe, expect, it, vi } from "vitest";

import {
  GUIDE_SHEET_WIDTH_PX,
  PRINT_CONTENT_HEIGHT_PX,
  PRINT_CONTENT_WIDTH_PX,
  PRINT_SHEET_CSS,
  getGuideSheetScale,
} from "@/lib/guide-sheet";

import { PRINT_FAILURE_MESSAGES, printGuideMarkup } from "./print-guide";

const MARKUP = '<div class="guide"><h1>Guia SP/SADT</h1></div>';

afterEach(() => {
  vi.restoreAllMocks();
  document.querySelectorAll("iframe").forEach((frame) => frame.remove());
});

/** Captura o documento gerado dentro do iframe antes de ele ser removido. */
async function renderPrintDocument(markup = MARKUP) {
  const created: HTMLIFrameElement[] = [];
  const originalAppend = document.body.appendChild.bind(document.body);
  vi.spyOn(document.body, "appendChild").mockImplementation((node) => {
    const appended = originalAppend(node as Node);
    if (node instanceof HTMLIFrameElement) created.push(node);
    return appended as never;
  });

  const result = await printGuideMarkup(markup, 'Guia 123 "A" <b>');
  const doc = created[0]?.contentDocument ?? null;
  return { result, doc };
}

describe("PRINT_SHEET_CSS", () => {
  it("declara página em paisagem e o container de escala da guia", () => {
    expect(PRINT_SHEET_CSS).toContain("@page");
    expect(PRINT_SHEET_CSS).toContain("landscape");
    expect(PRINT_SHEET_CSS).toContain(".print-guard");
    expect(PRINT_SHEET_CSS).toContain(`min-width: ${GUIDE_SHEET_WIDTH_PX}px`);
  });

  it("tem chaves balanceadas (CSS sintaticamente válido)", () => {
    const open = (PRINT_SHEET_CSS.match(/{/g) ?? []).length;
    const close = (PRINT_SHEET_CSS.match(/}/g) ?? []).length;
    expect(open).toBeGreaterThan(0);
    expect(open).toBe(close);
  });

  it("é aceito pelo parser de CSS do navegador sem regras inválidas", () => {
    const style = document.createElement("style");
    style.textContent = PRINT_SHEET_CSS;
    document.head.appendChild(style);
    const sheet = style.sheet;
    expect(sheet).not.toBeNull();
    expect(sheet!.cssRules.length).toBeGreaterThan(0);
    style.remove();
  });
});

describe("getGuideSheetScale", () => {
  it("nunca amplia a guia além de 1:1", () => {
    expect(getGuideSheetScale(200, 100)).toBe(1);
  });

  it("mantém a guia dentro da área útil do papel", () => {
    const scale = getGuideSheetScale(GUIDE_SHEET_WIDTH_PX, 900);
    expect(scale).toBeGreaterThan(0);
    expect(GUIDE_SHEET_WIDTH_PX * scale).toBeLessThanOrEqual(PRINT_CONTENT_WIDTH_PX + 0.01);
    expect(900 * scale).toBeLessThanOrEqual(PRINT_CONTENT_HEIGHT_PX + 0.01);
  });
});

describe("printGuideMarkup", () => {
  it("gera um documento HTML válido com o markup da guia", async () => {
    const { doc } = await renderPrintDocument();

    expect(doc).not.toBeNull();
    expect(doc!.documentElement.lang).toBe("pt-BR");
    expect(doc!.querySelector(".print-guard")).not.toBeNull();
    expect(doc!.querySelector(".print-scale")).not.toBeNull();
    expect(doc!.querySelector(".print-scale")!.innerHTML).toContain("Guia SP/SADT");
    expect(doc!.querySelectorAll("style").length).toBeGreaterThanOrEqual(2);
  });

  it("escapa o título para não injetar HTML", async () => {
    const { doc } = await renderPrintDocument();
    expect(doc!.title).toBe('Guia 123 "A" <b>');
    expect(doc!.querySelector("head b")).toBeNull();
  });

  it("retorna erro tratado quando não há markup", async () => {
    const result = await printGuideMarkup("   ", "Guia");
    expect(result).toEqual({ ok: false, reason: "empty-markup" });
  });

  it("retorna erro tratado quando o navegador bloqueia a impressão", async () => {
    vi.spyOn(
      HTMLIFrameElement.prototype,
      "contentWindow",
      "get",
    ).mockReturnValue(null);

    const result = await printGuideMarkup(MARKUP, "Guia");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("print-blocked");
  });

  it("expõe mensagem em PT-BR para todos os motivos de falha", () => {
    for (const message of Object.values(PRINT_FAILURE_MESSAGES)) {
      expect(message.length).toBeGreaterThan(10);
    }
  });
});
