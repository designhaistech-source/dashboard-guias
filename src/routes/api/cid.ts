import { createFileRoute } from "@tanstack/react-router";

import { CID10 } from "@/lib/cid";

/** Normaliza texto para busca tolerante a acentos e caixa. */
function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Endpoint de consulta da CID-10 (dados sintéticos).
 * GET /api/cid?q=termo&limit=20
 */
export const Route = createFileRoute("/api/cid")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const q = normalize(url.searchParams.get("q") ?? "");
        const limit = Math.min(Number(url.searchParams.get("limit")) || 20, 50);

        const items = (
          q
            ? CID10.filter(
                (item) =>
                  normalize(item.codigo).includes(q) ||
                  normalize(item.descricao).includes(q),
              )
            : CID10
        ).slice(0, limit);

        return Response.json(
          { items },
          { headers: { "cache-control": "no-store" } },
        );
      },
    },
  },
});
