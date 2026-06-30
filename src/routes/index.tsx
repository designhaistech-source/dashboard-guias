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
import { toast } from "sonner";

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

function generateReportPdf(range: Range, dailyAvg: number, total: number) {
  try {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const rangeLabel = range === "7d" ? "Últimos 7 dias" : range === "30d" ? "Últimos 30 dias" : "Últimos 90 dias";
    const now = new Date();
    const dateStr = now.toLocaleString("pt-BR");

    // Header
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 70, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("HaisGuias — Relatório do Dashboard", 40, 35);
    doc.setFontSize(10);
    doc.text(`Período: ${rangeLabel}  •  Gerado em: ${dateStr}`, 40, 55);

    doc.setTextColor(20, 20, 20);
    let y = 100;

    // KPIs
    doc.setFontSize(13);
    doc.text("Indicadores", 40, y);
    y += 10;
    autoTable(doc, {
      startY: y,
      head: [["Indicador", "Valor"]],
      body: [
        ["Total extraídas", String(total)],
        ["Extraídas hoje", "14"],
        ["Média por dia", String(dailyAvg)],
        ["Tipos diferentes", String(typeData.length)],
      ],
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 10 },
    });

    // Tipos de guia
    y = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(13);
    doc.text("Distribuição por tipo de guia", 40, y);
    autoTable(doc, {
      startY: y + 5,
      head: [["Tipo", "Quantidade", "Participação"]],
      body: typeData.map((t) => [
        t.name,
        String(t.value),
        `${Math.round((t.value / total) * 100)}%`,
      ]),
      theme: "striped",
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 10 },
    });

    // Procedimentos
    y = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(13);
    doc.text("Procedimentos mais realizados", 40, y);
    autoTable(doc, {
      startY: y + 5,
      head: [["Código TUSS", "Procedimento", "Qtd.", "Tendência"]],
      body: procedures.map((p) => [
        p.code,
        p.name,
        String(p.count),
        `${p.trend >= 0 ? "+" : ""}${p.trend}%`,
      ]),
      theme: "striped",
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 10 },
    });

    // Guias por dia
    y = (doc as any).lastAutoTable.finalY + 20;
    if (y > 700) {
      doc.addPage();
      y = 60;
    }
    doc.setFontSize(13);
    doc.text("Guias extraídas por dia", 40, y);
    const chunkSize = 10;
    const rows: string[][] = [];
    for (let i = 0; i < dailyData30.length; i += chunkSize) {
      const slice = dailyData30.slice(i, i + chunkSize);
      rows.push([
        `Dias ${slice[0].day}–${slice[slice.length - 1].day}`,
        slice.map((d) => `${d.day}: ${d.guias}`).join("   "),
      ]);
    }
    autoTable(doc, {
      startY: y + 5,
      head: [["Intervalo", "Guias por dia"]],
      body: rows,
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 110 } },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(
        `HaisGuias  •  Página ${i} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 20,
        { align: "center" },
      );
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
      <main className="flex-1 px-8 py-8">
        <div className="mx-auto max-w-[1400px] space-y-6">
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
              <div className="h-72">
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
                      dataKey="meta"
                      name="Meta"
                      stroke="oklch(0.6 0 0)"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      fill="transparent"
                      dot={false}
                      activeDot={false}
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
                <div className="relative h-44">
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
              <div className="h-64">
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
                    <Bar dataKey="count" fill="url(#gradBar)" radius={[0, 6, 6, 0]} maxBarSize={22}>
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
