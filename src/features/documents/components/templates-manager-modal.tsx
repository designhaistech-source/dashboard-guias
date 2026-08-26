import { useEffect, useMemo, useRef, useState } from "react";

import { BookMarked, Check, Pencil, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { AppModal } from "@/components/app-modal";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  listSavedTemplates,
  removeTemplate,
  renameTemplate,
  subscribeTemplates,
  type DocumentTemplateKind,
  type SavedDocumentTemplate,
} from "../data/document-templates";

const MAX_NAME = 60;

/** Rótulo do tipo de documento usado nos textos do modal. */
const KIND_LABEL: Record<DocumentTemplateKind, string> = {
  relatorio: "relatório",
  atestado: "atestado",
  comparecimento: "declaração de comparecimento",
};

export interface TemplatesManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: DocumentTemplateKind;
}

/**
 * Gerenciamento dos modelos personalizados de um tipo de documento:
 * busca, renomeação e exclusão com confirmação. A aplicação do modelo
 * continua no select "Modelos disponíveis" do formulário.
 */
export function TemplatesManagerModal({ open, onOpenChange, kind }: TemplatesManagerModalProps) {
  const [templates, setTemplates] = useState<SavedDocumentTemplate[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [toDelete, setToDelete] = useState<SavedDocumentTemplate | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTemplates(listSavedTemplates(kind));
    setQuery("");
    setEditing(null);
    return subscribeTemplates(kind, () => setTemplates(listSavedTemplates(kind)));
  }, [open, kind]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("pt-BR");
    if (!q) return templates;
    return templates.filter((t) => t.label.toLocaleLowerCase("pt-BR").includes(q));
  }, [templates, query]);

  function startRename(template: SavedDocumentTemplate) {
    setEditing(template.value);
    setDraftName(template.label);
  }

  function confirmRename(template: SavedDocumentTemplate) {
    const name = draftName.trim();
    if (name.length < 3) {
      toast.error("Use ao menos 3 caracteres no nome do modelo.");
      return;
    }
    if (name === template.label) {
      setEditing(null);
      return;
    }
    if (!renameTemplate(kind, template.value, name)) {
      toast.error("Já existe um modelo com este nome.");
      return;
    }
    setEditing(null);
    toast.success(`Modelo renomeado para “${name}”.`);
  }

  function handleDelete() {
    if (!toDelete) return;
    removeTemplate(kind, toDelete.value);
    toast.success(`Modelo “${toDelete.label}” excluído.`);
    setToDelete(null);
  }

  return (
    <>
      <AppModal
        open={open}
        onOpenChange={onOpenChange}
        size="lg"
        initialFocusRef={searchRef}
        icon={<BookMarked className="size-4" aria-hidden />}
        title="Gerenciar modelos"
        description={`Renomeie ou exclua os modelos de ${KIND_LABEL[kind]} salvos neste navegador. Os modelos padrão do sistema não podem ser alterados.`}
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
              return (
                <li
                  key={template.value}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background p-3"
                >
                  {isEditing ? (
                    <>
                      <Input
                        autoFocus
                        maxLength={MAX_NAME}
                        value={draftName}
                        aria-label={`Novo nome do modelo ${template.label}`}
                        onChange={(e) => setDraftName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            confirmRename(template);
                          }
                          if (e.key === "Escape") setEditing(null);
                        }}
                        className="min-w-0 flex-1"
                      />
                      <Button size="sm" onClick={() => confirmRename(template)}>
                        <Check className="size-4" aria-hidden />
                        Salvar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                        <X className="size-4" aria-hidden />
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                        {template.label}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startRename(template)}
                        aria-label={`Renomear modelo ${template.label}`}
                      >
                        <Pencil className="size-4" aria-hidden />
                        Renomear
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setToDelete(template)}
                        aria-label={`Excluir modelo ${template.label}`}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" aria-hidden />
                        Excluir
                      </Button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </AppModal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(v) => {
          if (!v) setToDelete(null);
        }}
        title="Excluir modelo?"
        description={`O modelo “${toDelete?.label ?? ""}” será removido deste navegador. Documentos já emitidos não são afetados.`}
        confirmLabel="Excluir modelo"
        onConfirm={handleDelete}
      />
    </>
  );
}
