#!/usr/bin/env node
/**
 * Lint do design system: falha quando algum componente/rota usa cor fixa,
 * escala de fonte arbitrária ou controle nativo em vez dos tokens e
 * componentes base do sistema.
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

/** Arquivos onde controles nativos e escala arbitrária são legítimos. */
const PRIMITIVES_ALLOWLIST = [
  "src/components/ui", // primitivos do design system
  "src/components/form-field.tsx", // define a escala de rótulos/hints
  "src/components/app-tabs.ts", // define a escala das abas
  "src/features/design-system",
  "src/lib/error-page.ts", // HTML estático de fallback, fora do React
  "src/routes/emitir.tsx", // fac-símile A4 com medidas de impressão
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
  {
    id: "arbitrary-font-size",
    re: /\btext-\[\d+(?:\.\d+)?(?:px|rem|em)\]/g,
    msg: "tamanho de fonte arbitrário — use a escala (text-xs, text-sm, text-base...)",
    allowlist: PRIMITIVES_ALLOWLIST,
  },
  {
    id: "native-control",
    re: /<(?:button|input|textarea|select)(?=[\s/>])/g,
    msg: "controle nativo — use Button/Input/Textarea/SelectField do design system",
    allowlist: PRIMITIVES_ALLOWLIST,
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
  const colorSkipped = ALLOWLIST.some((a) => rel.startsWith(a));
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (line.includes("ds-allow")) return;
    for (const rule of RULES) {
      const skipped = rule.allowlist
        ? rule.allowlist.some((a) => rel.startsWith(a))
        : colorSkipped;
      if (skipped) continue;
      for (const match of line.matchAll(rule.re)) {
        findings.push({ rel, line: i + 1, token: match[0], msg: rule.msg });
      }
    }
  });
}

if (findings.length) {
  console.error(`\n${findings.length} desvio(s) do design system:\n`);
  for (const f of findings) {
    console.error(`  ${f.rel}:${f.line}  ${f.token}  → ${f.msg}`);
  }
  console.error(
    "\nUse os tokens de src/styles.css, a escala tipográfica e os componentes base. Exceções conscientes: comentário // ds-allow-color na linha.\n",
  );
  process.exit(1);
}


console.log("Design system OK — cores, escala tipográfica e componentes base conformes.");
