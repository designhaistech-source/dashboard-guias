import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import { toLocalIsoDate, todayLocalIsoDate } from "@/lib/date";
import autoTable from "jspdf-autotable";
import {
  FileText,
  TrendingUp,
  Layers,
  Download,
  Activity,
  X,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Loader2,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  CalendarRange,
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
  ReferenceLine,
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
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/page-header";
import { SurfaceCard } from "@/components/surface-card";
import { FilterCard } from "@/components/filter-card";
import { Field } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/guiasplus-logo.png.asset.json";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Chip } from "@/components/ui/chip";
import { Badge } from "@/components/ui/badge";
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

/** Formats an ISO date (yyyy-mm-dd) as dd/mm/yyyy without timezone shifts. */
function formatIsoDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

/** Human label for the period actually filtered by the user. */
/**
 * Rótulo legível do período exibido. Sem filtro de data, usa o intervalo real
 * dos dados apresentados (primeiro e último dia com guias).
 */
function buildPeriodLabel(from: string, to: string, fallback?: { first?: string; last?: string }) {
  const de = from.trim() || fallback?.first || "";
  const ate = to.trim() || fallback?.last || "";
  if (de && ate) {
    return de === ate
      ? formatIsoDate(de)
      : `${formatIsoDate(de)} a ${formatIsoDate(ate)}`;
  }
  if (de) return `A partir de ${formatIsoDate(de)}`;
  if (ate) return `Até ${formatIsoDate(ate)}`;
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


async function captureChartPng(selector: string, scale = 2): Promise<{ dataUrl: string; w: number; h: number } | null> {
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
    if (!/oklch|oklab|color\(/i.test(v)) return v;
    colorProbe.style.color = v;
    return window.getComputedStyle(colorProbe).color || v;
  };

  const srcEls = svg.querySelectorAll<SVGElement>("*");
  const dstEls = clone.querySelectorAll<SVGElement>("*");
  srcEls.forEach((el, i) => {
    const cs = window.getComputedStyle(el);
    const dst = dstEls[i] as SVGElement;
    if (!dst) return;
    const props = ["fill", "stroke", "stroke-width", "stroke-dasharray", "opacity", "fill-opacity", "stroke-opacity", "font-size", "font-family", "font-weight"];
    let style = "";
    for (const p of props) {
      let v = cs.getPropertyValue(p);
      if (!v) continue;
      if (p === "fill" || p === "stroke") v = resolveColor(v);
      style += `${p}:${v};`;
    }
    dst.setAttribute("style", style);
    // Also normalize fill/stroke attributes (Recharts sets them on paths)
    const attrFill = el.getAttribute("fill");
    if (attrFill) dst.setAttribute("fill", resolveColor(attrFill));
    const attrStroke = el.getAttribute("stroke");
    if (attrStroke) dst.setAttribute("stroke", resolveColor(attrStroke));
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

async function generateReportPdf(periodLabel: string, metrics: DashboardMetrics) {
  const { dailyAvg, total, types: typeData, procedures } = metrics;
  try {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const contentW = pageWidth - margin * 2;
    const now = new Date();
    const dateStr = now.toLocaleString("pt-BR");

    // ---- Type system: single source of truth for fonts/weights/sizes ----
    const FONT = "helvetica";
    const TYPE = {
      title:       { size: 18, weight: "bold"   as const, color: [20, 20, 20]     as [number, number, number] },
      subtitle:    { size: 10, weight: "normal" as const, color: [110, 110, 110]  as [number, number, number] },
      sectionH:    { size: 12, weight: "bold"   as const, color: [20, 20, 20]     as [number, number, number] },
      body:        { size: 10, weight: "normal" as const, color: [20, 20, 20]     as [number, number, number] },
      tableHead:   { size: 10, weight: "bold"   as const, color: [255, 255, 255]  as [number, number, number] },
      tableBody:   { size: 10, weight: "normal" as const, color: [40, 40, 40]     as [number, number, number] },
      caption:     { size: 8,  weight: "normal" as const, color: [130, 130, 130]  as [number, number, number] },
    };

    const applyType = (t: typeof TYPE[keyof typeof TYPE]) => {
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
    doc.text("Relatório de Visão Geral", titleX, 35);
    applyType(TYPE.subtitle);
    doc.text(`Período: ${periodLabel}  •  Gerado em: ${dateStr}`, titleX, 52);

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

    const sectionTitle = (text: string, keepNextH = 0) => {
      const titleBlock = 28;
      keepTogether(titleBlock + keepNextH);
      applyType(TYPE.sectionH);
      doc.text(text, margin, y);
      doc.setDrawColor(220);
      doc.setLineWidth(0.6);
      doc.line(margin, y + 4, pageWidth - margin, y + 4);
      y += 18;
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

    // KPIs
    const kpiRows = 4;
    sectionTitle("Indicadores", tableBlockH(kpiRows));
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Indicador", "Valor"]],
      body: [
        ["Total de guias extraídas", String(total)],
        ["Guias extraídas hoje", String(metrics.today)],
        ["Média de guias por dia", String(dailyAvg)],
        ["Tipos de guia", String(typeData.length)],

      ],
      theme: "grid",
      headStyles: tableHeadStyles,
      bodyStyles: { font: FONT, fontStyle: "normal", textColor: TYPE.tableBody.color },
      columnStyles: { 1: { halign: "right", cellWidth: 120 } },
      styles: tableStyleDefaults,
      tableWidth: contentW,
      rowPageBreak: "avoid",
      showHead: "everyPage",
    });
    y = (doc as any).lastAutoTable.finalY + 24;

    // Spacing token between sections / between a chart and the next block.
    const GAP = 18;

    // Guias por dia — full width chart
    const daily = await captureChartPng('[data-chart="daily"]');
    const dailyMaxH = Math.min(260, pageInnerH * 0.38);
    sectionTitle("Guias extraídas por dia", dailyMaxH);
    const dailyH = drawChart(daily, contentW, dailyMaxH);
    y += dailyH + GAP;

    // Distribuição por tipo — donut full width on top, table below
    const types = await captureChartPng('[data-chart="types"]');
    const donutMaxH = Math.min(200, pageInnerH * 0.32);
    sectionTitle("Distribuição por tipo de guia", donutMaxH);
    const donutW = Math.min(contentW, donutMaxH * (types ? types.w / types.h : 2));
    const typesH = drawChart(types, donutW, donutMaxH, margin + (contentW - donutW) / 2);
    y += typesH + GAP;
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      tableWidth: contentW,
      head: [["Tipo", "Qtd.", "%"]],
      body: typeData.map((t) => [t.name, String(t.value), `${total > 0 ? Math.round((t.value / total) * 100) : 0}%`]),
      theme: "striped",
      headStyles: tableHeadStyles,
      bodyStyles: { font: FONT, fontStyle: "normal", textColor: TYPE.tableBody.color },
      columnStyles: { 1: { halign: "right", cellWidth: 60 }, 2: { halign: "right", cellWidth: 60 } },
      styles: tableStyleDefaults,
      rowPageBreak: "avoid",
      showHead: "everyPage",
    });
    y = (doc as any).lastAutoTable.finalY + GAP + 6;

    // Procedimentos — chart, then table (keep title with chart)
    const proc = await captureChartPng('[data-chart="procedures"]');
    const procMaxH = Math.min(280, pageInnerH * 0.42);
    sectionTitle("Procedimentos mais realizados", procMaxH);
    const procDrawnH = drawChart(proc, contentW, procMaxH);
    y += procDrawnH + GAP;
    // Don't strand the table header alone after the chart.
    keepTogether(tableBlockH(Math.min(3, procedures.length)));


    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      tableWidth: contentW,
      head: [["Código TUSS", "Procedimento", "Quantidade"]],
      body: procedures.map((p) => [p.code, p.name, String(p.count)]),
      theme: "striped",
      headStyles: tableHeadStyles,
      bodyStyles: { font: FONT, fontStyle: "normal", textColor: TYPE.tableBody.color },
      columnStyles: { 0: { cellWidth: 110 }, 2: { halign: "right", cellWidth: 60 } },
      styles: tableStyleDefaults,
      rowPageBreak: "avoid",
      showHead: "everyPage",
    });

    // "Gerado por" — bloco final, quebra página se não couber
    const lastY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
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
    doc.text(
      `${user.role}  •  ${user.crm}  •  ${user.email}  •  ${user.clinic}`,
      margin,
      y,
    );

    // Footer
    const pageCount = doc.getNumberOfPages();


    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(230);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 32, pageWidth - margin, pageHeight - 32);
      applyType(TYPE.caption);
      doc.text("Guias+", margin, pageHeight - 18);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - 18, { align: "right" });
    }


    const filename = `relatorio-haisguias-${toLocalIsoDate(now)}.pdf`;
    doc.save(filename);
    toast.success("Relatório PDF gerado com sucesso!");
  } catch (err) {
    console.error(err);
    toast.error("Falha ao gerar o relatório PDF.");
  }
}



/** Converte "yyyy-mm-dd" em "dd/mm/aaaa" para leitura de usuários finais. */
function formatIsoToBr(iso?: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

/**
 * Data completa para tooltips: "qua., 19/08/2026". O dia da semana ajuda a
 * comparar períodos sem contar dias manualmente.
 */
function formatIsoToBrFull(iso?: string) {
  const short = formatIsoToBr(iso);
  if (!short || !iso) return short;
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return short;
  const weekday = date.toLocaleDateString("pt-BR", { weekday: "short" });
  return `${weekday.replace(".", "")}., ${short}`;
}

/** Rótulo fixo do fuso usado em todos os tooltips, ex.: "Horário local (UTC-03:00)". */
function localTimeZoneLabel() {
  const offsetMinutes = -new Date().getTimezoneOffset();
  const sign = offsetMinutes < 0 ? "-" : "+";
  const abs = Math.abs(offsetMinutes);
  const hh = `${Math.floor(abs / 60)}`.padStart(2, "0");
  const mm = `${abs % 60}`.padStart(2, "0");
  return `Horário local (UTC${sign}${hh}:${mm})`;
}

function ChartTooltip({ active, payload, label, suffix }: any) {
  if (!active || !payload?.length) return null;
  const iso: string | undefined = payload[0]?.payload?.date;
  const fullDate = formatIsoToBrFull(iso);
  const heading = fullDate || (label !== undefined ? String(label) : "");

  return (
    <div className="rounded-lg border border-border bg-popover/95 px-3 py-2 shadow-md backdrop-blur">
      {heading && (
        <div className="mb-1">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {heading}
          </div>
          {iso && (
            <div className="text-[10px] text-muted-foreground/80">{localTimeZoneLabel()}</div>
          )}
        </div>
      )}
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.payload?.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="ml-auto font-semibold tabular-nums">
            {p.value}
            {suffix ?? ""}
          </span>
        </div>
      ))}

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
const filterGroupLabelClass =
  "mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";


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
    <Field label={label}>
      <Input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error || undefined}
        className={`h-9 ${error ? "border-destructive focus-visible:ring-destructive/40" : ""}`}
      />
    </Field>
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


/** Filtros cujo valor é uma data ISO e deve ser exibido em pt-BR. */
const dateFilterKeys: ReadonlySet<keyof GuideFilters> = new Set([
  "dataAutorizacaoDe",
  "dataAutorizacaoAte",
]);

/** Converte o valor cru do filtro na forma legível exibida nos chips. */
function formatFilterValue(key: keyof GuideFilters, value: string): string {
  if (!dateFilterKeys.has(key)) return value;
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

const MONTH_ABBR = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
] as const;

/**
 * Eixo X do gráfico diário: mostra apenas o dia para manter a leitura limpa e
 * acrescenta o mês abreviado no primeiro ponto e a cada virada de mês, para que
 * o período seja identificável mesmo atravessando meses.
 */
function formatDailyTick(iso: string, index: number): string {
  const [, month, day] = iso.split("-");
  if (!month || !day) return iso;
  const monthLabel = MONTH_ABBR[Number(month) - 1] ?? month;
  const showMonth = index === 0 || day === "01";
  return showMonth ? `${day} ${monthLabel}` : day;
}

/**
 * Datas de virada de mês (dia 01, exceto o primeiro ponto) usadas para desenhar
 * separadores verticais discretos no gráfico diário.
 */
function monthBoundaries(data: { date: string }[]): { date: string; label: string }[] {
  return data
    .filter((d, i) => i > 0 && d.date.slice(8, 10) === "01")
    .map((d) => {
      const month = Number(d.date.slice(5, 7));
      const monthLabel = MONTH_ABBR[month - 1] ?? d.date.slice(5, 7);
      return { date: d.date, label: `${monthLabel}/${d.date.slice(2, 4)}` };
    });
}





const filterLabels: Record<keyof GuideFilters, string> = {
  dataAutorizacaoDe: "Período de",
  dataAutorizacaoAte: "Período até",
  tipoGuia: "Tipo de guia",
  prestadorSolicitante: "Prestador solicitante",
};


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
    <DataTableHead
      aria-sort={ariaSort}
      className={align === "right" ? "text-right" : undefined}
    >
      <button
        type="button"
        onClick={() =>
          onSort({
            column,
            direction: active && sort.direction === "asc" ? "desc" : active ? "asc" : column === "count" ? "desc" : "asc",
          })
        }
        className={[
          "inline-flex items-center gap-1 rounded-sm uppercase tracking-wide",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active ? "text-foreground" : "hover:text-foreground",
        ].join(" ")}
      >
        {label}
        <Icon className="h-3 w-3" aria-hidden="true" />
      </button>
    </DataTableHead>
  );
}

function DashboardPage() {
  const [activeType, setActiveType] = useState<number | undefined>(undefined);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<GuideFilters>(emptyFilters);
  const [draft, setDraft] = useState<GuideFilters>(emptyFilters);

  const activeFilters = useMemo(
    () =>
      (Object.entries(filters) as [keyof GuideFilters, string][]).filter(
        ([, v]) => v.trim() !== "",
      ),
    [filters],
  );

  const openFilters = () => {
    setDraft(filters);
    setFiltersOpen(true);
  };
  const dateRangeInvalid =
    !!draft.dataAutorizacaoDe &&
    !!draft.dataAutorizacaoAte &&
    draft.dataAutorizacaoDe > draft.dataAutorizacaoAte;
  const hasErrors = dateRangeInvalid;

  const previewCount = useMemo(
    () => (hasErrors ? null : filterGuides(DASHBOARD_GUIDES, draft).length),
    [draft, hasErrors],
  );

  const applyPreset = (preset: "hoje" | "7d" | "30d") => {
    const today = new Date();
    const iso = toLocalIsoDate;
    setDraft((d) => {
      if (preset === "hoje") {
        const t = iso(today);
        return { ...d, dataAutorizacaoDe: t, dataAutorizacaoAte: t };
      }
      if (preset === "7d") {
        const from = new Date(today); from.setDate(today.getDate() - 7);
        return { ...d, dataAutorizacaoDe: iso(from), dataAutorizacaoAte: iso(today) };
      }
      const from = new Date(today); from.setDate(today.getDate() - 30);
      return { ...d, dataAutorizacaoDe: iso(from), dataAutorizacaoAte: iso(today) };
    });
  };

  const applyFilters = () => {
    if (hasErrors) return;
    setFilters(draft);
    setFiltersOpen(false);
    const count = Object.values(draft).filter((v) => v.trim() !== "").length;
    toast.success(
      count === 0 ? "Filtros limpos." : `${count} filtro${count > 1 ? "s" : ""} aplicado${count > 1 ? "s" : ""}.`,
    );
  };
  
  /**
   * Caminho único de limpeza: chips, painel e estados vazios chamam esta função,
   * com o mesmo efeito (limpa rascunho + filtros aplicados) e o mesmo feedback.
   * Não fecha o painel — limpar não é sair.
   */
  const clearAllFilters = () => {
    setDraft(emptyFilters);
    setFilters(emptyFilters);
    toast.success("Filtros limpos.");
  };
  const removeFilter = (key: keyof GuideFilters) => {
    setFilters((f) => ({ ...f, [key]: "" }));
    setDraft((d) => ({ ...d, [key]: "" }));
  };


  const isDirty = useMemo(
    () => (Object.keys(draft) as (keyof GuideFilters)[]).some((k) => draft[k] !== filters[k]),
    [draft, filters],
  );
  const [confirmDiscardFilters, setConfirmDiscardFilters] = useState(false);
  const discardFilterEdits = () => {
    setConfirmDiscardFilters(false);
    setDraft(filters);
    setFiltersOpen(false);
  };
  const requestClose = () => {
    if (isDirty) {
      setConfirmDiscardFilters(true);
      return;
    }
    setDraft(filters);
    setFiltersOpen(false);
  };
  const cancelEdits = () => {
    setDraft(filters);
    setFiltersOpen(false);
  };

  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (filtersOpen) {
      const t = setTimeout(() => firstFieldRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [filtersOpen]);


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
  const monthMarks = useMemo(() => monthBoundaries(dailyData), [dailyData]);

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
      await generateReportPdf(periodLabel, metrics);
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
    const prevDate = formatIsoToBr(dailyData[dailyData.length - 2].date);
    const diff = last - prev;
    if (diff === 0) {
      return { direction: "flat", label: `Mesma quantidade do dia ${prevDate}` };
    }
    return {
      direction: diff > 0 ? "up" : "down",
      label: `${Math.abs(diff)} ${Math.abs(diff) === 1 ? "guia" : "guias"} ${diff > 0 ? "a mais" : "a menos"} que no dia ${prevDate}`,
    };
  }, [dailyData]);

  /** Reference date of the "today" KPI, shown discreetly in the card. */
  const todayLabel = formatIsoToBr(todayLocalIsoDate());


  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <AppSidebar activeKey="dashboard" />
      <main className="flex-1 flex flex-col min-h-screen">
        <div className="w-full flex-1 space-y-6 px-6 py-8 pb-16 pt-20 md:pt-8 lg:px-10">
          <AppBreadcrumb />

          {/* Header */}
          <PageHeader
            title="Visão geral"
            description="Acompanhe suas guias, documentos e atividades recentes."
            actions={
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => (filtersOpen ? requestClose() : openFilters())}
                  aria-expanded={filtersOpen}
                  aria-controls="dashboard-filters-panel"
                  className="relative"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtros
                  {activeFilters.length > 0 && (
                    <Badge variant="secondary" size="sm">
                      {activeFilters.length}
                    </Badge>
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={handleGenerateReport}
                  disabled={!hasData || generatingReport}
                  aria-busy={generatingReport}
                  title={!hasData ? "Sem dados para gerar o relatório" : undefined}
                >
                  {generatingReport ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Download className="h-4 w-4" aria-hidden="true" />
                  )}
                  {generatingReport ? "Gerando…" : "Gerar relatório"}
                </Button>
              </>
            }
          />


          {/* Período aplicado — sempre visível, sem abrir os filtros */}
          <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
            <CalendarRange className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Indicadores e gráficos do período:{" "}
              <span className="font-medium text-foreground">{periodLabel}</span>
            </span>
          </p>

          {/* Chips de filtros ativos */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {activeFilters.map(([k, v]) => (
                <Chip key={k} asSpan variant="outline">
                  <span className="text-muted-foreground">{filterLabels[k]}:</span>
                  <span className="font-medium">{formatFilterValue(k, v)}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFilter(k)}
                    className="ml-1 h-4 w-4 rounded-full p-0.5 hover:bg-muted [&_svg]:size-3"
                    aria-label={`Remover filtro ${filterLabels[k]}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Chip>
              ))}
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={clearAllFilters}
                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              >
                Limpar todos
              </Button>
            </div>
          )}

          {/* Painel de filtros padronizado (FilterCard) */}
          {filtersOpen && (
            <FilterCard
              id="dashboard-filters-panel"
              variant="panel"
              hideToggle
              open={filtersOpen}
              onOpenChange={(v: boolean) => (v ? openFilters() : requestClose())}
              title="Filtros"
              description={
                <>
                  Selecione os critérios para atualizar os indicadores e gráficos da página.
                  {isDirty && (
                    <span className="ml-2 text-warning-strong">• alterações não aplicadas</span>
                  )}
                </>
              }
              activeCount={activeFilters.length}
              onClear={clearAllFilters}
              clearDisabled={activeFilters.length === 0}
              footerActions={
                <>
                  <Button type="button" variant="outline" size="sm" onClick={cancelEdits}>
                    {isDirty ? "Cancelar" : "Fechar"}
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={applyFilters}
                    disabled={hasErrors}
                    title={hasErrors ? "Corrija os campos destacados para aplicar" : undefined}
                  >
                    Aplicar filtros{previewCount !== null && ` (${previewCount} ${previewCount === 1 ? "guia" : "guias"})`}
                  </Button>
                </>
              }
            >
              <div>
                <div className={filterGroupLabelClass}>Períodos rápidos</div>
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

              <div>
                <div className={filterGroupLabelClass}>Período (data de autorização da guia)</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <FilterField label="Data inicial" type="date" error={dateRangeInvalid} value={draft.dataAutorizacaoDe} onChange={(v) => setDraft((d) => ({ ...d, dataAutorizacaoDe: v }))} inputRef={firstFieldRef} />
                  <FilterField label="Data final" type="date" error={dateRangeInvalid} value={draft.dataAutorizacaoAte} onChange={(v) => setDraft((d) => ({ ...d, dataAutorizacaoAte: v }))} />
                </div>
                {dateRangeInvalid && (
                  <p className="mt-1.5 text-xs text-destructive">A data inicial deve ser anterior ou igual à data final.</p>
                )}
              </div>

              <div>
                <div className={filterGroupLabelClass}>Comparação</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FilterSelect label="Tipo de guia" value={draft.tipoGuia} onChange={(v) => setDraft((d) => ({ ...d, tipoGuia: v }))} options={GUIDE_TYPES.map((t) => t.name)} />
                  <FilterSelect label="Prestador solicitante" value={draft.prestadorSolicitante} onChange={(v) => setDraft((d) => ({ ...d, prestadorSolicitante: v }))} options={prestadoresList} />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Para localizar uma guia específica por paciente, número ou procedimento, use a página Guias processadas.
                </p>
              </div>


            </FilterCard>
          )}


          {/* KPIs */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <Kpi icon={FileText} label="Total de guias extraídas" value={String(total)} hint="guias no período selecionado" tone="primary" />
            <Kpi icon={Activity} label="Guias extraídas hoje" value={String(metrics.today)} meta={todayLabel} hint={todayTrend ? todayTrend.label : "guias extraídas nesta data"} tone="success" trend={todayTrend?.direction} />
            <Kpi icon={TrendingUp} label="Média de guias por dia" value={String(dailyAvg)} hint="guias por dia no período selecionado" tone="info" />
            <Kpi icon={Layers} label="Tipos de guia" value={String(metrics.distinctTypes)} hint="tipos diferentes no período selecionado" tone="purple" />

          </div>

          {/* Charts row */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
            <SurfaceCard
              className="lg:col-span-2"
              title="Guias extraídas por dia"
              description={`Quantidade de guias por dia — ${periodLabel}`}
              actions={
                <div className="flex items-center gap-3 text-xs">
                  <LegendDot color="var(--primary)" label="Guias extraídas" />
                </div>
              }
            >
              {!hasData ? (
                emptyState
              ) : (
              <div className="h-72" data-chart="daily">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 6, bottom: 18 }}>
                    <defs>
                      <linearGradient id="gradPrimary" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickMargin={6}
                      interval="preserveStartEnd" minTickGap={18} tickFormatter={formatDailyTick}
                      label={{ value: "Data", position: "insideBottom", offset: -8, fill: "var(--muted-foreground)", fontSize: 11 }} />

                    <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={44} allowDecimals={false}
                      label={{ value: "Quantidade de guias", angle: -90, position: "insideLeft", fill: "var(--muted-foreground)", fontSize: 11, style: { textAnchor: "middle" } }} />

                    <RTooltip
                      content={<ChartTooltip />}
                      cursor={{ stroke: "var(--primary)", strokeOpacity: 0.25, strokeWidth: 1 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="guias"
                      name="Guias extraídas"
                      stroke="var(--primary)"
                      strokeWidth={2.5}
                      fill="url(#gradPrimary)"
                      dot={{ r: 0 }}
                      activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }}
                      isAnimationActive={false}
                    />
                    {/* Separadores discretos de virada de mês */}
                    {monthMarks.map((m) => (
                      <ReferenceLine
                        key={m.date}
                        x={m.date}
                        stroke="var(--border)"
                        strokeDasharray="4 4"
                        label={{
                          value: m.label,
                          position: "insideTopRight",
                          fill: "var(--muted-foreground)",
                          fontSize: 10,
                        }}
                      />
                    ))}



                  </AreaChart>
                </ResponsiveContainer>
              </div>
              )}
            </SurfaceCard>

            <SurfaceCard
              title="Guias por tipo"
              description={`Distribuição por tipo de guia — ${periodLabel}`}
            >

              {!hasData ? (
                emptyState
              ) : (
              <div className="space-y-4">
                <div className="relative h-44" data-chart="types">
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
                      <RTooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                    <div className="metric-value text-foreground">
                      {activeType !== undefined ? typeData[activeType].value : total}
                    </div>
                    <div className="max-w-[96px] text-[10px] leading-tight text-muted-foreground">
                      {activeType !== undefined
                        ? `guias de ${typeData[activeType].name}`
                        : "guias no período"}
                    </div>
                  </div>

                </div>
                <p className="text-xs text-muted-foreground">
                  Tipo de guia · quantidade de guias · % do total do período
                </p>
                <ul className="space-y-2 text-sm">
                  {typeData.map((d, i) => {
                    const pct = total > 0 ? (d.value / total) * 100 : 0;
                    const isActive = activeType === i;
                    return (
                      <li
                        key={d.name}
                        onMouseEnter={() => setActiveType(i)}
                        onMouseLeave={() => setActiveType(undefined)}
                        className={[
                          "min-w-0 rounded-md px-2 py-1 cursor-default transition-colors",
                          isActive ? "bg-muted/60" : "",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                          <span className="flex-1 truncate">{d.name}</span>
                          <span className="text-muted-foreground tabular-nums text-xs">
                            {d.value} · {Math.round(pct)}%
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: d.color }}
                          />
                        </div>
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
            description={`Procedimentos mais frequentes nas guias — ${periodLabel}`}

          >
            {procedures.length === 0 ? (
              emptyState
            ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="h-64" data-chart="procedures">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={procedures.map((p) => ({ name: p.name, count: p.count }))}
                    layout="vertical"
                    margin={{ top: 4, right: 28, left: 8, bottom: 16 }}
                    barCategoryGap={10}
                  >
                    <defs>
                      <linearGradient id="gradBar" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="var(--purple)" />
                        <stop offset="100%" stopColor="var(--primary)" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis
                      type="number"
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      label={{ value: "Quantidade de guias", position: "insideBottom", offset: -12, fill: "var(--muted-foreground)", fontSize: 11 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      width={158}
                      tickLine={false}
                      axisLine={false}
                      label={{ value: "Procedimento", angle: -90, position: "insideLeft", fill: "var(--muted-foreground)", fontSize: 11, style: { textAnchor: "middle" } }}
                    />

                    <RTooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                    <Bar dataKey="count" fill="url(#gradBar)" radius={[0, 6, 6, 0]} maxBarSize={22} isAnimationActive={false}>
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
            )}
          </SurfaceCard>

        </div>
        <SiteFooter />
      </main>

      <ConfirmDialog
        open={confirmDiscardFilters}
        onOpenChange={setConfirmDiscardFilters}
        title="Descartar alterações?"
        description="Você tem filtros alterados que ainda não foram aplicados. Se sair agora, eles serão perdidos."
        cancelLabel="Continuar editando"
        confirmLabel="Descartar alterações"
        onConfirm={discardFilterEdits}
      />


    </div>
  );
}







function LegendDot({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center icon-optical gap-1.5 text-muted-foreground">
      {dashed ? (
        <span
          className="inline-block h-0 w-4 border-t-2"
          style={{ borderColor: color, borderStyle: "dashed" }}
        />
      ) : (
        <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
      )}
      {label}
    </span>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  meta,
  tone,
  trend,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  /** Discreet reference detail (e.g. the exact date the value refers to). */
  meta?: string;
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
      className="group relative overflow-hidden hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <span className="metric-label">{label}</span>
        <span className={`grid place-items-center h-8 w-8 rounded-lg ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      {meta && <div className="mt-0.5 text-xs text-muted-foreground">{meta}</div>}
      <div className="mt-3 metric-value text-foreground">{value}</div>
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
        {hint}
      </div>
    </SurfaceCard>
  );
}
