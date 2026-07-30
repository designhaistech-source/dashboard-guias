import { createFileRoute } from "@tanstack/react-router";

import { DocumentsPage } from "@/features/documents";

export const Route = createFileRoute("/documentos")({
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
