/**
 * Canonical field dictionary of the official TISS SP/SADT guide
 * ("Guia de Serviço Profissional / Serviço Auxiliar de Diagnóstico e Terapia").
 *
 * This is the single source of truth used to validate that every label rendered
 * in the issuing form and in the generated guide preview matches the printed
 * form exactly (number + wording). Any label drift breaks the audit test in
 * `tiss-sadt-fields.test.ts`.
 */
export const TISS_SADT_FIELDS: Readonly<Record<number, string>> = {
  1: "Registro ANS",
  2: "Nº Guia no Prestador",
  3: "Número da Guia Principal",
  4: "Data da Autorização",
  5: "Senha",
  6: "Data de Validade da Senha",
  7: "Número da Guia Atribuído pela Operadora",
  8: "Número da Carteira",
  9: "Validade da Carteira",
  10: "Nome",
  11: "Cartão Nacional de Saúde",
  12: "Atendimento a RN",
  13: "Código na Operadora",
  14: "Nome do Contratado",
  15: "Nome do Profissional Solicitante",
  16: "Conselho Profissional",
  17: "Número no Conselho",
  18: "UF",
  19: "Código CBO",
  20: "Assinatura do Profissional Solicitante",
  21: "Caráter do Atendimento",
  22: "Data da Solicitação",
  23: "Indicação Clínica",
  24: "Tabela",
  25: "Código do Procedimento ou Item Assistencial",
  26: "Descrição",
  27: "Qtde. Solic.",
  28: "Qtde. Aut.",
  29: "Código na Operadora",
  30: "Nome do Contratado",
  31: "Código CNES",
  32: "Tipo de Atendimento",
  33: "Indicação de Acidente (acidente ou doença relacionada)",
  34: "Tipo de Consulta",
  35: "Motivo de Encerramento do Atendimento",
  36: "Data",
  37: "Hora Inicial",
  38: "Hora Final",
  39: "Tabela",
  40: "Código do Procedimento",
  41: "Descrição",
  42: "Qtde.",
  43: "Via",
  44: "Tec.",
  45: "Fator Red./Acresc.",
  46: "Valor Unitário (R$)",
  47: "Valor Total (R$)",
  48: "Seq. Ref.",
  49: "Grau Part.",
  50: "Código na Operadora / CPF",
  51: "Nome do Profissional",
  52: "Conselho Profissional",
  53: "Número no Conselho",
  54: "UF",
  55: "Código CBO",
  56: "Data de Realização de Procedimentos em Série",
  57: "Assinatura do Beneficiário ou Responsável",
  58: "Observação / Justificativa",
  59: "Total de Procedimentos (R$)",
  60: "Total de Taxas e Aluguéis (R$)",
  61: "Total de Materiais (R$)",
  62: "Total de OPME (R$)",
  63: "Total de Medicamentos (R$)",
  64: "Total de Gases Medicinais (R$)",
  65: "Total Geral (R$)",
  66: "Assinatura do Responsável pela Autorização",
  67: "Assinatura do Beneficiário ou Responsável",
  68: "Assinatura do Contratado",
};

/** Field numbers that intentionally have no rendered label (signature drawn by hand on print). */
export const TISS_FIELDS_WITHOUT_LABEL: readonly number[] = [20];

/** Builds the canonical rendered label, e.g. `1 - Registro ANS`. */
export function formatTissLabel(field: number): string {
  const name = TISS_SADT_FIELDS[field];
  if (!name) throw new Error(`Campo TISS inexistente: ${field}`);
  return `${field} - ${name}`;
}

export type TissLabelIssue = {
  label: string;
  field: number;
  expected: string | null;
  reason: "unknown-field" | "wording-mismatch";
};

/**
 * Validates a list of rendered labels (`"N - Nome do campo"`), optionally
 * accepting combined labels such as `"37 - Hora Inicial / 38 - Hora Final"`.
 */
export function validateTissLabels(labels: readonly string[]): {
  ok: boolean;
  issues: TissLabelIssue[];
  checkedFields: number[];
} {
  const issues: TissLabelIssue[] = [];
  const checkedFields: number[] = [];

  for (const raw of labels) {
    // Composite labels such as "37 - Hora Inicial / 38 - Hora Final" are split
    // only where a new field number starts, so names containing " / " survive.
    for (const part of raw.split(/\s\/\s(?=\d{1,2}\s-\s)/)) {
      const label = part.trim();
      const match = /^(\d{1,2})\s-\s(.+)$/.exec(label);
      if (!match) continue;
      const field = Number(match[1]);
      const name = match[2].trim();
      const expected = TISS_SADT_FIELDS[field];
      if (!expected) {
        issues.push({ label, field, expected: null, reason: "unknown-field" });
        continue;
      }
      checkedFields.push(field);
      if (name !== expected) {
        issues.push({ label, field, expected: formatTissLabel(field), reason: "wording-mismatch" });
      }
    }
  }

  return { ok: issues.length === 0, issues, checkedFields: [...new Set(checkedFields)].sort((a, b) => a - b) };
}

/**
 * Extracts every field label occurrence from a source file's text, covering both
 * inline labels (`"58 - Observação / Justificativa"`) and tuple definitions
 * (`["59", "Total de Procedimentos (R$)"]`) used to render the guide totals.
 */
export function extractTissLabels(source: string): string[] {
  const inline = [...source.matchAll(/\d{1,2}\s-\s[^"'`<>{}\n]+/g)].map((m) => m[0]);
  const tuples = [...source.matchAll(/\[\s*"(\d{1,2})"\s*,\s*"([^"]+)"\s*\]/g)].map(
    (m) => `${m[1]} - ${m[2]}`,
  );
  return [...inline, ...tuples]
    .map((l) => l.trim().replace(/\s+/g, " "))
    .filter((l) => /^\d{1,2}\s-\s\S/.test(l));
}


/** Field numbers that must appear somewhere in the issuing screen. */
export function missingTissFields(checkedFields: readonly number[]): number[] {
  const present = new Set(checkedFields);
  return Object.keys(TISS_SADT_FIELDS)
    .map(Number)
    .filter((n) => !present.has(n) && !TISS_FIELDS_WITHOUT_LABEL.includes(n));
}
