import { useSyncExternalStore } from "react";
import { CURRENT_USER } from "@/lib/current-user";

/**
 * Usuário = pessoa que acessa o sistema; perfil (`role`) = permissões associadas.
 * Cada usuário sintético tem um perfil fixo: alternar simula a entrada de outra pessoa.
 */
export type ProfileRole = "medico" | "recepcao";

export interface Profile {
  userId: string;
  role: ProfileRole;
  /** Registro profissional exibido na identificação, quando houver. */
  registry?: string;
  roleLabel: string;
  name: string;
  subtitle: string;
  email: string;
}

export const PROFILES: Record<ProfileRole, Profile> = {
  medico: {
    userId: "u-fulano",
    role: "medico",
    registry: CURRENT_USER.crm,
    roleLabel: "Profissional de saúde",
    name: CURRENT_USER.name,
    subtitle: CURRENT_USER.crm,
    email: CURRENT_USER.email,
  },
  recepcao: {
    userId: "u-maria",
    role: "recepcao",
    roleLabel: "Recepção",
    name: "Maria Oliveira",
    subtitle: "Recepção",
    email: "maria.oliveira@haistech.com",
  },
};

const STORAGE_KEY = "guiasplus:profile";
const listeners = new Set<() => void>();
let current: ProfileRole = "medico";
let hydrated = false;

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "medico" || saved === "recepcao") current = saved;
}

export function setProfileRole(role: ProfileRole) {
  current = role;
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, role);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  hydrate();
  listeners.add(listener);
  listener();
  return () => listeners.delete(listener);
}

export function useCurrentProfile(): Profile {
  const role = useSyncExternalStore(
    subscribe,
    () => current,
    () => "medico" as ProfileRole,
  );
  return PROFILES[role];
}
