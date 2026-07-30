import { TUSS } from "@/lib/tuss";

export type ProcedureReference = "TUSS" | "SIGTAP";

export interface Procedure {
  codigo: string;
  descricao: string;
  referencia: ProcedureReference;
  grupo: string;
  porte?: string;
}

/** Procedimento com o percentual de aderência ao termo buscado. */
export interface ProcedureMatch extends Procedure {
  similaridade: number;
}


const GRUPOS: Record<string, string> = {
  "1": "Consultas e atendimentos",
  "2": "Procedimentos diagnósticos e terapêuticos",
  "3": "Procedimentos cirúrgicos e invasivos",
  "4": "Exames laboratoriais e de imagem",
  "5": "Terapias e reabilitação",
  "6": "Diárias, taxas e gases medicinais",
};

const REFERENCIAS: ProcedureReference[] = ["TUSS", "SIGTAP"];

const REFERENCE_LABELS: Record<ProcedureReference, string> = {
  TUSS: "Tuss",
  SIGTAP: "Sigtap",
};

/** Base mockada de procedimentos derivada da amostra TUSS. */
export const PROCEDURES: Procedure[] = TUSS.map((item, index) => ({
  codigo: item.codigo,
  descricao: item.descricao,
  referencia: REFERENCIAS[index % REFERENCIAS.length],
  grupo: GRUPOS[item.codigo.charAt(0)] ?? "Outros",
  porte: `${(index % 12) + 1}${["A", "B", "C"][index % 3]}`,
}));

export const REFERENCE_OPTIONS = [
  { value: "todas", label: "Todas" },
  ...REFERENCIAS.map((r) => ({ value: r, label: REFERENCE_LABELS[r] })),
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Similaridade determinística (0-100) entre o termo e o procedimento. */
function similarityScore(term: string, procedure: Procedure): number {
  if (term.length === 0) return 100;
  const descricao = normalize(procedure.descricao);
  if (procedure.codigo.includes(term)) return 100;

  const words = descricao.split(/\s+/);
  const exactWord = words.includes(term);
  const startsWith = descricao.startsWith(term);
  const ratio = term.length / Math.max(descricao.length, 1);

  let score = ratio * 100;
  if (exactWord) score += 25;
  if (startsWith) score += 15;

  return Math.max(1, Math.min(100, Math.round(score * 100) / 100));
}

export function searchProcedures(
  term: string,
  referencia: string,
): ProcedureMatch[] {
  const q = normalize(term);
  return PROCEDURES.filter((p) => {
    const matchRef = referencia === "todas" || p.referencia === referencia;
    const matchTerm =
      q.length === 0 ||
      p.codigo.includes(q) ||
      normalize(p.descricao).includes(q) ||
      normalize(p.grupo).includes(q);
    return matchRef && matchTerm;
  })
    .map((p) => ({ ...p, similaridade: similarityScore(q, p) }))
    .sort((a, b) => b.similaridade - a.similaridade);
}

