#!/usr/bin/env node
/**
 * Lint do design system: falha quando algum componente/rota usa cor fixa,
 * tamanho arbitrário (fonte, espaçamento, dimensão, raio) ou controle nativo
 * em vez dos tokens e componentes base do sistema.
 *
 * Regras centralizadas em scripts/visual/design-system-rules.mjs.
 * Uso: node scripts/visual/check-design-tokens.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { ALLOW_MARKER, scanFile } from "./design-system-rules.mjs";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (/\.(tsx?|css)$/.test(entry)) files.push(full);
  }
  return files;
}

const findings = [];
for (const file of walk(SRC)) {
  const rel = relative(ROOT, file).replaceAll("\\", "/");
  if (rel.includes(".test.")) continue;
  findings.push(...scanFile(rel, readFileSync(file, "utf8")));
}

if (findings.length) {
  console.error(`\n${findings.length} desvio(s) do design system:\n`);
  for (const f of findings) {
    console.error(`  ${f.rel}:${f.line}  ${f.token}  → ${f.msg}`);
  }
  console.error(
    `\nUse os tokens de src/styles.css, a escala tipográfica/espacial e os componentes base. Exceções conscientes: comentário "${ALLOW_MARKER}: motivo" na linha.\n`,
  );
  process.exit(1);
}

console.log("Design system OK — cores, escalas de tamanho e componentes base conformes.");
