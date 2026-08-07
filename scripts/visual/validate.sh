#!/usr/bin/env bash
# Validação completa do design system:
#   1. tipos, 2. tokens de cor, 3. alinhamento ícone/texto, 4. visual regression,
#   5. abas Comparecimento, 6. abas entre rotas, 7. cabeçalho de procedimentos.
# Uso: bash scripts/visual/validate.sh [--update]
set -uo pipefail

status=0

echo "==> 1/7 Typecheck"
bunx tsgo --noEmit || status=1

echo
echo "==> 2/7 Tokens de cor"
node scripts/visual/check-design-tokens.mjs || status=1

echo
echo "==> 3/7 Alinhamento ícone/texto"
python3 scripts/visual/check-icon-alignment.py || status=1

echo
echo "==> 4/7 Visual regression"
python3 scripts/visual/visual-regression.py "$@" || status=1

echo
echo "==> 5/7 Visual da aba Comparecimento (mobile + desktop)"
python3 scripts/visual/check-comparecimento-visual.py "$@" || status=1

echo
echo "==> 6/7 Abas em Documentos, CID-10 e Emitir guia (alinhamento entre rotas)"
python3 scripts/visual/check-tabs-cross-route.py "$@" || status=1

echo
echo "==> 7/7 Cabeçalho de Procedimentos solicitados (larguras + zooms)"
python3 scripts/visual/check-proc-headers-visual.py "$@" || status=1

echo
if [ "$status" -eq 0 ]; then
  echo "Design system validado com sucesso."
else
  echo "Validação falhou — veja os detalhes acima."
fi
exit "$status"
