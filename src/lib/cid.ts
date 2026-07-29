export interface CidItem {
  codigo: string;
  descricao: string;
}

/** Amostra de CID-10 usada para autocomplete (dados mockados). */
export const CID10: CidItem[] = [
  { codigo: "I10", descricao: "Hipertensão essencial (primária)" },
  { codigo: "I20.0", descricao: "Angina instável" },
  { codigo: "I21.9", descricao: "Infarto agudo do miocárdio não especificado" },
  { codigo: "I25.1", descricao: "Doença aterosclerótica do coração" },
  { codigo: "I48", descricao: "Fibrilação e flutter atrial" },
  { codigo: "I50.0", descricao: "Insuficiência cardíaca congestiva" },
  { codigo: "E11.9", descricao: "Diabetes mellitus tipo 2 sem complicações" },
  { codigo: "E78.5", descricao: "Hiperlipidemia não especificada" },
  { codigo: "E66.0", descricao: "Obesidade devida a excesso de calorias" },
  { codigo: "J18.9", descricao: "Pneumonia não especificada" },
  { codigo: "J44.9", descricao: "Doença pulmonar obstrutiva crônica" },
  { codigo: "J45.9", descricao: "Asma não especificada" },
  { codigo: "K21.0", descricao: "Doença do refluxo gastroesofágico com esofagite" },
  { codigo: "K29.7", descricao: "Gastrite não especificada" },
  { codigo: "K40.9", descricao: "Hérnia inguinal unilateral sem obstrução" },
  { codigo: "K80.2", descricao: "Calculose da vesícula biliar sem colecistite" },
  { codigo: "M17.1", descricao: "Gonartrose primária" },
  { codigo: "M51.1", descricao: "Transtorno de disco lombar com radiculopatia" },
  { codigo: "M54.5", descricao: "Dor lombar baixa" },
  { codigo: "M75.1", descricao: "Síndrome do manguito rotador" },
  { codigo: "N20.0", descricao: "Calculose do rim" },
  { codigo: "N39.0", descricao: "Infecção do trato urinário de localização não especificada" },
  { codigo: "G40.9", descricao: "Epilepsia não especificada" },
  { codigo: "G43.9", descricao: "Enxaqueca não especificada" },
  { codigo: "F32.1", descricao: "Episódio depressivo moderado" },
  { codigo: "F41.1", descricao: "Ansiedade generalizada" },
  { codigo: "C50.9", descricao: "Neoplasia maligna da mama não especificada" },
  { codigo: "C61", descricao: "Neoplasia maligna da próstata" },
  { codigo: "H25.9", descricao: "Catarata senil não especificada" },
  { codigo: "S82.6", descricao: "Fratura do maléolo lateral" },
  { codigo: "Z01.8", descricao: "Outros exames especiais especificados" },
];

export const CID_OPTIONS = CID10.map((c) => ({
  value: c.codigo,
  label: `${c.codigo} — ${c.descricao}`,
  description: c.descricao,
}));
