import { describe, expect, it } from "vitest";

import { auditDocument } from "./audit";

/** Cria um documento isolado com o HTML informado. */
function makeDoc(html: string): Document {
  const doc = document.implementation.createHTMLDocument("qa");
  doc.body.innerHTML = html;
  return doc;
}

describe("auditDocument", () => {
  it("não reporta problemas em documento vazio", () => {
    const report = auditDocument(makeDoc("<p>ok</p>"));

    expect(report.hasHorizontalScroll).toBe(false);
    expect(report.issues).toEqual([]);
  });

  it("limita a lista de ocorrências", () => {
    const report = auditDocument(makeDoc("<span>texto</span>"));

    expect(report.issues.length).toBeLessThanOrEqual(30);
  });
});
