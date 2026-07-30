import { Link, useRouterState } from "@tanstack/react-router";
import { Home } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface RouteMeta {
  /** Grupo de navegação exibido como nível intermediário (sem link). */
  group?: string;
  label: string;
}

/** Mapa de rotas para rótulos de trilha, alinhado aos grupos da sidebar. */
const ROUTE_META: Record<string, RouteMeta> = {
  "/": { label: "Dashboard" },
  "/dashboard": { group: "Início", label: "Dashboard" },
  "/emitir": { group: "Guias", label: "Emitir guia" },
  "/guias": { group: "Guias", label: "Extrair dados da guia" },
  "/procedimentos": { group: "Guias", label: "Buscar procedimento" },
  "/prescricao": { group: "Atendimento clínico", label: "Emitir prescrição" },
  "/opme": { group: "Atendimento clínico", label: "Solicitar OPME" },
  "/documentos": {
    group: "Atendimento clínico",
    label: "Relatórios e documentos",
  },
  "/cid": { group: "Atendimento clínico", label: "Busca CID-10" },
  "/design-system": { group: "Design system", label: "Fundamentos" },
  "/design-system-icones": { group: "Design system", label: "Ícones" },
};

/**
 * Trilha de navegação padrão do sistema, derivada da rota atual.
 * Renderiza apenas quando há um nível além da home.
 */
export function AppBreadcrumb({ className }: { className?: string }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  const meta = ROUTE_META[normalized];

  if (!meta || normalized === "/") return null;

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/" className="inline-flex items-center gap-1.5">
              <Home aria-hidden="true" className="size-3.5 icon-optical" />
              <span>Início</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {meta.group && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="text-muted-foreground">{meta.group}</span>
            </BreadcrumbItem>
          </>
        )}
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{meta.label}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
