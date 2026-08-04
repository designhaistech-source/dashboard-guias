import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Info, PenLine, RotateCcw, Save, UserRound } from "lucide-react";
import { toast } from "sonner";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { FormActionBar } from "@/components/form-action-bar";
import { Field } from "@/components/form-field";
import { InfoHint } from "@/components/info-hint";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CURRENT_USER } from "@/lib/current-user";
import { ImageUploadField } from "./image-upload-field";
import { profileSchema, type ProfileFormValues } from "../lib/profile-schema";

/** Página "Meu Perfil" — dados do profissional e do consultório usados nos documentos. */
export function ProfilePage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting, touchedFields },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: "onBlur",
    defaultValues: {
      name: CURRENT_USER.name,
      email: CURRENT_USER.email,
      primaryCrm: CURRENT_USER.crm,
      secondaryCrm: "",
      clinicName: "Consultório Guias+",
      clinicAddress: "Av. Exemplo, 1000 — Natal / RN",
      clinicPhone: CURRENT_USER.phone,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    // Protótipo: sem persistência; apenas confirma a ação para o usuário.
    await new Promise((resolve) => setTimeout(resolve, 400));
    reset(values);
    toast.success(`Perfil de ${values.name} atualizado.`);
  });

  /** Só exibe o erro depois da interação com o campo. */
  const errorFor = (field: keyof ProfileFormValues) =>
    touchedFields[field] ? errors[field]?.message : undefined;

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <AppSidebar activeKey="perfil" />

      <main className="flex min-h-screen flex-1 flex-col overflow-x-hidden">
        <form
          onSubmit={onSubmit}
          className="w-full flex-1 space-y-6 px-4 py-6 pb-16 pt-20 sm:px-6 sm:py-8 md:pt-8 lg:px-10"
        >
          <AppBreadcrumb />
          <PageHeader
            title="Meu Perfil"
            description="Dados do profissional e do consultório utilizados nas prescrições, relatórios e demais documentos emitidos."
          />

          <SectionCard
            descriptionClassName="text-xs text-muted-foreground"
            title="Dados pessoais"
            description="Identificação do profissional responsável pelos documentos."
            icon={<UserRound className="h-4 w-4" aria-hidden="true" />}
          >
            <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
              <Field id="profile-name" label="Nome" required error={errorFor("name")}>
                <Input autoComplete="name" {...register("name")} />
              </Field>
              <Field id="profile-email" label="E-mail" required error={errorFor("email")}>
                <Input type="email" autoComplete="email" {...register("email")} />
              </Field>
              <Field
                id="profile-primary-crm"
                label="CRM principal"
                required
                error={errorFor("primaryCrm")}
              >
                <Input placeholder="CRM 1234/RN" {...register("primaryCrm")} />
              </Field>
              <Field
                id="profile-secondary-crm"
                label={
                  <span className="inline-flex items-center gap-1">
                    CRM secundário
                    <InfoHint label="Ajuda sobre CRM secundário">
                      Use quando atuar em mais de um estado.
                    </InfoHint>
                  </span>
                }
                optional
                error={errorFor("secondaryCrm")}
              >
                <Input placeholder="CRM 5678/PB" {...register("secondaryCrm")} />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            descriptionClassName="text-xs text-muted-foreground"
            title="Dados do consultório"
            description="Endereço e contato exibidos no cabeçalho dos documentos."
            icon={<Building2 className="h-4 w-4" aria-hidden="true" />}
          >
            <p className="flex items-start gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
              Estes dados serão utilizados em prescrições, relatórios e demais documentos
              emitidos pelo sistema.
            </p>

            <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
              <Field
                id="profile-clinic-name"
                label="Nome do consultório"
                required
                error={errorFor("clinicName")}
              >
                <Input {...register("clinicName")} />
              </Field>
              <Field
                id="profile-clinic-phone"
                label="Telefone"
                required
                error={errorFor("clinicPhone")}
              >
                <Input
                  type="tel"
                  autoComplete="tel"
                  placeholder="(84) 98888-1234"
                  {...register("clinicPhone")}
                />
              </Field>
              <Field
                id="profile-clinic-address"
                label="Endereço"
                required
                className="sm:col-span-2"
                error={errorFor("clinicAddress")}
              >
                <Input
                  autoComplete="street-address"
                  placeholder="Rua, número, bairro, cidade / UF"
                  {...register("clinicAddress")}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            descriptionClassName="text-xs text-muted-foreground"
            title="Assinatura e identidade visual"
            description="Imagens aplicadas no rodapé e no cabeçalho dos documentos."
            icon={<PenLine className="h-4 w-4" aria-hidden="true" />}
          >
            <div className="grid items-stretch gap-x-5 gap-y-4 sm:grid-cols-2">
              <ImageUploadField
                label="Assinatura digital"
                hint="PNG com fundo transparente, JPG ou SVG. Até 2 MB."
                previewAlt="Pré-visualização da assinatura digital do profissional"
              />
              <ImageUploadField
                label="Logo do consultório"
                hint="PNG, JPG ou SVG na maior resolução disponível. Até 2 MB."
                previewAlt="Pré-visualização da logo do consultório"
              />
            </div>
          </SectionCard>

          <FormActionBar
            note={
              isDirty
                ? "Você tem alterações não salvas neste perfil."
                : "Todas as alterações estão salvas."
            }
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => reset()}
              disabled={!isDirty || isSubmitting}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Descartar alterações
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting || !isDirty}>
              <Save className="h-4 w-4" aria-hidden="true" />
              {isSubmitting ? "Salvando..." : "Salvar alterações"}
            </Button>
          </FormActionBar>
        </form>

        <SiteFooter />
      </main>
    </div>
  );
}
