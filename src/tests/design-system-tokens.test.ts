import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

// @ts-expect-error módulo .mjs compartilhado com o ESLint e o script de CI
import { DESIGN_SYSTEM_RULES, scanFile } from "../../scripts/visual/design-system-rules.mjs";

/**
 * Guard-rail de design system: nenhuma cor fixa nem tamanho arbitrário
 * (fonte, espaçamento, dimensão, raio) fora dos primitivos e fac-símiles.
 */

type Finding = { rel: string; line: number; token: string; msg: string; id: string };
type Rule = { id: string; msg: string };

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

function collectFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) collectFiles(full, acc);
    else if (/\.(tsx?|css)$/.test(entry) && !entry.includes(".test.")) acc.push(full);
  }
  return acc;
}

const findings: Finding[] = collectFiles(SRC).flatMap((file) =>
  scanFile(relative(ROOT, file).replaceAll("\\", "/"), readFileSync(file, "utf8")),
);

const format = (list: Finding[]) => list.map((f) => `${f.rel}:${f.line} → ${f.token} (${f.msg})`);

describe("design system: tokens e escalas", () => {
  it("audita arquivos de UI", () => {
    expect(collectFiles(SRC).length).toBeGreaterThan(0);
  });

  for (const rule of DESIGN_SYSTEM_RULES as Rule[]) {
    if (rule.id === "native-control") continue; // coberto por design-system-controls.test.ts

    it(`não viola a regra "${rule.id}"`, () => {
      const offenders = findings.filter((f) => f.id === rule.id);
      expect(offenders.length, [rule.msg, ...format(offenders)].join("\n")).toBe(0);
    });
  }
});
