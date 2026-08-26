import { useEffect, useId, useRef, useState } from "react";
import { CheckCircle2, ImagePlus, Trash2, Upload } from "lucide-react";

import { InfoHint } from "@/components/info-hint";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/svg+xml"];

interface ImageUploadFieldProps {
  label: string;
  /** Texto de ajuda exibido em tooltip (formatos e limite de tamanho). */
  hint: string;
  /** Texto alternativo da pré-visualização. */
  previewAlt: string;
}

/** Formata o tamanho do arquivo para exibição curta (KB/MB). */
function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Campo de upload de imagem compacto com pré-visualização, arrastar e soltar,
 * e ações de substituir/remover (protótipo: nada é enviado ao servidor).
 */
export function ImageUploadField({ label, hint, previewAlt }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFiles = (files: FileList | null) => {
    const selected = files?.[0];
    if (!selected) return;

    if (!ACCEPTED.includes(selected.type)) {
      toast.error("Formato não suportado. Envie PNG, JPG ou SVG.");
      return;
    }
    if (selected.size > MAX_SIZE_BYTES) {
      toast.error("Arquivo muito grande. O limite é 2 MB.");
      return;
    }

    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(selected);
    });
    setFile({ name: selected.name, size: selected.size });
    toast.success(`${label} atualizada.`);
  };

  const handleRemove = () => {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center gap-1">
        <label
          htmlFor={inputId}
          className="text-sm font-medium leading-snug text-foreground"
        >
          {label}
        </label>
        <InfoHint label={`Requisitos para ${label}`}>{hint}</InfoHint>
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex flex-1 items-center gap-3 rounded-xl border bg-muted/25 p-3 transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-border",
        )}
      >
        <button /* ds-allow: miniatura clicável abre o seletor de arquivos */
          type="button"
          onClick={openPicker}
          aria-label={previewUrl ? `Substituir ${label}` : `Selecionar ${label}`}
          className={cn(
            "group relative flex h-17 w-25 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            previewUrl
              ? "border-border"
              : "border-border text-muted-foreground hover:border-primary/60 hover:text-primary",
          )}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={previewAlt}
              className="max-h-14 w-auto max-w-[88%] object-contain"
            />
          ) : (
            <ImagePlus className="h-5 w-5" aria-hidden="true" />
          )}
        </button>

        <div className="min-w-0 flex-1 space-y-2">
          {file ? (
            <p
              className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground"
              aria-live="polite"
            >
              <CheckCircle2
                className="h-3.5 w-3.5 shrink-0 text-success-strong"
                aria-hidden="true"
              />
              <span className="truncate font-medium text-foreground">{file.name}</span>
              <span className="shrink-0 tabular-nums">· {formatSize(file.size)}</span>
            </p>
          ) : (
            <p className="text-xs leading-snug text-muted-foreground" aria-live="polite">
              Arraste aqui ou selecione um arquivo.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={openPicker}>
              <Upload className="h-4 w-4" aria-hidden="true" />
              {previewUrl ? "Substituir imagem" : "Selecionar imagem"}
            </Button>
            {previewUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                aria-label={`Remover ${label}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Remover
              </Button>
            )}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        className="sr-only"
        onChange={(event) => handleFiles(event.target.files)}
      />
    </div>
  );
}
