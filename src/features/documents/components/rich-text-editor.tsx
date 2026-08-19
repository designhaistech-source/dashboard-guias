import * as React from "react";

import { VARIABLE_LABELS } from "../data/document-variables";
import { DocumentPagePreview } from "./document-page-preview";

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
  Eye,
  Pencil,
  AlertCircle,
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
  /** Comandos de alternância refletem o formato do cursor (aria-pressed + realce). */
  toggle?: boolean;
}

const GROUPS: ToolbarButton[][] = [
  [
    { command: "bold", label: "Negrito", icon: Bold, toggle: true },
    { command: "italic", label: "Itálico", icon: Italic, toggle: true },
    { command: "underline", label: "Sublinhado", icon: Underline, toggle: true },
  ],
  [
    { command: "insertUnorderedList", label: "Lista com marcadores", icon: List, toggle: true },
    { command: "insertOrderedList", label: "Lista numerada", icon: ListOrdered, toggle: true },
    { command: "removeFormat", label: "Limpar formatação", icon: Eraser },
  ],
  [
    { command: "justifyLeft", label: "Alinhar à esquerda", icon: AlignLeft, toggle: true },
    { command: "justifyCenter", label: "Centralizar", icon: AlignCenter, toggle: true },
    { command: "justifyRight", label: "Alinhar à direita", icon: AlignRight, toggle: true },
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
  /** Texto com as variáveis já substituídas, exibido no modo de pré-visualização. */
  previewHtml?: string;
  /** Variáveis usadas no texto que ainda não têm valor preenchido. */
  pendingVariables?: readonly string[];
  /** Valor atual de cada variável (ex.: { "@paciente": "Maria" }); usado ao inserir o chip. */
  variableValues?: Readonly<Record<string, string>>;
  /** Quando informado, "Pré-visualizar" abre o documento paginado em A4 (só conferência). */
  pagePreview?: { title: string; paciente: string };
  /** Documento já emitido: exibe o texto somente leitura, sem edição. */
  readOnly?: boolean;
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
  previewHtml,
  pendingVariables,
  variableValues,
  pagePreview,
  readOnly = false,
}: RichTextEditorProps) {
  const [previewing, setPreviewing] = React.useState(false);
  const [pagePreviewOpen, setPagePreviewOpen] = React.useState(false);
  const canPreview = typeof previewHtml === "string";

  const ref = React.useRef<HTMLDivElement>(null);
  const { canUndo, canRedo, undo, redo, record } = useEditorHistory(value, onChange, ref);
  const { activeCommands, syncActiveCommands } = useActiveCommands(ref, previewing);
  const uid = React.useId();
  const variablesHintId = `${uid}-variables-hint`;
  const aiHintId = `${uid}-ai-hint`;
  const countId = `${uid}-count`;

  const showVariables =
    Boolean(variables && variables.length > 0) && !previewing && !readOnly;
  const stats = React.useMemo(() => getTextStats(previewing ? (previewHtml ?? value) : value), [
    previewing,
    previewHtml,
    value,
  ]);

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
    syncActiveCommands();
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

  /**
   * Insere o valor atual da variável (ex.: o nome do paciente) na posição do cursor.
   * Sem valor preenchido, insere o token para ser resolvido depois.
   */
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
    const resolved = variableValues?.[variable]?.trim();
    document.execCommand("insertText", false, `${resolved || variable} `);
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
        {!readOnly && (
          <>
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
            {group.map(({ command, label, icon: Icon, toggle }) => {
              const active = toggle === true && activeCommands.has(command);
              return (
                <Button
                  key={command}
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => run(command)}
                  aria-label={label}
                  aria-pressed={toggle ? active : undefined}
                  title={label}
                  className={cn(
                    "h-7 w-7 text-muted-foreground hover:text-foreground",
                    active && "bg-accent text-accent-foreground shadow-xs",
                  )}
                >
                  <Icon className="icon-optical h-3.5 w-3.5" aria-hidden />
                </Button>
              );
            })}
          </React.Fragment>
        ))}
          </>
        )}
        {onImproveWithAi && !readOnly && (
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
                    aria-describedby={aiHintId}
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
                <TooltipContent id={aiHintId} className="max-w-64 text-pretty">
                  A IA reescreve todo o texto do editor: corrige gramática, ajusta a
                  linguagem para o padrão clínico e organiza os parágrafos, sem inventar
                  informações clínicas. A substituição pede confirmação e pode ser revertida
                  com “Desfazer” (Ctrl+Z) ou pelo aviso exibido após a troca.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
        {canPreview && (
          <div className="ml-auto flex items-center gap-1">
            {!readOnly && (
            <Button
              type="button"
              variant={previewing ? "ghost" : "secondary"}
              size="sm"
              onClick={() => setPreviewing(false)}
              aria-pressed={!previewing}
              className="h-7 gap-1.5 px-2 text-xs"
            >
              <Pencil className="icon-optical h-3.5 w-3.5" aria-hidden />
              Editar
            </Button>
            )}
            <Button
              type="button"
              variant={previewing || pagePreviewOpen ? "secondary" : "ghost"}
              size="sm"
              onClick={() => (pagePreview ? setPagePreviewOpen(true) : setPreviewing(true))}
              aria-pressed={pagePreview ? undefined : previewing}
              className="h-7 gap-1.5 px-2 text-xs"
            >
              <Eye className="icon-optical h-3.5 w-3.5" aria-hidden />
              Pré-visualizar
            </Button>
          </div>
        )}

        {pagePreview && (
          <DocumentPagePreview
            open={pagePreviewOpen}
            onOpenChange={setPagePreviewOpen}
            title={pagePreview.title}
            paciente={pagePreview.paciente}
            html={previewHtml ?? value}
          />
        )}

      </div>

      {showVariables && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-4 py-2">
          <span id={variablesHintId} className="text-xs text-muted-foreground">
            Inserir variável:
          </span>
          {(variables ?? []).map((variable) => {
            const resolved = variableValues?.[variable]?.trim();
            const label = VARIABLE_LABELS[variable] ?? variable;
            return (
              <Button
                key={variable}
                type="button"
                variant="secondary"
                size="sm"
                disabled={!resolved}
                onClick={() => insertVariable(variable)}
                title={
                  resolved
                    ? `Inserir “${resolved}” no texto`
                    : `Preencha o campo ${label} para usar ${variable}`
                }
                className="h-7 rounded-full px-2.5 font-mono text-xs"
              >
                {variable}
              </Button>
            );
          })}
          <span className="text-xs text-muted-foreground">
            (insere o valor atual do campo; variáveis sem valor ficam
            indisponíveis)
          </span>
        </div>
      )}



      {previewing && pendingVariables && pendingVariables.length > 0 && (
        <p
          role="status"
          className="flex items-start gap-1.5 border-b border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground"
        >
          <AlertCircle className="icon-optical mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            Sem valor preenchido: {pendingVariables.join(", ")}. No documento final aparecem
            como linha em branco para preenchimento manual.
          </span>
        </p>
      )}

      {previewing || readOnly ? (
        <div
          aria-label={`Pré-visualização — ${ariaLabel}`}
          role="region"
          className="min-h-64 bg-muted/20 px-4 py-3 text-sm leading-relaxed text-foreground"
          dangerouslySetInnerHTML={{ __html: previewHtml ?? "" }}
        />
      ) : (
      <div
        ref={ref}
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        aria-describedby={cn(showVariables && variablesHintId, countId) || undefined}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onKeyDown={handleKeyDown}
        onKeyUp={syncActiveCommands}
        onMouseUp={syncActiveCommands}
        onFocus={syncActiveCommands}
        onInput={(e) => {
          record(e.currentTarget.innerHTML, "typing");
          onChange(e.currentTarget.innerHTML);
          syncActiveCommands();
        }}
        className="min-h-64 px-4 py-3 text-sm leading-relaxed text-foreground outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]"
      />
      )}

      <p
        id={countId}
        role="status"
        className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground"
      >
        <span>
          <span className="font-mono">{stats.characters.toLocaleString("pt-BR")}</span>{" "}
          {stats.characters === 1 ? "caractere" : "caracteres"}
        </span>
        <span aria-hidden className="h-3 w-px bg-border" />
        <span>
          <span className="font-mono">{stats.words.toLocaleString("pt-BR")}</span>{" "}
          {stats.words === 1 ? "palavra" : "palavras"}
        </span>
        <span aria-hidden className="h-3 w-px bg-border" />
        <span>
          Estimativa de impressão:{" "}
          <span className="font-mono">{stats.pages}</span>{" "}
          {stats.pages === 1 ? "página A4" : "páginas A4"}
        </span>
      </p>
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

/** Comandos cujo estado ativo é consultado no navegador. */
const TOGGLE_COMMANDS = [
  "bold",
  "italic",
  "underline",
  "insertUnorderedList",
  "insertOrderedList",
  "justifyLeft",
  "justifyCenter",
  "justifyRight",
] as const;

/**
 * Espelha o formato do cursor/seleção na barra de ferramentas.
 * Consulta `queryCommandState` a cada mudança de seleção para que os botões
 * exibam `aria-pressed` e o realce visual correspondentes.
 */
function useActiveCommands(ref: React.RefObject<HTMLDivElement | null>, previewing: boolean) {
  const [activeCommands, setActiveCommands] = React.useState<Set<string>>(() => new Set());

  const syncActiveCommands = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const selection = window.getSelection();
    // Só reflete o estado quando a seleção está dentro do editor.
    if (!selection || selection.rangeCount === 0 || !el.contains(selection.anchorNode)) return;
    const next = new Set<string>();
    for (const command of TOGGLE_COMMANDS) {
      try {
        if (document.queryCommandState(command)) next.add(command);
      } catch {
        // Comando não suportado pelo navegador: mantém sem estado.
      }
    }
    // Sem alinhamento explícito, o parágrafo está alinhado à esquerda.
    if (!next.has("justifyCenter") && !next.has("justifyRight")) next.add("justifyLeft");
    setActiveCommands((current) =>
      current.size === next.size && [...next].every((c) => current.has(c)) ? current : next,
    );
  }, [ref]);

  React.useEffect(() => {
    if (previewing) {
      setActiveCommands(new Set());
      return;
    }
    document.addEventListener("selectionchange", syncActiveCommands);
    return () => document.removeEventListener("selectionchange", syncActiveCommands);
  }, [previewing, syncActiveCommands]);

  return { activeCommands, syncActiveCommands };
}

/** Caracteres que caberiam em uma página A4 no corpo de texto usado na impressão. */
const CHARS_PER_PAGE = 2400;

/** Converte o HTML do editor em métricas de caracteres, palavras e páginas A4. */
function getTextStats(html: string) {
  const text = html
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6])[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
  const characters = text.length;
  const words = text ? text.split(" ").length : 0;
  return { characters, words, pages: Math.max(1, Math.ceil(characters / CHARS_PER_PAGE)) };
}
