import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  /** HTML atual do documento. */
  html: z.string().min(1).max(20000),
  /** Tipo do documento (relatório, atestado, declaração). */
  documentType: z.string().min(1).max(120),
});

/** Melhora a redação clínica de um documento mantendo o HTML simples. */
export const improveDocumentText = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      throw new Error("Serviço de IA não configurado.");
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "Você é um assistente de redação clínica em português do Brasil. " +
                "Melhore a clareza, a gramática e o tom formal do documento sem inventar " +
                "informações clínicas, datas, nomes ou códigos. Preserve variáveis entre " +
                "chaves. Responda APENAS com HTML simples usando <p>, <strong>, <em>, " +
                "<u>, <ul>, <ol> e <li>, sem blocos de código nem comentários.",
            },
            {
              role: "user",
              content: `Tipo de documento: ${data.documentType}\n\nHTML atual:\n${data.html}`,
            },
          ],
        }),
      },
    );

    if (response.status === 429) {
      throw new Error("Limite de uso da IA atingido. Tente novamente em instantes.");
    }
    if (response.status === 402) {
      throw new Error("Créditos de IA insuficientes para melhorar o texto.");
    }
    if (!response.ok) {
      throw new Error("Não foi possível melhorar o texto agora.");
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("A IA não retornou um texto válido.");
    }

    return {
      html: content
        .replace(/^```(?:html)?\s*/i, "")
        .replace(/```$/i, "")
        .trim(),
    };
  });
