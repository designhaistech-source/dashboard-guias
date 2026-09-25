import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useCurrentProfile, type ProfileRole } from "@/lib/current-profile";

/** Rotas exclusivas por perfil; as demais valem para todos. */
const RESTRICTED_ROUTES: Record<string, ProfileRole[]> = {
  "/prescricao": ["medico"],
  "/opme": ["medico"],
  "/documentos": ["medico"],
  "/cid": ["medico"],
  "/solicitacoes": ["medico"],
  "/autorizacoes": ["recepcao"],
};

export function canAccessRoute(pathname: string, role: ProfileRole): boolean {
  const allowed = RESTRICTED_ROUTES[pathname.replace(/\/+$/, "") || "/"];
  return !allowed || allowed.includes(role);
}

/** Protótipo: devolve ao Início quem abre pela URL uma página fora do perfil. */
export function useProfileRouteGuard() {
  const { role } = useCurrentProfile();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  useEffect(() => {
    if (!canAccessRoute(pathname, role)) navigate({ to: "/", replace: true });
  }, [pathname, role, navigate]);
}
