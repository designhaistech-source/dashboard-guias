import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Info, PenLine, Save, UserRound } from "lucide-react";
import { toast } from "sonner";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { FormActionBar } from "@/components/form-action-bar";
import { Field } from "@/components/form-field";
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
    formState: { errors, isSubmitting, touchedFields },
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
            number={1}
            title="Dados pessoais"
            description="Identificação do profissional responsável pelos documentos."
            icon={<UserRound className="h-4 w-4" aria-hidden="true" />}
          >
            <div className="grid gap-4 sm:grid-cols-2">
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
                label="CRM secundário"
                optional
                hint="Use quando atuar em mais de um estado."
                error={errorFor("secondaryCrm")}
              >
                <Input placeholder="CRM 5678/PB" {...register("secondaryCrm")} />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            number={2}
            title="Dados do consultório"
            description="Endereço e contato exibidos no cabeçalho dos documentos."
            icon={<Building2 className="h-4 w-4" aria-hidden="true" />}
          >
            <div className="grid gap-4 sm:grid-cols-2">
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

            <p className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Estes dados serão utilizados em prescrições, relatórios e demais documentos
              emitidos pelo sistema.
            </p>
          </SectionCard>

          <SectionCard
            number={3}
            title="Assinatura e identidade visual"
            description="Imagens aplicadas no rodapé e no cabeçalho dos documentos."
            icon={<PenLine className="h-4 w-4" aria-hidden="true" />}
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <ImageUploadField
                label="Assinatura digital"
                hint="PNG com fundo transparente, JPG ou SVG (até 2 MB)."
                previewAlt="Pré-visualização da assinatura digital do profissional"
              />
              <ImageUploadField
                label="Logo do consultório"
                hint="PNG, JPG ou SVG na maior resolução disponível (até 2 MB)."
                previewAlt="Pré-visualização da logo do consultório"
              />
            </div>
          </SectionCard>

          <FormActionBar>
            <Button type="submit" size="sm" disabled={isSubmitting}>
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
