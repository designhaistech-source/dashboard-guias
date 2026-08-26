/**
 * Synthetic dataset backing the dashboard. Every KPI and chart is derived from
 * these rows so the filter panel produces real, visible changes.
 */

import { localIsoDaysAgo, toLocalIsoDate } from "@/lib/date";

/** Resultado do processamento automático da guia. */
export type ProcessingStatus = "sucesso" | "falha";

/**
 * Tipos de falha mapeados no sistema. "Qualidade da imagem" não é um tipo
 * próprio: é uma possível causa de "Falha na extração".
 */
export const FAILURE_TYPES = [
  "Documento inválido",
  "Falha na extração",
  "Erro de processamento",
  "Erro de entrega",
] as const;

export type FailureType = (typeof FAILURE_TYPES)[number];

export type DashboardGuide = {
  id: string;
  numGuiaPrestador: string;
  /** ISO date (yyyy-mm-dd) of authorization. */
  data: string;
  beneficiarioNome: string;
  tipoGuia: string;
  prestadorSolicitante: string;
  procCodigo: string;
  procDescricao: string;
  valorTotal: number;
  /** Resultado do processamento (qualidade). */
  statusProcessamento: ProcessingStatus;
  /** Preenchido apenas quando `statusProcessamento` é "falha". */
  tipoFalha?: FailureType;
};

export const GUIDE_TYPES = [
  { name: "SP/SADT", color: "var(--guide-type-1)" },
  { name: "Solicitação de Exame", color: "var(--guide-type-2)" },
  { name: "Encaminhamento", color: "var(--guide-type-3)" },
  { name: "Outros", color: "var(--guide-type-4)" },
] as const;

export const PRESTADORES = [
  "Clínica São Lucas",
  "Hospital Santa Marta",
  "Laboratório Diagnóstico+",
  "Centro Médico Vida",
  "Instituto Cardio",
  "UBS Central",
];

const PROCEDURES = [
  { code: "40901408", name: "Hemograma completo", tipo: "SP/SADT", valor: 62 },
  { code: "40802089", name: "Ultrassonografia abdominal", tipo: "SP/SADT", valor: 320 },
  { code: "31602045", name: "Eletrocardiograma", tipo: "SP/SADT", valor: 96 },
  { code: "40803115", name: "Ressonância magnética", tipo: "SP/SADT", valor: 1450 },
  { code: "40304361", name: "Colonoscopia", tipo: "Solicitação de Exame", valor: 980 },
  { code: "40601137", name: "Espirometria", tipo: "Solicitação de Exame", valor: 210 },
  { code: "10101012", name: "Consulta em cardiologia", tipo: "Encaminhamento", valor: 180 },
  { code: "10101039", name: "Consulta em ortopedia", tipo: "Encaminhamento", valor: 180 },
  { code: "20103077", name: "Curativo ambulatorial", tipo: "Outros", valor: 75 },
];



const FIRST_NAMES = [
  "Ana", "Bruno", "Carla", "Diego", "Eduarda", "Felipe", "Gabriela",
  "Heitor", "Isabela", "João", "Karina", "Lucas", "Mariana", "Nelson",
  "Olívia", "Paulo", "Renata", "Sérgio", "Tatiane", "Vinícius",
];
const LAST_NAMES = [
  "Almeida", "Barbosa", "Cardoso", "Duarte", "Esteves", "Ferreira",
  "Gonçalves", "Henriques", "Iglesias", "Junqueira", "Lima", "Moraes",
];

/** Deterministic pseudo-random generator so the dataset is stable per session. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const isoDaysAgo = localIsoDaysAgo;

export const TODAY_ISO = isoDaysAgo(0);

function buildGuides(): DashboardGuide[] {
  const rand = seeded(20260813);
  const rows: DashboardGuide[] = [];
  // Amount of guides per day across the last 30 days (index 0 = 29 days ago).
  const perDay = [
    4, 6, 3, 8, 5, 9, 11, 7, 12, 10, 14, 8, 6, 9, 13,
    11, 15, 9, 12, 7, 10, 14, 16, 11, 13, 9, 12, 15, 14, 18,
  ];

  perDay.forEach((count, dayIdx) => {
    const data = isoDaysAgo(perDay.length - 1 - dayIdx);
    for (let i = 0; i < count; i++) {
      const proc = PROCEDURES[Math.floor(rand() * PROCEDURES.length)];
      const beneficiario = `${FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)]} ${
        LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)]
      }`;
      const variation = 0.75 + rand() * 0.7;
      // ~12% das guias falham; distribuição desigual entre os tipos de falha.
      const failureRoll = rand();
      const failed = failureRoll < 0.12;
      const typeRoll = rand();
      const tipoFalha: FailureType = failed
        ? typeRoll < 0.42
          ? "Falha na extração"
          : typeRoll < 0.7
            ? "Documento inválido"
            : typeRoll < 0.89
              ? "Erro de processamento"
              : "Erro de entrega"
        : "Falha na extração";
      rows.push({
        statusProcessamento: failed ? "falha" : "sucesso",
        ...(failed ? { tipoFalha } : {}),
        id: `${data}-${i}`,
        numGuiaPrestador: String(100000 + rows.length * 7 + Math.floor(rand() * 6)),
        data,
        beneficiarioNome: beneficiario,
        tipoGuia: proc.tipo,
        prestadorSolicitante: PRESTADORES[Math.floor(rand() * PRESTADORES.length)],
        procCodigo: proc.code,
        procDescricao: proc.name,
        valorTotal: Math.round(proc.valor * variation),
      });
    }
  });

  return rows;
}

export const DASHBOARD_GUIDES: DashboardGuide[] = buildGuides();

export type DashboardFilterInput = {
  dataAutorizacaoDe: string;
  dataAutorizacaoAte: string;
  tipoGuia: string;
  prestadorSolicitante: string;
};

export function filterGuides(
  guides: DashboardGuide[],
  f: DashboardFilterInput,
): DashboardGuide[] {
  return guides.filter((g) => {
    if (f.dataAutorizacaoDe && g.data < f.dataAutorizacaoDe) return false;
    if (f.dataAutorizacaoAte && g.data > f.dataAutorizacaoAte) return false;
    if (f.tipoGuia.trim() && g.tipoGuia !== f.tipoGuia) return false;
    if (f.prestadorSolicitante.trim() && g.prestadorSolicitante !== f.prestadorSolicitante)
      return false;
    return true;
  });
}

export type DashboardMetrics = {
  total: number;
  today: number;
  dailyAvg: number;
  distinctTypes: number;
  daily: { day: string; date: string; guias: number }[];
  types: { name: string; value: number; color: string }[];
  procedures: { code: string; name: string; count: number }[];
  totalValue: number;
  /** Qualidade do processamento no período filtrado. */
  quality: {
    success: number;
    failure: number;
    failuresByType: { name: FailureType; count: number }[];
  };
};

/** Inclusive list of local ISO dates between `from` and `to`. */
function isoDateRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${from}T12:00:00`);
  const end = new Date(`${to}T12:00:00`);
  while (cursor.getTime() <= end.getTime()) {
    dates.push(toLocalIsoDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

/**
 * Builds the dashboard metrics. The daily series covers every day of the
 * period, so days without guides are shown explicitly as zero instead of
 * collapsing the X axis and suggesting missing data.
 */
export function buildMetrics(
  guides: DashboardGuide[],
  period?: { from?: string; to?: string },
): DashboardMetrics {
  const byDate = new Map<string, number>();
  for (const g of guides) byDate.set(g.data, (byDate.get(g.data) ?? 0) + 1);

  const observed = [...byDate.keys()].sort((a, b) => a.localeCompare(b));
  const from = period?.from || observed[0];
  const to = period?.to || observed[observed.length - 1];

  const daily = from && to && from <= to
    ? isoDateRange(from, to).map((date) => ({
        day: date.slice(8, 10),
        date,
        guias: byDate.get(date) ?? 0,
      }))
    : [];


  const types = GUIDE_TYPES.map((t) => ({
    name: t.name,
    color: t.color,
    value: guides.filter((g) => g.tipoGuia === t.name).length,
  })).filter((t) => t.value > 0);

  const procMap = new Map<string, { code: string; name: string; count: number }>();
  for (const g of guides) {
    const entry = procMap.get(g.procCodigo) ?? {
      code: g.procCodigo,
      name: g.procDescricao,
      count: 0,
    };
    entry.count += 1;
    procMap.set(g.procCodigo, entry);
  }

  const failed = guides.filter((g) => g.statusProcessamento === "falha");
  const failuresByType = FAILURE_TYPES.map((name) => ({
    name,
    count: failed.filter((g) => g.tipoFalha === name).length,
  }))
    .filter((f) => f.count > 0)
    .sort((a, b) => b.count - a.count);

  return {
    quality: {
      success: guides.length - failed.length,
      failure: failed.length,
      failuresByType,
    },
    total: guides.length,
    today: guides.filter((g) => g.data === TODAY_ISO).length,
    dailyAvg: daily.length ? Math.round(guides.length / daily.length) : 0,
    distinctTypes: types.length,
    daily,
    types,
    procedures: [...procMap.values()].sort((a, b) => b.count - a.count).slice(0, 6),
    totalValue: guides.reduce((s, g) => s + g.valorTotal, 0),
  };
}

export type ProviderProcedureMatrix = {
  /** Procedimentos (linhas), ordenados pela quantidade total desc. */
  rows: { code: string; name: string; total: number }[];
  /** Prestadores solicitantes (colunas) presentes no período filtrado. */
  columns: string[];
  /** Contagem por `${code}|${prestador}`. */
  cells: Record<string, number>;
  /** Maior contagem em uma célula, base para a escala de intensidade. */
  max: number;
};

/**
 * Matriz procedimento x prestador solicitante usada no heatmap da Visão geral.
 * Considera apenas as guias já filtradas, então o filtro de prestador reduz
 * naturalmente as colunas exibidas.
 */
export function buildProviderProcedureMatrix(
  guides: DashboardGuide[],
  limit = 6,
): ProviderProcedureMatrix {
  const totals = new Map<string, { code: string; name: string; total: number }>();
  const cells: Record<string, number> = {};
  const providers = new Set<string>();

  for (const g of guides) {
    const entry = totals.get(g.procCodigo) ?? {
      code: g.procCodigo,
      name: g.procDescricao,
      total: 0,
    };
    entry.total += 1;
    totals.set(g.procCodigo, entry);
    providers.add(g.prestadorSolicitante);
    const key = `${g.procCodigo}|${g.prestadorSolicitante}`;
    cells[key] = (cells[key] ?? 0) + 1;
  }

  const rows = [...totals.values()].sort((a, b) => b.total - a.total).slice(0, limit);
  const columns = PRESTADORES.filter((p) => providers.has(p));
  const max = rows.reduce(
    (acc, row) =>
      columns.reduce((m, col) => Math.max(m, cells[`${row.code}|${col}`] ?? 0), acc),
    0,
  );

  return { rows, columns, cells, max };
}

