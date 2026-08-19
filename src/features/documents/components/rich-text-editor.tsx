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
  Undo2,
  Redo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  /** Variáveis inseríveis no texto (ex.: "@paciente"). */
  variables?: readonly string[];
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
  variables,
}: RichTextEditorProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { canUndo, canRedo, undo, redo, record } = useEditorHistory(value, onChange, ref);

  React.useEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== value) el.innerHTML = value;
  }, [value]);

  function run(command: string) {
    ref.current?.focus();
    document.execCommand(command);
    if (ref.current) {
      record(ref.current.innerHTML, "command");
      onChange(ref.current.innerHTML);
    }
  }

  /** Undo/redo próprios: o histórico nativo do contentEditable é inconsistente. */
  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!(event.metaKey || event.ctrlKey)) return;
    const key = event.key.toLowerCase();
    if (key === "z" && !event.shiftKey) {
      event.preventDefault();
      undo();
      return;
    }
    if ((key === "z" && event.shiftKey) || key === "y") {
      event.preventDefault();
      redo();
    }
  }

  /** Insere a variável na posição do cursor; ao final do texto se não houver seleção ativa. */
  function insertVariable(variable: string) {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !el.contains(selection.anchorNode)) {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    document.execCommand("insertText", false, `${variable} `);
    record(el.innerHTML, "command");
    onChange(el.innerHTML);
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
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={undo}
          disabled={!canUndo}
          aria-label="Desfazer (Ctrl+Z)"
          title="Desfazer (Ctrl+Z)"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
        >
          <Undo2 className="icon-optical h-3.5 w-3.5" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={redo}
          disabled={!canRedo}
          aria-label="Refazer (Ctrl+Shift+Z)"
          title="Refazer (Ctrl+Shift+Z)"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
        >
          <Redo2 className="icon-optical h-3.5 w-3.5" aria-hidden />
        </Button>
        <span aria-hidden className="mx-1 h-5 w-px bg-border" />
        {GROUPS.map((group, index) => (
          <React.Fragment key={group[0].command}>
            {index > 0 && <span aria-hidden className="mx-1 h-5 w-px bg-border" />}
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
        {onImproveWithAi && (
          <>
            <span aria-hidden className="mx-1 h-5 w-px bg-border" />
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onImproveWithAi}
                    disabled={improving}
                    aria-busy={improving}
                    aria-describedby="rte-ai-hint"
                    className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {improving ? (
                      <Loader2 className="icon-optical h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : (
                      <Sparkles className="icon-optical h-3.5 w-3.5" aria-hidden />
                    )}
                    {improving ? "Melhorando..." : "Melhorar texto com IA"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent id="rte-ai-hint" className="max-w-64 text-pretty">
                  A IA reescreve todo o texto do editor: corrige gramática, ajusta a
                  linguagem para o padrão clínico e organiza os parágrafos, sem inventar
                  informações clínicas. A substituição pede confirmação e pode ser revertida
                  com “Desfazer” (Ctrl+Z) ou pelo aviso exibido após a troca.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
      </div>

      {variables && variables.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-4 py-2">
          <span id="rte-variables-hint" className="text-xs text-muted-foreground">
            Inserir variável:
          </span>
          {variables.map((variable) => (
            <Button
              key={variable}
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => insertVariable(variable)}
              title={`Inserir ${variable} no texto`}
              className="h-7 rounded-full px-2.5 font-mono text-xs"
            >
              {variable}
            </Button>
          ))}
          <span className="text-xs text-muted-foreground">
            (substituída pelos dados do paciente na impressão)
          </span>
        </div>
      )}



      <div
        ref={ref}
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onKeyDown={handleKeyDown}
        onInput={(e) => {
          record(e.currentTarget.innerHTML, "typing");
          onChange(e.currentTarget.innerHTML);
        }}
        className="min-h-64 px-4 py-3 text-sm leading-relaxed text-foreground outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]"
      />
    </div>
  );
}

/** Coalesce de digitação: alterações contínuas em menos de 600ms viram um passo. */
const TYPING_MERGE_MS = 600;
const MAX_HISTORY = 100;

type ChangeOrigin = "typing" | "command";

/**
 * Histórico próprio de undo/redo para o editor.
 * O histórico nativo do `document.execCommand` não sobrevive a injeções
 * programáticas de HTML (modelos, IA), por isso mantemos snapshots do valor.
 */
function useEditorHistory(
  value: string,
  onChange: (html: string) => void,
  ref: React.RefObject<HTMLDivElement | null>,
) {
  const state = React.useRef({
    stack: [value],
    index: 0,
    lastAt: 0,
    lastOrigin: "command" as ChangeOrigin,
    applying: false,
  });
  const [, forceUpdate] = React.useReducer((n: number) => n + 1, 0);

  const record = React.useCallback(
    (html: string, origin: ChangeOrigin) => {
      const s = state.current;
      if (html === s.stack[s.index]) return;
      const now = Date.now();
      const merge =
        origin === "typing" && s.lastOrigin === "typing" && now - s.lastAt < TYPING_MERGE_MS;
      if (merge) {
        s.stack[s.index] = html;
      } else {
        s.stack = [...s.stack.slice(0, s.index + 1), html].slice(-MAX_HISTORY);
        s.index = s.stack.length - 1;
      }
      s.lastAt = now;
      s.lastOrigin = origin;
      forceUpdate();
    },
    [forceUpdate],
  );

  // Captura substituições externas (modelos, IA, restaurar texto padrão).
  React.useEffect(() => {
    const s = state.current;
    if (s.applying) {
      s.applying = false;
      return;
    }
    record(value, "command");
  }, [value, record]);

  const apply = React.useCallback(
    (nextIndex: number) => {
      const s = state.current;
      if (nextIndex < 0 || nextIndex >= s.stack.length) return;
      s.applying = true;
      s.index = nextIndex;
      s.lastOrigin = "command";
      const html = s.stack[nextIndex];
      const el = ref.current;
      if (el) {
        el.innerHTML = html;
        el.focus();
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      onChange(html);
      forceUpdate();
    },
    [forceUpdate, onChange, ref],
  );

  return {
    canUndo: state.current.index > 0,
    canRedo: state.current.index < state.current.stack.length - 1,
    undo: () => apply(state.current.index - 1),
    redo: () => apply(state.current.index + 1),
    record,
  };
}
