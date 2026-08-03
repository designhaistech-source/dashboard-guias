import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  LayoutGrid,
  FileText,
  FileCheck2,
  
  ScanSearch,
  Pill,
  ScanLine,
  HelpCircle,
  CircleUser,
  LogOut,
  Moon,
  Sun,
  Settings,
  Mail,
  PanelLeft,
  Menu,
  X,
  Wrench,
  FileSpreadsheet,
  BookMarked,
  

} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/guiasplus-logo.png.asset.json";
import { RenderProfiler } from "@/lib/render-profiler";

type ItemKey =
  | "dashboard"
  | "emitir"
  | "extrair"
  | "guias"
  | "procedimento"
  | "prescricao"
  | "kits"
  | "opme"
  | "relatorios"
  | "cid"
  | "qa-responsividade"
  | "ajuda";



export function AppSidebar({ activeKey }: { activeKey: ItemKey }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Bloqueia o scroll do fundo enquanto o menu mobile estiver aberto.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <RenderProfiler id="AppSidebar">
    <TooltipProvider delayDuration={150}>
      {/* Mobile: barra fixa com o menu em gaveta. Os elementos são fixed, então
          este wrapper não interfere no layout em flex das páginas. */}
      <div className="md:hidden">
        <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={mobileOpen}
            className="-ml-1 grid size-9 shrink-0 place-items-center rounded-md text-sidebar-muted transition-colors hover:bg-muted hover:text-foreground"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <img src={logoAsset.url} alt="Guias+" className="h-7 w-auto object-contain" />
        </header>

        {mobileOpen && (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-foreground/50"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Menu principal"
              className="absolute inset-y-0 left-0 flex w-[85%] max-w-xs flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl"
            >
              <div className="flex items-center justify-between gap-2 border-b border-sidebar-border px-4 py-4">
                <img src={logoAsset.url} alt="Guias+" className="h-8 w-auto object-contain" />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Fechar menu"
                  className="grid size-9 shrink-0 place-items-center rounded-md text-sidebar-muted transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <SidebarNav activeKey={activeKey} onNavigate={() => setMobileOpen(false)} />
              <UserMenu collapsed={false} />
            </div>
          </div>
        )}
      </div>

      <aside
        className={`hidden md:flex shrink-0 flex-col sticky top-0 h-screen max-h-screen self-start border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ${
          collapsed ? "w-16" : "w-72"
        }`}
      >
        <div
          className={`flex items-center gap-2 border-b border-sidebar-border min-w-0 py-5 ${
            collapsed ? "justify-center px-2" : "justify-between px-4"
          }`}
        >
          {!collapsed && (
            <img
              src={logoAsset.url}
              alt="Guias+"
              className="block h-8 w-auto max-w-full object-contain"
            />
          )}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            className="shrink-0 p-1.5 rounded-md text-sidebar-muted hover:text-foreground hover:bg-muted transition-colors"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        </div>

        <SidebarNav activeKey={activeKey} collapsed={collapsed} />

        <UserMenu collapsed={collapsed} />
      </aside>
    </TooltipProvider>
    </RenderProfiler>
  );
}

function SidebarNav({
  activeKey,
  collapsed = false,
  onNavigate,
}: {
  activeKey: ItemKey;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
      <SidebarGroup label="INÍCIO" collapsed={collapsed}>
        <SidebarItem
          icon={LayoutGrid}
          label="Dashboard"
          to="/"
          active={activeKey === "dashboard"}
          hint="Visão geral com indicadores e resumo das suas atividades recentes."
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      </SidebarGroup>

      <SidebarGroup label="GUIAS" collapsed={collapsed}>
        <SidebarItem
          icon={FileText}
          label="Emitir guia"
          to="/emitir"
          active={activeKey === "emitir"}
          hint="Preencha e gere novas guias médicas (SADT, consultas, encaminhamentos)."
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        <SidebarItem
          icon={FileCheck2}
          label="Extrair dados da guia"
          to="/guias"
          active={activeKey === "extrair"}
          hint="Extraia automaticamente os dados de uma guia por meio de IA."
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        <SidebarItem
          icon={ScanSearch}
          label="Buscar procedimento"
          to="/procedimentos"
          active={activeKey === "procedimento"}
          hint="Consulte códigos e descrições de procedimentos (TUSS / tabelas)."
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      </SidebarGroup>

      <SidebarGroup label="ATENDIMENTO CLÍNICO" collapsed={collapsed}>
        <SidebarItem
          icon={Pill}
          label="Emitir prescrição"
          to="/prescricao"
          active={activeKey === "prescricao"}
          hint="Emita prescrições médicas para os pacientes."
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        <SidebarItem
          icon={Wrench}
          label="Solicitar OPME"
          to="/opme"
          active={activeKey === "opme"}
          hint="Solicite Órteses, Próteses e Materiais Especiais para procedimentos."
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        <SidebarItem
          icon={FileSpreadsheet}
          label="Relatórios e documentos"
          to="/documentos"
          active={activeKey === "relatorios"}
          hint="Gere e gerencie relatórios, atestados e documentos clínicos."
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        <SidebarItem
          icon={ScanLine}
          label="Buscar CID-10"
          to="/cid"
          active={activeKey === "cid"}
          hint="Pesquise códigos da Classificação Internacional de Doenças (CID-10)."
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      </SidebarGroup>
    </nav>

  );
}

function UserMenu({ collapsed }: { collapsed: boolean }) {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (collapsed) {
    return (
      <div className="border-t border-sidebar-border flex flex-col items-center py-3 gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Perfil"
              className="h-auto w-auto p-1.5"
            >
              <CircleUser className="h-7 w-7 text-sidebar-muted" strokeWidth={1.5} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Dr Fulano</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Sair"
              className="text-sidebar-muted hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Sair</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative border-t border-sidebar-border flex items-center">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex-1 min-w-0 px-4 py-4 flex items-center gap-3 hover:bg-muted transition-colors text-left"
      >
        <CircleUser className="h-9 w-9 text-sidebar-muted shrink-0" strokeWidth={1.5} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">Dr Fulano</div>
          <div className="text-xs text-sidebar-muted">CRM 1234/RN</div>
        </div>
      </button>
      <button
        type="button"
        aria-label="Sair"
        className="shrink-0 mr-3 p-2 rounded-md text-sidebar-muted hover:text-destructive hover:bg-muted transition-colors"
      >
        <LogOut className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute bottom-full left-3 right-3 mb-2 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-border">
            <div className="text-sm font-semibold">Dr Fulano</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              dr.fulano@haistech.com
            </div>
          </div>
          <div className="py-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDark((v) => !v)}
              className="w-full justify-start rounded-none px-4 py-2 h-auto gap-3 text-sm font-normal"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="flex-1 text-left">Modo {dark ? "claro" : "escuro"}</span>
              <span
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  dark ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-surface transition-transform ${
                    dark ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start rounded-none px-4 py-2 h-auto gap-3 text-sm font-normal"
            >
              <Settings className="h-4 w-4" />
              Configurações
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start rounded-none px-4 py-2 h-auto gap-3 text-sm font-normal"
            >
              <HelpCircle className="h-4 w-4" />
              <span className="flex-1 text-left">Ajuda</span>
            </Button>
          </div>
          <div className="border-t border-border py-1">
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start rounded-none px-4 py-2 h-auto gap-3 text-sm font-normal text-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarGroup({
  label,
  children,
  collapsed,
}: {
  label: string;
  children: React.ReactNode;
  collapsed?: boolean;
}) {
  return (
    <div className="space-y-1">
      {!collapsed && (
        <div className="px-3 text-xs font-medium tracking-wider text-sidebar-muted">
          {label}
        </div>
      )}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SidebarItem({
  icon: Icon,
  label,
  active,
  hint,
  to,
  collapsed,
  onNavigate,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  hint?: string;
  to?: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const className = [
    "group w-full flex items-center gap-3 rounded-md text-sm transition-colors",
    collapsed ? "justify-center px-2 py-2" : "px-3 py-2",
    active
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
      : "text-sidebar-foreground hover:bg-muted",
  ].join(" ");

  const inner = collapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex items-center justify-center">
          <Icon className="h-[18px] w-[18px] shrink-0" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  ) : (
    <>
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span className="flex-1 text-left">{label}</span>
      {hint && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              role="button"
              tabIndex={0}
              aria-label={`Sobre ${label}`}
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 opacity-60 hover:opacity-100 focus:opacity-100 transition-opacity text-sidebar-muted hover:text-foreground"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            align="center"
            sideOffset={10}
            collisionPadding={12}
            className="max-w-[min(18rem,calc(100vw-2rem))] whitespace-normal break-words text-xs leading-snug px-3 py-2"
          >
            {hint}
          </TooltipContent>
        </Tooltip>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className} onClick={onNavigate}>
        {inner}
      </Link>
    );
  }
  return (
    <button /* ds-allow: estilo compartilhado do item de sidebar */ type="button" className={className}>
      {inner}
    </button>
  );

}
