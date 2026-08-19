/**
 * Validação da data do documento.
 * Datas futuras são bloqueadas (erro) e datas muito retroativas geram aviso,
 * porque atestados e declarações retroativos exigem justificativa clínica.
 */

/** Dias de retroatividade a partir dos quais o usuário recebe um aviso. */
export const RETROACTIVE_WARNING_DAYS = 3;

export interface DocumentDateStatus {
  /** Mensagem de erro (data inválida no contexto clínico). */
  error?: string;
  /** Aviso não bloqueante (data retroativa). */
  warning?: string;
  /** Diferença em dias em relação a hoje (negativo = passado). */
  diffDays: number;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseIsoDate(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Data de hoje no formato ISO (yyyy-mm-dd), usada como `max` dos inputs. */
export function todayIsoDate(): string {
  const now = startOfDay(new Date());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function plural(days: number) {
  return days === 1 ? "1 dia" : `${days} dias`;
}

export function getDocumentDateStatus(
  iso: string,
  labels?: { future?: string; retroactive?: (days: number) => string },
): DocumentDateStatus {
  const parsed = parseIsoDate(iso);
  if (!parsed) return { diffDays: 0, error: iso ? "Informe uma data válida." : undefined };

  const today = startOfDay(new Date());
  const diffDays = Math.round((parsed.getTime() - today.getTime()) / 86_400_000);

  if (diffDays > 0) {
    return {
      diffDays,
      error:
        labels?.future ??
        "Data futura não é permitida: o documento só pode ser emitido com a data do atendimento ou anterior.",
    };
  }

  if (diffDays <= -RETROACTIVE_WARNING_DAYS) {
    const days = Math.abs(diffDays);
    return {
      diffDays,
      warning:
        labels?.retroactive?.(days) ??
        `Data retroativa em ${plural(days)}. Confirme se corresponde ao atendimento — documentos retroativos exigem justificativa.`,
    };
  }

  return { diffDays };
}
