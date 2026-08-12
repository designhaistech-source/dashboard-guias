export interface TussItem {
  codigo: string;
  descricao: string;
  /** Campo TISS 24/39 — tabela de referência do procedimento (domínio nº 87). */
  tabela?: string;
}

/** Tabela 22 — Procedimentos e eventos em saúde (TUSS). */
export const TISS_TABLE_TUSS = "22";
/** Tabela 00 — tabela própria das operadoras. */
export const TISS_TABLE_OPERADORA = "00";
/** Tabela 18 — Diárias, taxas e gases medicinais. */
export const TISS_TABLE_DIARIAS = "18";
/** Tabela 19 — Materiais e OPME. */
export const TISS_TABLE_OPME = "19";
/** Tabela 20 — Medicamentos. */
export const TISS_TABLE_MEDICAMENTOS = "20";

/**
 * Tabelas de domínio da ANS (domínio nº 87) usadas nos campos 24 e 39 da guia.
 * Serve como referência canônica dos códigos aceitos.
 */
export const TISS_DOMAIN_87: Readonly<Record<string, string>> = {
  "00": "Tabela própria das operadoras",
  "18": "Diárias, taxas e gases medicinais",
  "19": "Materiais e Órteses, Próteses e Materiais Especiais (OPME)",
  "20": "Medicamentos",
  "22": "Procedimentos e eventos em saúde",
  "98": "Tabela Própria de Pacotes",
};

/**
 * Resolve os campos 24/39 - Tabela a partir do procedimento escolhido.
 * O usuário nunca informa esse valor: ele é derivado do código selecionado.
 * Quando o código não existe na base de procedimentos, retorna vazio — a
 * tabela nunca é inferida ou inventada.
 */
export function resolveTissTable(codigo: string): string {
  const code = codigo.trim();
  if (!code) return "";
  const item = TUSS.find((t) => t.codigo === code);
  if (!item) return "";
  return item.tabela ?? TISS_TABLE_TUSS;
}


/** Amostra da tabela TUSS usada para autocomplete (dados mockados). */
export const TUSS: TussItem[] = [
  { codigo: "10101012", descricao: "Consulta em consultório (horário normal)" },
  { codigo: "10101039", descricao: "Consulta em pronto-socorro" },
  { codigo: "20103301", descricao: "Eletrocardiograma convencional (ECG)" },
  { codigo: "20104014", descricao: "Teste ergométrico computadorizado" },
  { codigo: "20104090", descricao: "Holter 24 horas - 3 canais" },
  { codigo: "40101010", descricao: "Hemograma completo" },
  { codigo: "40301150", descricao: "Glicose - dosagem" },
  { codigo: "40302040", descricao: "Colesterol total - dosagem" },
  { codigo: "40302113", descricao: "Creatinina - dosagem" },
  { codigo: "40316050", descricao: "TSH - hormônio tireoestimulante" },
  { codigo: "40311350", descricao: "Hemoglobina glicada (HbA1c)" },
  { codigo: "40311470", descricao: "Urina rotina (EAS)" },
  { codigo: "40901491", descricao: "Ultrassonografia abdome total" },
  { codigo: "40901025", descricao: "Ultrassonografia de tireoide" },
  { codigo: "40901165", descricao: "Ecocardiograma transtorácico" },
  { codigo: "41001010", descricao: "Radiografia de tórax - PA e perfil" },
  { codigo: "41101025", descricao: "Mamografia bilateral" },
  { codigo: "41301021", descricao: "Tomografia computadorizada de crânio" },
  { codigo: "41301137", descricao: "Tomografia computadorizada de tórax" },
  { codigo: "41401010", descricao: "Ressonância magnética de crânio" },
  { codigo: "41401125", descricao: "Ressonância magnética de coluna lombar" },
  { codigo: "41401192", descricao: "Ressonância magnética de joelho" },
  { codigo: "30101018", descricao: "Endoscopia digestiva alta" },
  { codigo: "30102014", descricao: "Colonoscopia" },
  { codigo: "30715016", descricao: "Artroscopia de joelho" },
  { codigo: "31003010", descricao: "Colecistectomia videolaparoscópica" },
  { codigo: "31005099", descricao: "Herniorrafia inguinal unilateral" },
  { codigo: "50000110", descricao: "Sessão de fisioterapia motora" },
  { codigo: "50000462", descricao: "Sessão de fonoaudiologia" },
  { codigo: "60000105", descricao: "Diária de internação em apartamento", tabela: TISS_TABLE_DIARIAS },
];

export const TUSS_OPTIONS = TUSS.map((t) => ({
  value: t.codigo,
  label: t.descricao,
  description: `TUSS ${t.codigo}`,
  // A busca considera apenas a descrição (não o código TUSS).
  searchText: t.descricao,
}));
