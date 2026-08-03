import { createFileRoute } from "@tanstack/react-router";

import { SettingsPage } from "@/features/settings";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações | Guias+" },
      {
        name: "description",
        content:
          "Altere a senha, gerencie seus dados pessoais conforme a LGPD e escolha o tema da interface no Guias+.",
      },
      { property: "og:title", content: "Configurações | Guias+" },
      {
        property: "og:description",
        content: "Segurança, privacidade (LGPD) e preferências de tema no Guias+.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});
