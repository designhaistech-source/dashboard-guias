import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { getProfileRole, useCurrentProfile, type ProfileRole } from "@/lib/current-profile";

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
  const path = pathname.replace(/\/+$/, "") || "/";
  // Child pages inherit the restriction of their first segment (e.g. /autorizacoes/SOL-00001).
  const allowed = RESTRICTED_ROUTES[path] ?? RESTRICTED_ROUTES[`/${path.split("/")[1]}`];
  return !allowed || allowed.includes(role);
}

/** Protótipo: devolve ao Início quem abre pela URL uma página fora do perfil. */
export function useProfileRouteGuard() {
  const { role } = useCurrentProfile();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  useEffect(() => {
    // The first client render uses the SSR default role; check the stored one.
    if (!canAccessRoute(pathname, getProfileRole())) navigate({ to: "/", replace: true });
  }, [pathname, role, navigate]);
}
