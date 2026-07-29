# Validação do design system

Fluxo para garantir que mudanças em tokens, componentes base (`Button`, `Badge`, `Chip`,
`StatusPill`, `Field`…) ou em `src/styles.css` não quebrem as telas existentes.

## Comando único

```bash
bash scripts/visual/validate.sh
```

Executa, em ordem:

1. **Typecheck** (`bunx tsgo --noEmit`) — pega quebras de API dos componentes.
2. **Lint de tokens** (`node scripts/visual/check-design-tokens.mjs`) — falha se alguma rota
   ou componente voltar a usar cor fixa (`#hex`, `bg-white`, `text-slate-500`…).
3. **Visual regression** (`python3 scripts/visual/visual-regression.py`) — compara
   screenshots das telas com baselines aprovados.

## Visual regression

O dev server precisa estar rodando em `http://localhost:8080`.

```bash
# comparar com os baselines (falha se divergir > 0.2% dos pixels)
python3 scripts/visual/visual-regression.py

# aprovar mudanças intencionais
python3 scripts/visual/visual-regression.py --update

# rodar só uma tela / viewport
python3 scripts/visual/visual-regression.py --only opme --viewport desktop
```

- Telas cobertas: Dashboard, Histórico de guias, Emitir guia, Emitir prescrição,
  Solicitar OPME e a própria página `/design-system`.
- Viewports: `desktop` (1280) e `mobile` (390).
- Baselines versionados em `scripts/visual/baselines/`.
- Diffs (pixels alterados em vermelho) e capturas atuais em `scripts/visual/output/`,
  que é ignorado pelo git.
- Animações, transições e caret são desativados antes do screenshot para eliminar flakiness.

## Como usar no dia a dia

1. Antes de alterar o design system: `bash scripts/visual/validate.sh` (baseline verde).
2. Faça a mudança.
3. Rode de novo. Cada tela que aparecer como `[FALHOU]` tem um `*.diff.png` em
   `scripts/visual/output/` — abra e confirme se a mudança é desejada.
4. Se for desejada em todas: `python3 scripts/visual/visual-regression.py --update` e
   versione os baselines junto com o código.

## Exceções ao lint de cor

Permitidas apenas onde o valor literal é parte do conteúdo (documentos A4/PDF em
`src/routes/emitir.tsx`, documentação em `src/features/design-system`) ou com o
comentário `// ds-allow-color` na linha.

## Alinhamento ícone/texto

```bash
python3 scripts/visual/check-icon-alignment.py
```

Regras do design system:

- Ícones ao lado de texto recebem o utilitário `icon-optical` (`src/styles.css`),
  que aplica `translateY(-0.075em)` — como o valor é em `em`, o alinhamento é o
  mesmo em `text-xs`, `text-sm` e `text-base`.
- O tamanho do ícone acompanha a escala tipográfica: `size-3` em `text-xs`
  compacto, `size-3.5` em `text-xs`/`text-sm` padrão e `size-4` em `text-base`.
- Componentes com ícone (`Button`, `Badge`, `Chip`, `Tabs`, `Toggle`,
  `SelectTrigger`, itens de `DropdownMenu`/`Command`) usam `text-*/none`, para que
  line-height e tamanho de fonte sejam definidos numa única utilidade e não
  dependam da ordem das classes.
- O half-leading é simétrico: mudar o line-height altera a altura da caixa, não o
  centro do texto. Por isso o validador checa o deslocamento em `em`, e não a
  altura — não reduza o line-height de botões só para "centralizar".

O script roda como etapa 3 de `scripts/visual/validate.sh`.

### Fixture de regressão visual dos ícones

A rota `/design-system-icones` (`IconAlignmentMatrix`) renderiza uma matriz
estática de `Button`, `Badge` e `Chip` com ícone à esquerda, à direita, sozinho
e sem ícone, em todos os tamanhos, além de linhas dentro de contêineres
`text-xs`/`text-sm`/`text-base`.

- É um alvo de `visual-regression.py` (`icon-alignment`) nos breakpoints desktop
  (1280px) e mobile (390px). O alvo usa `selector`, então o screenshot é
  recortado na matriz — mudanças de altura de página não geram falso positivo.
- O `check-icon-alignment.py` também percorre a rota e mede os 35 pares
  ícone/texto.
- Ao alterar tamanhos, padding ou tipografia desses componentes, revise o diff em
  `scripts/visual/output/icon-alignment__*.diff.png` antes de rodar `--update`.
