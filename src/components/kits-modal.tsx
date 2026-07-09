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
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) setKits(loadKits());
  }, [open]);

  // Salva/restaura foco + trava rolagem do body
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  // ESC + focus trap (Tab cíclico dentro do diálogo ativo)
  useEffect(() => {
    if (!open) return;
    const getFocusables = (root: HTMLElement | null): HTMLElement[] => {
      if (!root) return [];
      return Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(
        (el) =>
          !el.hasAttribute("aria-hidden") &&
          el.offsetParent !== null,
      );
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        if (pendente) setPendente(null);
        else onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const root = pendente ? confirmRef.current : dialogRef.current;
      const focusables = getFocusables(root);
      if (focusables.length === 0) {
        e.preventDefault();
        root?.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !root?.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !root?.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, pendente]);

  // Move o foco inicial ao abrir cada camada
  useEffect(() => {
    if (!open) return;
    const root = pendente ? confirmRef.current : dialogRef.current;
    if (!root) return;
    const focusable = root.querySelector<HTMLElement>(
      'input, button, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();
  }, [open, pendente]);


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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="kits-modal-title"
        aria-describedby="kits-modal-desc"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[90vh] rounded-2xl border border-border bg-card shadow-xl flex flex-col overflow-hidden focus:outline-none"
      >

        <div
          className={`flex flex-col flex-1 min-h-0 transition-all duration-200 ${
            pendente ? "opacity-40 blur-[1px] pointer-events-none select-none" : ""
          }`}
          aria-hidden={pendente ? true : undefined}
        >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid place-items-center h-9 w-9 rounded-lg bg-primary/15 text-primary shrink-0">
              <BookMarked className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <h2
                id="kits-modal-title"
                className="text-base font-semibold leading-tight"
              >
                Kits salvos
              </h2>
              <p
                id="kits-modal-desc"
                className="text-xs text-muted-foreground truncate"
              >
                Modelos reutilizáveis — aplique com um clique.
              </p>
            </div>

          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="h-8 w-8 grid place-items-center rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filtros */}
        <div className="px-5 py-3 border-b border-border space-y-2.5 bg-background/40">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
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
            <select
              value={ordenacao}
              onChange={(e) =>
                setOrdenacao(e.target.value as typeof ordenacao)
              }
              className="text-xs rounded-lg border border-border bg-background px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              title="Ordenar por"
            >
              <option value="recentes">Mais recentes</option>
              <option value="usados">Mais usados</option>
              <option value="alfabetica">A – Z</option>
            </select>
          </div>

          <div className="flex gap-1.5 flex-wrap items-center">
            <button
              type="button"
              onClick={() => setSoFavoritos((v) => !v)}
              className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                soFavoritos
                  ? "bg-amber-400/15 border-amber-400/60 text-amber-600 dark:text-amber-300"
                  : "bg-background border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Star
                className={`h-3 w-3 ${
                  soFavoritos ? "fill-amber-400 text-amber-400" : ""
                }`}
              />
              Favoritos
            </button>
            {categorias.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategoria(c)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  categoria === c
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
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
        </div>


        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
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
                    <div className="p-3 flex items-start gap-2.5">
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
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold truncate">
                            {kit.nome}
                          </h3>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {kit.categoria}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {kit.descricao}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                          <span className="inline-flex items-center gap-1">
                            <Pill className="h-3 w-3" />
                            {kit.itens.length}{" "}
                            {kit.itens.length === 1
                              ? "medicamento"
                              : "medicamentos"}
                          </span>
                          <span>•</span>
                          <span>{kit.usos} usos</span>
                          <span>•</span>
                          <span>{formatarRelativo(kit.atualizadoEm)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => aplicar(kit)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 hover:bg-primary/90 transition-colors"
                          title="Aplicar na receita atual"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Aplicar
                        </button>
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
                      className="w-full flex items-center justify-center gap-1 py-1 text-[11px] text-muted-foreground hover:bg-muted transition-colors border-t border-border"
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
        </div>

        {pendente && (
          <div
            className="absolute inset-0 z-10 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPendente(null)}
          >
            <div
              ref={confirmRef}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl p-5 focus:outline-none"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="kits-confirm-title"
              aria-describedby="kits-confirm-desc"
              tabIndex={-1}
            >
              <div className="flex items-start gap-3">
                <div className="grid place-items-center h-9 w-9 rounded-lg bg-amber-400/15 text-amber-600 dark:text-amber-300 shrink-0">
                  <AlertTriangle className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <h3 id="kits-confirm-title" className="text-sm font-semibold">
                    Aplicar kit à receita?
                  </h3>

                  <p id="kits-confirm-desc" className="text-xs text-muted-foreground mt-1">
                    A receita atual já contém{" "}
                    <strong className="text-foreground">
                      {currentCount}{" "}
                      {currentCount === 1 ? "medicamento" : "medicamentos"}
                    </strong>
                    . O kit{" "}
                    <strong className="text-foreground">
                      "{pendente.nome}"
                    </strong>{" "}
                    tem {pendente.itens.length}{" "}
                    {pendente.itens.length === 1 ? "item" : "itens"}. Como deseja
                    prosseguir?
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPendente(null)}
                  className="text-xs font-medium px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => confirmar("append")}
                  className="text-xs font-medium px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  Adicionar aos existentes
                </button>
                <button
                  type="button"
                  onClick={() => confirmar("replace")}
                  className="text-xs font-medium px-3 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                >
                  Substituir tudo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
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
