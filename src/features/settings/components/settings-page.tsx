import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Download,
  Info,
  KeyRound,
  Monitor,
  Moon,
  Palette,
  ShieldCheck,
  Sun,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppModal } from "@/components/app-modal";
import { AppSidebar } from "@/components/app-sidebar";
import { Field } from "@/components/form-field";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CURRENT_USER } from "@/lib/current-user";
import { useTheme, type ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { passwordSchema, type PasswordFormValues } from "../lib/settings-schema";

const THEME_OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  hint: string;
  icon: typeof Sun;
}> = [
  { value: "light", label: "Claro", hint: "Sempre em tema claro", icon: Sun },
  { value: "dark", label: "Escuro", hint: "Sempre em tema escuro", icon: Moon },
  {
    value: "system",
    label: "Sistema",
    hint: "Acompanha o dispositivo",
    icon: Monitor,
  },
];

/** Página "Configurações" — segurança, privacidade (LGPD) e preferências. */
export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [exportOpen, setExportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, touchedFields },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    mode: "onBlur",
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const errorFor = (field: keyof PasswordFormValues) =>
    touchedFields[field] ? errors[field]?.message : undefined;

  const onSubmitPassword = handleSubmit(async () => {
    // Protótipo: sem persistência; apenas confirma a ação para o usuário.
    await new Promise((resolve) => setTimeout(resolve, 400));
    reset();
    toast.success("Senha alterada com sucesso.");
  });

  const requestExport = () => {
    setExportOpen(false);
    toast.success(
      `Exportação solicitada. O arquivo será enviado para ${CURRENT_USER.email}.`,
    );
  };

  const requestDeletion = () => {
    setDeleteOpen(false);
    setDeleteConfirm("");
    toast.success(
      "Solicitação de exclusão registrada. Você tem até 30 dias para cancelar.",
    );
  };

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <AppSidebar activeKey="configuracoes" />

      <main className="flex min-h-screen flex-1 flex-col overflow-x-hidden">
        <div className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-4 py-6 pb-16 pt-20 sm:px-6 sm:py-8 md:pt-8 lg:px-10">
          <AppBreadcrumb />
          <PageHeader
            title="Configurações"
            description="Segurança da conta, privacidade dos dados e preferências de exibição do sistema."
          />

          <SectionCard
            title="Segurança"
            description="Credenciais de acesso à conta."
            descriptionClassName="text-xs text-muted-foreground"
            icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
          >
            <form onSubmit={onSubmitPassword} className="space-y-4" noValidate>
              <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                <Field
                  id="settings-current-password"
                  label="Senha atual"
                  required
                  error={errorFor("currentPassword")}
                  className="sm:col-span-2"
                >
                  <Input
                    type="password"
                    autoComplete="current-password"
                    {...register("currentPassword")}
                  />
                </Field>
                <Field
                  id="settings-new-password"
                  label="Nova senha"
                  required
                  hint="Mínimo de 8 caracteres, com letras e números."
                  error={errorFor("newPassword")}
                >
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...register("newPassword")}
                  />
                </Field>
                <Field
                  id="settings-confirm-password"
                  label="Confirmar nova senha"
                  required
                  error={errorFor("confirmPassword")}
                >
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...register("confirmPassword")}
                  />
                </Field>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  <KeyRound aria-hidden="true" />
                  Alterar senha
                </Button>
              </div>
            </form>
          </SectionCard>

          <SectionCard
            title="Privacidade (LGPD)"
            description="Direitos sobre os seus dados pessoais."
            descriptionClassName="text-xs text-muted-foreground"
            icon={<Info className="h-4 w-4" aria-hidden="true" />}
          >
            <p className="flex items-start gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
              <Info
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
                aria-hidden="true"
              />
              Solicitações de exportação e exclusão são atendidas em até 15 dias, conforme
              a Lei Geral de Proteção de Dados.
            </p>

            <div className="divide-y divide-border rounded-xl border border-border">
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    Solicitar exportação dos dados
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Receba um arquivo com o seu cadastro, guias e documentos emitidos.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="sm:shrink-0"
                  onClick={() => setExportOpen(true)}
                >
                  <Download aria-hidden="true" />
                  Solicitar exportação
                </Button>
              </div>

              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    Solicitar exclusão da conta
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Remove definitivamente o acesso e os dados vinculados ao seu perfil.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive sm:shrink-0"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 aria-hidden="true" />
                  Solicitar exclusão
                </Button>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Preferências"
            description="Aparência da interface neste dispositivo."
            descriptionClassName="text-xs text-muted-foreground"
            icon={<Palette className="h-4 w-4" aria-hidden="true" />}
          >
            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold text-foreground">Tema</legend>
              <div
                role="radiogroup"
                aria-label="Tema da interface"
                className="grid gap-3 sm:grid-cols-3"
              >
                {THEME_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const selected = theme === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setTheme(option.value)}
                      className={cn(
                        "flex min-h-11 items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                          selected
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-foreground">
                          {option.label}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {option.hint}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </SectionCard>
        </div>

        <SiteFooter />
      </main>

      <AppModal
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="Solicitar exportação dos dados"
        description={`Enviaremos um arquivo com os seus dados para ${CURRENT_USER.email} em até 15 dias.`}
        icon={<Download className="h-4 w-4" aria-hidden="true" />}
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setExportOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={requestExport}>
              Confirmar solicitação
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          A exportação inclui cadastro do profissional, dados do consultório, guias
          processadas e documentos emitidos.
        </p>
      </AppModal>

      <AppModal
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeleteConfirm("");
        }}
        title="Solicitar exclusão da conta"
        description="Esta ação é definitiva após o prazo de cancelamento de 30 dias."
        icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteConfirm.trim().toUpperCase() !== "EXCLUIR"}
              onClick={requestDeletion}
            >
              Solicitar exclusão
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Todos os dados vinculados a {CURRENT_USER.email} serão removidos, incluindo
            guias, prescrições e documentos emitidos.
          </p>
          <Field
            id="settings-delete-confirm"
            label="Digite EXCLUIR para confirmar"
            required
          >
            <Input
              value={deleteConfirm}
              onChange={(event) => setDeleteConfirm(event.target.value)}
              placeholder="EXCLUIR"
              autoComplete="off"
            />
          </Field>
        </div>
      </AppModal>
    </div>
  );
}
