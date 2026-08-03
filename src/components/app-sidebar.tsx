import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CURRENT_USER } from "@/lib/current-user";
import logoAsset from "@/assets/guiasplus-logo.png.asset.json";
import logoDarkAsset from "@/assets/guiasplus-logo-dark.png.asset.json";

/** Logo da marca com variante específica para o modo escuro. */
function BrandLogo({ className }: { className?: string }) {
  return (
    <>
      <img
        src={logoAsset.url}
        alt="Guias+"
        className={`block max-w-full object-contain dark:hidden ${className ?? ""}`}
      />
      <img
        src={logoDarkAsset.url}
        alt="Guias+"
        className={`hidden max-w-full object-contain dark:block ${className ?? ""}`}
      />
    </>
  );
}

import { RenderProfiler } from "@/lib/render-profiler";

export type ItemKey =
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
  | "perfil"
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
          <button /* ds-allow: controle de navegação do sidebar */
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={mobileOpen}
            className="-ml-1 grid size-9 shrink-0 place-items-center rounded-md text-sidebar-muted transition-colors hover:bg-muted hover:text-foreground"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <BrandLogo className="h-7 w-auto" />
        </header>

        {mobileOpen && (
          <div className="fixed inset-0 z-50">
            <button /* ds-allow: overlay de fechamento do drawer */
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
                <BrandLogo className="h-8 w-auto" />
                <button /* ds-allow: fechar drawer do sidebar */
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
            <BrandLogo className="h-8 w-auto" />
          )}
          <button /* ds-allow: colapsar/expandir sidebar */
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
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const itemClass = "gap-3 px-4 py-2.5 min-h-11 text-sm";

  // Iniciais do nome: evita repetir o mesmo ícone do item "Meu Perfil".
  const userInitials = CURRENT_USER.name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const confirmLogout = () => {
    setLogoutOpen(false);
    setMenuOpen(false);
    toast.success("Sessão encerrada.");
  };

  // Confirmação compartilhada pelos dois pontos de saída (menu e rodapé).
  const logoutConfirmation = (
    <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sair da conta?</AlertDialogTitle>
          <AlertDialogDescription>
            Você será desconectado e os dados não salvos deste formulário podem ser
            perdidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmLogout}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Sair
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );


  const content = (
    <DropdownMenuContent
      side="top"
      align="start"
      sideOffset={8}
      className="w-72 p-0 overflow-hidden"
    >
      {/* Cabeçalho informativo em 2 linhas: identidade + e-mail completo (sem corte). */}
      <DropdownMenuLabel className="px-4 py-3 font-normal">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground">
              {CURRENT_USER.name}
            </div>
            <div className="text-xs text-muted-foreground break-all">
              {CURRENT_USER.email}
            </div>
          </div>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator className="mx-0 my-0" />

      {/* Bloco 1 — conta e sistema (destinos). */}
      <DropdownMenuGroup className="py-1">
        <DropdownMenuItem asChild className={itemClass}>
          <Link to="/perfil" aria-current={pathname === "/perfil" ? "page" : undefined}>
            <CircleUser className="h-4 w-4" aria-hidden="true" />
            <span className="flex-1">Meu Perfil</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className={itemClass}>
          <Settings className="h-4 w-4" aria-hidden="true" />
          Configurações
        </DropdownMenuItem>
      </DropdownMenuGroup>

      <DropdownMenuSeparator className="mx-0 my-0" />

      {/* Bloco 2 — suporte. */}
      <DropdownMenuGroup className="py-1">
        <DropdownMenuItem className={itemClass}>
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
          Ajuda
        </DropdownMenuItem>
      </DropdownMenuGroup>

      <DropdownMenuSeparator className="mx-0 my-0" />

      {/* Bloco 3 — preferência rápida: mantém o menu aberto ao alternar. */}
      <DropdownMenuGroup className="py-1">
        <DropdownMenuItem
          className={itemClass}
          onSelect={(event) => {
            event.preventDefault();
            setDark((value) => !value);
          }}
        >
          {dark ? (
            <Sun className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <Moon className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span className="flex-1">Modo escuro</span>
          <Switch
            checked={dark}
            tabIndex={-1}
            aria-hidden="true"
            className="pointer-events-none"
          />
        </DropdownMenuItem>
      </DropdownMenuGroup>

      <DropdownMenuSeparator className="mx-0 my-0" />

      {/* Bloco 4 — sessão. */}
      <DropdownMenuGroup className="py-1">
        {/* Mantém o menu aberto: a confirmação decide se a sessão termina. */}
        <DropdownMenuItem
          className={`${itemClass} text-destructive focus:text-destructive`}
          onSelect={(event) => {
            event.preventDefault();
            setLogoutOpen(true);
          }}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );

  if (collapsed) {
    return (
      <div className="border-t border-sidebar-border flex flex-col items-center py-3">
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Menu do usuário"
                  className="h-auto w-auto p-1.5"
                >
                  <CircleUser className="h-7 w-7 text-sidebar-muted" strokeWidth={1.5} />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">{CURRENT_USER.name}</TooltipContent>
          </Tooltip>
          {content}
        </DropdownMenu>
        {logoutConfirmation}
      </div>
    );
  }

  return (
    <div className="border-t border-sidebar-border flex items-center">
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <button /* ds-allow: item de perfil do sidebar */
            type="button"
            className="flex-1 min-w-0 px-4 py-4 flex items-center gap-3 hover:bg-muted transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CircleUser className="h-9 w-9 text-sidebar-muted shrink-0" strokeWidth={1.5} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{CURRENT_USER.name}</div>
              <div className="text-xs text-sidebar-muted">{CURRENT_USER.crm}</div>
            </div>
          </button>
        </DropdownMenuTrigger>
        {content}
      </DropdownMenu>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Sair"
            onClick={() => setLogoutOpen(true)}
            className="mr-3 shrink-0 text-sidebar-muted hover:text-destructive"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Sair</TooltipContent>
      </Tooltip>

      {logoutConfirmation}
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
