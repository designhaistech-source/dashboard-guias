import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guard-rail de design system: nenhum arquivo da aplicação deve renderizar um
 * `<button>` nativo. Primitivos do design system (src/components/ui) e casos
 * conscientes marcados com `ds-allow` são as únicas exceções permitidas.
 */

const ROOT = join(process.cwd(), "src");

/** Diretórios que contêm primitivos do design system ou não geram UI da app. */
const IGNORED_DIRS = ["components/ui", "tests"];

/** Arquivos com HTML estático fora do React (ex.: página de erro do servidor). */
const IGNORED_FILES = ["lib/error-page.ts"];

const SOURCE_EXTENSIONS = [".ts", ".tsx"];

/** Marcador que documenta um `<button>` nativo intencional. */
const ALLOW_MARKER = "ds-allow";

/** Quantas linhas ao redor da abertura da tag aceitam o marcador. */
const MARKER_LOOKAROUND = 3;

function collectSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const relPath = relative(ROOT, fullPath).replaceAll("\\", "/");

    if (statSync(fullPath).isDirectory()) {
      if (IGNORED_DIRS.some((ignored) => relPath === ignored)) continue;
      collectSourceFiles(fullPath, acc);
      continue;
    }

    if (IGNORED_FILES.includes(relPath)) continue;
    if (relPath.includes(".test.")) continue;
    if (!SOURCE_EXTENSIONS.some((ext) => relPath.endsWith(ext))) continue;

    acc.push(fullPath);
  }
  return acc;
}

function findUnmarkedNativeButtons(filePath: string): string[] {
  const lines = readFileSync(filePath, "utf8").split("\n");
  const relPath = relative(ROOT, filePath).replaceAll("\\", "/");
  const offenders: string[] = [];

  lines.forEach((line, index) => {
    if (!/<button[\s>/]/.test(line)) return;

    const start = Math.max(0, index - MARKER_LOOKAROUND);
    const end = Math.min(lines.length, index + MARKER_LOOKAROUND + 1);
    const context = lines.slice(start, end).join("\n");
    if (context.includes(ALLOW_MARKER)) return;

    offenders.push(`src/${relPath}:${index + 1} → ${line.trim()}`);
  });

  return offenders;
}

describe("design system: botões", () => {
  const files = collectSourceFiles(ROOT);

  it("encontra arquivos de UI para auditar", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("não usa <button> nativo sem marcação ds-allow", () => {
    const offenders = files.flatMap(findUnmarkedNativeButtons);

    expect(
      offenders,
      [
        "Use o componente <Button> de @/components/ui/button.",
        `Se o <button> nativo for intencional, documente com um comentário "${ALLOW_MARKER}: motivo" na própria tag.`,
        "Ocorrências:",
        ...offenders,
      ].join("\n"),
    ).toEqual([]);
  });
});
