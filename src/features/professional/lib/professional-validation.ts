import { z } from "zod";

import { COUNCILS } from "../data/professionals";
import type { ProfessionalValue } from "./professional";

/** UFs válidas para o sufixo do número no conselho (campo 17). */
export const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA",
  "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN",
  "RO", "RR", "RS", "SC", "SE", "SP", "TO",
] as const;

/** Campos validados do bloco profissional (15, 16 e 17). */
export type ProfessionalField = "nome" | "conselho" | "numero";

/**
 * Máscara do campo 15: remove dígitos e símbolos, mantém letras, espaços,
 * apóstrofos, hífens e pontos (para abreviações como "Dr." ou "M. Silva").
 */
export function maskProfessionalName(input: string): string {
  return input
    .replace(/[^\p{L}\s.'-]/gu, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, 70);
}

/**
 * Máscara do campo 17: `NNNNNN/UF`. Aceita até 8 dígitos e força a UF em
 * maiúsculas, inserindo a barra automaticamente durante a digitação.
 */
export function maskCouncilNumber(input: string): string {
  const raw = input.toUpperCase().replace(/[^0-9A-Z]/g, "");
  const digits = raw.replace(/[^0-9]/g, "").slice(0, 8);
  const letters = raw.replace(/[^A-Z]/g, "").slice(0, 2);
  if (!digits) return letters;
  return letters ? `${digits}/${letters}` : digits;
}

const professionalSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, { message: "Informe o nome completo do profissional." })
    .max(70, { message: "Máximo de 70 caracteres." })
    .regex(/^[\p{L}][\p{L}\s.'-]*$/u, {
      message: "Use apenas letras, espaços e pontuação simples.",
    })
    .refine((v) => v.split(/\s+/).filter(Boolean).length >= 2, {
      message: "Informe nome e sobrenome.",
    }),
  conselho: z.enum(COUNCILS as unknown as [string, ...string[]], {
    errorMap: () => ({ message: "Selecione um conselho válido." }),
  }),
  numero: z
    .string()
    .trim()
    .regex(/^\d{4,8}\/[A-Z]{2}$/, {
      message: "Use o formato 0000/UF (4 a 8 dígitos + UF).",
    })
    .refine((v) => (UFS as readonly string[]).includes(v.slice(-2)), {
      message: "UF inválida.",
    }),
});

/** Erros por campo (vazio quando tudo válido). */
export function validateProfessional(
  value: ProfessionalValue,
): Partial<Record<ProfessionalField, string>> {
  const result = professionalSchema.safeParse({
    nome: value.nome,
    conselho: value.conselho,
    numero: value.numero,
  });
  if (result.success) return {};
  const errors: Partial<Record<ProfessionalField, string>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as ProfessionalField | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}

/** Regra única usada para liberar impressão e geração de PDF. */
export function isProfessionalValid(value: ProfessionalValue): boolean {
  return Object.keys(validateProfessional(value)).length === 0;
}

export const PROFESSIONAL_FIELDS: readonly ProfessionalField[] = [
  "nome",
  "conselho",
  "numero",
];
