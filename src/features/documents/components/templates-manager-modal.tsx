import { useEffect, useMemo, useRef, useState } from "react";

import { AlertTriangle, BookMarked, Pencil, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { AppModal } from "@/components/app-modal";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/form-field";
import { Input } from "@/components/ui/input";

import {
  listSavedTemplates,
  removeTemplate,
  subscribeTemplates,
  updateTemplate,
  type DocumentTemplateKind,
  type SavedDocumentTemplate,
} from "../data/document-templates";
import { RichTextEditor } from "./rich-text-editor";

const MAX_NAME = 60;

/** Rótulo do tipo de documento usado nos textos do modal. */
const KIND_LABEL: Record<DocumentTemplateKind, string> = {
  relatorio: "relatório",
  atestado: "atestado",
  comparecimento: "declaração de comparecimento",
};

function hasText(html: string): boolean {
  return html.replace(/<[^>]+>/g, "").trim().length > 0;
}

export interface TemplatesManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: DocumentTemplateKind;
}

/**
 * Gerenciamento dos modelos personalizados de um tipo de documento:
 * busca, edição (nome + conteúdo) e exclusão com confirmação inline.
 * Os modelos padrão do sistema não são listados e seguem inalteráveis.
 */
export function TemplatesManagerModal({ open, onOpenChange, kind }: TemplatesManagerModalProps) {
  const [templates, setTemplates] = useState<SavedDocumentTemplate[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTemplates(listSavedTemplates(kind));
    setQuery("");
    setEditing(null);
    setConfirmingDelete(null);
    return subscribeTemplates(kind, () => setTemplates(listSavedTemplates(kind)));
  }, [open, kind]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("pt-BR");
    if (!q) return templates;
    return templates.filter((t) => t.label.toLocaleLowerCase("pt-BR").includes(q));
  }, [templates, query]);

  function startEdit(template: SavedDocumentTemplate) {
    setConfirmingDelete(null);
    setEditing(template.value);
    setDraftName(template.label);
    setDraftContent(template.content);
  }

  const trimmedName = draftName.trim();
  const nameError =
    trimmedName.length > 0 && trimmedName.length < 3 ? "Use ao menos 3 caracteres." : undefined;
  const contentError = !hasText(draftContent) ? "Escreva o conteúdo do modelo." : undefined;

  function saveEdit(template: SavedDocumentTemplate) {
    if (!trimmedName || nameError || contentError) {
      toast.error(nameError ?? contentError ?? "Preencha o nome do modelo.");
      return;
    }
    if (!updateTemplate(kind, template.value, trimmedName, draftContent)) {
      toast.error("Já existe um modelo com este nome.");
      return;
    }
    setEditing(null);
    toast.success(`Modelo “${trimmedName}” atualizado.`);
  }

  function handleDelete(template: SavedDocumentTemplate) {
    removeTemplate(kind, template.value);
    toast.success(`Modelo “${template.label}” excluído.`);
    setConfirmingDelete(null);
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      initialFocusRef={searchRef}
      icon={<BookMarked className="size-4" aria-hidden />}
      title="Gerenciar modelos"
      description={`Edite ou exclua os modelos de ${KIND_LABEL[kind]} salvos neste navegador. Os modelos padrão do sistema não podem ser alterados.`}
      toolbar={
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar modelo pelo nome…"
            aria-label="Buscar modelo pelo nome"
            className="pl-9"
          />
        </div>
      }
      footer={
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Fechar
        </Button>
      }
    >
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <BookMarked className="mx-auto size-8 text-muted-foreground/60" aria-hidden />
          <p className="mt-3 text-sm font-medium text-foreground">
            {templates.length === 0 ? "Nenhum modelo salvo" : "Nenhum modelo encontrado"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {templates.length === 0
              ? "Use “Salvar como modelo” após redigir o texto para reaproveitá-lo depois."
              : "Ajuste a busca para encontrar outros modelos."}
          </p>
        </div>
      ) : (
        <ul className="grid gap-2.5">
          {filtered.map((template) => {
            const isEditing = editing === template.value;
            const isConfirming = confirmingDelete === template.value;
            return (
              <li key={template.value} className="rounded-xl border border-border bg-background p-3">
                {isEditing ? (
                  <form
                    className="grid gap-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      saveEdit(template);
                    }}
                  >
                    <Field
                      id={`modelo-nome-${template.value}`}
                      label="Nome do modelo"
                      required
                      error={nameError}
                    >
                      <Input
                        id={`modelo-nome-${template.value}`}
                        autoFocus
                        maxLength={MAX_NAME}
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                      />
                    </Field>

                    <RichTextEditor
                      value={draftContent}
                      onChange={setDraftContent}
                      ariaLabel={`Conteúdo do modelo ${template.label}`}
                      header={
                        <p className="text-xs font-medium text-foreground">Conteúdo do modelo</p>
                      }
                      placeholder="Escreva o conteúdo do modelo…"
                    />

                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setEditing(null)}
                      >
                        <X className="size-4" aria-hidden />
                        Cancelar
                      </Button>
                      <Button type="submit" size="sm" disabled={!trimmedName || Boolean(nameError)}>
                        Salvar alterações
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                      {template.label}
                    </span>
                    {!isConfirming && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(template)}
                          aria-label={`Editar modelo ${template.label}`}
                        >
                          <Pencil className="size-4" aria-hidden />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirmingDelete(template.value)}
                          aria-label={`Excluir modelo ${template.label}`}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-4" aria-hidden />
                          Excluir
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {isConfirming && !isEditing && (
                  <div
                    role="alert"
                    className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-md border border-destructive/20 bg-destructive/5 px-2.5 py-1.5"
                  >
                    <AlertTriangle className="size-3.5 shrink-0 text-destructive" aria-hidden />
                    <p className="min-w-0 flex-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Excluir este modelo?</span>{" "}
                      Esta ação não poderá ser desfeita.
                    </p>
                    <div className="ml-auto flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => setConfirmingDelete(null)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        autoFocus
                        className="h-7 px-2.5 text-xs"
                        onClick={() => handleDelete(template)}
                      >
                        Excluir modelo
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </AppModal>
  );
}
