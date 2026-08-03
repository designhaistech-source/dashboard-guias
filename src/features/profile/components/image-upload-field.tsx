import { useEffect, useRef, useState } from "react";
import { ImageOff, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/svg+xml"];

interface ImageUploadFieldProps {
  label: string;
  hint: string;
  /** Texto alternativo da pré-visualização. */
  previewAlt: string;
}

/**
 * Campo de upload de imagem com pré-visualização local (protótipo: nada é enviado).
 * Valida tipo e tamanho e libera a URL temporária ao trocar/remover o arquivo.
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
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      </div>

      <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 p-4">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={previewAlt}
            className="max-h-24 w-auto max-w-full object-contain"
          />
        ) : (
          <p className="flex flex-col items-center gap-2 text-center text-xs text-muted-foreground">
            <ImageOff className="h-5 w-5" aria-hidden="true" />
            Nenhuma imagem enviada
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        className="sr-only"
        onChange={(event) => handleFiles(event.target.files)}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          {previewUrl ? "Trocar imagem" : "Enviar imagem"}
        </Button>
        {previewUrl && (
          <Button type="button" variant="ghost" size="sm" onClick={handleRemove}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Remover
          </Button>
        )}
      </div>

      {fileName && (
        <p className="truncate text-xs text-muted-foreground" aria-live="polite">
          Arquivo: {fileName}
        </p>
      )}
    </div>
  );
}
