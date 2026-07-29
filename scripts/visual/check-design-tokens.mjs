#!/usr/bin/env node
/**
 * Lint do design system: falha quando algum componente/rota usa cor fixa
 * em vez dos tokens semânticos definidos em src/styles.css.
 *
 * Uso: node scripts/visual/check-design-tokens.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

/** Arquivos onde valores literais de cor são legítimos. */
const ALLOWLIST = [
  "src/styles.css",
  "src/features/design-system", // documentação: mostra a escala neutra e exemplos de "evite"
  "src/routes/emitir.tsx", // fac-símile de documento impresso (PDF/A4)
];

const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";

const RULES = [
  {
    id: "hex-color",
    re: /(?:bg|text|border|fill|stroke|ring|shadow|from|via|to)-\[#[0-9a-fA-F]{3,8}\]/g,
    msg: "cor hexadecimal inline — use um token semântico",
  },
  {
    id: "absolute-neutral",
    re: /\b(?:bg|text|border|fill|stroke|ring)-(?:white|black)(?:\/\d{1,3})?\b/g,
    msg: "branco/preto absoluto — use background, card, foreground ou foreground/50",
  },
  {
    id: "tailwind-palette",
    re: new RegExp(
      `\\b(?:bg|text|border|fill|stroke|ring|from|via|to)-(?:${PALETTE})-\\d{2,3}(?:\\/\\d{1,3})?\\b`,
      "g",
    ),
    msg: "cor da paleta padrão do Tailwind — use tokens (primary, success, warning, cat-1...)",
  },
];

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
  if (ALLOWLIST.some((a) => rel.startsWith(a))) continue;
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (line.includes("ds-allow-color")) return;
    for (const rule of RULES) {
      for (const match of line.matchAll(rule.re)) {
        findings.push({ rel, line: i + 1, token: match[0], msg: rule.msg });
      }
    }
  });
}

if (findings.length) {
  console.error(`\n${findings.length} uso(s) de cor fora do design system:\n`);
  for (const f of findings) {
    console.error(`  ${f.rel}:${f.line}  ${f.token}  → ${f.msg}`);
  }
  console.error(
    "\nAdicione um token em src/styles.css ou use os existentes. Exceções conscientes: comentário // ds-allow-color na linha.\n",
  );
  process.exit(1);
}

console.log("Design tokens OK — nenhuma cor fixa encontrada em src/.");
