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
