import { z } from "zod";

/** Validação da alteração de senha na página Configurações. */
export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual."),
    newPassword: z
      .string()
      .min(8, "Use no mínimo 8 caracteres.")
      .regex(/[A-Za-z]/, "Inclua ao menos uma letra.")
      .regex(/\d/, "Inclua ao menos um número."),
    confirmPassword: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não coincidem.",
  });

export type PasswordFormValues = z.infer<typeof passwordSchema>;
