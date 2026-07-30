import { queryOptions } from "@tanstack/react-query";

import type { CidItem } from "@/lib/cid";

export interface CidSearchResponse {
  items: CidItem[];
}

/** Contrato HTTP tipado da busca de CID-10. */
export async function fetchCidSearch(
  term: string,
  signal?: AbortSignal,
): Promise<CidItem[]> {
  const params = new URLSearchParams({ q: term, limit: "20" });
  const response = await fetch(`/api/cid?${params.toString()}`, { signal });

  if (!response.ok) {
    throw new Error(`Falha ao consultar a CID-10 [${response.status}]`);
  }

  const data = (await response.json()) as CidSearchResponse;
  return data.items ?? [];
}

export const cidSearchQueryOptions = (term: string) =>
  queryOptions({
    queryKey: ["cid-search", term] as const,
    queryFn: ({ signal }) => fetchCidSearch(term, signal),
    staleTime: 5 * 60 * 1000,
  });
