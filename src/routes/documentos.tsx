import { createFileRoute } from "@tanstack/react-router";

import { DocumentsPage } from "@/features/documents";

const DOCUMENT_TABS = ["relatorios", "atestados", "comparecimento"] as const;
type DocumentTab = (typeof DOCUMENT_TABS)[number];

export const Route = createFileRoute("/documentos")({
  // Mantém a aba ativa na URL para sobreviver a reload e compartilhamento.
  validateSearch: (search: Record<string, unknown>): { aba: DocumentTab } => ({
    aba: DOCUMENT_TABS.includes(search.aba as DocumentTab)
      ? (search.aba as DocumentTab)
      : "relatorios",
  }),
  head: () => ({
    meta: [
      { title: "HaisGuias — Relatórios e documentos" },
      {
        name: "description",
        content:
          "Emita relatórios médicos, atestados e declarações de comparecimento com CID e texto automático.",
      },
      { property: "og:title", content: "HaisGuias — Relatórios e documentos" },
      {
        property: "og:description",
        content:
          "Relatórios, atestados e declarações de comparecimento em um único fluxo clínico.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DocumentsPage,
});
