import { useEffect, useRef, useState } from "react";

import { GUIDE_SHEET_WIDTH_PX } from "@/lib/guide-sheet";

/**
 * Ajusta o modelo impresso da guia (largura fixa compartilhada com o gerador de
 * PDF) à largura disponível, evitando corte de conteúdo em telas menores. Em
 * telas largas o documento é exibido em escala 1:1.
 */
const SHEET_WIDTH = GUIDE_SHEET_WIDTH_PX;


export function ScaledGuideSheet({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const update = () => {
      const available = container.clientWidth;
      // offsetWidth ignora o transform, então serve como largura natural.
      const natural = content.offsetWidth || SHEET_WIDTH;
      const next = Math.min(1, available / natural);
      setScale(next);
      setHeight(content.offsetHeight * next);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full overflow-hidden bg-muted">
      <div style={{ height }}>
        <div
          ref={contentRef}
          style={{
            width: "max-content",
            minWidth: SHEET_WIDTH,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
