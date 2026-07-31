export type QaIssueKind = "text-clip" | "out-of-viewport";

export interface QaIssue {
  kind: QaIssueKind;
  /** Trecho do texto afetado, quando houver. */
  text: string;
  /** Caminho curto do elemento, para localizar no código. */
  selector: string;
  /** Largura visível x largura necessária, em px. */
  clientWidth: number;
  scrollWidth: number;
}

export interface QaReport {
  hasHorizontalScroll: boolean;
  issues: QaIssue[];
}

const IGNORED_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT", "SVG", "PATH"]);

function shortSelector(el: Element): string {
  const parts: string[] = [];
  let current: Element | null = el;
  while (current && current.tagName !== "BODY" && parts.length < 3) {
    const classes = String(current.className || "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .join(".");
    parts.push(current.tagName.toLowerCase() + (classes ? `.${classes}` : ""));
    current = current.parentElement;
  }
  return parts.join(" < ");
}

function isHidden(el: Element, style: CSSStyleDeclaration): boolean {
  if (style.display === "none" || style.visibility === "hidden") return true;
  if (String(el.className || "").includes("sr-only")) return true;
  const rect = el.getBoundingClientRect();
  return rect.width === 0 && rect.height === 0;
}

/**
 * Inspeciona um documento renderizado e devolve os cortes de texto e elementos
 * que ultrapassam a largura da viewport. Puro: não altera o documento.
 */
export function auditDocument(doc: Document): QaReport {
  const root = doc.documentElement;
  const viewportWidth = root.clientWidth;
  const issues: QaIssue[] = [];

  for (const el of Array.from(doc.body.querySelectorAll<HTMLElement>("*"))) {
    if (IGNORED_TAGS.has(el.tagName)) continue;
    const style = doc.defaultView?.getComputedStyle(el);
    if (!style || isHidden(el, style)) continue;
    if (style.position === "fixed") continue;

    const clipsText =
      el.children.length === 0 &&
      (el.textContent ?? "").trim().length > 0 &&
      el.scrollWidth > el.clientWidth + 1;

    if (clipsText) {
      issues.push({
        kind: "text-clip",
        text: (el.textContent ?? "").trim().slice(0, 60),
        selector: shortSelector(el),
        clientWidth: Math.round(el.clientWidth),
        scrollWidth: Math.round(el.scrollWidth),
      });
      continue;
    }

    let insideScroller = false;
    for (let parent = el.parentElement; parent; parent = parent.parentElement) {
      const parentStyle = doc.defaultView?.getComputedStyle(parent);
      if (parentStyle && ["auto", "scroll", "hidden"].includes(parentStyle.overflowX)) {
        insideScroller = true;
        break;
      }
    }
    if (insideScroller) continue;

    const rect = el.getBoundingClientRect();
    if (rect.right > viewportWidth + 1 || rect.left < -1) {
      issues.push({
        kind: "out-of-viewport",
        text: (el.textContent ?? "").trim().slice(0, 60),
        selector: shortSelector(el),
        clientWidth: Math.round(rect.width),
        scrollWidth: Math.round(rect.right),
      });
    }
  }

  return {
    hasHorizontalScroll: root.scrollWidth > viewportWidth + 1,
    issues: issues.slice(0, 30),
  };
}
