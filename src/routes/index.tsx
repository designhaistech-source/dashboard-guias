import { createFileRoute } from "@tanstack/react-router";
import { memo, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import jsPDF from "jspdf";
import {
  toLocalIsoDate,
  todayLocalIsoDate,
  formatIsoToBr,
  formatIsoToBrFull,
  localTimeZoneLabel,
} from "@/lib/date";
import autoTable from "jspdf-autotable";
import {
  FileText,
  TrendingUp,
  Layers,
  Download,
  Activity,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Loader2,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  CalendarRange,
  Info,
  FileCheck2,
  FileWarning,
  FileStack,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LabelList,
  Sector,
  
} from "recharts";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { EmptyState } from "@/components/data-state";
import {
  DataTable,
  DataTableBody,
  DataTableCard,
  DataTableCardHeader,
  DataTableCardList,
  DataTableCell,
  DataTableDesktop,
  DataTableHead,
  DataTableHeader,
  DataTableRoot,
  DataTableRow,
} from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  appTabsIconClass,
  appTabsLabelClass,
  appTabsListClass,
  appTabsTriggerClass,
} from "@/components/app-tabs";
import { SurfaceCard } from "@/components/surface-card";
import { InfoHint } from "@/components/info-hint";
import { cn } from "@/lib/utils";
import { Field } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/guiasplus-logo.png.asset.json";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Chip } from "@/components/ui/chip";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  tooltipPanelClass,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DASHBOARD_GUIDES,
  PRESTADORES,
  filterGuides,
  buildMetrics,
  buildProviderProcedureMatrix,
  buildProviderCounts,
  GUIDE_TYPES,
  FAILURE_CATEGORIES,
  type DashboardMetrics,
  type ProviderProcedureMatrix,
} from "@/features/dashboard/data/mock-guides";

async function loadImageDataUrl(url: string): Promise<{ dataUrl: string; w: number; h: number }> {
  const res = await fetch(url);
  const blob = await res.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
  const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = reject;
    img.src = dataUrl;
  });
  return { dataUrl, ...dims };
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Visão geral — Guias+" },
      { name: "description", content: "Visão geral das guias médicas processadas." },
    ],
  }),
  component: DashboardPage,
});

/** Human label for the period actually filtered by the user. */
/**
 * Rótulo legível do período exibido. Sem filtro de data, usa o intervalo real
 * dos dados apresentados (primeiro e último dia com guias).
 */
function buildPeriodLabel(from: string, to: string, fallback?: { first?: string; last?: string }) {
  const de = from.trim() || fallback?.first || "";
  const ate = to.trim() || fallback?.last || "";
  if (de && ate) {
    return de === ate ? formatIsoToBrFull(de) : `${formatIsoToBr(de)} a ${formatIsoToBr(ate)}`;
  }
  if (de) return `A partir de ${formatIsoToBrFull(de)}`;
  if (ate) return `Até ${formatIsoToBrFull(ate)}`;
  return "Todo o período";
}

const prestadoresList = PRESTADORES;

type TrendDirection = "up" | "down" | "flat";
type KpiTrend = { direction: TrendDirection; label: string };

const trendA11yLabel: Record<TrendDirection, string> = {
  up: "Em alta:",
  down: "Em queda:",
  flat: "Sem variação:",
};

async function captureChartPng(
  selector: string,
  scale = 2,
): Promise<{ dataUrl: string; w: number; h: number } | null> {
  const container = document.querySelector(selector) as HTMLElement | null;
  if (!container) return null;
  const svg = container.querySelector("svg") as SVGSVGElement | null;
  if (!svg) return null;

  const rect = svg.getBoundingClientRect();
  const w = Math.max(1, Math.floor(rect.width));
  const h = Math.max(1, Math.floor(rect.height));

  // Clone and inline computed styles so external CSS variables resolve
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(w));
  clone.setAttribute("height", String(h));
  if (!clone.getAttribute("viewBox")) clone.setAttribute("viewBox", `0 0 ${w} ${h}`);

  // Convert modern color functions (oklch / oklab / color()) to rgb(),
  // because the SVG renderer used by Image+canvas can't paint those directly
  // when written as style/attribute values during off-DOM rasterization.
  const colorProbe = document.createElement("div");
  colorProbe.style.position = "absolute";
  colorProbe.style.visibility = "hidden";
  document.body.appendChild(colorProbe);
  const resolveColor = (v: string) => {
    if (!v || v === "none" || v.startsWith("url(")) return v;
    if (!/oklch|oklab|color\(|var\(/i.test(v)) return v;
    colorProbe.style.color = "";
    colorProbe.style.color = v;
    return window.getComputedStyle(colorProbe).color || v;
  };

  const srcEls = svg.querySelectorAll<SVGElement>("*");
  const dstEls = clone.querySelectorAll<SVGElement>("*");
  srcEls.forEach((el, i) => {
    const cs = window.getComputedStyle(el);
    const dst = dstEls[i] as SVGElement;
    if (!dst) return;
    const props = [
      "fill",
      "stroke",
      "stroke-width",
      "stroke-dasharray",
      "opacity",
      "fill-opacity",
      "stroke-opacity",
      "stop-color",
      "stop-opacity",
      "font-size",
      "font-family",
      "font-weight",
    ];
    let style = "";
    for (const p of props) {
      let v = cs.getPropertyValue(p);
      if (!v) continue;
      if (p === "fill" || p === "stroke" || p === "stop-color") v = resolveColor(v);
      style += `${p}:${v};`;
    }
    dst.setAttribute("style", style);
    // Also normalize fill/stroke attributes (Recharts sets them on paths)
    const attrFill = el.getAttribute("fill");
    if (attrFill) dst.setAttribute("fill", resolveColor(attrFill));
    const attrStroke = el.getAttribute("stroke");
    if (attrStroke) dst.setAttribute("stroke", resolveColor(attrStroke));
  });

  // Gradient stops declared with CSS variables (e.g. stopColor="var(--purple)")
  // lose their value once the SVG is rasterized off-DOM, so resolve them here.
  const rootStyle = window.getComputedStyle(document.documentElement);
  clone.querySelectorAll<SVGStopElement>("stop").forEach((stop) => {
    const raw = stop.getAttribute("stop-color") ?? stop.style.stopColor ?? "";
    const varName = raw.match(/var\(\s*(--[\w-]+)/)?.[1];
    const value = varName ? rootStyle.getPropertyValue(varName).trim() : raw;
    const resolved = resolveColor(value);
    if (resolved) {
      stop.setAttribute("stop-color", resolved);
      stop.style.stopColor = resolved;
    }
  });
  colorProbe.remove();


  const xml = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { dataUrl: canvas.toDataURL("image/png"), w, h };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Extra context so the PDF matches the wording shown on the "Guias processadas" tab. */
type ReportContext = {
  todayLabel: string;
  todayComparison?: string;
  averageComparison?: string;
};

async function generateReportPdf(
  periodLabel: string,
  metrics: DashboardMetrics,
  context: ReportContext,
) {
  const { dailyAvg, total, types: typeData, procedures } = metrics;
  try {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const contentW = pageWidth - margin * 2;
    const now = new Date();
    // Mesmo estilo de data da página: "qua., 19/08/2026 15:47".
    const dateStr = `${formatIsoToBrFull(toLocalIsoDate(now))} ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

    // ---- Type system: single source of truth for fonts/weights/sizes ----
    const FONT = "helvetica";
    const TYPE = {
      title: { size: 18, weight: "bold" as const, color: [20, 20, 20] as [number, number, number] },
      subtitle: {
        size: 10,
        weight: "normal" as const,
        color: [110, 110, 110] as [number, number, number],
      },
      sectionH: {
        size: 12,
        weight: "bold" as const,
        color: [20, 20, 20] as [number, number, number],
      },
      body: {
        size: 10,
        weight: "normal" as const,
        color: [20, 20, 20] as [number, number, number],
      },
      tableHead: {
        size: 10,
        weight: "bold" as const,
        color: [255, 255, 255] as [number, number, number],
      },
      tableBody: {
        size: 10,
        weight: "normal" as const,
        color: [40, 40, 40] as [number, number, number],
      },
      caption: {
        size: 8,
        weight: "normal" as const,
        color: [130, 130, 130] as [number, number, number],
      },
    };

    const applyType = (t: (typeof TYPE)[keyof typeof TYPE]) => {
      doc.setFont(FONT, t.weight);
      doc.setFontSize(t.size);
      doc.setTextColor(t.color[0], t.color[1], t.color[2]);
    };
    const tableStyleDefaults = {
      font: FONT,
      fontSize: TYPE.tableBody.size,
      cellPadding: 6,
      textColor: TYPE.tableBody.color,
      lineColor: [220, 220, 220] as [number, number, number],
    };
    const tableHeadStyles = {
      font: FONT,
      fontStyle: "bold" as const,
      fontSize: TYPE.tableHead.size,
      fillColor: [37, 99, 235] as [number, number, number],
      textColor: TYPE.tableHead.color,
      halign: "left" as const,
    };

    // Header (white background, thin accent rule below)
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, 70, "F");

    // Guias+ logo (top-left)
    let titleX = margin;
    try {
      const logo = await loadImageDataUrl(logoAsset.url);
      const logoH = 32;
      const logoW = (logo.w / logo.h) * logoH;
      doc.addImage(logo.dataUrl, "PNG", margin, (70 - logoH) / 2, logoW, logoH);
      titleX = margin + logoW + 14;
    } catch {
      // fallback: skip logo if it fails to load
    }

    applyType(TYPE.title);
    doc.text("Relatório de Guias Processadas", titleX, 35);
    applyType(TYPE.subtitle);
    // Wrap the metadata line so the timezone suffix is never clipped on the right edge.
    const metaLines = doc.splitTextToSize(
      `Período: ${periodLabel}  •  Gerado em: ${dateStr}  •  ${localTimeZoneLabel()}`,
      pageWidth - titleX - margin,
    );
    doc.text(metaLines, titleX, 50);

    // thin accent rule
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(1.5);
    doc.line(0, 70, pageWidth, 70);

    // Info do usuário que gerou o relatório (mock) — renderizado ao final
    const user = {
      name: "Dra. Camila Bezerra Andrade",
      role: "Médica Cardiologista",
      crm: "CRM/RN 12.845",
      email: "camila.andrade@haisguias.com.br",
      clinic: "Clínica CAORN — Natal/RN",
    };

    const footerH = 50;
    const headerOffsetTop = 60;
    let y = 100;

    const availableH = () => pageHeight - footerH - y;
    const pageInnerH = pageHeight - footerH - headerOffsetTop;

    const ensureSpace = (needed: number) => {
      if (y + needed > pageHeight - footerH) {
        doc.addPage();
        y = headerOffsetTop;
      }
    };

    // Push to a new page whenever the next block wouldn't fit alongside the
    // section title or chart — keeps title+chart+table groups visually together.
    const keepTogether = (needed: number) => {
      if (needed > availableH()) {
        doc.addPage();
        y = headerOffsetTop;
      }
    };

    const sectionTitle = (text: string, keepNextH = 0, description?: string) => {
      applyType(TYPE.subtitle);
      const descLines = description
        ? doc.splitTextToSize(description, pageWidth - margin * 2)
        : [];
      const titleBlock = 28 + descLines.length * 12;
      // The title, its description and the following block always travel together.
      keepTogether(titleBlock + keepNextH);
      applyType(TYPE.sectionH);
      doc.text(text, margin, y);
      doc.setDrawColor(220);
      doc.setLineWidth(0.6);
      doc.line(margin, y + 4, pageWidth - margin, y + 4);
      y += 18;
      if (descLines.length > 0) {
        applyType(TYPE.subtitle);
        doc.text(descLines, margin, y);
        y += descLines.length * 12 + 2;
      }
      applyType(TYPE.body);
    };


    // Fit image into a box preserving aspect ratio (contain).
    const fitSize = (img: { w: number; h: number }, maxW: number, maxH: number) => {
      const ratio = img.w / img.h;
      let w = maxW;
      let h = w / ratio;
      if (h > maxH) {
        h = maxH;
        w = h * ratio;
      }
      return { w, h };
    };

    const drawChart = (
      img: { dataUrl: string; w: number; h: number } | null,
      boxW: number,
      maxH: number,
      boxX = margin,
    ) => {
      if (!img) return 0;
      const cap = Math.min(maxH, pageInnerH);
      // If the full intended chart height doesn't fit on the current page,
      // move to a fresh page so the chart is never sliced.
      if (cap > availableH()) {
        doc.addPage();
        y = headerOffsetTop;
      }
      const { w, h } = fitSize(img, boxW, cap);
      const x = boxX + (boxW - w) / 2;
      doc.addImage(img.dataUrl, "PNG", x, y, w, h);
      return h;
    };

    // Approx height for an autoTable block (header + N rows + padding).
    const tableBlockH = (rows: number, rowH = 22, headH = 26) => headH + rows * rowH + 6;

    // Nota de escopo: o relatório deve ser compreensível sem consultar o sistema.
    keepTogether(46);
    applyType(TYPE.body);
    const scopeLines = doc.splitTextToSize(
      `Este relatório considera apenas as guias processadas (importadas e lidas automaticamente) no período selecionado: ${periodLabel}. Indicadores, gráficos e tabelas a seguir referem-se exclusivamente a essas guias.`,
      contentW,
    );
    doc.text(scopeLines, margin, y);
    y += scopeLines.length * 13 + 16;

    // KPIs — resumo simples: apenas indicador e valor.
    const todayLabel = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const kpiBody: string[][] = [
      ["Total de guias processadas", String(total)],
      [`Guias processadas hoje (${todayLabel})`, String(metrics.today)],
      ["Média diária de guias processadas", String(dailyAvg)],
      ["Tipos de guias processadas", String(metrics.distinctTypes)],
    ];
    sectionTitle(
      "Indicadores de guias processadas",
      tableBlockH(kpiBody.length, 26),
      // "22/07/2026 a 20/08/2026" pede a preposição; rótulos como "Todo o
      // período" ou "A partir de ..." já são autoexplicativos.
      /^\d/.test(periodLabel)
        ? `Dados referentes ao período de ${periodLabel}.`
        : `Dados referentes ao período selecionado: ${periodLabel}.`,
    );
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Indicador", "Valor"]],
      body: kpiBody,
      theme: "grid",
      headStyles: tableHeadStyles,
      bodyStyles: { font: FONT, fontStyle: "normal", textColor: TYPE.tableBody.color },
      columnStyles: {
        1: { halign: "right", cellWidth: 90 },
      },

      styles: tableStyleDefaults,
      tableWidth: contentW,
      rowPageBreak: "avoid",
      showHead: "everyPage",
    });
    y = (doc as any).lastAutoTable.finalY + 24;

    // Spacing token between sections / between a chart and the next block.
    const GAP = 18;

    // Guias processadas por dia — full width chart
    const daily = await captureChartPng('[data-chart="daily"]');
    const dailyMaxH = Math.min(260, pageInnerH * 0.38);
    sectionTitle(
      "Guias processadas por dia",
      dailyMaxH,
      "Quantidade de guias processadas por dia no período filtrado.",
    );
    const dailyH = drawChart(daily, contentW, dailyMaxH);
    y += dailyH + GAP;

    // Guias processadas por tipo — donut on top, table below
    const types = await captureChartPng('[data-chart="types"]');
    const donutMaxH = Math.min(200, pageInnerH * 0.32);
    // Header + a couple of rows is enough to keep the group together without
    // pushing the whole section to a new page and leaving a large blank area.
    const typesTableH = tableBlockH(Math.min(2, typeData.length));
    sectionTitle(
      "Guias processadas por tipo",
      donutMaxH + GAP + typesTableH,
      "Distribuição das guias processadas no período filtrado. O centro do gráfico mostra o total de guias processadas.",
    );
    const donutW = Math.min(contentW, donutMaxH * (types ? types.w / types.h : 2));
    const donutX = margin + (contentW - donutW) / 2;
    const typesH = drawChart(types, donutW, donutMaxH, donutX);
    if (typesH > 0) {
      // The center total is an HTML overlay on screen, so it is redrawn here.
      const cx = donutX + donutW / 2;
      const cy = y + typesH / 2;
      applyType(TYPE.sectionH);
      doc.setFontSize(16);
      doc.text(String(total), cx, cy - 1, { align: "center" });
      applyType(TYPE.caption);
      doc.text("guias processadas", cx, cy + 12, { align: "center" });
      applyType(TYPE.body);
    }
    y += typesH + GAP;
    // Never leave the table header stranded at the bottom of a page.
    keepTogether(typesTableH);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      tableWidth: contentW,
      head: [["Tipo de guia", "Guias processadas", "% do total processado"]],
      body: typeData.map((t) => [
        t.name,
        String(t.value),
        `${total > 0 ? Math.round((t.value / total) * 100) : 0}%`,
      ]),
      theme: "striped",
      headStyles: tableHeadStyles,
      bodyStyles: { font: FONT, fontStyle: "normal", textColor: TYPE.tableBody.color },
      columnStyles: {
        1: { halign: "right", cellWidth: 100 },
        2: { halign: "right", cellWidth: 110 },
      },
      styles: tableStyleDefaults,
      rowPageBreak: "avoid",
      showHead: "everyPage",
    });
    y = (doc as any).lastAutoTable.finalY + GAP + 6;

    // Procedimentos — chart, then table (keep title with chart)
    const proc = await captureChartPng('[data-chart="procedures"]');
    const procMaxH = Math.min(280, pageInnerH * 0.42);
    const procTableH = tableBlockH(Math.min(2, procedures.length));
    sectionTitle(
      "Procedimentos mais frequentes nas guias processadas",
      procMaxH + GAP + procTableH,
      "Procedimentos mais frequentes nas guias processadas no período filtrado.",
    );
    const procDrawnH = drawChart(proc, contentW, procMaxH);
    y += procDrawnH + GAP;
    // Don't strand the table header alone after the chart.
    keepTogether(procTableH);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      tableWidth: contentW,
      head: [["Código TUSS", "Procedimento", "Ocorrências em guias processadas"]],
      body: procedures.map((p) => [p.code, p.name, String(p.count)]),
      theme: "striped",
      headStyles: tableHeadStyles,
      bodyStyles: { font: FONT, fontStyle: "normal", textColor: TYPE.tableBody.color },
      columnStyles: { 0: { cellWidth: 110 }, 2: { halign: "right", cellWidth: 150 } },
      styles: tableStyleDefaults,
      rowPageBreak: "avoid",
      showHead: "everyPage",
    });


    // "Gerado por" — bloco final, quebra página se não couber
    const lastY =
      (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
    y = lastY + 30;
    const blockH = 60;
    if (y + blockH > pageHeight - footerH) {
      doc.addPage();
      y = headerOffsetTop;
    }
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(1);
    doc.line(margin, y, margin + 40, y);
    y += 14;
    applyType(TYPE.caption);
    doc.text("GERADO POR", margin, y);
    y += 14;
    applyType(TYPE.body);
    doc.setFont(FONT, "bold");
    doc.text(user.name, margin, y);
    y += 13;
    doc.setFont(FONT, "normal");
    doc.setTextColor(90, 90, 90);
    doc.text(`${user.role}  •  ${user.crm}  •  ${user.email}  •  ${user.clinic}`, margin, y);

    // Footer
    const pageCount = doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(230);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 32, pageWidth - margin, pageHeight - 32);
      applyType(TYPE.caption);
      doc.text("Guias+", margin, pageHeight - 18);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - 18, {
        align: "right",
      });
    }

    const filename = `relatorio-guias-processadas-${toLocalIsoDate(now)}.pdf`;
    doc.save(filename);
    toast.success("Relatório PDF gerado com sucesso!");
  } catch (err) {
    console.error(err);
    toast.error("Falha ao gerar o relatório PDF.");
  }
}

/** Nomes de variáveis internas que nunca devem aparecer na interface. */
const TECHNICAL_SERIES_KEYS = new Set(["count", "value", "name", "label", "guias", "qtd"]);

/** Fixed bar thickness (px) for horizontal bar charts, constant across breakpoints. */
const HORIZONTAL_BAR_SIZE = 22;
/** Gap (px) between bar categories in horizontal bar charts. */
const HORIZONTAL_BAR_GAP = 18;

/**
 * Height needed so bars keep a constant thickness regardless of viewport width:
 * responsiveness adjusts width and total height, never bar thickness.
 */
function horizontalBarsHeight(categories: number, isMobile: boolean) {
  const axisSpace = isMobile ? 32 : 60;
  return Math.max(1, categories) * (HORIZONTAL_BAR_SIZE + HORIZONTAL_BAR_GAP) + axisSpace;
}



/** Two-column split with a vertical divider on desktop and a centered horizontal divider (24px above/below) on mobile/tablet. */
const SPLIT_GRID_CLASS =
  "grid gap-0 xl:grid-cols-2 xl:divide-x xl:divide-border " +
  "[&>*+*]:mt-6 [&>*+*]:border-t [&>*+*]:border-border/50 [&>*+*]:pt-6 " +
  "xl:[&>*+*]:mt-0 xl:[&>*+*]:border-t-0 xl:[&>*+*]:pt-0";

function ChartTooltip({ active, payload, label, suffix, unit }: any) {
  if (!active || !payload?.length) return null;
  const iso: string | undefined = payload[0]?.payload?.date;
  // Aggregated per day: plain dd/MM/yyyy, without weekday or timezone noise.
  const fullDate = formatIsoToBr(iso);
  const heading = fullDate || (label !== undefined ? String(label) : "");

  return (
    <div className={tooltipPanelClass}>
      {heading && (
        <div className="mb-1">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{heading}</div>
        </div>
      )}

      {payload.map((p: any) => {
        const rawName = typeof p.name === "string" ? p.name : "";
        const seriesName = TECHNICAL_SERIES_KEYS.has(rawName.toLowerCase()) ? "" : rawName;
        return (
          <div key={p.dataKey} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: p.color || p.payload?.color }}
            />
            {seriesName && <span className="text-muted-foreground">{seriesName}</span>}
            <span className={`${seriesName ? "ml-auto" : ""} font-semibold tabular-nums`}>
              {p.value}
              {suffix ?? ""}
              {unit ? ` ${unit}` : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Filtros do dashboard. Contém apenas os campos que o painel expõe e que
 * `filterGuides` realmente interpreta — nenhum estado morto.
 */
type GuideFilters = {
  // Período de autorização
  dataAutorizacaoDe: string;
  dataAutorizacaoAte: string;
  // Dimensões de comparação
  tipoGuia: string;
  prestadorSolicitante: string;
};

const emptyFilters: GuideFilters = {
  dataAutorizacaoDe: "",
  dataAutorizacaoAte: "",
  tipoGuia: "",
  prestadorSolicitante: "",
};

/** Rótulo de grupo dentro do painel de filtros — único nível em caixa alta. */


function FilterField({
  label,
  value,
  onChange,
  type = "text",
  error,
  inputRef,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  error?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <div className="min-w-0">
      <Field label={label}>
        <Input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error || undefined}
          className={`h-9 w-full min-w-0 ${error ? "border-destructive focus-visible:ring-destructive/40" : ""}`}
        />
      </Field>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Todos",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <Combobox
        value={value}
        onChange={onChange}
        options={options.map((o) => ({ value: o, label: o }))}
        placeholder={placeholder}
        searchPlaceholder="Buscar..."
        clearable
      />
    </Field>
  );
}

const MONTH_ABBR = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
] as const;

/** Largura observada de um elemento, para adaptar a densidade de rótulos. */
function useElementWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width ?? 0;
      setWidth((current) => (Math.abs(current - next) > 8 ? next : current));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

/**

 * Ticks do eixo X do gráfico diário. As viradas de mês são âncoras fixas e os
 * demais ticks são distribuídos com passo regular dentro de cada mês, descartando
 * candidatos próximos da âncora seguinte para nunca haver sobreposição.
 */
function dailyAxisTicks(data: { date: string }[], maxTicks: number): string[] {
  if (data.length === 0) return [];
  const dates = data.map((d) => d.date);
  const step = Math.max(1, Math.ceil(dates.length / Math.max(2, maxTicks)));

  const anchors: number[] = [];
  dates.forEach((date, index) => {
    if (index === 0 || date.slice(8, 10) === "01") anchors.push(index);
  });

  const selected = new Set<number>();
  anchors.forEach((anchor, i) => {
    const next = anchors[i + 1] ?? dates.length;
    selected.add(anchor);
    for (let index = anchor + step; index < next; index += step) {
      // Mantém distância mínima da próxima virada de mês.
      if (next - index < Math.max(2, Math.ceil(step * 0.7))) break;
      selected.add(index);
    }
  });

  return [...selected].sort((a, b) => a - b).map((index) => dates[index]!);
}

/** Primeiro tick exibido de cada mês, usado para destacar a virada de mês. */
function monthStartTicks(ticks: string[]): Set<string> {
  const seen = new Set<string>();
  const starts = new Set<string>();
  for (const tick of ticks) {
    const month = tick.slice(0, 7);
    if (!seen.has(month)) {
      seen.add(month);
      starts.add(tick);
    }
  }
  return starts;
}

/**
 * Tick do eixo X em duas linhas: o dia na primeira e, apenas na virada de mês,
 * o mês abreviado destacado na segunda — evitando textos longos lado a lado.
 */
function DailyAxisTick({
  x,
  y,
  payload,
  monthStarts,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string };
  monthStarts: Set<string>;
}) {
  const iso = payload?.value ?? "";
  const [year, month, day] = iso.split("-");
  if (!month || !day) return null;
  const isMonthStart = monthStarts.has(iso);
  const monthLabel = `${MONTH_ABBR[Number(month) - 1] ?? month}${year ? ` ${year.slice(2)}` : ""}`;
  return (
    <g transform={`translate(${x ?? 0},${y ?? 0})`}>
      <text
        textAnchor="middle"
        dy={12}
        fontSize={11}
        fill={isMonthStart ? "var(--foreground)" : "var(--muted-foreground)"}
        fontWeight={isMonthStart ? 600 : 400}
      >
        {day}
      </text>
      {isMonthStart ? (
        <text
          textAnchor="middle"
          dy={26}
          fontSize={10}
          fontWeight={600}
          fill="var(--foreground)"
        >
          {monthLabel}
        </text>
      ) : null}
    </g>
  );
}



type ProcedureSortColumn = "code" | "name" | "count";
type ProcedureSort = { column: ProcedureSortColumn; direction: "asc" | "desc" };

type ProviderSortColumn = "name" | "count";
type ProviderSort = { column: ProviderSortColumn; direction: "asc" | "desc" };

/** Cabeçalho de coluna ordenável, com estado anunciado via aria-sort. */
function SortableHead<C extends string>({
  label,
  column,
  sort,
  onSort,
  align = "left",
}: {
  label: string;
  column: C;
  sort: { column: C; direction: "asc" | "desc" };
  onSort: (sort: { column: C; direction: "asc" | "desc" }) => void;
  align?: "left" | "right";
}) {
  const active = sort.column === column;
  const ariaSort = active ? (sort.direction === "asc" ? "ascending" : "descending") : "none";
  const Icon = !active ? ChevronsUpDown : sort.direction === "asc" ? ChevronUp : ChevronDown;
  return (
    <DataTableHead aria-sort={ariaSort} className={align === "right" ? "text-right" : undefined}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() =>
          onSort({
            column,
            direction:
              active && sort.direction === "asc"
                ? "desc"
                : active
                  ? "asc"
                  : column === "count"
                    ? "desc"
                    : "asc",
          })
        }
        className={cn(
          "-mx-2 h-auto gap-1 px-2 py-1 text-xs font-medium uppercase tracking-wide",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        <Icon className="h-3 w-3" aria-hidden="true" />
      </Button>
    </DataTableHead>
  );
}

function DashboardPage() {
  const [activeType, setActiveType] = useState<number | undefined>(undefined);
  /** Densidade e rótulos dos gráficos mudam em telas estreitas. */
  const isMobile = useIsMobile();
  /** Filtros abertos por padrão, como na página Guias emitidas. */
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [filters, setFilters] = useState<GuideFilters>(emptyFilters);

  const activeFilters = useMemo(
    () =>
      (Object.entries(filters) as [keyof GuideFilters, string][]).filter(
        ([, v]) => v.trim() !== "",
      ),
    [filters],
  );

  /**
   * Contador exibido ao lado de "Filtros": conta apenas os filtros adicionais
   * (Tipo de guia e Prestador). O período já aparece na linha de contexto.
   */
  const extraFilterCount = useMemo(
    () => [filters.tipoGuia, filters.prestadorSolicitante].filter((v) => v.trim() !== "").length,
    [filters.tipoGuia, filters.prestadorSolicitante],
  );

  const dateRangeInvalid =
    !!filters.dataAutorizacaoDe &&
    !!filters.dataAutorizacaoAte &&
    filters.dataAutorizacaoDe > filters.dataAutorizacaoAte;

  const setFilter = (key: keyof GuideFilters, value: string) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const applyPreset = (preset: "hoje" | "7d" | "30d") => {
    const today = new Date();
    const iso = toLocalIsoDate;
    setFilters((d) => {
      if (preset === "hoje") {
        const t = iso(today);
        return { ...d, dataAutorizacaoDe: t, dataAutorizacaoAte: t };
      }
      if (preset === "7d") {
        const from = new Date(today);
        from.setDate(today.getDate() - 7);
        return { ...d, dataAutorizacaoDe: iso(from), dataAutorizacaoAte: iso(today) };
      }
      const from = new Date(today);
      from.setDate(today.getDate() - 30);
      return { ...d, dataAutorizacaoDe: iso(from), dataAutorizacaoAte: iso(today) };
    });
  };

  /**
   * Caminho único de limpeza: chips, painel e estados vazios chamam esta função,
   * com o mesmo efeito e o mesmo feedback. Não fecha o painel.
   */
  const clearAllFilters = () => {
    setFilters(emptyFilters);
    toast.success("Filtros limpos.");
  };

  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  const filteredGuides = useMemo(() => filterGuides(DASHBOARD_GUIDES, filters), [filters]);

  const metrics = useMemo(
    () =>
      buildMetrics(filteredGuides, {
        from: filters.dataAutorizacaoDe || undefined,
        to: filters.dataAutorizacaoAte || undefined,
      }),
    [filteredGuides, filters.dataAutorizacaoDe, filters.dataAutorizacaoAte],
  );

  /** Matriz procedimento x prestador (heatmap), limitada aos 6 mais solicitados. */
  const providerMatrix = useMemo(
    () => buildProviderProcedureMatrix(filteredGuides, 6),
    [filteredGuides],
  );
  const providerHeatRange = useMemo(() => heatmapRange(providerMatrix), [providerMatrix]);
  // A matriz é o bloco mais caro de renderizar: com valor deferido, cliques
  // sucessivos em filtros atualizam a UI de imediato e a matriz recompõe depois.
  const deferredProviderMatrix = useDeferredValue(providerMatrix);
  // Enquanto o valor deferido não acompanha a matriz atual, exibimos skeleton.
  const isHeatmapPending = deferredProviderMatrix !== providerMatrix;
  const hasProviderMatrix =
    providerMatrix.rows.length > 0 && providerMatrix.columns.length > 0;




  const periodLabel = useMemo(
    () =>
      buildPeriodLabel(filters.dataAutorizacaoDe, filters.dataAutorizacaoAte, {
        first: metrics.daily[0]?.date,
        last: metrics.daily[metrics.daily.length - 1]?.date,
      }),
    [filters.dataAutorizacaoDe, filters.dataAutorizacaoAte, metrics.daily],
  );

  const total = metrics.total;
  const dailyAvg = metrics.dailyAvg;
  /** Há ao menos um dia com processamento no período filtrado. */
  const hasProcessingDays = metrics.activeDays > 0;
  const typeData = metrics.types;
  const procedures = metrics.procedures;
  const [procedureSort, setProcedureSort] = useState<ProcedureSort>({
    column: "count",
    direction: "desc",
  });
  const sortedProcedures = useMemo(() => {
    const { column, direction } = procedureSort;
    const factor = direction === "asc" ? 1 : -1;
    return [...procedures].sort((a, b) =>
      column === "count"
        ? (a.count - b.count) * factor
        : a[column].localeCompare(b[column], "pt-BR") * factor,
    );
  }, [procedures, procedureSort]);

  /** Ranking de prestadores (10 maiores) reagindo aos filtros da página. */
  const providerCounts = useMemo(
    () => buildProviderCounts(filteredGuides, 10),
    [filteredGuides],
  );
  const [providerSort, setProviderSort] = useState<ProviderSort>({
    column: "count",
    direction: "desc",
  });
  const sortedProviders = useMemo(() => {
    const { column, direction } = providerSort;
    const factor = direction === "asc" ? 1 : -1;
    return [...providerCounts].sort((a, b) =>
      column === "count"
        ? (a.count - b.count) * factor
        : a.name.localeCompare(b.name, "pt-BR") * factor,
    );
  }, [providerCounts, providerSort]);
  const dailyData = metrics.daily;
  const dailyChartRef = useRef<HTMLDivElement>(null);
  const dailyChartWidth = useElementWidth(dailyChartRef);
  /** Quantidade de rótulos proporcional ao espaço disponível (~52px por rótulo). */
  const dailyMaxTicks = Math.max(3, Math.floor((dailyChartWidth || 640) / 52));
  const dailyTicks = useMemo(
    () => dailyAxisTicks(dailyData, dailyMaxTicks),
    [dailyData, dailyMaxTicks],
  );
  const dailyMonthStarts = useMemo(() => monthStartTicks(dailyTicks), [dailyTicks]);

  const hasData = total > 0;

  /** Status do processamento: sucesso, arquivo não processável e erro técnico. */
  const statusData = useMemo(
    () => [
      {
        name: "Processadas com sucesso",
        value: metrics.quality.success,
        color: "var(--quality-success)",
        icon: CheckCircle2,
        hint: "Guias em que os dados foram extraídos e validados sem nenhuma pendência." as
          | string
          | undefined,
      },
      {
        name: "Arquivo não processável",
        value: metrics.quality.unprocessable,
        color: "var(--quality-unprocessable)",
        icon: FileWarning,
        hint: "O arquivo não pôde ser processado devido ao formato, conteúdo ou qualidade do documento enviado.",
      },
      {
        name: "Erro no processamento",
        value: metrics.quality.processingError,
        color: "var(--quality-failure)",
        icon: AlertTriangle,
        hint: "Falha técnica durante o processamento da guia. É possível reenviar o arquivo para nova tentativa.",
      },
    ].filter((d) => d.value > 0),


    [
      metrics.quality.success,
      metrics.quality.unprocessable,
      metrics.quality.processingError,
    ],
  );
  const [generatingReport, setGeneratingReport] = useState(false);

  const handleGenerateReport = async () => {
    if (generatingReport) return;
    if (!hasData) {
      toast.error("Nenhuma guia no período — ajuste os filtros para gerar o relatório.");
      return;
    }
    setGeneratingReport(true);
    try {
      await generateReportPdf(periodLabel, metrics, {
        todayLabel,
        todayComparison: todayTrend?.label,
        averageComparison: weekTrend?.label,
      });
    } finally {
      setGeneratingReport(false);
    }
  };
  const emptyState = (
    <EmptyState
      size="sm"
      title="Nenhuma guia encontrada"
      description={
        activeFilters.length > 0
          ? "Nenhum resultado para os filtros aplicados. Ajuste ou limpe os filtros para ver os dados."
          : "Ainda não há guias processadas para exibir."
      }
      action={
        activeFilters.length > 0 ? (
          <Button type="button" variant="outline" size="sm" onClick={clearAllFilters}>
            Limpar filtros
          </Button>
        ) : undefined
      }
    />
  );

  /** Real variation of the latest day against the previous one. */
  const todayTrend = useMemo<KpiTrend | undefined>(() => {
    if (dailyData.length < 2) return undefined;
    const last = dailyData[dailyData.length - 1].guias;
    const prev = dailyData[dailyData.length - 2].guias;
    const diff = last - prev;
    if (diff === 0) {
      return { direction: "flat", label: "Mesma quantidade de ontem" };
    }
    return {
      direction: diff > 0 ? "up" : "down",
      label: `${Math.abs(diff)} ${diff > 0 ? "a mais" : "a menos"} que ontem`,
    };
  }, [dailyData]);


  /** Reference date of the "today" KPI, shown discreetly in the card. */
  const todayLabel = formatIsoToBrFull(todayLocalIsoDate());

  /** Number of days covered by the selected period. */
  const dayCount = dailyData.length;

  /**
   * Compares the last 7 days against the 7 preceding days so the daily average
   * card can describe its variation in plain language.
   */
  const weekTrend = useMemo<KpiTrend | undefined>(() => {
    if (dailyData.length < 4) return undefined;
    const window = Math.min(7, Math.floor(dailyData.length / 2));
    const recent = dailyData.slice(-window);
    const previous = dailyData.slice(-window * 2, -window);
    if (previous.length === 0) return undefined;
    // Média por dia com processamento: dias sem guias não entram no divisor.
    const avg = (rows: typeof dailyData) => {
      const active = rows.filter((row) => row.guias > 0);
      if (active.length === 0) return undefined;
      return active.reduce((sum, row) => sum + row.guias, 0) / active.length;
    };
    const recentAvg = avg(recent);
    const previousAvg = avg(previous);
    if (recentAvg === undefined || previousAvg === undefined) return undefined;
    const diff = Number((recentAvg - previousAvg).toFixed(1));
    const period = `nos ${window} dias anteriores`;
    if (diff === 0) {
      return { direction: "flat", label: `Média igual à ${period.replace("nos", "dos")}` };
    }
    return {
      direction: diff > 0 ? "up" : "down",
      label: `${Math.abs(diff).toLocaleString("pt-BR")} ${
        Math.abs(diff) === 1 ? "guia" : "guias"
      } por dia ${diff > 0 ? "a mais" : "a menos"} que ${period}`,
    };
  }, [dailyData]);

  /**
   * Explains, in one short sentence per card, the exact dates used in the
   * calculation and the comparison rule applied.
   */
  const kpiTooltips = useMemo(() => {
    const firstDate = dailyData[0]?.date ? formatIsoToBrFull(dailyData[0].date) : undefined;
    const lastDate = dailyData[dailyData.length - 1]?.date
      ? formatIsoToBrFull(dailyData[dailyData.length - 1].date)
      : undefined;
    const rangeSentence =
      firstDate && lastDate
        ? firstDate === lastDate
          ? `Considera apenas o dia ${firstDate}.`
          : `Considera os dias de ${firstDate} até ${lastDate}.`
        : "Nenhum dia com dados no período selecionado.";
    const currentDate = lastDate;
    const previousDate = dailyData[dailyData.length - 2]?.date
      ? formatIsoToBrFull(dailyData[dailyData.length - 2].date)
      : undefined;
    const window = dailyData.length >= 4 ? Math.min(7, Math.floor(dailyData.length / 2)) : 0;
    const recentStart = window
      ? formatIsoToBrFull(dailyData[dailyData.length - window].date)
      : undefined;
    const previousStart = window
      ? formatIsoToBrFull(dailyData[dailyData.length - window * 2].date)
      : undefined;
    const previousEnd = window
      ? formatIsoToBrFull(dailyData[dailyData.length - window - 1].date)
      : undefined;

    return {
      total: `${rangeSentence} Regra: soma das guias processadas em cada dia do período.`,
      today:
        currentDate && previousDate
          ? `Data atual: ${currentDate}. Data anterior: ${previousDate}. Regra: quantidade do dia atual menos a do dia anterior.`
          : currentDate
            ? `Data atual: ${currentDate}. Sem dia anterior no período para comparar.`
            : "Sem dias com dados para calcular este indicador.",
      average:
        window && recentStart && currentDate && previousStart && previousEnd
          ? "Considera apenas os dias em que houve processamento de guias no período selecionado."
          : "Considera apenas os dias em que houve processamento de guias no período selecionado.",
      types: `${rangeSentence} Regra: contagem de tipos de guia diferentes, sem comparação com outro período.`,
    };
  }, [dailyData]);

  /**
   * O dataset sintético é relativo à data local do navegador, que não coincide
   * com o relógio usado na renderização no servidor. Só renderizamos os
   * indicadores após a hidratação para manter os textos consistentes.
   */
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar activeKey="dashboard" />
        <main className="min-w-0 flex-1 flex flex-col min-h-screen">
          <div className="w-full flex-1 space-y-6 px-4 py-6 pb-16 pt-20 sm:px-6 sm:py-8 md:pt-8 lg:px-10">
            <PageHeader
              title="Visão geral"
              description="Acompanhe suas guias, documentos e atividades recentes."
            />
            <div
              className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
              aria-busy="true"
              aria-label="Carregando indicadores"
            >
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl border border-border bg-card" />
              ))}
            </div>
            <div className="h-72 animate-pulse rounded-2xl border border-border bg-card" />
          </div>
          <SiteFooter />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <AppSidebar activeKey="dashboard" />
      <main className="min-w-0 flex-1 flex flex-col min-h-screen">
        <div className="w-full flex-1 space-y-6 px-4 py-6 pb-16 pt-20 sm:px-6 sm:py-8 md:pt-8 lg:px-10">
          <AppBreadcrumb />

          {/* Header */}
          <PageHeader
            className="sm:flex-nowrap"
            title="Visão geral"
            description="Acompanhe suas guias, documentos e atividades recentes."
            actions={
              <Button
                size="sm"
                onClick={handleGenerateReport}
                disabled={!hasData || generatingReport}
                aria-busy={generatingReport}
                title={!hasData ? "Sem dados para gerar o relatório" : undefined}
                className="w-full justify-center sm:w-auto"
              >
                {generatingReport ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Download className="h-4 w-4" aria-hidden="true" />
                )}
                {generatingReport ? "Gerando…" : "Gerar relatório"}
              </Button>
            }
          />

          <Tabs defaultValue="extraidas" className="space-y-6">
            <TooltipProvider>
              <TabsList className={appTabsListClass}>
                <TabsTrigger value="extraidas" className={appTabsTriggerClass}>
                  <FileText className={appTabsIconClass} aria-hidden />
                  <span className={appTabsLabelClass}>Guias processadas</span>
                </TabsTrigger>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex min-w-0">
                      <TabsTrigger
                        value="emitidas"
                        disabled
                        aria-disabled="true"
                        className={cn(appTabsTriggerClass, "w-full opacity-50")}
                      >
                        <FileCheck2 className={appTabsIconClass} aria-hidden />
                        <span className={appTabsLabelClass}>Guias emitidas</span>
                      </TabsTrigger>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Disponível em breve</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex min-w-0">
                      <TabsTrigger
                        value="documentos"
                        disabled
                        aria-disabled="true"
                        className={cn(appTabsTriggerClass, "w-full opacity-50")}
                      >
                        <FileStack className={appTabsIconClass} aria-hidden />
                        <span className={appTabsLabelClass}>Documentos emitidos</span>
                      </TabsTrigger>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Disponível em breve</TooltipContent>
                </Tooltip>
              </TabsList>
            </TooltipProvider>

            <TabsContent value="extraidas" className="space-y-6">
          {/* Recorte aplicado — sempre visível, sem abrir os filtros */}
          <p className="flex items-center gap-2 text-sm leading-5 text-muted-foreground" aria-live="polite">
            <span className="flex h-5 shrink-0 items-center" aria-hidden="true">
              <CalendarRange className="block h-4 w-4" />
            </span>
            <span className="leading-5">
              Dados exibidos: <span className="font-medium text-foreground">{periodLabel}</span>
              {filters.tipoGuia.trim() ? (
                <>
                  {" · "}Tipo de guia:{" "}
                  <span className="font-medium text-foreground">{filters.tipoGuia.trim()}</span>
                </>
              ) : null}
              {filters.prestadorSolicitante.trim() ? (
                <>
                  {" · "}Prestador:{" "}
                  <span className="font-medium text-foreground">
                    {filters.prestadorSolicitante.trim()}
                  </span>
                </>
              ) : null}
            </span>
          </p>

          {/* Container de filtros — cabeçalho próprio com expandir/recolher */}
          <section
            aria-label="Filtros"
            className="rounded-2xl border border-border bg-card shadow-xs"
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal
                  className="icon-optical h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <h2 className="font-display text-base font-semibold tracking-tight text-foreground">
                  Filtros
                </h2>
                {extraFilterCount > 0 && (
                  <Badge
                    variant="secondary"
                    size="sm"
                    aria-label={`${extraFilterCount} filtro${extraFilterCount > 1 ? "s" : ""} adicional${extraFilterCount > 1 ? "is" : ""} ativo${extraFilterCount > 1 ? "s" : ""}`}
                  >
                    {extraFilterCount}
                  </Badge>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFiltersOpen((open) => !open)}
                aria-expanded={filtersOpen}
                aria-controls="dashboard-filters-panel"
              >
                {filtersOpen ? "Recolher" : "Expandir"}
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform", filtersOpen && "rotate-180")}
                  aria-hidden="true"
                />
              </Button>
            </div>

            {filtersOpen && (
              <div
                id="dashboard-filters-panel"
                className="space-y-4 border-t border-border px-4 py-4 sm:px-5 sm:py-5"
              >
                <div className="space-y-1.5">
                  <span className="block text-xs font-medium leading-snug text-muted-foreground">
                    Períodos predefinidos
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "hoje", label: "Hoje" },
                      { id: "7d", label: "Últimos 7 dias" },
                      { id: "30d", label: "Últimos 30 dias" },
                    ].map((p) => (
                      <Chip
                        key={p.id}
                        onClick={() => applyPreset(p.id as "hoje" | "7d" | "30d")}
                        className="text-foreground hover:border-primary hover:bg-primary/5 hover:text-primary"
                      >
                        {p.label}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-4 lg:grid-cols-[10rem_10rem_minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <FilterField
                    label="Data inicial"
                    type="date"
                    error={dateRangeInvalid}
                    value={filters.dataAutorizacaoDe}
                    onChange={(v) => setFilter("dataAutorizacaoDe", v)}
                    inputRef={firstFieldRef}
                  />
                  <FilterField
                    label="Data final"
                    type="date"
                    error={dateRangeInvalid}
                    value={filters.dataAutorizacaoAte}
                    onChange={(v) => setFilter("dataAutorizacaoAte", v)}
                  />
                  <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                    <FilterSelect
                      label="Tipo de guia"
                      value={filters.tipoGuia}
                      onChange={(v) => setFilter("tipoGuia", v)}
                      options={GUIDE_TYPES.map((t) => t.name)}
                    />
                  </div>
                  <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                    <FilterSelect
                      label="Prestador solicitante"
                      value={filters.prestadorSolicitante}
                      onChange={(v) => setFilter("prestadorSolicitante", v)}
                      options={prestadoresList}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearAllFilters}
                    disabled={activeFilters.length === 0}
                    className="h-10 w-full justify-center sm:col-span-2 sm:h-9 lg:col-span-1 lg:w-auto"
                  >
                    Limpar filtros
                  </Button>
                </div>

                {dateRangeInvalid && (
                  <p className="text-xs text-destructive">
                    A data inicial deve ser anterior ou igual à data final.
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Para localizar uma guia específica por paciente, número ou procedimento, use a
                  página Guias processadas.
                </p>
              </div>
            )}
          </section>

          {/* KPIs */}
          <div
            className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
            data-testid="kpi-grid"
          >
            <Kpi
              icon={FileText}
              label="Total de guias processadas"
              value={String(total)}
              tooltip={kpiTooltips.total}
              context={dayCount > 0 ? "No período filtrado" : "Nenhuma guia no período filtrado"}
              tone="primary"
            />
            <Kpi
              icon={Activity}
              label="Guias processadas hoje"
              value={String(metrics.today)}
              tooltip={kpiTooltips.today}
              context={`Hoje, ${todayLabel}`}
              comparison={todayTrend?.label}
              tone="success"
              trend={todayTrend?.direction}
            />
            <Kpi
              icon={TrendingUp}
              label="Média diária de guias processadas"
              value={hasProcessingDays ? String(dailyAvg) : "—"}
              tooltip={kpiTooltips.average}
              context={hasProcessingDays ? "Por dia com processamento" : "Sem processamento no período"}
              comparison={weekTrend?.label}
              tone="info"
              trend={weekTrend?.direction}
            />
            <Kpi
              icon={Layers}
              label="Tipos de guias processadas"
              value={String(metrics.distinctTypes)}
              tooltip={kpiTooltips.types}
              context="Tipos distintos no período filtrado"
              tone="purple"
            />

          </div>

          {/* Charts row */}
          <div className="grid gap-4 grid-cols-1 xl:grid-cols-3 items-stretch">
            <SurfaceCard
              className="xl:col-span-2 flex h-full min-w-0 flex-col"
              bodyClassName="flex flex-1 flex-col"
              title="Guias processadas por dia"
              description="Quantidade de guias processadas por dia no período filtrado"
            >

              {!hasData ? (
                emptyState
              ) : (
                <>
                <div className="min-h-60 flex-1 sm:min-h-72 xl:min-h-80" data-chart="daily" ref={dailyChartRef}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={dailyData}
                      margin={{ top: 10, right: 12, left: isMobile ? 4 : 6, bottom: isMobile ? 0 : 6 }}
                    >
                      <defs>
                        <linearGradient id="gradPrimary" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        stroke="var(--muted-foreground)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={4}
                        height={isMobile ? 46 : 48}
                        ticks={dailyTicks}
                        interval={0}
                        tick={<DailyAxisTick monthStarts={dailyMonthStarts} />}
                        label={
                          isMobile
                            ? undefined
                            : {
                                value: "Dia do período",
                                position: "insideBottom",
                                offset: 2,
                                fill: "var(--muted-foreground)",
                                fontSize: 11,
                              }
                        }
                      />



                      <YAxis
                        stroke="var(--muted-foreground)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        width={isMobile ? 28 : 44}
                        allowDecimals={false}
                        label={
                          isMobile
                            ? undefined
                            : {
                                value: "Quantidade de guias",
                                angle: -90,
                                position: "insideLeft",
                                fill: "var(--muted-foreground)",
                                fontSize: 11,
                                style: { textAnchor: "middle" },
                              }
                        }
                      />

                      <RTooltip
                        content={<ChartTooltip />}
                        cursor={{ stroke: "var(--primary)", strokeOpacity: 0.25, strokeWidth: 1 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="guias"
                        name="Guias processadas"
                        stroke="var(--primary)"
                        strokeWidth={2.5}
                        fill="url(#gradPrimary)"
                        dot={{ r: 0 }}
                        activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }}
                        isAnimationActive={false}
                      />


                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {isMobile ? (
                  <p className="mt-2 text-xs leading-snug text-muted-foreground">
                    Eixo vertical: quantidade de guias · Eixo horizontal: dia do período
                  </p>
                ) : null}
                </>
              )}
            </SurfaceCard>

            <SurfaceCard
              className="flex h-full min-w-0 flex-col"
              bodyClassName="flex flex-1 flex-col"
              title="Guias processadas por tipo"
              description="Distribuição das guias processadas no período filtrado"
            >
              {!hasData ? (
                emptyState
              ) : (
                <div className="flex flex-1 flex-col gap-4">
                  <div
                    className="relative min-h-44 flex-1 sm:min-h-48"
                    data-chart="types"

                    role="img"
                    aria-label={`Guias processadas por tipo: ${typeData
                      .map((d) => `${d.name} ${d.value}`)
                      .join(", ")}. Total ${total} guias.`}
                  >

                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={typeData}
                          innerRadius={58}
                          outerRadius={82}
                          paddingAngle={typeData.length > 1 ? 2 : 0}
                          dataKey="value"
                          stroke="var(--card)"
                          strokeWidth={typeData.length > 1 ? 2 : 0}
                          activeIndex={activeType}
                          activeShape={(props: any) => (
                            <Sector {...props} outerRadius={props.outerRadius + 6} />
                          )}
                          onMouseEnter={(_, i) => setActiveType(i)}
                          onMouseLeave={() => setActiveType(undefined)}
                          isAnimationActive={false}
                        >
                          {typeData.map((d, i) => (
                            <Cell key={i} fill={d.color} />
                          ))}
                        </Pie>
                        <RTooltip content={<ChartTooltip unit="guias" />} wrapperStyle={{ zIndex: 30 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                      <div className="metric-value text-foreground">
                        {activeType !== undefined ? typeData[activeType].value : total}
                      </div>
                      <div className="max-w-24 text-xs leading-tight text-muted-foreground">
                        {activeType !== undefined
                          ? `guias de ${typeData[activeType].name}`
                          : "guias processadas"}
                      </div>
                    </div>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {typeData.map((d, i) => {
                      const pct = total > 0 ? (d.value / total) * 100 : 0;
                      const isActive = activeType === i;
                      return (
                        <li
                          key={d.name}
                          onMouseEnter={() => setActiveType(i)}
                          onMouseLeave={() => setActiveType(undefined)}
                          className={[
                            "flex min-w-0 items-center gap-2 rounded-md px-2 py-1 cursor-default transition-colors",
                            isActive ? "bg-muted/60" : "",
                          ].join(" ")}
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ background: d.color }}
                          />
                          <span className="flex-1 truncate">{d.name}</span>
                          <span className="text-muted-foreground tabular-nums text-xs">
                            {d.value} · {Math.round(pct)}%
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </SurfaceCard>
          </div>

          {/* Prestadores */}
          <SurfaceCard
            title="Guias processadas por prestador"
            description="Quantidade de guias processadas por prestador no período filtrado"
          >
            {providerCounts.length === 0 ? (
              emptyState
            ) : (
              <div className={`${SPLIT_GRID_CLASS} items-stretch`}>
                <div className="min-w-0 flex h-full flex-col gap-3 xl:pr-8">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Ranking de prestadores
                    </p>
                  </div>
                  <div
                    className="w-full flex-1"
                    style={{ minHeight: horizontalBarsHeight(providerCounts.length, isMobile) }}
                    data-chart="providers"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={providerCounts.map((p) => ({ name: p.name, count: p.count }))}
                        layout="vertical"
                        margin={{
                          top: 4,
                          right: isMobile ? 20 : 28,
                          left: isMobile ? 0 : 8,
                          bottom: isMobile ? 4 : 16,
                        }}
                        barCategoryGap={HORIZONTAL_BAR_GAP}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border)"
                          horizontal={false}
                        />
                        <XAxis
                          type="number"
                          stroke="var(--muted-foreground)"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                          label={
                            isMobile
                              ? undefined
                              : {
                                  value: "Quantidade de guias",
                                  position: "insideBottom",
                                  offset: -12,
                                  fill: "var(--muted-foreground)",
                                  fontSize: 11,
                                }
                          }
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke="var(--muted-foreground)"
                          fontSize={11}
                          width={isMobile ? 104 : 158}
                          tickLine={false}
                          axisLine={false}
                          label={
                            isMobile
                              ? undefined
                              : {
                                  value: "Prestador",
                                  angle: -90,
                                  position: "insideLeft",
                                  fill: "var(--muted-foreground)",
                                  fontSize: 11,
                                  style: { textAnchor: "middle" },
                                }
                          }
                        />
                        <RTooltip
                          content={<ChartTooltip unit="guias" />}
                          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                        />
                        <Bar
                          dataKey="count"
                          name=""
                          fill="var(--primary)"
                          radius={[0, 6, 6, 0]}
                          barSize={HORIZONTAL_BAR_SIZE}
                          isAnimationActive={false}
                        >
                          <LabelList
                            dataKey="count"
                            position="right"
                            className="fill-foreground"
                            style={{ fontSize: 11, fontWeight: 600 }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {isMobile ? (
                    <p className="text-xs leading-snug text-muted-foreground">
                      Eixo vertical: prestador · Eixo horizontal: quantidade de guias
                    </p>
                  ) : null}
                </div>
                <div className="min-w-0 space-y-3 xl:pl-8">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Detalhamento dos prestadores
                    </p>
                  </div>

                  <DataTable>
                    <DataTableDesktop breakpoint="md">
                      <DataTableRoot className="min-w-72">
                        <DataTableHeader>
                          <DataTableRow>
                            <SortableHead
                              label="Prestador"
                              column="name"
                              sort={providerSort}
                              onSort={setProviderSort}
                            />
                            <SortableHead
                              label="Quantidade"
                              column="count"
                              sort={providerSort}
                              onSort={setProviderSort}
                              align="right"
                            />
                          </DataTableRow>
                        </DataTableHeader>
                        <DataTableBody>
                          {sortedProviders.map((p) => (
                            <DataTableRow key={p.name}>
                              <DataTableCell title={p.name}>{p.name}</DataTableCell>
                              <DataTableCell className="text-right font-medium tabular-nums">
                                {p.count}
                              </DataTableCell>
                            </DataTableRow>
                          ))}
                        </DataTableBody>
                      </DataTableRoot>
                    </DataTableDesktop>

                    <DataTableCardList breakpoint="md" divided>
                      {sortedProviders.map((p) => (
                        <DataTableCard key={p.name} flat>
                          <DataTableCardHeader
                            title={<span className="min-w-0 break-words">{p.name}</span>}
                            trailing={
                              <Badge variant="secondary" className="tabular-nums">
                                {p.count}
                              </Badge>
                            }
                          />
                        </DataTableCard>
                      ))}
                    </DataTableCardList>
                  </DataTable>
                </div>
              </div>
            )}
          </SurfaceCard>


          {/* Procedures */}
          <SurfaceCard
            title="Procedimentos mais solicitados"
            description="Procedimentos mais frequentes nas guias processadas no período filtrado"

          >
            {procedures.length === 0 ? (
              emptyState
            ) : (
              <div className={`${SPLIT_GRID_CLASS} items-stretch`}>
                <div className="min-w-0 flex h-full flex-col gap-3 xl:pr-8">

                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Ranking de procedimentos
                  </p>
                </div>

                {/* Cresce junto com a tabela ao lado: as barras mantêm a espessura
                    e apenas os intervalos se redistribuem na altura disponível. */}
                <div
                  className="w-full flex-1"
                  style={{ minHeight: horizontalBarsHeight(procedures.length, isMobile) }}
                  data-chart="procedures"
                >

                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={procedures.map((p) => ({ name: p.name, count: p.count }))}
                      layout="vertical"
                      margin={{
                        top: 4,
                        right: isMobile ? 20 : 28,
                        left: isMobile ? 0 : 8,
                        bottom: isMobile ? 4 : 16,
                      }}
                      barCategoryGap={HORIZONTAL_BAR_GAP}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        stroke="var(--muted-foreground)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                        label={
                          isMobile
                            ? undefined
                            : {
                                value: "Quantidade de guias",
                                position: "insideBottom",
                                offset: -12,
                                fill: "var(--muted-foreground)",
                                fontSize: 11,
                              }
                        }
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="var(--muted-foreground)"
                        fontSize={11}
                        width={isMobile ? 104 : 158}
                        tickLine={false}
                        axisLine={false}
                        label={
                          isMobile
                            ? undefined
                            : {
                                value: "Procedimento",
                                angle: -90,
                                position: "insideLeft",
                                fill: "var(--muted-foreground)",
                                fontSize: 11,
                                style: { textAnchor: "middle" },
                              }
                        }
                      />

                      <RTooltip
                        content={<ChartTooltip unit="guias" />}
                        cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                      />
                      <Bar
                        dataKey="count"
                        name=""
                        fill="var(--primary)"
                        radius={[0, 6, 6, 0]}
                        barSize={HORIZONTAL_BAR_SIZE}
                        isAnimationActive={false}
                      >
                        <LabelList
                          dataKey="count"
                          position="right"
                          className="fill-foreground"
                          style={{ fontSize: 11, fontWeight: 600 }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {isMobile ? (
                   <p className="text-xs leading-snug text-muted-foreground">
                    Eixo vertical: procedimento · Eixo horizontal: quantidade de guias
                  </p>
                ) : null}
                </div>
                <div className="min-w-0 space-y-3 xl:pl-8">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Detalhamento dos procedimentos
                  </p>
                </div>

                <DataTable>
                  <DataTableDesktop breakpoint="md">
                    <DataTableRoot className="min-w-72">
                      <DataTableHeader>
                        <DataTableRow>
                          <SortableHead
                            label="Código"
                            column="code"
                            sort={procedureSort}
                            onSort={setProcedureSort}
                          />
                          <SortableHead
                            label="Procedimento"
                            column="name"
                            sort={procedureSort}
                            onSort={setProcedureSort}
                          />
                          <SortableHead
                            label="Quantidade"
                            column="count"
                            sort={procedureSort}
                            onSort={setProcedureSort}
                            align="right"
                          />
                        </DataTableRow>
                      </DataTableHeader>
                      <DataTableBody>
                        {sortedProcedures.map((p) => (
                          <DataTableRow key={p.code}>
                            <DataTableCell className="text-muted-foreground tabular-nums">
                              {p.code}
                            </DataTableCell>
                            <DataTableCell title={p.name}>{p.name}</DataTableCell>
                            <DataTableCell className="text-right font-medium tabular-nums">
                              {p.count}
                            </DataTableCell>
                          </DataTableRow>
                        ))}
                      </DataTableBody>
                    </DataTableRoot>
                  </DataTableDesktop>

                  <DataTableCardList breakpoint="md" divided>
                    {sortedProcedures.map((p) => (
                      <DataTableCard key={p.code} flat>
                        <DataTableCardHeader
                          title={<span className="min-w-0 break-words">{p.name}</span>}
                          subtitle={<span className="tabular-nums">{p.code}</span>}
                          trailing={
                            <Badge variant="secondary" className="tabular-nums">
                              {p.count}
                            </Badge>
                          }
                        />
                      </DataTableCard>
                    ))}
                  </DataTableCardList>
                </DataTable>
                </div>
              </div>
            )}
          </SurfaceCard>

          {/* Heatmap procedimento x prestador */}
          <SurfaceCard
            title="Procedimentos solicitados por prestador"
            description="Quantidade de procedimentos por prestador no período filtrado"
            actions={
              <HeatmapLegend
                min={providerHeatRange.min}
                max={providerHeatRange.max}
                className="hidden lg:block"
                muted={!hasProviderMatrix}
              />
            }
            headerClassName="gap-x-6"
            className="min-w-0"
          >
            <HeatmapLegend
              min={providerHeatRange.min}
              max={providerHeatRange.max}
              className="mb-4 lg:hidden"
              muted={!hasProviderMatrix}
            />
            {!hasProviderMatrix ? (
              emptyState
            ) : isHeatmapPending ? (
              <HeatmapSkeleton
                rows={providerMatrix.rows.length}
                columns={providerMatrix.columns.length}
                isMobile={isMobile}
              />
            ) : (
              <ProviderProcedureHeatmap matrix={deferredProviderMatrix} isMobile={isMobile} />
            )}
          </SurfaceCard>




          {/* Status do processamento de guias */}
          <SurfaceCard
            title="Status do processamento de guias"
            description="Distribuição das guias por status no período filtrado"
          >
            {!hasData ? (
              emptyState
            ) : (
              <div className={`${SPLIT_GRID_CLASS} items-start`}>
                <div className="min-w-0 flex flex-col gap-3 xl:pr-8">
                  <div className="relative h-44 sm:h-48" data-chart="quality-status">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          innerRadius={58}
                          outerRadius={82}
                          paddingAngle={statusData.length > 1 ? 2 : 0}
                          dataKey="value"
                          stroke="var(--card)"
                          strokeWidth={statusData.length > 1 ? 2 : 0}
                          isAnimationActive={false}
                        >
                          {statusData.map((d) => (
                            <Cell key={d.name} fill={d.color} />
                          ))}
                        </Pie>
                        <RTooltip content={<ChartTooltip unit="guias" />} wrapperStyle={{ zIndex: 30 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                      <div className="metric-value text-foreground">
                        {total > 0 ? Math.round((metrics.quality.success / total) * 100) : 0}%
                      </div>
                      <div className="max-w-24 text-xs leading-tight text-muted-foreground">
                        com sucesso
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-xs text-muted-foreground">
                    <span className="tabular-nums">{total}</span> guias no período
                  </p>
                  <ul className="space-y-1 text-sm">
                    <TooltipProvider>
                      {statusData.map((d) => {
                        const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                        return (
                          <li
                            key={d.name}
                            className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1"
                          >
                            <span
                              aria-hidden="true"
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ background: d.color }}
                            />
                            <span className="truncate">{d.name}</span>
                            {d.hint ? (
                              <InfoHint label={`Sobre ${d.name}`}>{d.hint}</InfoHint>
                            ) : null}

                            <span className="ml-auto shrink-0 tabular-nums text-xs">
                              <span className="font-semibold text-foreground">{pct}%</span>
                              <span className="font-normal text-muted-foreground">
                                {" "}
                                · {d.value}
                              </span>
                            </span>
                          </li>
                        );
                      })}
                    </TooltipProvider>
                  </ul>


                </div>

                {/* Motivos de não processamento, coloridos pela categoria de status. */}
                <div className="min-w-0 flex flex-col gap-3 xl:pl-8">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Motivos de não processamento
                    </p>
                    {metrics.quality.failuresByType.length > 0 && (
                      <ul className="flex flex-wrap items-center gap-3">
                        {(
                          Object.entries(FAILURE_CATEGORIES) as [
                            keyof typeof FAILURE_CATEGORIES,
                            { label: string; color: string },
                          ][]
                        ).map(([key, cat]) => (
                          <li key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span
                              aria-hidden="true"
                              className="size-2 rounded-full"
                              style={{ background: cat.color }}
                            />
                            {cat.label}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {metrics.quality.failuresByType.length === 0 ? (
                    <EmptyState
                      icon={<FileCheck2 className="h-10 w-10" />}
                      title="Nenhuma falha no período"
                      description="Todas as guias do período filtrado foram processadas com sucesso."
                    />
                  ) : (
                    <div className="flex flex-1 flex-col gap-3">
                      <div
                        className="w-full"
                        style={{
                          height: horizontalBarsHeight(
                            metrics.quality.failuresByType.length,
                            isMobile,
                          ),
                        }}
                        data-chart="quality-failures"
                      >

                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={metrics.quality.failuresByType}
                            layout="vertical"
                            margin={{
                              top: 4,
                              right: isMobile ? 20 : 28,
                              left: isMobile ? 0 : 8,
                              bottom: isMobile ? 4 : 16,
                            }}
                            barCategoryGap={HORIZONTAL_BAR_GAP}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="var(--border)"
                              horizontal={false}
                            />
                            <XAxis
                              type="number"
                              stroke="var(--muted-foreground)"
                              fontSize={11}
                              tickLine={false}
                              axisLine={false}
                              allowDecimals={false}
                              label={
                                isMobile
                                  ? undefined
                                  : {
                                      value: "Quantidade de ocorrências",
                                      position: "insideBottom",
                                      offset: -12,
                                      fill: "var(--muted-foreground)",
                                      fontSize: 11,
                                    }
                              }
                            />
                            <YAxis
                              type="category"
                              dataKey="name"
                              stroke="var(--muted-foreground)"
                              fontSize={11}
                              width={isMobile ? 104 : 172}
                              tickLine={false}
                              axisLine={false}
                              label={
                                isMobile
                                  ? undefined
                                  : {
                                      value: "Motivo",
                                      angle: -90,
                                      position: "insideLeft",
                                      fill: "var(--muted-foreground)",
                                      fontSize: 11,
                                      style: { textAnchor: "middle" },
                                    }
                              }
                            />
                            <RTooltip
                              content={<ChartTooltip unit="ocorrências" />}
                              cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                            />
                            <Bar
                              dataKey="count"
                              name="Ocorrências"
                              radius={[0, 6, 6, 0]}
                              barSize={HORIZONTAL_BAR_SIZE}
                              isAnimationActive={false}
                            >
                              {metrics.quality.failuresByType.map((f) => (
                                <Cell key={f.name} fill={f.color} />
                              ))}
                              <LabelList
                                dataKey="count"
                                position="right"
                                className="fill-foreground"
                                style={{ fontSize: 11, fontWeight: 600 }}
                              />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      {isMobile ? (
                        <p className="text-xs leading-snug text-muted-foreground">
                          Eixo vertical: tipo de falha · Eixo horizontal: quantidade de ocorrências
                        </p>
                      ) : null}
                    </div>

                  )}
                </div>
              </div>
            )}
          </SurfaceCard>
            </TabsContent>

            {/* Reservado para indicadores, filtros e gráficos próprios de cada aba. */}
            <TabsContent value="emitidas" />
            <TabsContent value="documentos" />
          </Tabs>
        </div>
        <SiteFooter />
      </main>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  context,
  comparison,
  tooltip,
  tone,
  trend,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  /** What the value refers to (period or reference date). */
  context: string;
  /** Optional comparison against a previous period. */
  comparison?: string;
  /** Short sentence with the exact dates and the comparison rule used. */
  tooltip?: string;
  tone: "primary" | "success" | "info" | "purple";
  trend?: TrendDirection;
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    info: "bg-info/15 text-info",
    purple: "bg-purple/15 text-purple",
  }[tone];

  return (
    <SurfaceCard
      padding="md"
      className="group relative h-full overflow-hidden hover:shadow-sm"
      bodyClassName="flex h-full flex-col items-start text-left"
    >
      <div className="flex w-full min-h-11 items-start justify-between gap-2">
        <span className="metric-label flex items-start icon-optical gap-1 text-left">
          {label}
          {tooltip ? (
            <InfoHint label={`Como este indicador é calculado: ${label}`}>{tooltip}</InfoHint>
          ) : null}
        </span>
        <span className={`grid place-items-center h-8 w-8 shrink-0 rounded-lg ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 metric-value text-foreground">{value}</div>
      <div className="mt-1 metric-hint text-muted-foreground">{context}</div>

      {comparison && (
        <div
          className={[
            "mt-1 metric-hint flex items-center icon-optical gap-1",
            trend === "up"
              ? "text-success"
              : trend === "down"
                ? "text-destructive"
                : "text-muted-foreground",
          ].join(" ")}
        >
          {trend === "up" && <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />}
          {trend === "down" && <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />}
          {trend === "flat" && <Minus className="h-3.5 w-3.5" aria-hidden="true" />}
          {trend && <span className="sr-only">{trendA11yLabel[trend]}</span>}
          {comparison}
        </div>
      )}
    </SurfaceCard>
  );

}

/** Quantidade de faixas da escala de intensidade do heatmap. */
const HEAT_STEPS = 5;

/** Estilo de uma faixa (0 = mais claro, HEAT_STEPS-1 = mais escuro). */
function heatStepStyle(step: number) {
  const mix = Math.round(14 + (step / (HEAT_STEPS - 1)) * 76);
  return {
    background: `color-mix(in oklab, var(--primary) ${mix}%, var(--card))`,
    color: mix >= 55 ? "var(--primary-foreground)" : "var(--foreground)",
  };
}

/** Faixa da escala em que um valor cai, dado o intervalo dos dados exibidos. */
function heatStep(value: number, min: number, max: number) {
  if (max <= min) return HEAT_STEPS - 1;
  const ratio = (value - min) / (max - min);
  return Math.min(HEAT_STEPS - 1, Math.max(0, Math.floor(ratio * HEAT_STEPS)));
}

/** Cor da célula: usa exatamente as mesmas faixas mostradas na legenda. */
function heatCell(value: number, min: number, max: number) {
  if (value === 0) return { background: "var(--muted)", color: "var(--muted-foreground)" };
  return heatStepStyle(heatStep(value, min, max));
}

/** Intervalo real das quantidades exibidas (ignora células sem solicitação). */
function heatmapRange(matrix: ProviderProcedureMatrix) {
  const values = matrix.rows.flatMap((row) =>
    matrix.columns.map((provider) => matrix.cells[`${row.code}|${provider}`] ?? 0),
  );
  const positives = values.filter((v) => v > 0);
  return { min: positives.length ? Math.min(...positives) : 0, max: matrix.max };
}

/**
 * Escala de intensidade do heatmap. Os valores de referência acompanham
 * dinamicamente o intervalo dos dados filtrados.
 */
function HeatmapLegend({
  min,
  max,
  className,
  muted = false,
}: {
  min: number;
  max: number;
  className?: string;
  /** Sem dados no período: legenda permanece visível, apenas atenuada. */
  muted?: boolean;
}) {
  const ticks = Array.from({ length: HEAT_STEPS + 1 }, (_, i) =>
    Math.round(min + ((max - min) * i) / HEAT_STEPS),
  );
  return (
    <div
      className={cn(
        "w-full min-w-0 lg:w-56 lg:shrink",
        muted && "opacity-50",
        className,
      )}
    >
      <p className="text-xs font-medium text-muted-foreground">Quantidade de solicitações</p>
      <div className="mt-1.5">
        <div className="flex overflow-hidden rounded-md border border-border" aria-hidden="true">
          {Array.from({ length: HEAT_STEPS }, (_, step) => (
            <span key={step} className="h-3.5 flex-1" style={heatStepStyle(step)} />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-xs tabular-nums text-muted-foreground">
          {ticks.map((tick, i) => (
            <span key={i}>{tick}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Placeholder do heatmap durante o recálculo da matriz (filtros em transição).
 * Espelha a estrutura real (matriz no desktop, cards no mobile) para evitar
 * salto de layout ao trocar do skeleton para os dados.
 */
function HeatmapSkeleton({
  rows,
  columns,
  isMobile,
}: {
  rows: number;
  columns: number;
  isMobile: boolean;
}) {
  const rowCount = Math.min(Math.max(rows, 1), 6);
  const colCount = Math.min(Math.max(columns, 1), 7);

  if (isMobile) {
    return (
      <div className="flex flex-col gap-4" role="status" aria-label="Recalculando heatmap">
        {Array.from({ length: rowCount }, (_, r) => (
          <div key={r} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-2/3" />
            <div className="flex flex-col gap-1.5">
              {Array.from({ length: Math.min(colCount, 4) }, (_, c) => (
                <div key={c} className="flex items-center justify-between gap-3">
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="h-3.5 w-10" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5" role="status" aria-label="Recalculando heatmap">
      <div className="flex items-end gap-1.5">
        <div className="w-52 shrink-0" />
        {Array.from({ length: colCount }, (_, c) => (
          <Skeleton key={c} className="h-4 min-w-0 flex-1" />
        ))}
      </div>
      {Array.from({ length: rowCount }, (_, r) => (
        <div key={r} className="flex items-center gap-1.5">
          <div className="w-52 shrink-0 pr-3">
            <Skeleton className="h-4 w-full" />
          </div>
          {Array.from({ length: colCount }, (_, c) => (
            <Skeleton key={c} className="h-9 min-w-0 flex-1 rounded-md" />
          ))}
        </div>
      ))}
    </div>
  );
}




/**
 * Heatmap procedimento (linhas) x prestador solicitante (colunas).
 * No mobile a matriz é reagrupada por procedimento, mantendo a leitura dos
 * nomes e das quantidades sem comprimir todas as colunas na largura da tela.
 */
const ProviderProcedureHeatmap = memo(function ProviderProcedureHeatmap({
  matrix,
  isMobile,
}: {
  matrix: ProviderProcedureMatrix;
  isMobile: boolean;
}) {
  const { columns, cells, max } = matrix;
  const get = (code: string, provider: string) => cells[`${code}|${provider}`] ?? 0;

  /** null = ordem original (por quantidade); asc/desc = alfabética pelo nome. */
  const [nameSort, setNameSort] = useState<"asc" | "desc" | null>(null);
  const rows = useMemo(() => {
    if (!nameSort) return matrix.rows;
    const dir = nameSort === "asc" ? 1 : -1;
    return [...matrix.rows].sort((a, b) => dir * a.name.localeCompare(b.name, "pt-BR"));
  }, [matrix.rows, nameSort]);
  const toggleNameSort = () => setNameSort((s) => (s === "asc" ? "desc" : "asc"));
  const SortIcon = !nameSort ? ChevronsUpDown : nameSort === "asc" ? ChevronUp : ChevronDown;

  // Intervalo real dos dados exibidos (ignora células sem solicitação).
  // Memoizado: recalcular a escala em cada render encarece a troca de filtros.
  const { min } = useMemo(() => heatmapRange(matrix), [matrix]);

  // Mede o espaço realmente disponível: a matriz só é usada quando cabe com
  // legibilidade; abaixo disso caímos no formato em cards (sem rolagem lateral).
  const hostRef = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState<number | null>(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof ResizeObserver === "undefined") return;
    // Agrupa as medições em um frame e ignora variações sub-pixel: sem isso o
    // observer dispara um render por pixel durante resize/troca de filtros.
    let frame = 0;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setAvailable((prev) => (prev === width ? prev : width));
      });
    });
    observer.observe(host);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  // Larguras legíveis: rótulo + colunas de prestador + total.
  // As células variam entre MIN_CELL e MAX_CELL para aproveitar o espaço sem
  // ficarem estreitas nem desproporcionalmente largas; altura e espaçamento
  // permanecem constantes em qualquer largura de tela.
  const MIN_LABEL = 208;
  const MIN_CELL = 68;
  const MAX_CELL = 112;
  const MIN_TOTAL = 56;
  // border-spacing-1 => 4px de cada lado de cada célula.
  const GAP = 8;
  const fixedWidth = MIN_LABEL + MIN_TOTAL + GAP * (columns.length + 2);
  const minMatrixWidth = fixedWidth + columns.length * MIN_CELL;
  const useCards = isMobile || (available !== null && available < minMatrixWidth);
  const cellWidth = Math.min(
    MAX_CELL,
    Math.max(
      MIN_CELL,
      Math.floor(((available ?? minMatrixWidth) - fixedWidth) / Math.max(columns.length, 1)),
    ),
  );
  // A matriz não estica até 100% do card quando isso distorceria as células.
  const matrixWidth = fixedWidth + columns.length * cellWidth;

  if (useCards) {
    return (
      <div ref={hostRef} className="@container min-w-0">
        {/* Colunas medidas pelo espaço do card (container query), não pela viewport. */}
        <div className="grid grid-cols-1 gap-3 @xl:grid-cols-2 @4xl:grid-cols-3">

          {rows.map((row) => {
            const items = columns
              .map((provider) => ({ provider, value: get(row.code, provider) }))
              .filter((i) => i.value > 0)
              .sort((a, b) => b.value - a.value);
            return (
              <div key={row.code} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {/* Sem truncamento no card: em telas estreitas o nome do
                        procedimento quebra em até duas linhas para seguir legível. */}
                    <p
                      title={row.name}
                      className="line-clamp-2 text-sm font-medium leading-tight text-foreground"
                    >
                      {row.name}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">{row.code}</p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="shrink-0 tabular-nums"
                    aria-label={`Total de ${row.total} solicitações`}
                  >
                    {row.total}
                  </Badge>
                </div>
                <ul className="mt-2 flex flex-col gap-1">
                  {items.map((item) => (
                    <li key={item.provider} className="flex items-start justify-between gap-2">
                      {/* Tooltip não é acessível por toque: o rótulo completo
                          fica no title e o nome quebra em vez de truncar. */}
                      <span
                        title={item.provider}
                        className="min-w-0 flex-1 break-words pt-1 text-xs leading-tight text-muted-foreground"
                      >
                        {item.provider}
                      </span>
                      <span
                        className="grid h-7 w-11 shrink-0 place-items-center rounded-md text-xs font-medium tabular-nums"
                        style={heatCell(item.value, min, max)}
                        aria-label={`${item.provider}: ${item.value} ${item.value === 1 ? "solicitação" : "solicitações"}`}
                      >
                        {item.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div ref={hostRef} className="min-w-0">
      {/* Um provider para toda a matriz (antes: um por célula). */}
      <TooltipProvider delayDuration={120}>
        <table
          className="table-fixed border-separate border-spacing-1 text-sm"
          style={{ width: matrixWidth, maxWidth: "100%" }}
        >
          <caption className="sr-only">
            Quantidade de solicitações por procedimento e prestador solicitante
          </caption>
          <colgroup>
            {/* Rótulo e total fixos; prestadores com largura limitada (min/max). */}
            <col style={{ width: MIN_LABEL }} />
            {columns.map((provider) => (
              <col key={provider} style={{ width: cellWidth }} />
            ))}
            <col style={{ width: MIN_TOTAL }} />
          </colgroup>


          <thead>
            <tr>
              <th
                scope="col"
                aria-sort={nameSort ? (nameSort === "asc" ? "ascending" : "descending") : "none"}
                className="text-left align-bottom"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleNameSort}
                  className={cn(
                    "-mx-2 h-auto gap-1 px-2 py-1 text-xs font-medium uppercase tracking-wide",
                    nameSort ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  Procedimento
                  <SortIcon className="h-3 w-3" aria-hidden="true" />
                </Button>
              </th>

              {columns.map((provider) => (
                <th
                  key={provider}
                  scope="col"
                  className="px-1 pb-1 align-bottom text-xs font-medium text-muted-foreground"
                >
                  {/* Célula estreita: o rótulo quebra apenas entre palavras (o
                      word joiner evita "+" sozinho numa linha) e o nome completo
                      continua acessível por tooltip/title. */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        tabIndex={0}
                        title={provider}
                        className="mx-auto block break-normal hyphens-none text-center leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {provider.replace(/([+/&-])/g, "\u2060$1")}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent variant="panel" className="max-w-56">
                      {provider}
                    </TooltipContent>
                  </Tooltip>
                </th>
              ))}
              <th scope="col" className="px-1 pb-1 text-right align-bottom text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.code}>
                <th scope="row" className="py-1 pr-3 text-left font-normal">
                  <span
                    title={row.name}
                    className="block truncate text-sm leading-tight text-foreground"
                  >
                    {row.name}
                  </span>
                  <span className="block font-mono text-xs text-muted-foreground">{row.code}</span>
                </th>
                {columns.map((provider) => {
                  const value = get(row.code, provider);
                  return (
                    <td key={provider} className="p-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            tabIndex={0}
                            aria-label={`${row.name}, ${provider}: ${value} ${value === 1 ? "solicitação" : "solicitações"}`}
                            className="mx-auto grid h-9 w-full place-items-center rounded-md text-sm font-medium tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            // maxWidth garante o limite superior mesmo quando o
                            // table-fixed distribui sobra de largura nas colunas.
                            style={{ maxWidth: MAX_CELL, ...heatCell(value, min, max) }}
                          >
                            {value === 0 ? "–" : value}
                          </span>
                        </TooltipTrigger>
                        {/* Largura reduzida em telas menores para o tooltip não
                            encostar nas bordas; texto quebra em vez de cortar. */}
                        <TooltipContent
                          variant="panel"
                          collisionPadding={12}
                          className="max-w-56 sm:max-w-64">
                          <div className="flex flex-col gap-1 text-xs">
                            <span className="text-xs uppercase tracking-wider text-muted-foreground">
                              CBHPM {row.code}
                            </span>
                            <span className="font-medium leading-tight text-foreground">
                              {row.name}
                            </span>
                            <span className="text-muted-foreground">{provider}</span>
                            <span className="mt-1 border-t border-border pt-1 font-semibold tabular-nums text-foreground">
                              {value} {value === 1 ? "solicitação" : "solicitações"}
                            </span>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                  );
                })}

                {/* Fonte mono + peso normal: evita que números repetidos (44) pareçam mais pesados. */}
                <td className="pl-2 text-right font-mono text-sm tabular-nums text-foreground">

                  {row.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TooltipProvider>
    </div>
  );
});
