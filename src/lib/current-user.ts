/** Dados sintéticos do usuário autenticado (protótipo). */
export interface CurrentUser {
  name: string;
  crm: string;
  email: string;
  specialty: string;
  phone: string;
  city: string;
}

export const CURRENT_USER: CurrentUser = {
  name: "Dr Fulano",
  crm: "CRM 1234/RN",
  email: "dr.fulano@haistech.com",
  specialty: "Clínica médica",
  phone: "(84) 98888-1234",
  city: "Natal / RN",
};
