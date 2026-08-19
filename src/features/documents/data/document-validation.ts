import { z } from "zod";

/**
 * Validação dos campos que entram no texto impresso dos documentos.
 * As mensagens são exibidas inline no formulário e também bloqueiam
 * imprimir/baixar PDF, evitando documentos com dados inconsistentes.
 */

const NAME_PATTERN = /^[\p{L}\p{M}\s.'-]+$/u;

export const pacienteSchema = z
  .string()
  .trim()
  .min(3, "Informe o nome completo do paciente (mínimo 3 caracteres).")
  .max(120, "O nome do paciente deve ter no máximo 120 caracteres.")
  .regex(NAME_PATTERN, "Use apenas letras, espaços, hífen e apóstrofo.");

export const cidadeSchema = z
  .string()
  .trim()
  .max(60, "A cidade deve ter no máximo 60 caracteres.")
  .regex(NAME_PATTERN, "Use apenas letras, espaços, hífen e apóstrofo.");

export const localSchema = z
  .string()
  .trim()
  .min(3, "Informe o local de atendimento (mínimo 3 caracteres).")
  .max(120, "O local deve ter no máximo 120 caracteres.");

export const diasAfastamentoSchema = z.coerce
  .number()
  .int("Informe um número inteiro de dias.")
  .min(1, "O afastamento deve ser de no mínimo 1 dia.")
  .max(365, "Afastamentos acima de 365 dias exigem perícia — revise o valor.");

/** Retorna a primeira mensagem de erro do schema, ou undefined quando válido. */
function firstError(result: z.SafeParseReturnType<unknown, unknown>) {
  return result.success ? undefined : result.error.issues[0]?.message;
}

export function validatePaciente(value: string) {
  if (!value.trim()) return undefined; // campo vazio: tratado como pendência, não erro
  return firstError(pacienteSchema.safeParse(value));
}

export function validateCidade(value: string) {
  if (!value.trim()) return undefined; // opcional
  return firstError(cidadeSchema.safeParse(value));
}

export function validateLocal(value: string) {
  if (!value.trim()) return undefined;
  return firstError(localSchema.safeParse(value));
}

export function validateDiasAfastamento(value: string) {
  if (!value.trim()) return undefined;
  return firstError(diasAfastamentoSchema.safeParse(value));
}

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export interface TimeRangeValidation {
  entradaError?: string;
  saidaError?: string;
}

/** Valida entrada/saída da declaração de comparecimento. */
export function validateTimeRange(entrada: string, saida: string): TimeRangeValidation {
  const inicio = entrada ? toMinutes(entrada) : null;
  const fim = saida ? toMinutes(saida) : null;

  if (entrada && inicio === null) return { entradaError: "Horário inválido." };
  if (saida && fim === null) return { saidaError: "Horário inválido." };

  if (inicio !== null && fim !== null) {
    if (fim === inicio) {
      return { saidaError: "O horário de saída deve ser posterior ao de entrada." };
    }
    if (fim < inicio) {
      return {
        saidaError:
          "Saída anterior à entrada. Corrija os horários do comparecimento.",
      };
    }
  }

  return {};
}
