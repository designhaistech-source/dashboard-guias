/**
 * Fonte única das regras do design system.
 *
 * Consumidores:
 *   - scripts/visual/check-design-tokens.mjs  (checagem local + CI)
 *   - eslint.config.js                        (feedback no editor / `bun run lint`)
 *   - src/tests/design-system-tokens.test.ts  (suíte automatizada)
 */

/** Arquivos onde valores literais de cor são legítimos. */
export const COLOR_ALLOWLIST = [
  "src/styles.css",
  "src/features/design-system", // documentação: mostra a escala neutra e exemplos de "evite"
  "src/routes/emitir.tsx", // fac-símile de documento impresso (PDF/A4)
];

/** Arquivos onde controles nativos e escalas arbitrárias são legítimos. */
export const PRIMITIVES_ALLOWLIST = [
  "src/components/ui", // primitivos do design system
  "src/components/form-field.tsx", // define a escala de rótulos/hints
  "src/components/app-tabs.ts", // define a escala das abas
  "src/features/design-system",
  "src/lib/error-page.ts", // HTML estático de fallback, fora do React
  "src/routes/emitir.tsx", // fac-símile A4 com medidas de impressão
  // Fac-símiles das guias TISS: reproduzem o formulário oficial impresso, cujas
  // medidas tipográficas em px são normativas e não pertencem à escala da UI.
  "src/features/guides/components/guide-print-primitives.tsx",
  "src/features/guides/sadt/sadt-guide-preview.tsx",
  "src/features/guides/internacao/internacao-guide-preview.tsx",
  "src/features/guides/apac/apac-guide-preview.tsx",
  "src/features/guides/aih/aih-guide-preview.tsx",
];

/** Globs equivalentes ao PRIMITIVES/COLOR allowlist, para o ESLint. */
export const ESLINT_EXEMPT_GLOBS = [
  "src/components/ui/**",
  "src/components/form-field.tsx",
  "src/components/app-tabs.ts",
  "src/features/design-system/**",
  "src/lib/error-page.ts",
  "src/routes/emitir.tsx",
  "src/features/guides/components/guide-print-primitives.tsx",
  "src/features/guides/**/*-guide-preview.tsx",
  "scripts/**",
  "e2e/**",
];

const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";

const SIZE_PREFIXES =
  "w|h|size|min-w|min-h|max-w|max-h|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y|rounded|leading|tracking";

/**
 * Cada regra tem `source` (sem flags) para reuso em ESLint e um `kind`
 * que define qual allowlist se aplica.
 */
export const DESIGN_SYSTEM_RULES = [
  {
    id: "hex-color",
    kind: "color",
    source: String.raw`(?:bg|text|border|fill|stroke|ring|shadow|from|via|to)-\[#[0-9a-fA-F]{3,8}\]`,
    msg: "cor hexadecimal inline — use um token semântico",
  },
  {
    id: "color-function",
    kind: "color",
    source: String.raw`(?:bg|text|border|fill|stroke|ring|shadow|from|via|to)-\[(?:rgb|rgba|hsl|hsla|oklch|lab)\(`,
    msg: "cor literal inline — use um token semântico de src/styles.css",
  },
  {
    id: "absolute-neutral",
    kind: "color",
    source: String.raw`\b(?:bg|text|border|fill|stroke|ring)-(?:white|black)(?:\/\d{1,3})?\b`,
    msg: "branco/preto absoluto — use background, card, foreground ou foreground/50",
  },
  {
    id: "tailwind-palette",
    kind: "color",
    source: String.raw`\b(?:bg|text|border|fill|stroke|ring|from|via|to)-(?:${PALETTE})-\d{2,3}(?:\/\d{1,3})?\b`,
    msg: "cor da paleta padrão do Tailwind — use tokens (primary, success, warning, cat-1...)",
  },
  {
    id: "arbitrary-font-size",
    kind: "primitive",
    source: String.raw`\btext-\[\d+(?:\.\d+)?(?:px|rem|em)\]`,
    msg: "tamanho de fonte arbitrário — use a escala (text-xs, text-sm, text-base...)",
  },
  {
    id: "arbitrary-size",
    kind: "primitive",
    source: String.raw`\b(?:${SIZE_PREFIXES})-\[-?\d+(?:\.\d+)?(?:px|rem|em)\]`,
    msg: "tamanho arbitrário — use a escala de espaçamento/raio (ex.: w-45, min-h-100, rounded-lg)",
  },
  {
    id: "native-control",
    kind: "primitive",
    source: String.raw`<(?:button|input|textarea|select)(?=[\s/>])`,
    msg: "controle nativo — use Button/Input/Textarea/SelectField do design system",
  },
];

/** Marcador de exceção consciente na linha. */
export const ALLOW_MARKER = "ds-allow";

/**
 * Executa as regras sobre o conteúdo de um arquivo.
 * @param {string} relPath caminho relativo à raiz (com "/")
 * @param {string} content
 * @returns {{ rel: string, line: number, token: string, msg: string, id: string }[]}
 */
export function scanFile(relPath, content) {
  const findings = [];
  content.split("\n").forEach((line, i) => {
    if (line.includes(ALLOW_MARKER)) return;
    for (const rule of DESIGN_SYSTEM_RULES) {
      const allowlist =
        rule.kind === "color" ? COLOR_ALLOWLIST : PRIMITIVES_ALLOWLIST;
      if (allowlist.some((a) => relPath.startsWith(a))) continue;
      for (const match of line.matchAll(new RegExp(rule.source, "g"))) {
        findings.push({
          rel: relPath,
          line: i + 1,
          token: match[0],
          msg: rule.msg,
          id: rule.id,
        });
      }
    }
  });
  return findings;
}
