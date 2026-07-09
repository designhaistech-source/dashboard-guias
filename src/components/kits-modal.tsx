import { useEffect, useMemo, useState } from "react";
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
}: {
  open: boolean;
  onClose: () => void;
  onAplicar: (kit: Kit) => void;
}) {
  const [kits, setKits] = useState<Kit[]>([]);
  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState<string>("Todas");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) setKits(loadKits());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const categorias = useMemo(() => {
    const s = new Set<string>();
    kits.forEach((k) => s.add(k.categoria));
    return ["Todas", ...Array.from(s).sort()];
  }, [kits]);

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    return kits
      .filter((k) => categoria === "Todas" || k.categoria === categoria)
      .filter((k) => {
        if (!q) return true;
        return (
          k.nome.toLowerCase().includes(q) ||
          k.descricao.toLowerCase().includes(q) ||
          k.itens.some((it) => it.med.nome.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (!!b.favorito !== !!a.favorito) return b.favorito ? 1 : -1;
        return b.atualizadoEm - a.atualizadoEm;
      });
  }, [kits, query, categoria]);

  const aplicar = (kit: Kit) => {
    onAplicar(kit);
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
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[90vh] rounded-2xl border border-border bg-card shadow-xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid place-items-center h-9 w-9 rounded-lg bg-primary/15 text-primary shrink-0">
              <BookMarked className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold leading-tight">Kits salvos</h2>
              <p className="text-xs text-muted-foreground truncate">
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome, descrição ou medicamento…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
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
