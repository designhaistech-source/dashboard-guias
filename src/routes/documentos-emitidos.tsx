import { createFileRoute } from "@tanstack/react-router";

import { IssuedDocumentsPage } from "@/features/issued-documents";

export const Route = createFileRoute("/documentos-emitidos")({
  head: () => ({
    meta: [
      { title: "Documentos emitidos — Guias+" },
      {
        name: "description",
        content:
          "Histórico dos relatórios, atestados e declarações de comparecimento emitidos no Guias+, com busca por paciente e filtros por tipo e período.",
      },
      { property: "og:title", content: "Documentos emitidos — Guias+" },
      {
        property: "og:description",
        content:
          "Consulte, baixe e imprima os documentos clínicos já emitidos no Guias+.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IssuedDocumentsPage,
});
