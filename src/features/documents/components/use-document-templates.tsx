import { useCallback, useEffect, useState } from "react";

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
const FORM_ID = "salvar-modelo-form";

/** Placeholder do nome do modelo por tipo de documento. */
const NAME_PLACEHOLDER: Record<DocumentTemplateKind, string> = {
  relatorio: "Ex.: Relatório de acompanhamento",
  atestado: "Ex.: Atestado de afastamento",
  comparecimento: "Ex.: Declaração de comparecimento",
};

const MODAL_DESCRIPTION =
  "Os dados do paciente serão substituídos por variáveis, permitindo reutilizar o modelo em outros documentos.";

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
}) {
  const { kind, getContent } = options;
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
    // Nome sempre começa vazio: o modelo é reutilizável, não vinculado ao paciente.
    setName("");
    setOpen(true);
  }, [getContent]);

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
      description={MODAL_DESCRIPTION}
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
              placeholder={NAME_PLACEHOLDER[kind]}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>

      </form>
    </AppModal>
  );

  return { templates, requestSave, remove, saveDialog };
}
