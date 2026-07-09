import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BookMarked,
  Search,
  Star,
  Copy,
  Trash2,
  Send,
  Pill,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { toast } from "sonner";
import {
  type Kit,
  loadKits,
  deleteKit,
  toggleFavorito,
  marcarParaAplicar,
  upsertKit,
  formatarRelativo,
} from "@/lib/kits";

export const Route = createFileRoute("/kits")({
  head: () => ({
    meta: [
      { title: "HaisGuias — Kits salvos" },
      {
        name: "description",
        content:
          "Kits reutilizáveis de prescrição para aplicar em receitas com um clique.",
      },
    ],
  }),
  component: KitsPage,
});

function KitsPage() {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <AppSidebar activeKey="kits" />
      <main className="flex-1 flex flex-col min-h-screen">
        <div className="w-full max-w-5xl mx-auto space-y-6 flex-1 px-8 pt-8 pb-16">
          <Header />
          <KitsList />
        </div>
        <SiteFooter />
      </main>
    </div>
  );
}

function Header() {
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="grid place-items-center h-12 w-12 rounded-xl bg-primary/15 text-primary">
          <BookMarked className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kits salvos</h1>
          <p className="text-sm text-muted-foreground">
            Modelos reutilizáveis de prescrição — aplique em uma receita com um
            clique.
          </p>
        </div>
      </div>
    </div>
  );
}

function KitsList() {
  const navigate = useNavigate();
  const [kits, setKits] = useState<Kit[]>(() => loadKits());
  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState<string>("Todas");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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
    marcarParaAplicar(kit.id);
    toast.success(`Kit "${kit.nome}" pronto para aplicar.`);
    navigate({ to: "/prescricao" });
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
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">
              {filtrados.length}{" "}
              {filtrados.length === 1 ? "kit" : "kits"}{" "}
              {categoria !== "Todas" ? `em ${categoria}` : "no total"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kits ficam disponíveis também no fluxo de prescrição.
            </p>
          </div>
          <Link
            to="/prescricao"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium px-3.5 py-2 hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo kit
          </Link>
        </div>

        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
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
      </div>

      {filtrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <BookMarked className="h-10 w-10 mx-auto text-muted-foreground/60" />
          <div className="mt-3 text-sm font-medium">Nenhum kit encontrado</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Ajuste os filtros ou salve um novo kit a partir do fluxo de
            prescrição.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtrados.map((kit) => {
            const aberto = expanded.has(kit.id);
            return (
              <div
                key={kit.id}
                className="rounded-2xl border border-border bg-card overflow-hidden"
              >
                <div className="p-4 flex items-start gap-3">
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
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
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
                      <span>Atualizado {formatarRelativo(kit.atualizadoEm)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
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
                  className="w-full flex items-center justify-center gap-1 py-1.5 text-[11px] text-muted-foreground hover:bg-muted transition-colors border-t border-border"
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
                      <li key={i} className="px-4 py-3">
                        <div className="text-sm font-medium">
                          {i + 1}. {it.med.nome}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {it.med.forma}
                        </div>
                        <div className="text-xs mt-1.5">{it.posologia}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
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
