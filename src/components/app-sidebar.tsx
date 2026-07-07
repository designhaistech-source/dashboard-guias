import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  LayoutGrid,
  FileText,
  FileCheck2,
  Files,
  ScanSearch,
  Pill,
  ScanLine,
  HelpCircle,
  CircleUser,
  LogOut,
  ChevronDown,
  Moon,
  Sun,
  Settings,
  Mail,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import logoAsset from "@/assets/haisguias-logo.png.asset.json";

type ItemKey =
  | "dashboard"
  | "emitir"
  | "extrair"
  | "guias"
  | "procedimento"
  | "prescricao"
  | "cid"
  | "ajuda";

export function AppSidebar({ activeKey }: { activeKey: ItemKey }) {
  return (
    <TooltipProvider delayDuration={150}>
      <aside className="hidden md:flex w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="flex items-center justify-center px-4 py-5 border-b border-sidebar-border min-w-0">
          <img
            src={logoAsset.url}
            alt="HaisGuias"
            className="block h-8 w-auto max-w-full object-contain"
          />
        </div>



        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <SidebarGroup label="INÍCIO">
            <SidebarItem
              icon={LayoutGrid}
              label="Dashboard"
              to="/"
              active={activeKey === "dashboard"}
              hint="Visão geral com indicadores e resumo das suas atividades recentes."
            />

          </SidebarGroup>

          <SidebarGroup label="GUIAS">
            <SidebarItem
              icon={FileText}
              label="Emitir guia"
              to="/emitir"
              active={activeKey === "emitir"}
              hint="Preencha e gere novas guias médicas (SADT, consultas, encaminhamentos)."
            />
            <SidebarItem
              icon={FileCheck2}
              label="Histórico de guias"
              active={activeKey === "extrair"}
              hint="Consulte o histórico e acompanhe o status das guias processadas."
            />
            <SidebarItem
              icon={Files}
              label="Extrair dados da guia"
              to="/guias"
              active={activeKey === "guias"}
              hint="Extraia automaticamente os dados de uma guia por meio de IA."
            />

            <SidebarItem
              icon={ScanSearch}
              label="Buscar procedimento"
              active={activeKey === "procedimento"}
              hint="Consulte códigos e descrições de procedimentos (TUSS / tabelas)."
            />
          </SidebarGroup>

          <SidebarGroup label="ATENDIMENTO CLÍNICO">
            <SidebarItem
              icon={Pill}
              label="Prescrição médica"
              to="/prescricao"
              active={activeKey === "prescricao"}
              hint="Crie e gerencie prescrições de medicamentos para seus pacientes."
            />

            <SidebarItem
              icon={ScanLine}
              label="Buscar CID"
              active={activeKey === "cid"}
              hint="Pesquise códigos da Classificação Internacional de Doenças (CID‑10/11)."
            />
          </SidebarGroup>

          <div className="border-t border-sidebar-border pt-4">
            <SidebarGroup label="AJUDA">
              <SidebarItem
                icon={HelpCircle}
                label="Relatar Problema"
                active={activeKey === "ajuda"}
                hint="Envie um relato de erro ou sugestão para o time de suporte."
              />
            </SidebarGroup>
          </div>
        </nav>

        <UserMenu />
      </aside>
    </TooltipProvider>
  );
}

function UserMenu() {
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

  return (
    <div ref={ref} className="relative border-t border-sidebar-border">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-4 flex items-center gap-3 hover:bg-muted transition-colors text-left"
      >
        <CircleUser className="h-9 w-9 text-sidebar-muted shrink-0" strokeWidth={1.5} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">Dr Fulano</div>
          <div className="text-xs text-sidebar-muted">CRM 1234/RN</div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-sidebar-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
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
            <button
              onClick={() => setDark((v) => !v)}
              className="w-full px-4 py-2 flex items-center gap-3 text-sm hover:bg-muted transition-colors"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="flex-1 text-left">Modo {dark ? "claro" : "escuro"}</span>
              <span
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  dark ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    dark ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </span>
            </button>
            <button className="w-full px-4 py-2 flex items-center gap-3 text-sm hover:bg-muted transition-colors">
              <Settings className="h-4 w-4" />
              Configurações
            </button>
          </div>
          <div className="border-t border-border py-1">
            <button className="w-full px-4 py-2 flex items-center gap-3 text-sm text-destructive hover:bg-muted transition-colors">
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="px-3 text-[11px] font-medium tracking-wider text-sidebar-muted">{label}</div>
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
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  hint?: string;
  to?: string;
}) {
  const className = [
    "group w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
    active
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
      : "text-sidebar-foreground hover:bg-muted",
  ].join(" ");

  const inner = (
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
      <Link to={to} className={className}>
        {inner}
      </Link>
    );
  }
  return <button className={className}>{inner}</button>;
}
