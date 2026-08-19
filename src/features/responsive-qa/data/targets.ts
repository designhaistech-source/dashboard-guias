/** Larguras de referência usadas na validação rápida de cortes de texto. */
export const QA_WIDTHS = [360, 390, 768, 1280] as const;

export type QaWidth = (typeof QA_WIDTHS)[number];

export interface QaRoute {
  /** Caminho da rota renderizada dentro do iframe. */
  path: string;
  /** Rótulo exibido no seletor. */
  label: string;
}

/** Rotas do sistema disponíveis para inspeção. */
export const QA_ROUTES: QaRoute[] = [
  { path: "/", label: "Visão geral" },
  { path: "/emitir", label: "Emitir guia" },
  { path: "/guias", label: "Extrair dados da guia" },
  { path: "/procedimentos", label: "Buscar procedimento" },
  { path: "/prescricao", label: "Emitir prescrição" },
  { path: "/opme", label: "Solicitar OPME" },
  { path: "/documentos", label: "Relatórios e documentos" },
  { path: "/cid", label: "Buscar CID-10" },
];
