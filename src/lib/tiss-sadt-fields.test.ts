import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  extractTissLabels,
  missingTissFields,
  validateTissLabels,
} from "./tiss-sadt-fields";

const SOURCES = [
  "src/routes/emitir.tsx",
  "src/features/professional/components/professional-picker.tsx",
];

function readSources(): string {
  return SOURCES.map((file) => {
    try {
      return readFileSync(resolve(process.cwd(), file), "utf8");
    } catch {
      return "";
    }
  }).join("\n");
}

describe("Rótulos da guia TISS SP/SADT", () => {
  const labels = extractTissLabels(readSources());
  const result = validateTissLabels(labels);

  it("encontra rótulos numerados na tela de emissão", () => {
    expect(labels.length).toBeGreaterThan(30);
  });

  it("usa exatamente a numeração e o texto do formulário oficial", () => {
    const report = result.issues
      .map((i) =>
        i.reason === "unknown-field"
          ? `campo inexistente na guia: "${i.label}"`
          : `"${i.label}" deveria ser "${i.expected}"`,
      )
      .join("\n");
    expect(report, `Divergências encontradas:\n${report}`).toBe("");
  });

  it("cobre todos os campos da guia oficial", () => {
    const missing = missingTissFields(result.checkedFields);
    expect(missing, `Campos ausentes na tela: ${missing.join(", ")}`).toEqual([]);
  });
});
