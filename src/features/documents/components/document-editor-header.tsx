import type { ReactNode } from "react";

interface DocumentEditorHeaderProps {
  /** Título do documento (H2 na escala do design system). */
  title: string;
  /** Linha de metadados: paciente, data, CID. */
  meta: ReactNode;
  /** Ações opcionais à direita (ex.: restaurar texto padrão). */
  actions?: ReactNode;
}

/**
 * Cabeçalho padronizado do editor de documentos.
 * Centraliza os tokens de tipografia usados nas abas Relatórios,
 * Atestados e Comparecimento.
 */
export function DocumentEditorHeader({ title, meta, actions }: DocumentEditorHeaderProps) {
  return (
    <>
      <div className="min-w-0">
        <h2 className="font-display text-base font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>
      </div>
      {actions}
    </>
  );
}
