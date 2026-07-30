# Perfil de renderização — AppSidebar

Instrumentação: `RenderProfiler` (`src/lib/render-profiler.tsx`) envolve o `AppSidebar`
com o React Profiler. Só é ativa em desenvolvimento (`import.meta.env.DEV`); em produção
renderiza os filhos sem overhead.

## Como reproduzir

1. Abra qualquer página do app em dev e olhe o console: linhas `[perf][AppSidebar] …`
   (`console.warn` quando o render passa de 16 ms).
2. No console, `window.__renderProfile.AppSidebar` traz o agregado
   (mounts, updates, `totalActual`, `maxActual`, últimas 50 amostras).
3. As medições também aparecem na aba Performance como marcas `AppSidebar:mount|update`.

## Medição (Chromium headless, 1280×1800, rota `/procedimentos`, 5 ciclos recolher/expandir)

| Cenário | actual | base | Observação |
| --- | --- | --- | --- |
| Mount inicial | **76,3 ms** | 72,4 ms | maior custo único do componente |
| Hidratação/efeitos seguintes | 21,3 / 6,3 / 0,2 ms | ~57 ms | 4 renders extras após o mount |
| Toggle recolher/expandir | **24–54 ms** (mediana ~29 ms) | 26–47 ms | acima do orçamento de 16 ms/frame |
| Renders por clique no toggle | **3** | — | 1 `update` + 2 `nested-update` |

## Principais gargalos

1. **Toda a árvore re-renderiza no toggle.** `collapsed` mora no `AppSidebar`, então os
   ~10 `SidebarItem` + `SidebarGroup` + `UserMenu` refazem render a cada clique — daí os
   24–54 ms por interação. Os itens não são memoizados e as strings de `className` são
   recalculadas em todos eles.
2. **Cada item carrega um `Tooltip` do Radix.** São ~10 `Tooltip` + `TooltipTrigger`
   (hints) e mais um por ícone no modo recolhido, sob um único `TooltipProvider`. Isso
   explica o mount de 76 ms e os dois `nested-update` que aparecem depois de cada clique
   (o Radix agenda estado próprio em efeito de layout).
3. **`base` ≈ `actual` (26 vs 29 ms).** Praticamente nada é reaproveitado entre renders:
   não há `memo`/`useMemo` na lista de itens, que hoje é JSX literal recriado a cada
   render do componente.
4. **Sidebar remontado por rota.** Cada página renderiza `<AppSidebar />` por conta
   própria (não há layout compartilhado), então o mount de ~76 ms pode voltar a ser pago
   em navegações que troquem a subárvore.

## Próximos passos sugeridos (não aplicados)

- Extrair a lista de itens para uma constante de módulo e memoizar `SidebarItem`.
- Renderizar `Tooltip` só quando houver interação (hover/focus) em vez de sempre.
- Mover o `AppSidebar` para um layout de rota compartilhado, preservando o mount.
