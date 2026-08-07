import { createFileRoute } from "@tanstack/react-router";

import { IssuedGuidesPage } from "@/features/issued-guides";

export const Route = createFileRoute("/guias-emitidas")({
  head: () => ({
    meta: [
      { title: "Guias emitidas — Guias+" },
      {
        name: "description",
        content:
          "Histórico completo das guias emitidas no Guias+, com busca, filtros por período, operadora e status.",
      },
      { property: "og:title", content: "Guias emitidas — Guias+" },
      {
        property: "og:description",
        content:
          "Consulte, baixe, reimprima ou duplique as guias já emitidas pelo Guias+.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IssuedGuidesPage,
});
