import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppModal } from "@/components/app-modal";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/form-field";
import { Input } from "@/components/ui/input";

import {
  listSavedTemplates,
  removeTemplate,
  saveTemplate,
  subscribeTemplates,
  type DocumentTemplateKind,
  type SavedDocumentTemplate,
} from "../data/document-templates";

const MAX_NAME = 60;

function hasText(html: string): boolean {
  return html.replace(/<[^>]+>/g, "").trim().length > 0;
}

/**
 * Persiste e lista os modelos de documento salvos pelo usuário.
 * Expõe o diálogo de nomeação usado pela ação “Salvar como modelo”.
 */
export function useDocumentTemplates(options: {
  kind: DocumentTemplateKind;
  /** Conteúdo HTML atual do editor, lido no momento do salvamento. */
  getContent: () => string;
  /** Nome sugerido no diálogo (ex.: nome do paciente). */
  suggestName?: () => string;
}) {
  const { kind, getContent, suggestName } = options;
  const [templates, setTemplates] = useState<SavedDocumentTemplate[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const refresh = useCallback(() => setTemplates(listSavedTemplates(kind)), [kind]);

  useEffect(() => {
    refresh();
    return subscribeTemplates(kind, refresh);
  }, [kind, refresh]);

  const requestSave = useCallback(() => {
    if (!hasText(getContent())) {
      toast.error("Escreva o texto do documento antes de salvá-lo como modelo.");
      return;
    }
    setName(suggestName?.().trim() ?? "");
    setOpen(true);
  }, [getContent, suggestName]);

  const remove = useCallback(
    (template: SavedDocumentTemplate) => {
      removeTemplate(kind, template.value);
      toast.success(`Modelo “${template.label}” removido.`);
    },
    [kind],
  );

  const trimmed = name.trim();
  const duplicate = templates.some(
    (t) => t.label.toLocaleLowerCase("pt-BR") === trimmed.toLocaleLowerCase("pt-BR"),
  );
  const nameError = trimmed.length > 0 && trimmed.length < 3 ? "Use ao menos 3 caracteres." : undefined;

  function handleConfirm() {
    if (!trimmed || nameError) return;
    const { template, overwritten } = saveTemplate(kind, trimmed, getContent());
    setOpen(false);
    toast.success(
      overwritten
        ? `Modelo “${template.label}” atualizado.`
        : `Modelo “${template.label}” salvo e disponível na lista.`,
    );
  }

  const saveDialog = (
    <AppModal
      open={open}
      onOpenChange={setOpen}
      size="md"
      title="Salvar como modelo"
      description="O texto atual será guardado neste navegador e ficará disponível na lista de modelos deste tipo de documento."
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button form={FORM_ID} type="submit" disabled={!trimmed || Boolean(nameError)}>
            Salvar modelo
          </Button>
        </>
      }
    >
      <form
        id={FORM_ID}
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          handleConfirm();
        }}
      >
          <Field
            id="modelo-nome"
            label="Nome do modelo"
            required
            error={nameError}
            hint={
              duplicate && !nameError
                ? "Já existe um modelo com este nome: ele será substituído."
                : undefined
            }
          >
            <Input
              id="modelo-nome"
              autoFocus
              maxLength={MAX_NAME}
              placeholder="Ex.: Atestado padrão 3 dias"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>

        {templates.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Modelos salvos</p>
            <ul className="max-h-40 space-y-1.5 overflow-y-auto">
              {templates.map((template) => (
                <li
                  key={template.value}
                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 py-1.5 pl-3 pr-1.5"
                >
                  <span className="min-w-0 truncate text-xs">{template.label}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground"
                    aria-label={`Remover modelo ${template.label}`}
                    onClick={() => remove(template)}
                  >
                    <Trash2 className="icon-optical h-4 w-4" aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </AppModal>
  );

  return { templates, requestSave, remove, saveDialog };
}
