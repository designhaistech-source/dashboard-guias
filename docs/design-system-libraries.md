# Base tecnológica do Design System HaisTech

Auditoria do projeto atual (HaisGuias) e definição da base de implementação
para os próximos produtos. Nenhuma tela foi alterada visualmente: o documento
registra o que já está padronizado e o que permanece intencionalmente fora das
três bibliotecas de referência.

Bibliotecas de referência:

- **Radix UI** — comportamento e acessibilidade dos componentes de interface
- **Lucide** (`lucide-react`) — biblioteca única de ícones
- **Recharts** — gráficos e visualizações de dados

## 1. Radix UI

### Já implementados sobre Radix (referência oficial)

`accordion`, `alert-dialog`, `aspect-ratio`, `avatar`, `breadcrumb`, `button`
(via `Slot`), `checkbox`, `collapsible`, `context-menu`, `dialog`,
`dropdown-menu`, `form` (via `Label`/`Slot`), `hover-card`, `label`, `menubar`,
`navigation-menu`, `popover`, `progress`, `radio-group`, `scroll-area`,
`select`, `separator`, `sheet`, `sidebar`, `slider`, `switch`, `tabs`, `toggle`,
`toggle-group`, `tooltip`.

Todas as composições compartilhadas (`AppModal`, `ConfirmDialog`, `SectionCard`,
`FilterCard`, `InfoHint`, `app-tabs`) são montadas sobre esses primitivos — logo,
já herdam foco, `aria-*` e navegação por teclado do Radix.

### Sem equivalente no Radix (mantidos por decisão)

| Componente | Implementação | Por que permanece |
| --- | --- | --- |
| `input`, `textarea` | elementos nativos estilizados | Radix não oferece primitivo de campo de texto |
| `card`, `badge`, `chip`, `alert`, `skeleton`, `table`, `pagination` | markup + CVA | são padrões de estilo, sem comportamento a delegar |
| `combobox`, `MultiSelect`, `command` | `cmdk` + `Popover` do Radix | o Radix não tem combobox/autocomplete; a sobreposição já é Radix |
| `calendar` | `react-day-picker` | calendário acessível fora do escopo do Radix |
| `drawer` | `vaul` (construído sobre Radix Dialog) | gesto de arraste em mobile |
| `sonner` (`Toaster`) | `sonner` | fila de toasts; o `@radix-ui/react-toast` foi descontinuado |
| `carousel` | `embla-carousel-react` | sem primitivo Radix equivalente |
| `resizable` | `react-resizable-panels` | idem |

Regra: novos componentes com comportamento interativo (sobreposição, foco preso,
seleção, navegação por teclado) devem usar Radix. Componentes puramente visuais
não precisam de dependência.

## 2. Ícones — Lucide

Todos os ícones do produto vêm de `lucide-react` (65 arquivos). Não há
`react-icons`, Heroicons, Tabler nem SVG inline decorativo no código de UI.

Regras já valendo (verificadas por `bun run lint:ds` e pelos testes de tokens):

- 16px como padrão, 14px em controles `sm`, 12px em badges
- `aria-hidden` em ícone decorativo; rótulo textual ou `aria-label` quando informativo
- `icon-optical` sempre que o ícone estiver ao lado de texto
- Marca, logotipos e os fac-símiles impressos TISS continuam como imagem/SVG próprio — não são ícones de interface

## 3. Gráficos — Recharts

- Wrapper oficial: `src/components/ui/chart.tsx` (`ChartContainer`,
  `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`,
  `ChartStyle`) — resolve cores por token e tema claro/escuro.
- Uso atual: o painel "Visão geral" (`src/routes/index.tsx`) importa Recharts
  diretamente (`AreaChart`, `BarChart`, `PieChart`, `Pie`, `Cell`, `Sector`,
  `LabelList`, `ResponsiveContainer`, `Tooltip`) com tooltips próprios.

Inconsistência registrada, sem correção automática: existem dois caminhos para
gráficos (wrapper x Recharts direto). Migrar o painel para o wrapper altera a
aparência dos tooltips e das legendas atuais, o que está fora do escopo
"não alterar visualmente". Decisão: **o wrapper é a referência para novos
gráficos e novos produtos**; o painel do HaisGuias permanece como está até uma
aprovação explícita de mudança visual.

Exceção consciente: o card "Procedimentos solicitados por prestador" é um mapa
de calor em grade — o Recharts não tem esse tipo de gráfico, então segue como
composição de células com tokens semânticos.

## 4. Compartilhável x específico do HaisGuias

### Compartilhável entre produtos HaisTech

Sem regra de negócio; importável por `@/design-system`.

- **Fundamentos:** `src/styles.css` (tokens claro/escuro e utilities),
  `src/design-system/tokens.ts`, `src/lib/theme.ts`, `src/lib/utils.ts`
- **Primitivos:** todo `src/components/ui/**`, incluindo o wrapper de gráficos
- **Composições:** `PageHeader`, `SurfaceCard`, `SectionCard`, `FilterCard`,
  `DataTable*`, `form-field`, `form-action-bar`, `app-modal`, `confirm-dialog`,
  `data-state`, `info-hint`, `status-pill`, `saved-indicator`, `app-tabs`,
  `search-page-layout`, `app-breadcrumb`, `camera-capture-dialog`
- **Guarda-corpos:** `scripts/visual/design-system-rules.mjs`,
  `scripts/visual/check-design-tokens.mjs`, `eslint.ds.config.js`,
  `src/tests/design-system-tokens.test.ts`, `design-system-controls.test.ts`

### Específico do HaisGuias (não portar)

- Todo `src/features/**` (guias TISS/SUS, prescrição, OPME, documentos,
  beneficiários, dashboard, CID, procedimentos)
- Tokens de domínio: `quality-*` e `guide-type-*`
- Componentes de marca/domínio: `app-sidebar`, `site-footer`,
  `scaled-guide-sheet`, `kits-modal`, `procedure-code-modal`,
  `signature-field`, fac-símiles `*-guide-preview.tsx` e
  `guide-print-primitives.tsx`
- Bibliotecas de saída de documento (`jspdf`, `jspdf-autotable`) e as regras de
  papel A4/A5 por tipo de documento

`app-sidebar` e `site-footer` servem apenas como referência de anatomia:
recriar com a marca do novo produto, reaproveitando os tokens `sidebar-*`.

## 5. Como um novo produto começa

1. Copiar fundamentos e guarda-corpos (seção 4) e ajustar as allowlists.
2. Copiar `src/components/ui/**` e as composições compartilhadas.
3. Importar sempre por `@/design-system` — nunca por caminhos internos.
4. Componentes novos: comportamento interativo em Radix, ícones em Lucide,
   gráficos no wrapper Recharts.
5. Não criar `src/features/**` do novo produto dentro do núcleo compartilhado.

Detalhes de componentes por categoria: `docs/design-system-catalog.md`.
Passo a passo de adoção: `docs/design-system-adoption.md`.
