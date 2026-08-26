import * as React from "react";
import { useMemo, useState } from "react";
import { BookOpen, Copy, History, ScanSearch, Search, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  appTabsIconClass,
  appTabsLabelClass,
  appTabsListClass,
  appTabsTriggerClass,
} from "@/components/app-tabs";
import { SearchPageLayout } from "@/components/search-page-layout";
import { SearchInput } from "@/components/form-field";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { SurfaceCard } from "@/components/surface-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CID10, type CidItem } from "@/lib/cid";
import { cn } from "@/lib/utils";

/** Termos sugeridos quando a busca não retorna resultados. */
const SUGGESTED_TERMS = ["hipertensão", "diabetes", "I10", "dor", "febre"];

/** Normaliza texto removendo acentos para busca tolerante. */
function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function searchCid(term: string): CidItem[] {
  const q = normalize(term);
  if (!q) return [];
  return CID10.filter(
    (item) =>
      normalize(item.codigo).includes(q) || normalize(item.descricao).includes(q),
  );
}

/**
 * Consulta assíncrona simulada (dados sintéticos). O termo "erro" força a
 * falha para permitir validar o estado de erro do protótipo.
 */
function fetchCid(term: string): Promise<CidItem[]> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (normalize(term).includes("erro")) {
        reject(new Error("Falha simulada na consulta da CID-10"));
        return;
      }
      resolve(searchCid(term));
    }, 500);
  });
}

/** Página de consulta da CID-10 com favoritos e histórico. */
export function CidSearchPage() {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<CidItem[] | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">(
    "idle",
  );
  const [lastQuery, setLastQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>(["I10"]);
  const [history, setHistory] = useState<string[]>([]);

  const favoriteItems = useMemo(
    () => CID10.filter((item) => favorites.includes(item.codigo)),
    [favorites],
  );

  async function runSearch(nextTerm: string) {
    setTerm(nextTerm);
    setLastQuery(nextTerm.trim());

    if (!nextTerm.trim()) {
      setResults(null);
      setStatus("idle");
      return;
    }

    setStatus("loading");
    try {
      setResults(await fetchCid(nextTerm));
      setStatus("done");
    } catch {
      setResults(null);
      setStatus("error");
    }
  }

  function handleSearch(event?: React.FormEvent) {
    event?.preventDefault();
    void runSearch(term);
  }


  function toggleFavorite(codigo: string) {
    setFavorites((prev) =>
      prev.includes(codigo)
        ? prev.filter((c) => c !== codigo)
        : [...prev, codigo],
    );
  }

  async function copyCode(item: CidItem) {
    try {
      await navigator.clipboard.writeText(`${item.codigo} — ${item.descricao}`);
      toast.success("CID copiado", { description: item.codigo });
    } catch {
      toast.error("Não foi possível copiar o CID.");
    }
    setHistory((prev) =>
      [item.codigo, ...prev.filter((c) => c !== item.codigo)].slice(0, 10),
    );
  }

  const historyItems = useMemo(
    () =>
      history
        .map((codigo) => CID10.find((item) => item.codigo === codigo))
        .filter((item): item is CidItem => Boolean(item)),
    [history],
  );

  /** Limpa o histórico de códigos copiados. */
  function clearHistory() {
    setHistory([]);
    toast.success("Histórico limpo");
  }

  return (
    <SearchPageLayout
      activeKey="cid"
      title="Busca CID-10"
      description="Consulte códigos da Classificação Internacional de Doenças por código ou termo, com favoritos e histórico."
      onSubmit={handleSearch}
      submitting={status === "loading"}

      searchFields={
        <div className="min-w-0 flex-1">
          <SearchInput
            id="busca-cid"
            aria-label="Buscar CID-10 por código ou termo"
            placeholder="Digite CID (ex: I63.9) ou termo (ex: aneurisma)"
            value={term}
            clearable
            onChange={(event) => setTerm(event.target.value)}
            onClear={() => {
              setTerm("");
              setLastQuery("");
              setResults(null);
              setStatus("idle");

            }}
          />
        </div>
      }
      extra={
        <>
          {/* Listas de apoio: consulta secundária, agrupadas em abas */}
          <SurfaceCard>
            <Tabs defaultValue="favoritos" className="space-y-5">
              <TabsList className={appTabsListClass}>
                <TabsTrigger value="favoritos" className={appTabsTriggerClass}>
                  <Star className={appTabsIconClass} aria-hidden />
                  <span className={appTabsLabelClass}>Favoritos</span>
                  <Badge variant="secondary" size="sm" className="tabular-nums">
                    {favorites.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="historico" className={appTabsTriggerClass}>
                  <History className={appTabsIconClass} aria-hidden />
                  <span className={appTabsLabelClass}>Histórico</span>
                  <Badge variant="secondary" size="sm" className="tabular-nums">
                    {historyItems.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="favoritos">
                <CidList
                  items={favoriteItems}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                  onCopy={copyCode}
                  emptyIcon={<Star className="h-10 w-10" />}
                  emptyTitle="Nenhum favorito salvo"
                  emptyHint="Toque na estrela de um resultado para salvá-lo aqui."
                />
              </TabsContent>

              <TabsContent value="historico" className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    Últimos códigos copiados (máximo de 10).
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearHistory}
                    disabled={historyItems.length === 0}
                  >
                    <Trash2 className="icon-optical h-4 w-4" aria-hidden />
                    Limpar histórico
                  </Button>
                </div>

                <CidList
                  items={historyItems}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                  onCopy={copyCode}
                  emptyIcon={<History className="h-10 w-10" />}
                  emptyTitle="Histórico vazio"
                  emptyHint="Os códigos copiados aparecem aqui para consulta rápida."
                />
              </TabsContent>
            </Tabs>
          </SurfaceCard>
        </>
      }
    >
      {status === "loading" ? (
        <LoadingState
          size="lg"
          title="Buscando códigos CID-10…"
          description="Estamos consultando a tabela CID-10."
        />
      ) : status === "error" ? (
        <ErrorState
          size="lg"
          title="Não foi possível buscar códigos CID-10"
          description="Verifique sua conexão e tente novamente em alguns instantes."
          onRetry={() => void runSearch(lastQuery || term)}
        />
      ) : results === null ? (


              <EmptyState
                size="lg"
                icon={<BookOpen className="h-12 w-12" />}
                title="Faça uma busca"
                description="Você pode buscar pelo código (ex: I10) ou por parte da descrição (ex: hipertensão)."
              />
            ) : results.length === 0 ? (
              <EmptyState
                size="lg"
                icon={<ScanSearch className="h-12 w-12" />}
                title="Nenhum CID encontrado"
                description={
                  lastQuery
                    ? `Não encontramos resultados para “${lastQuery}”. Revise a grafia, use termos mais curtos ou tente uma das sugestões abaixo.`
                    : "Revise a grafia, use termos mais curtos ou tente uma das sugestões abaixo."
                }
                action={
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Sugestões:
                    </span>
                    {SUGGESTED_TERMS.map((sugestao) => (
                      <Button
                        key={sugestao}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => runSearch(sugestao)}
                      >
                        {sugestao}
                      </Button>
                    ))}
                  </div>
                }
              />
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
                  <p
                    aria-live="polite"
                    className="text-sm text-muted-foreground tabular-nums"
                  >
                    {results.length}{" "}
                    {results.length === 1
                      ? "código encontrado"
                      : "códigos encontrados"}
                  </p>
                </div>

                <div className="p-4 sm:p-6">
                  <CidList
                    items={results}
                    favorites={favorites}
                    onToggleFavorite={toggleFavorite}
                    onCopy={copyCode}
                    emptyTitle="Nenhum CID encontrado"
                    emptyHint="Revise a grafia ou tente um termo mais curto."
                  />
                </div>
        </>
      )}
    </SearchPageLayout>
  );
}



interface CidListProps {
  items: CidItem[];
  favorites: string[];
  onToggleFavorite: (codigo: string) => void;
  onCopy: (item: CidItem) => void;
  emptyTitle: string;
  emptyHint: string;
  emptyIcon?: React.ReactNode;
}

function CidList({
  items,
  favorites,
  onToggleFavorite,
  onCopy,
  emptyTitle,
  emptyHint,
  emptyIcon,
}: CidListProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon ?? <Search className="h-10 w-10" />}
        title={emptyTitle}
        description={emptyHint}
      />
    );
  }

  return (
    <ul className="max-h-112 space-y-2 overflow-y-auto pr-1">
      {items.map((item) => {
        const isFavorite = favorites.includes(item.codigo);
        return (
          <li
            key={item.codigo}
            className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/50"
          >
            <div className="min-w-0">
              <p className="font-mono text-sm font-semibold tabular-nums">
                {item.codigo}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {item.descricao}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={
                  isFavorite
                    ? `Remover ${item.codigo} dos favoritos`
                    : `Favoritar ${item.codigo}`
                }
                aria-pressed={isFavorite}
                onClick={() => onToggleFavorite(item.codigo)}
              >
                <Star
                  aria-hidden
                  className={cn(
                    "icon-optical h-4 w-4",
                    isFavorite && "fill-current text-primary",
                  )}
                />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Copiar ${item.codigo}`}
                onClick={() => onCopy(item)}
              >
                <Copy className="icon-optical h-4 w-4" aria-hidden />
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
