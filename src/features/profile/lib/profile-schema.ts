import { z } from "zod";

/** Validação dos dados do profissional usados na emissão de documentos. */
export const profileSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome completo."),
  email: z.string().trim().email("Informe um e-mail válido."),
  primaryCrm: z.string().trim().min(4, "Informe o CRM principal (ex.: CRM 1234/RN)."),
  secondaryCrm: z.string().trim().optional(),
  clinicName: z.string().trim().min(3, "Informe o nome do consultório."),
  clinicAddress: z.string().trim().min(5, "Informe o endereço do consultório."),
  clinicPhone: z
    .string()
    .trim()
    .min(10, "Informe um telefone com DDD."),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
