import { useMemo, useState } from "react";
import { BookOpen, Copy, History, Search, Star, X } from "lucide-react";
import { toast } from "sonner";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { SurfaceCard } from "@/components/surface-card";
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

          <SurfaceCard>
            <Tabs defaultValue="buscar" className="space-y-5">
              <TabsList className="flex w-full gap-1 h-auto rounded-xl border border-border bg-muted p-1 shadow-inner lg:grid lg:grid-cols-3">
                <TabsTrigger
                  value="buscar"
                  className="flex flex-1 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1.5 py-2 font-medium text-muted-foreground transition-all hover:text-foreground lg:flex-row lg:gap-2.5 lg:px-6 lg:py-3 data-[state=active]:border data-[state=active]:border-border/60 data-[state=active]:bg-background data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <Search className="icon-optical h-4 w-4 shrink-0" aria-hidden />
                  <span className="max-w-full truncate whitespace-nowrap text-[11px] leading-tight tracking-tight sm:text-xs lg:text-sm">Buscar</span>
                </TabsTrigger>
                <TabsTrigger
                  value="favoritos"
                  className="flex flex-1 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1.5 py-2 font-medium text-muted-foreground transition-all hover:text-foreground lg:flex-row lg:gap-2.5 lg:px-6 lg:py-3 data-[state=active]:border data-[state=active]:border-border/60 data-[state=active]:bg-background data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <Star className="icon-optical h-4 w-4 shrink-0" aria-hidden />
                  <span className="max-w-full truncate whitespace-nowrap text-[11px] leading-tight tracking-tight sm:text-xs lg:text-sm">Favoritos<span className="hidden sm:inline"> ({favorites.length})</span></span>
                </TabsTrigger>
                <TabsTrigger
                  value="historico"
                  className="flex flex-1 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1.5 py-2 font-medium text-muted-foreground transition-all hover:text-foreground lg:flex-row lg:gap-2.5 lg:px-6 lg:py-3 data-[state=active]:border data-[state=active]:border-border/60 data-[state=active]:bg-background data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <History className="icon-optical h-4 w-4 shrink-0" aria-hidden />
                  <span className="max-w-full truncate whitespace-nowrap text-[11px] leading-tight tracking-tight sm:text-xs lg:text-sm">Histórico</span>
                </TabsTrigger>
              </TabsList>



              <TabsContent value="buscar" className="space-y-4">
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
                    <button
                      type="button"
                      onClick={() => setTerm("")}
                      aria-label="Limpar busca"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
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
              </TabsContent>

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

              <TabsContent value="historico">
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
