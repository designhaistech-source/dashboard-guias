export interface ReportTemplate {
  value: string;
  label: string;
  content: string;
}

/** Variáveis dinâmicas suportadas no corpo dos documentos. */
export const DOCUMENT_VARIABLES = ["@paciente", "@data", "@cid", "@diagnostico"] as const;

/** Modelos de relatório (dados fictícios de demonstração). */
export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    value: "avaliacao-clinica",
    label: "Avaliação clínica geral",
    content:
      "<p>Paciente @paciente, avaliado(a) em @data, apresenta quadro compatível com @diagnostico (CID @cid).</p><p>Exame físico sem alterações agudas. Mantida conduta ambulatorial com reavaliação em 30 dias.</p>",
  },
  {
    value: "encaminhamento",
    label: "Encaminhamento para especialista",
    content:
      "<p>Encaminho o(a) paciente @paciente para avaliação especializada em razão de @diagnostico (CID @cid).</p><p>Solicito avaliação e conduta conforme necessidade.</p>",
  },
  {
    value: "acompanhamento",
    label: "Relatório de acompanhamento",
    content:
      "<p>Paciente @paciente segue em acompanhamento regular desde o diagnóstico de @diagnostico (CID @cid).</p><p>Evolução estável, com boa adesão ao tratamento proposto.</p>",
  },
];

export const AFASTAMENTO_OPTIONS = [
  { value: "1", label: "1 dia" },
  { value: "2", label: "2 dias" },
  { value: "3", label: "3 dias" },
  { value: "5", label: "5 dias" },
  { value: "7", label: "7 dias" },
  { value: "15", label: "15 dias" },
  { value: "30", label: "30 dias" },
];

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseIso(iso: string): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** 25/06/2026 */
export function formatDateShort(iso: string): string {
  const date = parseIso(iso);
  return date ? date.toLocaleDateString("pt-BR") : "—";
}

/** 25 de junho de 2026 */
export function formatDateLong(iso: string): string {
  const date = parseIso(iso);
  if (!date) return "—";
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface AtestadoInput {
  paciente: string;
  dias: string;
  data: string;
  cidade: string;
  cid: string;
}

/** Texto padrão do atestado, montado a partir dos campos do formulário. */
export function buildAtestado({ paciente, dias, data, cidade, cid }: AtestadoInput): string {
  const nome = paciente.trim() || "____________________";
  const plural = Number(dias) > 1 ? "dias" : "dia";
  const local = cidade.trim() ? `${cidade.trim()}, ` : "";
  const cidTexto = cid.trim() ? ` CID: ${cid.trim()}.` : "";

  return [
    `<p>Atesto para os devidos fins que o(a) Sr.(a) ${nome}, esteve sob cuidados médicos e necessita de afastamento de suas atividades pelo período de ${dias} ${plural}, a partir de ${formatDateShort(data)}.${cidTexto}</p>`,
    `<p>${local}${formatDateLong(data)}.</p>`,
  ].join("");
}

interface ComparecimentoInput {
  paciente: string;
  local: string;
  cidade: string;
  data: string;
  entrada: string;
  saida: string;
}

/** Texto padrão da declaração de comparecimento. */
export function buildComparecimento({
  paciente,
  local,
  cidade,
  data,
  entrada,
  saida,
}: ComparecimentoInput): string {
  const nome = paciente.trim() || "____________________";
  const estabelecimento = local.trim() || "este estabelecimento";
  const periodo = entrada && saida ? `das ${entrada} às ${saida}` : "no horário do atendimento";
  const cidadeTexto = cidade.trim() ? `${cidade.trim()}, ` : "";

  return [
    `<p>Declaro, para os devidos fins, que o(a) Sr.(a) ${nome} compareceu a(o) ${estabelecimento} no dia ${formatDateShort(data)}.</p>`,
    `<p>O interessado esteve presente ${periodo}.</p>`,
    `<p>Por ser verdade, firmo a presente declaração.</p>`,
    `<p>${cidadeTexto}${formatDateLong(data)}.</p>`,
  ].join("");
}

/** Abre a janela de impressão com o documento formatado. */
export function printHtml(title: string, paciente: string, bodyHtml: string) {
  if (typeof window === "undefined") return;

  const frame = document.createElement("iframe");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  if (!doc) return;

  doc.open();
  doc.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" />
<title>${title}</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 48px; line-height: 1.6; }
  h1 { font-size: 18px; text-transform: uppercase; letter-spacing: .06em; text-align: center; }
  .paciente { font-size: 13px; margin-bottom: 24px; text-align: center; color: #444; }
  .assinatura { margin-top: 72px; text-align: center; font-size: 13px; }
  .assinatura span { display: block; border-top: 1px solid #111; padding-top: 6px; width: 260px; margin: 0 auto; }
</style></head><body>
<h1>${title}</h1>
<p class="paciente">Paciente: ${paciente || "—"}</p>
${bodyHtml}
<div class="assinatura"><span>Dr. Fulano de Tal — CRM 47231/RN</span></div>
</body></html>`);
  doc.close();

  frame.contentWindow?.focus();
  frame.contentWindow?.print();
  window.setTimeout(() => frame.remove(), 1000);
}
