import { TUSS } from "@/lib/tuss";

export type ProcedureReference = "TUSS" | "SIGTAP";

export interface Procedure {
  codigo: string;
  descricao: string;
  referencia: ProcedureReference;
  grupo: string;
  porte?: string;
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

export function searchProcedures(term: string, referencia: string): Procedure[] {
  const q = normalize(term);
  return PROCEDURES.filter((p) => {
    const matchRef = referencia === "todas" || p.referencia === referencia;
    const matchTerm =
      q.length === 0 ||
      p.codigo.includes(q) ||
      normalize(p.descricao).includes(q) ||
      normalize(p.grupo).includes(q);
    return matchRef && matchTerm;
  });
}
