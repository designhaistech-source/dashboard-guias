import * as React from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Eraser,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Loader2,
  Sparkles,
} from "lucide-react";


import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ToolbarButton {
  command: string;
  label: string;
  icon: React.ElementType;
}

const GROUPS: ToolbarButton[][] = [
  [
    { command: "bold", label: "Negrito", icon: Bold },
    { command: "italic", label: "Itálico", icon: Italic },
    { command: "underline", label: "Sublinhado", icon: Underline },
  ],
  [
    { command: "insertUnorderedList", label: "Lista com marcadores", icon: List },
    { command: "insertOrderedList", label: "Lista numerada", icon: ListOrdered },
    { command: "removeFormat", label: "Limpar formatação", icon: Eraser },
  ],
  [
    { command: "justifyLeft", label: "Alinhar à esquerda", icon: AlignLeft },
    { command: "justifyCenter", label: "Centralizar", icon: AlignCenter },
    { command: "justifyRight", label: "Alinhar à direita", icon: AlignRight },
  ],
];

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  /** Conteúdo renderizado acima da barra de ferramentas (título, ações de IA). */
  header?: React.ReactNode;
  placeholder?: string;
  className?: string;
  ariaLabel: string;
  /** Aciona a melhoria do texto com IA. Quando ausente, o botão não é exibido. */
  onImproveWithAi?: () => void;
  /** Indica que a melhoria com IA está em andamento. */
  improving?: boolean;
}


/**
 * Editor de texto simples usado nos documentos clínicos.
 * Mantém o HTML controlado por fora e só reescreve o DOM quando o valor
 * externo diverge do conteúdo atual (evita perder o cursor ao digitar).
 */
export function RichTextEditor({
  value,
  onChange,
  header,
  placeholder,
  className,
  ariaLabel,
  onImproveWithAi,
  improving = false,
}: RichTextEditorProps) {

  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== value) el.innerHTML = value;
  }, [value]);

  function run(command: string) {
    ref.current?.focus();
    document.execCommand(command);
    if (ref.current) onChange(ref.current.innerHTML);
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-xs",
        className,
      )}
    >
      {header && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          {header}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/30 px-2 py-1.5">
        {GROUPS.map((group, index) => (
          <React.Fragment key={group[0].command}>
            {index > 0 && (
              <span aria-hidden className="mx-1 h-5 w-px bg-border" />
            )}
            {group.map(({ command, label, icon: Icon }) => (
              <Button
                key={command}
                variant="ghost"
                size="icon"
                onClick={() => run(command)}
                aria-label={label}
                title={label}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <Icon className="icon-optical h-3.5 w-3.5" aria-hidden />
              </Button>
            ))}

          </React.Fragment>
        ))}
      </div>
      <div
        ref={ref}
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        className="min-h-64 px-4 py-3 text-sm leading-relaxed text-foreground outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]"
      />
    </div>
  );
}
