import { MANUAL_PROFESSIONAL_ID, PROFESSIONALS, type Professional } from "../data/professionals";

/** Estado do seletor de profissional: registro escolhido ou dados manuais. */
export interface ProfessionalValue extends Omit<Professional, "id"> {
  /** Id do profissional cadastrado ou `outro` para preenchimento manual. */
  id: string;
}

/** Valor inicial padrão (primeiro profissional cadastrado). */
export function defaultProfessionalValue(): ProfessionalValue {
  const first = PROFESSIONALS[0];
  return { ...first };
}

/** Rótulo do conselho no formato usado em guias e documentos: "CRM 1234/RN". */
export function councilLabel(value: ProfessionalValue): string {
  return [value.conselho, value.numero].filter(Boolean).join(" ").trim();
}

/** Indica se o usuário está informando o profissional manualmente. */
export function isManual(value: ProfessionalValue): boolean {
  return value.id === MANUAL_PROFESSIONAL_ID;
}

/** Regra única de completude usada pelas barras de progresso. */
export function isProfessionalComplete(value: ProfessionalValue): boolean {
  return Boolean(value.nome.trim() && value.numero.trim());
}

/** Converte um rótulo livre ("CRM 1234/RN") em conselho + número. */
export function parseCouncil(label: string): { conselho: string; numero: string } {
  const match = label.trim().match(/^([A-Za-z]+)\s*(.*)$/);
  if (!match) return { conselho: "CRM", numero: label.trim() };
  return { conselho: match[1].toUpperCase(), numero: match[2].trim() };
}
