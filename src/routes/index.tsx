import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
  LineChart,
  Line,
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
} from "recharts";
import { AppSidebar } from "@/components/app-sidebar";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "HaisGuias — Dashboard" },
      { name: "description", content: "Visão geral das guias médicas processadas." },
    ],
  }),
  component: DashboardPage,
});

type Range = "7d" | "30d" | "90d";

const dailyData30: { day: string; guias: number }[] = [
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
];

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
];

function DashboardPage() {
  const [range, setRange] = useState<Range>("30d");

  const total = useMemo(() => typeData.reduce((s, t) => s + t.value, 0), []);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <AppSidebar activeKey="dashboard" />
      <main className="flex-1 px-8 py-8">
        <div className="mx-auto max-w-[1400px] space-y-6">
          {/* Header */}
          <div className="rounded-2xl border border-border bg-card p-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="grid place-items-center h-12 w-12 rounded-xl bg-primary/10 text-primary">
                <LayoutGrid className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Início</h1>
                <p className="text-sm text-muted-foreground">
                  Visão geral das guias extraídas
                </p>
              </div>
            </div>
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
                onClick={() => toast.success("Relatório gerado com sucesso!")}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Download className="h-4 w-4" />
                Gerar relatório
              </button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi
              icon={FileText}
              label="Total extraídas"
              value="252"
              hint="no período"
              tone="primary"
            />
            <Kpi
              icon={Activity}
              label="Extraídas hoje"
              value="14"
              hint="+4 vs. ontem"
              tone="success"
              trend="up"
            />
            <Kpi
              icon={TrendingUp}
              label="Média por dia"
              value="8"
              hint="guias/dia no período"
              tone="info"
            />
            <Kpi
              icon={Layers}
              label="Tipos diferentes"
              value="5"
              hint="categorias de guia"
              tone="purple"
            />
          </div>

          {/* Charts row */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
              <div className="mb-4">
                <h3 className="font-semibold">Guias extraídas por dia</h3>
                <p className="text-xs text-muted-foreground">
                  Últimos {range === "7d" ? 7 : range === "30d" ? 30 : 90} dias
                </p>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData30} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradPrimary" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.55 0.19 255)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="oklch(0.55 0.19 255)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" vertical={false} />
                    <XAxis dataKey="day" stroke="oklch(0.6 0 0)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="oklch(0.6 0 0)" fontSize={11} tickLine={false} axisLine={false} />
                    <RTooltip
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="guias"
                      stroke="oklch(0.55 0.19 255)"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      fill="url(#gradPrimary)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4">
                <h3 className="font-semibold">Por tipo de guia</h3>
                <p className="text-xs text-muted-foreground">Distribuição no período</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative h-44 w-44 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeData}
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {typeData.map((d, i) => (
                          <Cell key={i} fill={d.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-2xl font-bold">{total}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      guias
                    </div>
                  </div>
                </div>
                <ul className="flex-1 space-y-2 text-sm min-w-0">
                  {typeData.map((d) => (
                    <li key={d.name} className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ background: d.color }}
                      />
                      <span className="flex-1 truncate">{d.name}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {Math.round((d.value / total) * 100)}%
                      </span>
                    </li>
                  ))}
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
                    margin={{ top: 4, right: 16, left: 16, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" horizontal={false} />
                    <XAxis type="number" stroke="oklch(0.6 0 0)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="oklch(0.6 0 0)"
                      fontSize={11}
                      width={140}
                      tickLine={false}
                      axisLine={false}
                    />
                    <RTooltip
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="count" fill="oklch(0.55 0.19 255)" radius={[0, 6, 6, 0]} />
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
                      <th className="px-4 py-2 font-medium text-right">Tend.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {procedures.map((p) => (
                      <tr key={p.code} className="border-t border-border hover:bg-muted/30">
                        <td className="px-4 py-2 text-muted-foreground tabular-nums">{p.code}</td>
                        <td className="px-4 py-2 truncate max-w-[180px]">{p.name}</td>
                        <td className="px-4 py-2 text-right tabular-nums font-medium">{p.count}</td>
                        <td className="px-4 py-2 text-right">
                          <span
                            className={[
                              "inline-flex items-center gap-1 text-xs font-medium",
                              p.trend >= 0 ? "text-success" : "text-destructive",
                            ].join(" ")}
                          >
                            {p.trend >= 0 ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            {Math.abs(p.trend)}%
                          </span>
                        </td>
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

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  tone,
  trend,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  tone: "primary" | "success" | "info" | "purple";
  trend?: "up" | "down";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    info: "bg-info/15 text-info",
    purple: "bg-purple/15 text-purple",
  }[tone];

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
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
