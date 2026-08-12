import { useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  GUIDE_SHEET_WIDTH_PX,
  PRINT_EDGE_GUARD_PX,
  getPreviewSheetScale,
} from "@/lib/guide-sheet";

/**
 * Ajusta o modelo impresso da guia (largura fixa compartilhada com o gerador de
 * PDF) à largura disponível, evitando corte de conteúdo em telas menores. Em
 * telas largas o documento é exibido em escala 1:1.
 */
const SHEET_WIDTH = GUIDE_SHEET_WIDTH_PX;

/**
 * `zoom` refaz o layout e mantém o container rolável, mas em WebKit móvel
 * (iOS) o recálculo durante a rolagem causa travamentos. Nesses casos usamos
 * `transform: scale()` com altura medida — o scroll continua nativo e suave.
 */
function prefersTransformFallback(): boolean {
  if (typeof window === "undefined") return false;
  const supportsZoom =
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("zoom", "0.5");
  if (!supportsZoom) return true;

  const ua = window.navigator.userAgent;
  const isAppleTouch =
    /iP(hone|ad|od)/.test(ua) ||
    (/Macintosh/.test(ua) && window.navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  return isAppleTouch || isAndroid;
}

export function ScaledGuideSheet({
  children,
  /**
   * `print`: reproduz a proporção exata da página exportada (usado onde o
   * usuário compara com o PDF). `width`: ocupa toda a largura disponível,
   * evitando sobra lateral na pré-visualização em tela.
   */
  fit = "print",
}: {
  children: React.ReactNode;
  fit?: "print" | "width";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [useTransform, setUseTransform] = useState(false);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    setUseTransform(prefersTransformFallback());
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      // clientWidth inclui o padding de guarda; usamos apenas a área de conteúdo.
      const available = container.clientWidth - PRINT_EDGE_GUARD_PX * 2;
      if (!available) return;
      const content = contentRef.current;
      // offsetWidth/offsetHeight ignoram o transform: são as medidas naturais.
      const naturalWidth = content?.offsetWidth || SHEET_WIDTH;
      const naturalHeight = content?.offsetHeight || 0;
      // Mesma escala relativa da página exportada (ver getPreviewSheetScale).
      const next =
        fit === "width"
          ? Math.min(1, available / naturalWidth)
          : getPreviewSheetScale(available, naturalWidth, naturalHeight);
      setScale(next);
      if (naturalHeight) setHeight(Math.ceil(naturalHeight * next));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    if (contentRef.current) observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [useTransform, fit]);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-x-hidden bg-muted [-webkit-overflow-scrolling:touch] [overscroll-behavior:contain]"
      style={{ padding: PRINT_EDGE_GUARD_PX }}
    >
      {useTransform ? (
        // Altura reservada explicitamente para o pai continuar rolável.
        <div style={{ height }}>
          <div
            ref={contentRef}
            style={{
              width: SHEET_WIDTH,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              willChange: "transform",
            }}
          >
            {children}
          </div>
        </div>
      ) : (
        <div ref={contentRef} style={{ zoom: scale, width: SHEET_WIDTH }}>
          {children}
        </div>
      )}
    </div>
  );
}
