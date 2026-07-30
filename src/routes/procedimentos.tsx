import { createFileRoute } from "@tanstack/react-router";

import { ProcedureSearchPage } from "@/features/procedure-search";

export const Route = createFileRoute("/procedimentos")({
  head: () => ({
    meta: [
      { title: "HaisGuias — Busca de procedimentos" },
      {
        name: "description",
        content:
          "Consulte códigos e descrições de procedimentos Tuss e Sigtap.",
      },
      { property: "og:title", content: "HaisGuias — Busca de procedimentos" },
      {
        property: "og:description",
        content: "Busque procedimentos por código ou descrição e copie para suas guias.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProcedureSearchPage,
});
