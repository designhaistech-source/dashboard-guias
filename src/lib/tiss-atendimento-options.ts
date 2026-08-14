/**
 * Opções dos campos 90, 91 e 92 da guia TISS SP/SADT.
 * Extraídas em módulo próprio para reuso e teste automatizado.
 */

export interface TissOption {
  value: string;
  label: string;
}

/** Campo 90 — Indicador de Cobertura Especial (domínio TISS nº 75). */
export const COBERTURA_ESPECIAL_OPTIONS: readonly TissOption[] = [
  { value: "01", label: "01 - Gestante" },
  { value: "02", label: "02 - Pré-operatório" },
  { value: "03", label: "03 - Pós-operatório" },
] as const;

/** Campo 91 — Regime de atendimento (domínio TISS nº 76). */
export const REGIME_ATENDIMENTO_OPTIONS: readonly TissOption[] = [
  { value: "01", label: "01 - Ambulatorial" },
  { value: "02", label: "02 - Domiciliar" },
  { value: "03", label: "03 - Internação" },
  { value: "04", label: "04 - Pronto-socorro" },
  { value: "05", label: "05 - Telessaúde" },
] as const;

/** Campo 92 — Saúde Ocupacional (domínio TISS nº 77). */
export const SAUDE_OCUPACIONAL_OPTIONS: readonly TissOption[] = [
  { value: "01", label: "01 - Admissional" },
  { value: "02", label: "02 - Demissional" },
  { value: "03", label: "03 - Periódico" },
  { value: "04", label: "04 - Retorno ao trabalho" },
  { value: "05", label: "05 - Mudança de função" },
  { value: "06", label: "06 - Promoção à saúde" },
] as const;

/** Valor sentinela usado apenas no select para limpar o campo 92 (opcional). */
export const SAUDE_OCUPACIONAL_NONE = "none";

/** Códigos aceitos no campo 92 (vazio = não informado). */
export const SAUDE_OCUPACIONAL_CODES = new Set<string>(
  SAUDE_OCUPACIONAL_OPTIONS.map((o) => o.value),
);

/** Campo 92 é opcional, mas quando informado precisa ser um código do domínio 77. */
export function isSaudeOcupacionalValid(value: string): boolean {
  return value === "" || SAUDE_OCUPACIONAL_CODES.has(value);
}

/** Normaliza a escolha do select do campo 92 para o valor persistido. */
export function normalizeSaudeOcupacional(value: string): string {
  return value === SAUDE_OCUPACIONAL_NONE || !SAUDE_OCUPACIONAL_CODES.has(value)
    ? ""
    : value;
}

/** Texto exato da opção selecionada, usado na guia. */
export function findOptionLabel(
  options: readonly TissOption[],
  value: string,
): string {
  return options.find((o) => o.value === value)?.label ?? "";
}
