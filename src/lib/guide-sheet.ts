/**
 * Constantes e CSS compartilhados entre a pré-visualização da guia em tela
 * (modal) e a geração de PDF/impressão. Manter uma única fonte de verdade
 * evita divergência de escala entre o que o usuário vê e o que é impresso.
 */

/** Largura fixa do modelo oficial da guia, em px CSS. */
export const GUIDE_SHEET_WIDTH_PX = 1100;

/** Margem física da página impressa, em mm. */
export const PRINT_PAGE_MARGIN_MM = 8;

/** Folga em px CSS para a borda de 1px da guia nunca tocar o limite do papel. */
export const PRINT_EDGE_GUARD_PX = 4;

/** Folga contra arredondamento do navegador ao converter px CSS em mm. */
export const PRINT_SAFETY_FACTOR = 0.97;

const MM_TO_PX = 96 / 25.4;

/* Interseção entre A4 paisagem (297x210mm) e Letter paisagem (279,4x215,9mm):
   escalando pelo menor limite, a guia não corta lateral nem quebra em duas
   páginas, qualquer que seja o papel escolhido no diálogo de impressão. */
const NARROWEST_LANDSCAPE_WIDTH_MM = 279.4;
const SHORTEST_LANDSCAPE_HEIGHT_MM = 210;

export const PRINT_CONTENT_WIDTH_PX =
  (NARROWEST_LANDSCAPE_WIDTH_MM - PRINT_PAGE_MARGIN_MM * 2) *
    MM_TO_PX *
    PRINT_SAFETY_FACTOR -
  PRINT_EDGE_GUARD_PX * 2;

export const PRINT_CONTENT_HEIGHT_PX =
  (SHORTEST_LANDSCAPE_HEIGHT_MM - PRINT_PAGE_MARGIN_MM * 2) *
    MM_TO_PX *
    PRINT_SAFETY_FACTOR -
  PRINT_EDGE_GUARD_PX * 2;

/**
 * Escala usada na impressão. Espelha o cálculo do modal (largura natural x
 * espaço disponível), trocando a largura do container pela área útil do papel.
 */
export function getGuideSheetScale(naturalWidth: number, naturalHeight: number) {
  const width = Math.max(naturalWidth, GUIDE_SHEET_WIDTH_PX);
  const height = naturalHeight || 1;
  return Math.min(
    1,
    PRINT_CONTENT_WIDTH_PX / width,
    PRINT_CONTENT_HEIGHT_PX / height,
  );
}

/**
 * Escala do modal. Reproduz a proporção exata da página exportada: a área útil
 * do papel é mapeada na largura disponível em tela, então a guia aparece na
 * mesma posição/escala relativa do PDF (inclusive quando a altura é o limite).
 */
export function getPreviewSheetScale(
  availableWidth: number,
  naturalWidth: number,
  naturalHeight: number,
) {
  if (!availableWidth) return 1;
  const printScale = getGuideSheetScale(naturalWidth, naturalHeight);
  const pageToScreen = Math.min(
    1,
    availableWidth / (PRINT_CONTENT_WIDTH_PX + PRINT_EDGE_GUARD_PX * 2),
  );
  return printScale * pageToScreen;
}


/**
 * CSS de impressão. Reproduz o container do modal (`ScaledGuideSheet`): mesma
 * largura natural, mesma origem de transformação e sem estouro horizontal.
 */
export const PRINT_SHEET_CSS = `
@page { size: landscape; margin: ${PRINT_PAGE_MARGIN_MM}mm; }
html, body { margin: 0; padding: 0; background: #fff; }
.print-guard { padding: ${PRINT_EDGE_GUARD_PX}px; overflow: hidden; }
.print-scale {
  width: max-content;
  min-width: ${GUIDE_SHEET_WIDTH_PX}px;
  transform-origin: top left;
}
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
/* Assinaturas: nunca esticar, nunca quebrar entre páginas. */
img { max-width: 100%; max-height: 100%; break-inside: avoid; page-break-inside: avoid; }

`;
