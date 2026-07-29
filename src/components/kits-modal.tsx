import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookMarked,
  Search,
  Star,
  Copy,
  Trash2,
  Send,
  Pill,
  ChevronDown,
  ChevronUp,
  X,
  AlertTriangle,
} from "lucide-react";

import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogBody,
  DialogToolbar,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import {
  type Kit,

  loadKits,
  deleteKit,
  toggleFavorito,
  upsertKit,
  formatarRelativo,
} from "@/lib/kits";

export function KitsModal({
  open,
  onClose,
  onAplicar,
  currentCount = 0,
}: {
  open: boolean;
  onClose: () => void;
  onAplicar: (kit: Kit, mode: "replace" | "append") => void;
  currentCount?: number;
}) {
  const [kits, setKits] = useState<Kit[]>([]);
  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState<string>("Todas");
  const [soFavoritos, setSoFavoritos] = useState(false);
  const [ordenacao, setOrdenacao] = useState<
    "recentes" | "usados" | "alfabetica"
  >("recentes");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pendente, setPendente] = useState<Kit | null>(null);
  // Foco inicial no campo de busca; trava de rolagem, focus trap, Esc e
  // restauração de foco são responsabilidade do Dialog do design system.
  const buscaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setKits(loadKits());
  }, [open]);




  const categorias = useMemo(() => {
    const s = new Set<string>();
    kits.forEach((k) => s.add(k.categoria));
    return ["Todas", ...Array.from(s).sort()];
  }, [kits]);

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    const arr = kits
      .filter((k) => categoria === "Todas" || k.categoria === categoria)
      .filter((k) => (soFavoritos ? !!k.favorito : true))
      .filter((k) => {
        if (!q) return true;
        return (
          k.nome.toLowerCase().includes(q) ||
          k.descricao.toLowerCase().includes(q) ||
          k.categoria.toLowerCase().includes(q) ||
          k.itens.some((it) => it.med.nome.toLowerCase().includes(q))
        );
      });

    const sorted = [...arr].sort((a, b) => {
      if (ordenacao === "alfabetica") return a.nome.localeCompare(b.nome, "pt-BR");
      if (ordenacao === "usados") return (b.usos ?? 0) - (a.usos ?? 0);
      return b.atualizadoEm - a.atualizadoEm;
    });
    // Favoritos sempre no topo
    return sorted.sort((a, b) => {
      if (!!b.favorito !== !!a.favorito) return b.favorito ? 1 : -1;
      return 0;
    });
  }, [kits, query, categoria, soFavoritos, ordenacao]);

  const limparFiltros = () => {
    setQuery("");
    setCategoria("Todas");
    setSoFavoritos(false);
    setOrdenacao("recentes");
  };
  const filtrosAtivos =
    query.trim() !== "" ||
    categoria !== "Todas" ||
    soFavoritos ||
    ordenacao !== "recentes";

  const aplicar = (kit: Kit) => {
    if (currentCount > 0) {
      setPendente(kit);
      return;
    }
    onAplicar(kit, "replace");
    onClose();
  };

  const confirmar = (mode: "replace" | "append") => {
    if (!pendente) return;
    onAplicar(pendente, mode);
    setPendente(null);
    onClose();
  };


  const duplicar = (kit: Kit) => {
    const novo: Kit = {
      ...kit,
      id: `${kit.id}-${Date.now()}`,
      nome: `${kit.nome} (cópia)`,
      usos: 0,
      favorito: false,
      atualizadoEm: Date.now(),
    };
    upsertKit(novo);
    setKits(loadKits());
    toast.success("Kit duplicado.");
  };

  const excluir = (kit: Kit) => {
    if (!confirm(`Excluir o kit "${kit.nome}"?`)) return;
    deleteKit(kit.id);
    setKits(loadKits());
    toast.success("Kit excluído.");
  };

  const favoritar = (kit: Kit) => {
    toggleFavorito(kit.id);
    setKits(loadKits());
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  return (
    <>
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent size="lg" initialFocusRef={buscaRef}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookMarked className="size-4 text-primary" />
            Kits salvos
          </DialogTitle>
          <DialogDescription>
            Modelos reutilizáveis — aplique com um clique.
          </DialogDescription>
        </DialogHeader>

        {/* Filtros */}
        <DialogToolbar className="space-y-2.5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref={buscaRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome, categoria ou medicamento…"
                className="w-full pl-9 pr-8 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Limpar busca"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 grid place-items-center rounded-md text-muted-foreground hover:bg-muted"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Select
              value={ordenacao}
              onValueChange={(v) => setOrdenacao(v as typeof ordenacao)}
            >
              <SelectTrigger className="h-9 w-[160px] text-xs" title="Ordenar por">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recentes">Mais recentes</SelectItem>
                <SelectItem value="usados">Mais usados</SelectItem>
                <SelectItem value="alfabetica">A – Z</SelectItem>
              </SelectContent>
            </Select>

          </div>

          <div className="flex gap-1.5 flex-wrap items-center">
            <Chip
              variant={soFavoritos ? "warning" : "default"}
              onClick={() => setSoFavoritos((v) => !v)}
              className="py-1.5"
            >
              <Star
                className={`h-3 w-3 ${
                  soFavoritos ? "fill-warning text-warning" : ""
                }`}
              />
              Favoritos
            </Chip>
            {categorias.map((c) => (
              <Chip
                key={c}
                variant={categoria === c ? "selected" : "default"}
                onClick={() => setCategoria(c)}
                className="py-1.5"
              >
                {c}
              </Chip>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
            <span>
              {filtrados.length}{" "}
              {filtrados.length === 1 ? "kit encontrado" : "kits encontrados"}
              {kits.length !== filtrados.length && ` de ${kits.length}`}
            </span>
            {filtrosAtivos && (
              <button
                type="button"
                onClick={limparFiltros}
                className="text-primary hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </DialogToolbar>



        {/* Lista */}
        <DialogBody>
          {filtrados.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
              <BookMarked className="h-8 w-8 mx-auto text-muted-foreground/60" />
              <div className="mt-3 text-sm font-medium">Nenhum kit encontrado</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Salve um novo kit a partir de uma receita para vê-lo aqui.
              </p>
            </div>
          ) : (
            <div className="grid gap-2.5">
              {filtrados.map((kit) => {
                const aberto = expanded.has(kit.id);
                return (
                  <div
                    key={kit.id}
                    className="rounded-xl border border-border bg-background overflow-hidden"
                  >
                    <div className="p-3 sm:p-4 flex flex-wrap items-start gap-2.5">
                      <button
                        type="button"
                        onClick={() => favoritar(kit)}
                        aria-label={
                          kit.favorito ? "Remover dos favoritos" : "Favoritar"
                        }
                        className="mt-0.5 shrink-0 p-1 rounded-md hover:bg-muted transition-colors"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            kit.favorito
                              ? "fill-warning text-warning"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>

                      <div className="min-w-0 flex-1 basis-[calc(100%-3rem)] sm:basis-auto">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold truncate">
                            {kit.nome}
                          </h3>
                          <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {kit.categoria}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {kit.descricao}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <span className="inline-flex items-center gap-1 whitespace-nowrap">
                            <Pill className="h-3 w-3 shrink-0" />
                            {kit.itens.length}{" "}
                            {kit.itens.length === 1
                              ? "medicamento"
                              : "medicamentos"}
                          </span>
                          <span aria-hidden>•</span>
                          <span className="whitespace-nowrap">{kit.usos} usos</span>
                          <span aria-hidden>•</span>
                          <span className="whitespace-nowrap">{formatarRelativo(kit.atualizadoEm)}</span>
                        </div>
                      </div>

                      <div className="flex w-full items-center justify-end gap-1 shrink-0 sm:w-auto">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => aplicar(kit)}
                          title="Aplicar na receita atual"
                        >
                          <Send />
                          Aplicar
                        </Button>

                        <IconAction
                          onClick={() => duplicar(kit)}
                          label="Duplicar"
                          icon={<Copy className="h-3.5 w-3.5" />}
                        />
                        <IconAction
                          onClick={() => excluir(kit)}
                          label="Excluir"
                          danger
                          icon={<Trash2 className="h-3.5 w-3.5" />}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleExpand(kit.id)}
                      className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors border-t border-border"
                    >
                      {aberto ? (
                        <>
                          Ocultar medicamentos <ChevronUp className="h-3 w-3" />
                        </>
                      ) : (
                        <>
                          Ver medicamentos <ChevronDown className="h-3 w-3" />
                        </>
                      )}
                    </button>

                    {aberto && (
                      <ul className="border-t border-border divide-y divide-border">
                        {kit.itens.map((it, i) => (
                          <li key={i} className="px-3 py-2.5">
                            <div className="text-sm font-medium">
                              {i + 1}. {it.med.nome}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {it.med.forma}
                            </div>
                            <div className="text-xs mt-1">{it.posologia}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>

    <Dialog open={!!pendente} onOpenChange={(v) => { if (!v) setPendente(null); }}>
      <DialogContent size="sm" role="alertdialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-warning-strong" />
            Aplicar kit à receita?
          </DialogTitle>
          <DialogDescription>
            A receita atual já contém{" "}
            <strong className="text-foreground">
              {currentCount} {currentCount === 1 ? "medicamento" : "medicamentos"}
            </strong>
            {pendente && (
              <>
                . O kit <strong className="text-foreground">"{pendente.nome}"</strong> tem{" "}
                {pendente.itens.length}{" "}
                {pendente.itens.length === 1 ? "item" : "itens"}
              </>
            )}
            . Como deseja prosseguir?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setPendente(null)}>
            Cancelar
          </Button>
          <Button variant="secondary" size="sm" onClick={() => confirmar("append")}>
            Adicionar aos existentes
          </Button>
          <Button variant="destructive" size="sm" onClick={() => confirmar("replace")}>
            Substituir tudo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}


function IconAction({
  onClick,
  label,
  icon,
  danger,
}: {
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`inline-flex items-center justify-center h-7 w-7 rounded-lg border border-border transition-colors ${
        danger
          ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      {icon}
    </button>
  );
}
