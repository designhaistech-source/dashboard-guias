import { DOCUMENT_VARIABLES, formatDateShort } from "./documents";

/** Valores conhecidos para as variáveis dinâmicas do documento. */
export interface DocumentVariableValues {
  paciente?: string;
  /** ISO (yyyy-mm-dd); formatada como dd/mm/aaaa no texto final. */
  data?: string;
  cidade?: string;
  cid?: string;
  diagnostico?: string;
}

/** Rótulos legíveis usados nos avisos de variável pendente. */
export const VARIABLE_LABELS: Record<string, string> = {
  "@paciente": "Paciente",
  "@data": "Data do documento",
  "@cidade": "Cidade",
  "@cid": "CID",
  "@diagnostico": "Diagnóstico",
};

function valueFor(variable: string, values: DocumentVariableValues): string {
  switch (variable) {
    case "@paciente":
      return values.paciente?.trim() ?? "";
    case "@data":
      return values.data ? formatDateShort(values.data) : "";
    case "@cidade":
      return values.cidade?.trim() ?? "";
    case "@cid":
      return values.cid?.trim() ?? "";
    case "@diagnostico":
      return values.diagnostico?.trim() ?? "";
    default:
      return "";
  }
}

function tokenRegex(variable: string): RegExp {
  return new RegExp(`${variable}(?![\\p{L}\\p{N}_])`, "gu");
}

/** Valor atual de cada token, para inserir o dado real no editor. */
export function variableTokenValues(
  values: DocumentVariableValues,
): Record<string, string> {
  return Object.fromEntries(
    DOCUMENT_VARIABLES.map((variable) => [variable, valueFor(variable, values)]),
  );
}

/** Marcador impresso quando a variável usada no texto ainda não tem valor. */
const EMPTY_PLACEHOLDER = "____________";

/** Substitui as variáveis (@paciente, @data…) pelos valores atuais do formulário. */
export function resolveDocumentVariables(
  html: string,
  values: DocumentVariableValues,
): string {
  return DOCUMENT_VARIABLES.reduce(
    (acc, variable) =>
      acc.replace(tokenRegex(variable), valueFor(variable, values) || EMPTY_PLACEHOLDER),
    html,
  );
}

/** Variáveis usadas no texto que ainda não possuem valor preenchido. */
export function pendingVariables(
  html: string,
  values: DocumentVariableValues,
): string[] {
  return DOCUMENT_VARIABLES.filter(
    (variable) => tokenRegex(variable).test(html) && !valueFor(variable, values),
  );
}

/** true quando o texto ainda contém alguma variável não substituída. */
export function hasVariables(html: string): boolean {
  return DOCUMENT_VARIABLES.some((variable) => tokenRegex(variable).test(html));
}
