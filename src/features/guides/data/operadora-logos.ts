import convenioHumanasAsset from "@/assets/convenio-humanas-real.png.asset.json";
import convenioUnimedAsset from "@/assets/convenio-unimed-real.png.asset.json";
import convenioCaurnAsset from "@/assets/convenio-caurn-real.png.asset.json";

/**
 * Logos das operadoras usadas no cabeçalho da guia impressa (campo "Logo da
 * Operadora"). A chave aceita tanto o código interno quanto o nome exibido.
 */
const OPERADORA_LOGOS: Record<string, string> = {
  humanas: convenioHumanasAsset.url,
  unimed: convenioUnimedAsset.url,
  "unimed natal/rn": convenioUnimedAsset.url,
  caurn: convenioCaurnAsset.url,
};

export function operadoraLogoUrl(operadora?: string): string | undefined {
  if (!operadora) return undefined;
  const key = operadora.trim().toLowerCase();
  return (
    OPERADORA_LOGOS[key] ??
    Object.entries(OPERADORA_LOGOS).find(([name]) => key.includes(name))?.[1]
  );
}
