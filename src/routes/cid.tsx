import { createFileRoute } from "@tanstack/react-router";

import { CidSearchPage } from "@/features/cid-search";

export const Route = createFileRoute("/cid")({
  head: () => ({
    meta: [
      { title: "HaisGuias — Busca CID-10" },
      {
        name: "description",
        content:
          "Consulte a CID-10 por código ou termo, com favoritos e histórico de códigos usados.",
      },
      { property: "og:title", content: "HaisGuias — Busca CID-10" },
      {
        property: "og:description",
        content:
          "Pesquise códigos da Classificação Internacional de Doenças com favoritos e histórico.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CidSearchPage,
});
