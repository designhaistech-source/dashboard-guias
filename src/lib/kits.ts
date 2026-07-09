// Store simples de "Kits salvos" persistido em localStorage.
// Um kit é um conjunto reutilizável de medicamentos + posologias que pode
// ser aplicado na receita atual em um clique.

export type KitMed = {
  nome: string;
  forma: string;
  fabricante: string;
  tipo: string;
  preco: number;
  principios: string;
  classe: string;
  favorito?: boolean;
  alerta?: boolean;
};

export type KitItem = {
  med: KitMed;
  posologia: string;
};

export type Kit = {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  itens: KitItem[];
  atualizadoEm: number;
  usos: number;
  favorito?: boolean;
};

export const LS_KITS = "hg:kits";
export const LS_KIT_APPLY = "hg:kits:aplicar";

const POS_UMA_VEZ = "Tomar 1 comprimido, por via oral, 1 vez ao dia. Uso contínuo.";
const POS_12H = "Tomar 1 comprimido, por via oral, de 12 em 12 horas por 5 dias.";
const POS_8H = "Tomar 1 comprimido, por via oral, de 8 em 8 horas por 7 dias.";
const POS_JEJUM = "Tomar 1 comprimido, por via oral, 1 vez ao dia. Em jejum. Uso contínuo.";

const MEDS: Record<string, KitMed> = {
  benegrip: {
    nome: "BENEGRIP 250mg + 30mg + 250mg + 2mg",
    forma: "comprimidos revestidos",
    fabricante: "COSMED INDUSTRIA DE COSMETICOS E MEDICAMENTOS",
    tipo: "Referência",
    preco: 27.47,
    principios: "MALEATO DE CLORFENIRAMINA + DIPIRONA MONOIDRATADA + CAFEÍNA ANIDRA",
    classe: "ANTIGRIPAIS SEM ANTIINFECCIOSOS",
  },
  novalgina: {
    nome: "NOVALGINA 500mg/ml",
    forma: "Solução oral, 10 ML",
    fabricante: "SANOFI MEDLEY FARMACÊUTICA LTDA",
    tipo: "Referência",
    preco: 14.6,
    principios: "DIPIRONA SÓDICA",
    classe: "ANALGÉSICOS NÃO OPIOIDES",
  },
  dipirona: {
    nome: "DIPIRONA MONOIDRATADA 500mg",
    forma: "comprimidos, 10 un",
    fabricante: "MEDLEY",
    tipo: "Genérico",
    preco: 7.9,
    principios: "DIPIRONA MONOIDRATADA",
    classe: "ANALGÉSICOS NÃO OPIOIDES",
  },
  buscopan: {
    nome: "BUSCOPAN COMPOSTO",
    forma: "Solução para infusão, 5 ML",
    fabricante: "COSMED INDUSTRIA DE COSMETICOS E MEDICAMENTOS",
    tipo: "Referência",
    preco: 35.24,
    principios: "DIPIRONA MONOIDRATADA + BUTILBROMETO DE ESCOPOLAMINA",
    classe: "ASSOCIAÇÕES DE ANTIESPASMÓDICOS COM ANALGÉSICOS",
  },
  losartana: {
    nome: "LOSARTANA POTÁSSICA 50mg",
    forma: "comprimidos revestidos, 30 un",
    fabricante: "EUROFARMA",
    tipo: "Similar",
    preco: 18.9,
    principios: "LOSARTANA POTÁSSICA",
    classe: "ANTAGONISTAS DA ANGIOTENSINA II",
  },
  amoxicilina: {
    nome: "AMOXICILINA 500mg",
    forma: "cápsulas, 21 un",
    fabricante: "PRATI-DONADUZZI",
    tipo: "Similar",
    preco: 22.4,
    principios: "AMOXICILINA",
    classe: "ANTIBIÓTICOS BETA-LACTÂMICOS",
  },
  passiflorine: {
    nome: "PASSIFLORINE",
    forma: "solução oral, 150 ml",
    fabricante: "SANOFI",
    tipo: "Fitoterápico",
    preco: 39.5,
    principios: "PASSIFLORA INCARNATA + CRATAEGUS OXYACANTHA + SALIX ALBA",
    classe: "ANSIOLÍTICOS FITOTERÁPICOS",
  },
  systane: {
    nome: "SYSTANE ULTRA",
    forma: "colírio, 10 ml",
    fabricante: "ALCON",
    tipo: "Oftalmológico",
    preco: 58.9,
    principios: "POLIETILENOGLICOL + PROPILENOGLICOL",
    classe: "LUBRIFICANTES OFTÁLMICOS",
  },
};

const DIA = 24 * 60 * 60 * 1000;

const SEED: Kit[] = [
  {
    id: "gripe-adulto",
    nome: "Gripe adulto",
    descricao: "Sintomático padrão para quadro gripal em adultos.",
    categoria: "Clínica geral",
    usos: 42,
    favorito: true,
    atualizadoEm: Date.now() - 2 * DIA,
    itens: [
      { med: MEDS.benegrip, posologia: "Tomar 1 comprimido, por via oral, de 8 em 8 horas por 5 dias." },
      { med: MEDS.novalgina, posologia: "Tomar 20 gotas, por via oral, de 6 em 6 horas se dor ou febre." },
      { med: MEDS.dipirona, posologia: POS_8H },
    ],
  },
  {
    id: "colica-abdominal",
    nome: "Cólica abdominal",
    descricao: "Antiespasmódico + analgésico para cólica leve/moderada.",
    categoria: "Clínica geral",
    usos: 27,
    atualizadoEm: Date.now() - 6 * DIA,
    itens: [
      { med: MEDS.buscopan, posologia: "Tomar 1 comprimido, por via oral, de 8 em 8 horas por 3 dias." },
      { med: MEDS.dipirona, posologia: POS_8H },
    ],
  },
  {
    id: "hipertensao-manutencao",
    nome: "Hipertensão — manutenção",
    descricao: "Controle contínuo de PA com bloqueador de angiotensina II.",
    categoria: "Cardiologia",
    usos: 61,
    favorito: true,
    atualizadoEm: Date.now() - 14 * DIA,
    itens: [
      { med: MEDS.losartana, posologia: POS_JEJUM },
    ],
  },
  {
    id: "infeccao-respiratoria",
    nome: "Infecção respiratória",
    descricao: "Antibioticoterapia empírica com controle sintomático.",
    categoria: "Clínica geral",
    usos: 18,
    atualizadoEm: Date.now() - 21 * DIA,
    itens: [
      { med: MEDS.amoxicilina, posologia: "Tomar 1 cápsula, por via oral, de 8 em 8 horas por 7 dias." },
      { med: MEDS.dipirona, posologia: POS_12H },
    ],
  },
  {
    id: "pos-operatorio-leve",
    nome: "Pós-operatório leve",
    descricao: "Manejo de dor e ansiedade em pós-operatório ambulatorial.",
    categoria: "Cirurgia",
    usos: 9,
    atualizadoEm: Date.now() - 40 * DIA,
    itens: [
      { med: MEDS.dipirona, posologia: "Tomar 1 comprimido, por via oral, de 6 em 6 horas por 3 dias." },
      { med: MEDS.passiflorine, posologia: "Tomar 5 ml, por via oral, 3 vezes ao dia por 7 dias." },
    ],
  },
  {
    id: "olho-seco",
    nome: "Olho seco",
    descricao: "Lubrificação ocular em ceratoconjuntivite seca.",
    categoria: "Oftalmologia",
    usos: 12,
    atualizadoEm: Date.now() - 55 * DIA,
    itens: [
      { med: MEDS.systane, posologia: "Instilar 1 gota em cada olho, de 4 em 4 horas. Uso contínuo." },
    ],
  },
];

export function loadKits(): Kit[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(LS_KITS);
    if (!raw) {
      window.localStorage.setItem(LS_KITS, JSON.stringify(SEED));
      return SEED;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      window.localStorage.setItem(LS_KITS, JSON.stringify(SEED));
      return SEED;
    }
    return parsed as Kit[];
  } catch {
    return SEED;
  }
}

export function saveKits(kits: Kit[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KITS, JSON.stringify(kits));
}

export function upsertKit(kit: Kit) {
  const kits = loadKits();
  const i = kits.findIndex((k) => k.id === kit.id);
  if (i >= 0) kits[i] = kit;
  else kits.unshift(kit);
  saveKits(kits);
}

export function deleteKit(id: string) {
  saveKits(loadKits().filter((k) => k.id !== id));
}

export function toggleFavorito(id: string) {
  const kits = loadKits().map((k) =>
    k.id === id ? { ...k, favorito: !k.favorito } : k,
  );
  saveKits(kits);
}

export function marcarParaAplicar(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KIT_APPLY, id);
}

export function consumirKitParaAplicar(): Kit | null {
  if (typeof window === "undefined") return null;
  const id = window.localStorage.getItem(LS_KIT_APPLY);
  if (!id) return null;
  window.localStorage.removeItem(LS_KIT_APPLY);
  const kit = loadKits().find((k) => k.id === id);
  if (!kit) return null;
  // registra o uso
  const kits = loadKits().map((k) =>
    k.id === id ? { ...k, usos: (k.usos || 0) + 1, atualizadoEm: Date.now() } : k,
  );
  saveKits(kits);
  return kit;
}

export function formatarRelativo(ts: number): string {
  const diff = Date.now() - ts;
  const dias = Math.floor(diff / DIA);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 7) return `há ${dias} dias`;
  if (dias < 30) return `há ${Math.floor(dias / 7)} sem.`;
  if (dias < 365) return `há ${Math.floor(dias / 30)} meses`;
  return `há ${Math.floor(dias / 365)} anos`;
}
