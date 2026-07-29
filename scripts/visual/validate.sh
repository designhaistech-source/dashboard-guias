#!/usr/bin/env bash
# Validação completa do design system:
#   1. tipos, 2. lint de tokens de cor, 3. alinhamento ícone/texto, 4. visual regression.
# Uso: bash scripts/visual/validate.sh [--update]
set -uo pipefail

status=0

echo "==> 1/4 Typecheck"
bunx tsgo --noEmit || status=1

echo
echo "==> 2/4 Tokens de cor"
node scripts/visual/check-design-tokens.mjs || status=1

echo
echo "==> 3/4 Alinhamento ícone/texto"
python3 scripts/visual/check-icon-alignment.py || status=1

echo
echo "==> 4/4 Visual regression"
python3 scripts/visual/visual-regression.py "$@" || status=1

echo
if [ "$status" -eq 0 ]; then
  echo "Design system validado com sucesso."
else
  echo "Validação falhou — veja os detalhes acima."
fi
exit "$status"
