import { useMemo, useState } from "react";
import { BookOpen, Copy, History, Search, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import {
  appTabsIconClass,
  appTabsLabelClass,
  appTabsListClass,
  appTabsTriggerClass,
} from "@/components/app-tabs";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { SurfaceCard } from "@/components/surface-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CID10, type CidItem } from "@/lib/cid";
import { cn } from "@/lib/utils";

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

/** Página de consulta da CID-10 com favoritos e histórico. */
export function CidSearchPage() {
  const [term, setTerm] = useState("");
  const [favorites, setFavorites] = useState<string[]>(["I10"]);
  const [history, setHistory] = useState<string[]>([]);

  const results = useMemo(() => searchCid(term), [term]);

  const favoriteItems = useMemo(
    () => CID10.filter((item) => favorites.includes(item.codigo)),
    [favorites],
  );

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
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <AppSidebar activeKey="cid" />

      <main className="flex min-h-screen flex-1 flex-col overflow-x-hidden">
        <div className="w-full flex-1 space-y-6 px-6 py-8 pb-16 lg:px-10">
          <AppBreadcrumb />
          <PageHeader
            title="Busca CID-10"
            description="Consulte códigos da Classificação Internacional de Doenças por código ou termo, com favoritos e histórico."
          />

          {/* Busca sempre visível: é a ação principal da página */}
          <SurfaceCard className="space-y-4">
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Digite CID (ex: I63.9) ou termo (ex: aneurisma)"
                aria-label="Buscar CID-10 por código ou termo"
                className="h-11 pl-9 pr-9"
              />
              {term ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setTerm("")}
                  aria-label="Limpar busca"
                  className="absolute right-1.5 top-1/2 h-8 w-8 -translate-y-1/2"
                >
                  <X className="icon-optical h-4 w-4" aria-hidden />
                </Button>
              ) : null}
            </div>

            <div className="mt-6 mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-5">
              <h2 className="text-sm font-semibold leading-none">Resultados</h2>
              {term ? (
                <p
                  aria-live="polite"
                  className="text-xs leading-none text-muted-foreground tabular-nums"
                >
                  {results.length}{" "}
                  {results.length === 1
                    ? "código encontrado"
                    : "códigos encontrados"}
                </p>
              ) : null}
            </div>

            {term ? (
              <CidList
                items={results}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onCopy={copyCode}
                emptyTitle="Nenhum CID encontrado"
                emptyHint="Revise a grafia ou tente um termo mais curto, como “dor” ou “I10”."
              />
            ) : (
              <EmptyHint
                icon={BookOpen}
                title="Comece a digitar para consultar a CID-10"
                hint="Você pode buscar pelo código (ex: I10) ou por parte da descrição (ex: hipertensão)."
              />
            )}
          </SurfaceCard>

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
                  emptyTitle="Histórico vazio"
                  emptyHint="Os códigos copiados aparecem aqui para consulta rápida."
                />
              </TabsContent>
            </Tabs>
          </SurfaceCard>


        </div>

        <SiteFooter />
      </main>
    </div>
  );
}

interface CidListProps {
  items: CidItem[];
  favorites: string[];
  onToggleFavorite: (codigo: string) => void;
  onCopy: (item: CidItem) => void;
  emptyTitle: string;
  emptyHint: string;
}

function CidList({
  items,
  favorites,
  onToggleFavorite,
  onCopy,
  emptyTitle,
  emptyHint,
}: CidListProps) {
  if (items.length === 0) {
    return <EmptyHint icon={Search} title={emptyTitle} hint={emptyHint} />;
  }

  return (
    <ul className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
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

function EmptyHint({
  icon: Icon,
  title,
  hint,
}: {
  icon: typeof Search;
  title: string;
  hint: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-6 py-12 text-center">
      <Icon className="h-6 w-6 text-muted-foreground" aria-hidden />
      <p className="text-sm font-semibold">{title}</p>
      <p className="max-w-md text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}
