import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ReplaceRequest = {
  /** Título do diálogo de confirmação. */
  title: string;
  /** Explicação do que será sobrescrito. */
  description: string;
  /** Rótulo do botão de confirmação. */
  confirmLabel: string;
  /** Mensagem exibida no toast com a opção de desfazer. */
  successMessage: string;
  /** Executa a substituição do texto. */
  apply: () => void | Promise<void>;
};

/**
 * Protege substituições destrutivas do texto do editor: pede confirmação quando
 * já existe conteúdo e oferece "Desfazer" no toast de sucesso.
 */
export function useTextReplacement(html: string, setHtml: (value: string) => void) {
  const [pending, setPending] = useState<ReplaceRequest | null>(null);
  const htmlRef = useRef(html);
  htmlRef.current = html;

  const run = useCallback(
    async (request: ReplaceRequest) => {
      const previous = htmlRef.current;
      await request.apply();
      const hadContent = Boolean(previous.replace(/<[^>]+>/g, "").trim());
      toast.success(
        request.successMessage,
        hadContent
          ? {
              action: {
                label: "Desfazer",
                onClick: () => {
                  setHtml(previous);
                  toast.info("Texto anterior restaurado.");
                },
              },
              duration: 10000,
            }
          : undefined,
      );
    },
    [setHtml],
  );

  const requestReplace = useCallback(
    (request: ReplaceRequest) => {
      const hasContent = Boolean(htmlRef.current.replace(/<[^>]+>/g, "").trim());
      if (!hasContent) {
        void run(request);
        return;
      }
      setPending(request);
    },
    [run],
  );

  const dialog = (
    <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{pending?.title ?? ""}</AlertDialogTitle>
          <AlertDialogDescription>{pending?.description ?? ""}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              const request = pending;
              setPending(null);
              if (request) void run(request);
            }}
          >
            {pending?.confirmLabel ?? "Continuar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { requestReplace, replacementDialog: dialog };
}
