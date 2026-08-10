import * as React from "react";
import { Eraser, PenLine, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

interface SignatureFieldProps {
  /** Data URL da assinatura (PNG) ou string vazia. */
  value: string;
  onChange: (dataUrl: string) => void;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}

/**
 * Campo de assinatura digital: permite desenhar com mouse/toque em um canvas
 * ou enviar uma imagem existente. O resultado é um data URL PNG usado tanto na
 * pré-visualização da guia quanto na impressão/PDF.
 */
export function SignatureField({
  value,
  onChange,
  label = "Assinatura digital",
  hint,
  className,
}: SignatureFieldProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const drawingRef = React.useRef(false);
  const dirtyRef = React.useRef(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = React.useState<"draw" | "upload">("draw");
  const [error, setError] = React.useState<string | null>(null);

  const getContext = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    // Tinta da assinatura vem do token --ink (mesma cor da guia impressa).
    const ink = getComputedStyle(canvas).getPropertyValue("--ink").trim();
    ctx.strokeStyle = ink || "currentColor";

    return ctx;
  };

  const pointFrom = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = getContext();
    if (!ctx) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    const { x, y } = pointFrom(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = getContext();
    if (!ctx) return;
    const { x, y } = pointFrom(event);
    ctx.lineTo(x, y);
    ctx.stroke();
    dirtyRef.current = true;
  };

  const commitDrawing = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (!dirtyRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setError(null);
    onChange(canvas.toDataURL("image/png"));
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    dirtyRef.current = false;
  };

  const handleClear = () => {
    clearCanvas();
    setError(null);
    onChange("");
  };

  const handleUpload = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Envie uma imagem PNG, JPG ou WEBP.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("A imagem deve ter no máximo 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setError(null);
      clearCanvas();
      onChange(String(reader.result ?? ""));
    };
    reader.onerror = () => setError("Não foi possível ler a imagem.");
    reader.readAsDataURL(file);
  };

  const showUploadPreview = mode === "upload" && Boolean(value);

  return (
    <div className={cn("min-w-0 space-y-2", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium leading-snug text-muted-foreground">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant={mode === "draw" ? "secondary" : "ghost"}
            onClick={() => {
              setMode("draw");
              setError(null);
            }}
            aria-pressed={mode === "draw"}
          >
            <PenLine className="h-4 w-4" />
            Desenhar
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "upload" ? "secondary" : "ghost"}
            onClick={() => {
              setMode("upload");
              setError(null);
            }}
            aria-pressed={mode === "upload"}
          >
            <Upload className="h-4 w-4" />
            Enviar imagem
          </Button>
        </div>
      </div>

      {mode === "draw" ? (
        <div className="rounded-xl border border-dashed border-border bg-surface-subtle p-2">
          <canvas
            ref={canvasRef}
            width={640}
            height={180}
            role="img"
            aria-label="Área para desenhar a assinatura"
            className="h-32 w-full touch-none rounded-lg bg-background"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={commitDrawing}
            onPointerLeave={commitDrawing}
            onPointerCancel={commitDrawing}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Assine com o mouse ou o dedo dentro da área acima.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-surface-subtle p-4">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            className="hidden"
            onChange={(e) => handleUpload(e.target.files?.[0])}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              Selecionar imagem
            </Button>
            <span className="text-xs text-muted-foreground">
              PNG, JPG ou WEBP até 2 MB — de preferência com fundo transparente.
            </span>
          </div>
          {showUploadPreview && (
            <img
              src={value}
              alt="Pré-visualização da assinatura enviada"
              className="mt-3 h-20 w-auto max-w-full rounded-lg border border-border bg-background object-contain p-1"
            />
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleClear} disabled={!value}>
          {mode === "draw" ? <Eraser className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
          Limpar assinatura
        </Button>
        {value && !error && (
          <span className="text-xs text-muted-foreground">
            Assinatura pronta — ela sai impressa na guia.
          </span>
        )}
      </div>

      {(error || hint) && (
        <p
          className={cn(
            "text-xs leading-snug",
            error ? "text-destructive" : "text-muted-foreground",
          )}
          role={error ? "alert" : undefined}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
