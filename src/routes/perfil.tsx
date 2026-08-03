import { createFileRoute } from "@tanstack/react-router";

import { ProfilePage } from "@/features/profile";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Meu Perfil | Guias+" },
      {
        name: "description",
        content:
          "Consulte os dados do profissional usados nas guias, prescrições e documentos emitidos no Guias+.",
      },
      { property: "og:title", content: "Meu Perfil | Guias+" },
      {
        property: "og:description",
        content: "Dados de registro e contato do profissional no Guias+.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});
