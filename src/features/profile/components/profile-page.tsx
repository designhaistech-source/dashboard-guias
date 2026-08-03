import { BadgeCheck, CircleUser, Mail, MapPin, Phone, Stethoscope } from "lucide-react";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { PageHeader } from "@/components/page-header";
import { SiteFooter } from "@/components/site-footer";
import { SurfaceCard } from "@/components/surface-card";
import { CURRENT_USER } from "@/lib/current-user";

interface InfoRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}

/** Linha de leitura de um dado do perfil. */
function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="truncate text-sm font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
}

/** Página "Meu Perfil" — dados do profissional autenticado (somente leitura). */
export function ProfilePage() {
  const user = CURRENT_USER;

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <AppSidebar activeKey="perfil" />

      <main className="flex min-h-screen flex-1 flex-col overflow-x-hidden">
        <div className="w-full flex-1 space-y-6 px-4 py-6 pb-16 pt-20 sm:px-6 sm:py-8 md:pt-8 lg:px-10">
          <AppBreadcrumb />
          <PageHeader
            title="Meu Perfil"
            description="Dados do profissional utilizados nas guias, prescrições e documentos emitidos."
          />

          <SurfaceCard>
            <div className="flex flex-wrap items-center gap-4">
              <CircleUser
                className="h-16 w-16 shrink-0 text-muted-foreground"
                strokeWidth={1.25}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
                  {user.name}
                </h2>
                <p className="mt-0.5 font-mono text-sm text-muted-foreground">{user.crm}</p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <BadgeCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                  Registro profissional verificado
                </p>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard title="Informações de contato">
            <div className="grid gap-5 sm:grid-cols-2">
              <InfoRow icon={Mail} label="E-mail" value={user.email} />
              <InfoRow icon={Phone} label="Telefone" value={user.phone} />
              <InfoRow icon={Stethoscope} label="Especialidade" value={user.specialty} />
              <InfoRow icon={MapPin} label="Cidade" value={user.city} />
            </div>
          </SurfaceCard>
        </div>

        <SiteFooter />
      </main>
    </div>
  );
}
