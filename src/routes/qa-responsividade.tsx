import { createFileRoute } from "@tanstack/react-router";
import { ResponsiveQaPage } from "@/features/responsive-qa";

export const Route = createFileRoute("/qa-responsividade")({
  head: () => ({
    meta: [
      { title: "Testes de responsividade | Guias+" },
      {
        name: "description",
        content:
          "Valide rapidamente cortes de texto e rolagem horizontal das telas do Guias+ em 360, 390, 768 e 1280px.",
      },
      { property: "og:title", content: "Testes de responsividade | Guias+" },
      {
        property: "og:description",
        content:
          "Rotina interna de QA para inspecionar cortes de texto e overflow em quatro larguras de referência.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResponsiveQaPage,
});
