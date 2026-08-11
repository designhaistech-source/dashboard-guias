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
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      const available = container.clientWidth;
      if (!available) return;
      setScale(Math.min(1, available / SHEET_WIDTH));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full overflow-x-hidden bg-muted">
      {/* `zoom` refaz o layout (ao contrário de `transform`), então a altura do
          documento acompanha a escala e o container pai continua rolável. */}
      <div style={{ zoom: scale, width: SHEET_WIDTH }}>{children}</div>
    </div>
  );
}

