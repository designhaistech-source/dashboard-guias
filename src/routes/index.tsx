import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
  FileStack,
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
import { cn } from "@/lib/utils";
import { Field } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/guiasplus-logo.png.asset.json";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Chip } from "@/components/ui/chip";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DASHBOARD_GUIDES,
  PRESTADORES,
  filterGuides,
  buildMetrics,
  GUIDE_TYPES,
  type DashboardMetrics,
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

function ChartTooltip({ active, payload, label, suffix, unit }: any) {
  if (!active || !payload?.length) return null;
  const iso: string | undefined = payload[0]?.payload?.date;
  // Aggregated per day: plain dd/MM/yyyy, without weekday or timezone noise.
  const fullDate = formatIsoToBr(iso);
  const heading = fullDate || (label !== undefined ? String(label) : "");

  return (
    <div className="rounded-lg border border-border bg-popover/95 px-3 py-2 shadow-md backdrop-blur">
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

/** Cabeçalho de coluna ordenável, com estado anunciado via aria-sort. */
function SortableHead({
  label,
  column,
  sort,
  onSort,
  align = "left",
}: {
  label: string;
  column: ProcedureSortColumn;
  sort: ProcedureSort;
  onSort: (sort: ProcedureSort) => void;
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

  const metrics = useMemo(
    () =>
      buildMetrics(filterGuides(DASHBOARD_GUIDES, filters), {
        from: filters.dataAutorizacaoDe || undefined,
        to: filters.dataAutorizacaoAte || undefined,
      }),
    [filters],
  );

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
    const avg = (rows: typeof dailyData) =>
      rows.reduce((sum, row) => sum + row.guias, 0) / rows.length;
    const recentAvg = avg(recent);
    const previousAvg = avg(previous);
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
          ? `Período atual: ${recentStart} a ${currentDate}. Período anterior: ${previousStart} a ${previousEnd}. Regra: média diária atual menos a média diária do período anterior de mesmo tamanho.`
          : `${rangeSentence} Regra: total de guias dividido pelo número de dias. Sem período anterior para comparar.`,
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
        <main className="flex-1 flex flex-col min-h-screen">
          <div className="w-full flex-1 space-y-6 px-4 py-6 pb-16 pt-20 sm:px-6 sm:py-8 md:pt-8 lg:px-10">
            <PageHeader
              title="Visão geral"
              description="Acompanhe suas guias, documentos e atividades recentes."
            />
            <div
              className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
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
      <main className="flex-1 flex flex-col min-h-screen">
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
          <p className="flex items-start gap-2 text-sm text-muted-foreground" aria-live="polite">
            <CalendarRange className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
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
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
              value={String(dailyAvg)}
              tooltip={kpiTooltips.average}
              context="Por dia no período filtrado"
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
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3 items-start lg:items-stretch">
            <SurfaceCard
              className="lg:col-span-2 lg:flex lg:flex-col"
              bodyClassName="lg:flex-1 lg:flex lg:flex-col lg:min-h-0"
              title="Guias processadas por dia"
              description="Quantidade de guias processadas por dia no período filtrado"
            >
              {!hasData ? (
                emptyState
              ) : (
                <>
                <div className="h-60 sm:h-72 lg:h-auto lg:flex-1 lg:min-h-[15rem]" data-chart="daily" ref={dailyChartRef}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={dailyData}
                      margin={{ top: 10, right: 10, left: isMobile ? 0 : 6, bottom: isMobile ? 0 : 6 }}
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
                        height={isMobile ? 34 : 48}
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
                  <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                    Eixo vertical: quantidade de guias · Eixo horizontal: dia do período
                  </p>
                ) : null}
                </>
              )}
            </SurfaceCard>

            <SurfaceCard
              title="Guias processadas por tipo"
              description="Distribuição das guias processadas no período filtrado"

            >
              {!hasData ? (
                emptyState
              ) : (
                <div className="space-y-4">
                  <div className="relative h-44 sm:h-48" data-chart="types">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={typeData}
                          innerRadius={58}
                          outerRadius={82}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="var(--card)"
                          strokeWidth={2}
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
                        <RTooltip content={<ChartTooltip unit="guias" />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                      <div className="metric-value text-foreground">
                        {activeType !== undefined ? typeData[activeType].value : total}
                      </div>
                      <div className="max-w-[96px] text-xs leading-tight text-muted-foreground">
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

          {/* Procedures */}
          <SurfaceCard
            title="Procedimentos mais realizados"
            description="Procedimentos mais frequentes nas guias processadas no período filtrado"

          >
            {procedures.length === 0 ? (
              emptyState
            ) : (
              <div className="grid gap-6 xl:gap-8 xl:grid-cols-2 items-start xl:items-stretch">
                <div className="min-w-0 flex flex-col gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Ranking de procedimentos
                  </p>
                </div>

                <div className="h-72 sm:h-64 xl:h-auto xl:flex-1 xl:min-h-[16rem]" data-chart="procedures">

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
                      barCategoryGap={10}
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
                        maxBarSize={22}
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
                  <p className="text-[11px] leading-snug text-muted-foreground">
                    Eixo vertical: procedimento · Eixo horizontal: quantidade de guias
                  </p>
                ) : null}
                </div>
                <div className="min-w-0 space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Detalhamento dos procedimentos
                  </p>
                </div>

                <DataTable>
                  <DataTableDesktop breakpoint="md">
                    <DataTableRoot className="min-w-[18rem]">
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
    <SurfaceCard padding="md" className="group relative overflow-hidden hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="metric-label flex items-center icon-optical gap-1">
          {label}
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 rounded-full text-muted-foreground hover:text-foreground [&_svg]:size-3.5"
                    aria-label={`Como este indicador é calculado: ${tooltip}`}
                  >
                    <Info aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-64 text-xs">{tooltip}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
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
