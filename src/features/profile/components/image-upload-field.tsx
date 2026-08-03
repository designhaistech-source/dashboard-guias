import { useEffect, useRef, useState } from "react";
import { ImageOff, Trash2, Upload } from "lucide-react";

import { InfoHint } from "@/components/info-hint";
import { Button } from "@/components/ui/button";
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

/**
 * Campo de upload de imagem compacto: miniatura da imagem enviada ao lado das
 * ações de trocar/remover (protótipo: nada é enviado ao servidor).
 */
export function ImageUploadField({ label, hint, previewAlt }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    if (!ACCEPTED.includes(file.type)) {
      toast.error("Formato não suportado. Envie PNG, JPG ou SVG.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error("Arquivo muito grande. O limite é 2 MB.");
      return;
    }

    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    setFileName(file.name);
    toast.success(`${label} atualizada.`);
  };

  const handleRemove = () => {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const inputId = `upload-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <p className="text-[13px] font-medium leading-snug text-foreground sm:text-sm">
          {label}
        </p>
        <InfoHint label={`Requisitos para ${label}`}>{hint}</InfoHint>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
        <button /* ds-allow: miniatura clicável abre o seletor de arquivos */
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label={previewUrl ? `Trocar ${label}` : `Enviar ${label}`}
          className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-background transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={previewAlt}
              className="max-h-14 w-auto max-w-full object-contain"
            />
          ) : (
            <ImageOff className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          )}
        </button>

        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="truncate text-xs text-muted-foreground" aria-live="polite">
            {fileName ?? "Nenhuma imagem enviada"}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              {previewUrl ? "Trocar" : "Enviar"}
            </Button>
            {previewUrl && (
              <Button type="button" variant="ghost" size="sm" onClick={handleRemove}>
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
