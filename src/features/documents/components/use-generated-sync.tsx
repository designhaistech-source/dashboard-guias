import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface UseGeneratedSyncOptions {
  /** Texto padrão gerado a partir dos campos do formulário. */
  generated: string;
  /** Texto editado manualmente (vazio quando o padrão está em uso). */
  html: string;
  /** Atualiza o texto manual; string vazia volta ao texto gerado. */
  setHtml: (value: string) => void;
}

/**
 * Detecta quando o texto editado manualmente ficou desatualizado em relação aos
 * campos do formulário (dias, datas, horários) e devolve um aviso acessível com
 * as ações "Atualizar texto" e "Manter meu texto".
 */
export function useGeneratedSync({ generated, html, setHtml }: UseGeneratedSyncOptions) {
  // Snapshot do texto gerado no momento em que a edição manual começou.
  const baselineRef = useRef(generated);
  const [baseline, setBaseline] = useState(generated);

  useEffect(() => {
    if (!html && baselineRef.current !== generated) {
      baselineRef.current = generated;
      setBaseline(generated);
    }
  }, [html, generated]);

  const stale = Boolean(html) && baseline !== generated;

  const resync = useCallback(() => {
    baselineRef.current = generated;
    setBaseline(generated);
    setHtml("");
  }, [generated, setHtml]);

  const keepManual = useCallback(() => {
    baselineRef.current = generated;
    setBaseline(generated);
  }, [generated]);

  const staleNotice = stale ? (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-lg border border-warning/50 bg-warning-muted px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="flex items-start gap-2 text-sm text-warning-foreground">
        <RefreshCw className="icon-optical mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>
          Você alterou os campos do documento, mas o texto foi editado manualmente e não
          acompanhou a mudança. Revise antes de imprimir.
        </span>
      </p>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button type="button" size="sm" onClick={resync}>
          Atualizar texto
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={keepManual}>
          Manter meu texto
        </Button>
      </div>
    </div>
  ) : null;

  return { stale, staleNotice, resync, keepManual };
}
