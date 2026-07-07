import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  LayoutGrid,
  FileText,
  TrendingUp,
  Layers,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
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
  LineChart,
  Line,
  LabelList,
  Sector,
} from "recharts";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import logoAsset from "@/assets/haisguias-logo.png.asset.json";
import { toast } from "sonner";

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
      { title: "HaisGuias — Dashboard" },
      { name: "description", content: "Visão geral das guias médicas processadas." },
    ],
  }),
  component: DashboardPage,
});

type Range = "7d" | "30d" | "90d";

const dailyData30: { day: string; guias: number; meta: number }[] = [
  { day: "01", guias: 4 }, { day: "02", guias: 6 }, { day: "03", guias: 3 },
  { day: "04", guias: 8 }, { day: "05", guias: 5 }, { day: "06", guias: 9 },
  { day: "07", guias: 11 }, { day: "08", guias: 7 }, { day: "09", guias: 12 },
  { day: "10", guias: 10 }, { day: "11", guias: 14 }, { day: "12", guias: 8 },
  { day: "13", guias: 6 }, { day: "14", guias: 9 }, { day: "15", guias: 13 },
  { day: "16", guias: 11 }, { day: "17", guias: 15 }, { day: "18", guias: 9 },
  { day: "19", guias: 12 }, { day: "20", guias: 7 }, { day: "21", guias: 10 },
  { day: "22", guias: 14 }, { day: "23", guias: 16 }, { day: "24", guias: 11 },
  { day: "25", guias: 13 }, { day: "26", guias: 9 }, { day: "27", guias: 12 },
  { day: "28", guias: 15 }, { day: "29", guias: 14 }, { day: "30", guias: 18 },
].map((d) => ({ ...d, meta: 10 }));

const typeData = [
  { name: "Consulta", value: 89, color: "oklch(0.55 0.19 255)" },
  { name: "SP/SADT", value: 78, color: "oklch(0.62 0.18 285)" },
  { name: "Internação", value: 41, color: "oklch(0.68 0.16 35)" },
  { name: "Honorários", value: 26, color: "oklch(0.70 0.17 145)" },
  { name: "Odontológica", value: 18, color: "oklch(0.72 0.15 80)" },
];

const procedures = [
  { code: "10101012", name: "Consulta em consultório", count: 64, trend: 12 },
  { code: "40901408", name: "Hemograma completo", count: 47, trend: 8 },
  { code: "40802089", name: "Ultrassonografia abdominal", count: 39, trend: -3 },
  { code: "31602045", name: "Eletrocardiograma", count: 31, trend: 5 },
  { code: "40803115", name: "Ressonância magnética", count: 22, trend: -1 },
  { code: "20203020", name: "Curativo grau II", count: 17, trend: 4 },
].sort((a, b) => b.count - a.count);

// Sparkline data per KPI
const sparkTotal = dailyData30.slice(-10).map((d) => ({ v: d.guias }));
const sparkHoje = [3, 5, 4, 6, 8, 7, 10, 9, 12, 14].map((v) => ({ v }));
const sparkMedia = [6, 7, 7, 8, 8, 9, 8, 9, 8, 8].map((v) => ({ v }));
const sparkTipos = [3, 3, 4, 4, 4, 5, 5, 5, 5, 5].map((v) => ({ v }));

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

async function generateReportPdf(range: Range, dailyAvg: number, total: number) {
  try {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const contentW = pageWidth - margin * 2;
    const rangeLabel = range === "7d" ? "Últimos 7 dias" : range === "30d" ? "Últimos 30 dias" : "Últimos 90 dias";
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

    // HaisGuias logo (top-left)
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
    doc.text("Relatório do Dashboard", titleX, 35);
    applyType(TYPE.subtitle);
    doc.text(`Período: ${rangeLabel}  •  Gerado em: ${dateStr}`, titleX, 52);

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
        ["Total extraídas", String(total)],
        ["Extraídas hoje", "14"],
        ["Média por dia", String(dailyAvg)],
        ["Tipos diferentes", String(typeData.length)],
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
      body: typeData.map((t) => [t.name, String(t.value), `${Math.round((t.value / total) * 100)}%`]),
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
      head: [["Código TUSS", "Procedimento", "Qtd."]],
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
      doc.text("HaisGuias", margin, pageHeight - 18);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - 18, { align: "right" });
    }


    const filename = `relatorio-haisguias-${now.toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
    toast.success("Relatório PDF gerado com sucesso!");
  } catch (err) {
    console.error(err);
    toast.error("Falha ao gerar o relatório PDF.");
  }
}



function ChartTooltip({ active, payload, label, suffix }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover/95 px-3 py-2 shadow-md backdrop-blur">
      {label !== undefined && (
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
          Dia {label}
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

function DashboardPage() {
  const [range, setRange] = useState<Range>("30d");
  const [activeType, setActiveType] = useState<number | undefined>(undefined);

  const total = useMemo(() => typeData.reduce((s, t) => s + t.value, 0), []);
  const dailyAvg = useMemo(
    () => Math.round(dailyData30.reduce((s, d) => s + d.guias, 0) / dailyData30.length),
    [],
  );

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <AppSidebar activeKey="dashboard" />
      <main className="flex-1 flex flex-col min-h-screen">
        <div className="w-full space-y-6 flex-1 px-8 pt-8 pb-16">

          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Dashboard</h1>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border border-border bg-card p-1">
                {(["7d", "30d", "90d"] as Range[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={[
                      "px-3 py-1.5 text-sm rounded-md transition-colors",
                      range === r
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground",
                    ].join(" ")}
                  >
                    {r === "7d" ? "7 dias" : r === "30d" ? "30 dias" : "90 dias"}
                  </button>
                ))}
              </div>
              <button
                onClick={() => generateReportPdf(range, dailyAvg, total)}
                className="inline-flex items-center gap-2 rounded-lg border border-primary bg-card px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
              >
                <Download className="h-4 w-4" />
                Gerar relatório
              </button>
            </div>
          </div>


          {/* KPIs */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi icon={FileText} label="Total extraídas" value="252" hint="no período" tone="primary" spark={sparkTotal} />
            <Kpi icon={Activity} label="Extraídas hoje" value="14" hint="+4 vs. ontem" tone="success" trend="up" spark={sparkHoje} />
            <Kpi icon={TrendingUp} label="Média por dia" value={String(dailyAvg)} hint="guias/dia no período" tone="info" spark={sparkMedia} />
            <Kpi icon={Layers} label="Tipos diferentes" value="5" hint="categorias de guia" tone="purple" spark={sparkTipos} />
          </div>

          {/* Charts row */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">Guias extraídas por dia</h3>
                  <p className="text-xs text-muted-foreground">
                    Últimos {range === "7d" ? 7 : range === "30d" ? 30 : 90} dias
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <LegendDot color="oklch(0.55 0.19 255)" label="Guias" />
                </div>
              </div>
              <div className="h-72" data-chart="daily">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData30} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradPrimary" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.55 0.19 255)" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="oklch(0.55 0.19 255)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickMargin={6} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={32} />
                    <RTooltip
                      content={<ChartTooltip />}
                      cursor={{ stroke: "oklch(0.55 0.19 255)", strokeOpacity: 0.25, strokeWidth: 1 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="guias"
                      name="Guias"
                      stroke="oklch(0.55 0.19 255)"
                      strokeWidth={2.5}
                      fill="url(#gradPrimary)"
                      dot={{ r: 0 }}
                      activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }}
                      isAnimationActive={false}
                    />

                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4">
                <h3 className="font-semibold">Por tipo de guia</h3>
                <p className="text-xs text-muted-foreground">Distribuição no período</p>
              </div>
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
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-2xl font-bold tabular-nums">
                      {activeType !== undefined ? typeData[activeType].value : total}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {activeType !== undefined ? typeData[activeType].name : "guias"}
                    </div>
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  {typeData.map((d, i) => {
                    const pct = (d.value / total) * 100;
                    const isActive = activeType === i;
                    return (
                      <li
                        key={d.name}
                        onMouseEnter={() => setActiveType(i)}
                        onMouseLeave={() => setActiveType(undefined)}
                        className={[
                          "rounded-md px-2 py-1 -mx-2 cursor-default transition-colors",
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
            </div>
          </div>

          {/* Procedures */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Procedimentos mais realizados</h3>
                <p className="text-xs text-muted-foreground">Top códigos TUSS no período</p>
              </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="h-64" data-chart="procedures">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={procedures.map((p) => ({ name: p.name, count: p.count }))}
                    layout="vertical"
                    margin={{ top: 4, right: 28, left: 8, bottom: 0 }}
                    barCategoryGap={10}
                  >
                    <defs>
                      <linearGradient id="gradBar" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="oklch(0.62 0.18 285)" />
                        <stop offset="100%" stopColor="oklch(0.55 0.19 255)" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      width={150}
                      tickLine={false}
                      axisLine={false}
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
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground bg-muted/40">
                      <th className="px-4 py-2 font-medium">Código</th>
                      <th className="px-4 py-2 font-medium">Procedimento</th>
                      <th className="px-4 py-2 font-medium text-right">Qtd.</th>
                      
                    </tr>
                  </thead>
                  <tbody>
                    {procedures.map((p) => (
                      <tr key={p.code} className="border-t border-border hover:bg-muted/30">
                        <td className="px-4 py-2 text-muted-foreground tabular-nums">{p.code}</td>
                        <td className="px-4 py-2 truncate max-w-[180px]">{p.name}</td>
                        <td className="px-4 py-2 text-right tabular-nums font-medium">{p.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <SiteFooter />
      </main>
    </div>
  );
}

function LegendDot({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
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
  tone,
  trend,
  spark,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  tone: "primary" | "success" | "info" | "purple";
  trend?: "up" | "down";
  spark?: { v: number }[];
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    info: "bg-info/15 text-info",
    purple: "bg-purple/15 text-purple",
  }[tone];

  const toneStroke = {
    primary: "oklch(0.55 0.19 255)",
    success: "oklch(0.70 0.17 145)",
    info: "oklch(0.62 0.18 285)",
    purple: "oklch(0.62 0.18 285)",
  }[tone];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={`grid place-items-center h-8 w-8 rounded-lg ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 text-3xl font-bold tabular-nums">{value}</div>
      <div
        className={[
          "mt-1 text-xs flex items-center gap-1",
          trend === "up" ? "text-success" : "text-muted-foreground",
        ].join(" ")}
      >
        {trend === "up" && <ArrowUpRight className="h-3 w-3" />}
        {hint}
      </div>
    </div>
  );
}
