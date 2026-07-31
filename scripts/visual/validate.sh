#!/usr/bin/env bash
# Validação completa do design system:
#   1. tipos, 2. tokens de cor, 3. alinhamento ícone/texto, 4. visual regression, 5. abas Comparecimento.
# Uso: bash scripts/visual/validate.sh [--update]
set -uo pipefail

status=0

echo "==> 1/5 Typecheck"
bunx tsgo --noEmit || status=1

echo
echo "==> 2/5 Tokens de cor"
node scripts/visual/check-design-tokens.mjs || status=1

echo
echo "==> 3/5 Alinhamento ícone/texto"
python3 scripts/visual/check-icon-alignment.py || status=1

echo
echo "==> 4/5 Visual regression"
python3 scripts/visual/visual-regression.py "$@" || status=1

echo
echo "==> 5/5 Visual da aba Comparecimento (mobile + desktop)"
python3 scripts/visual/check-comparecimento-visual.py "$@" || status=1

echo
if [ "$status" -eq 0 ]; then
  echo "Design system validado com sucesso."
else
  echo "Validação falhou — veja os detalhes acima."
fi
exit "$status"
