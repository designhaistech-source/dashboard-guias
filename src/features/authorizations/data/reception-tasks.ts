import type { AuthorizationStatus } from "./authorization-requests";

export type ReceptionTask = "solicitar" | "retorno" | "realizacao" | "pendencias";

export const RECEPTION_TASKS: Record<
  ReceptionTask,
  { status: AuthorizationStatus; title: string; description: string; listTitle: string; action: string; empty: string }
> = {
  solicitar: {
    status: "pendente",
    title: "Solicitar autorização",
    description: "Escolha uma solicitação para conferir os dados e solicitar a autorização à operadora.",
    listTitle: "Pendentes de autorização",
    action: "Solicitar autorização",
    empty: "Nenhuma solicitação pendente de autorização.",
  },
  retorno: {
    status: "aguardando",
    title: "Registrar retorno",
    description: "Registre o retorno recebido da operadora.",
    listTitle: "Aguardando operadora",
    action: "Registrar retorno",
    empty: "Nenhuma solicitação aguardando a operadora.",
  },
  realizacao: {
    status: "autorizada",
    title: "Registrar realização",
    description: "Registre a realização dos exames autorizados.",
    listTitle: "Autorizadas",
    action: "Registrar realização",
    empty: "Nenhuma solicitação autorizada aguardando realização.",
  },
  pendencias: {
    status: "pendencia",
    title: "Pendências",
    description: "Solicitações com pendência informada pela operadora.",
    listTitle: "Com pendência",
    action: "Ver pendência",
    empty: "Nenhuma solicitação com pendência.",
  },
};

export function isReceptionTask(v: string): v is ReceptionTask {
  return v in RECEPTION_TASKS;
}
