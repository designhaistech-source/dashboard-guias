# Checklist de tokens do design system

Use este checklist ao criar ou revisar qualquer página. Cada item é verificável no
código e, quando possível, coberto por `bash scripts/visual/validate.sh`.

## 1. Cores

- [ ] Nenhum `#hex`, `bg-white/black` ou cor da paleta Tailwind (`text-slate-500`…).
- [ ] Superfícies: página `bg-background`, cards `bg-card`, blocos secundários `bg-muted/30`.
- [ ] Texto: principal `text-foreground`, apoio `text-muted-foreground`, metadado `text-muted-foreground` em `text-xs`.
- [ ] Bordas sempre `border-border` (ou `border-input` em controles).
- [ ] Feedback só via tokens semânticos (`success`, `warning`, `destructive`, `info`) e sempre acompanhado de texto.
- [ ] Foco visível com `ring-ring` (nunca `outline-none` sem substituto).

## 2. Tipografia

- [ ] H1 da página: `font-display text-2xl font-semibold tracking-tight` (via `PageHeader`).
- [ ] H2 de seção/card: `font-display text-base font-semibold tracking-tight`.
- [ ] Rótulo de campo: `text-xs font-medium` (via `Field`/`SelectField`).
- [ ] Corpo: `text-sm`; metadado/hint: `text-xs text-muted-foreground`.
- [ ] Números, códigos (CID, TUSS, carteira): `font-mono`.
- [ ] Sem `text-[13px]` e afins — apenas a escala (`text-xs`, `text-sm`, `text-base`…).

## 3. Espaçamentos

- [ ] Entre seções da página: `space-y-6`.
- [ ] Entre campos dentro de um card: `space-y-4`; grids de campos: `gap-4`.
- [ ] Ícone + texto: `gap-2`; grupos de botões: `gap-2`.
- [ ] Padding de card: `padding="lg"` do `SurfaceCard` (`p-6`).
- [ ] Grids responsivos com `min-w-0` no container e nos filhos.

## 4. Forma e elevação

- [ ] Cards e blocos de conteúdo: `rounded-2xl shadow-xs`.
- [ ] Controles (input, botão, select): `rounded-md`; badges/pills: `rounded-full`.
- [ ] Alturas de controle iguais às do `Input`: `h-10 sm:h-9`.

## 5. Componentes

- [ ] Reutilizar `PageHeader`, `SurfaceCard`, `Field`/`SelectField`, `Button`,
      `FormActionBar`, `AppModal`, `SavedIndicator` — sem recriar variantes locais.
- [ ] Sem `<button>`, `<input>`, `<select>` nativos fora de `src/components/ui`.
- [ ] Ícones só de `lucide-react`, com `aria-hidden` e `icon-optical` quando ao lado de texto.
- [ ] Abas usam as classes de `src/components/app-tabs.ts`.

## 6. Estados e acessibilidade

- [ ] Loading, vazio, erro e sucesso cobertos em toda superfície de dados.
- [ ] Ações com feedback (`sonner`) e bloqueio de submissão duplicada.
- [ ] Labels associados, dicas via `hint`, campos opcionais marcados com `optional`.

## Verificação

```bash
node scripts/visual/check-design-tokens.mjs   # cores, escala e controles nativos
python3 scripts/visual/check-icon-alignment.py
bash scripts/visual/validate.sh               # typecheck + tokens + visual regression
```

## Aplicação em “Relatórios e documentos”

Itens ajustados nesta revisão (`src/features/documents/`):

- Cabeçalho do editor extraído em `DocumentEditorHeader`, com H2 e metadado nos
  tokens tipográficos padrão nas três abas (antes duplicado inline).
- Ícones dos cards e do cabeçalho do editor com `icon-optical`.
- Gatilho do `CidAutocomplete` alinhado à altura/escala do `Input`
  (`h-10 sm:h-9`, `text-base sm:text-sm`).
- Placeholders de campos opcionais deixaram de repetir a palavra “opcional”
  (a marcação já vem do `Field optional`).
