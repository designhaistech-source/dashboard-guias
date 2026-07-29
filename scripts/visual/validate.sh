#!/usr/bin/env bash
# Validação completa do design system:
#   1. tipos, 2. lint de tokens de cor, 3. visual regression das telas.
# Uso: bash scripts/visual/validate.sh [--update]
set -uo pipefail

status=0

echo "==> 1/3 Typecheck"
bunx tsgo --noEmit || status=1

echo
echo "==> 2/3 Tokens de cor"
node scripts/visual/check-design-tokens.mjs || status=1

echo
echo "==> 3/3 Visual regression"
python3 scripts/visual/visual-regression.py "$@" || status=1

echo
if [ "$status" -eq 0 ]; then
  echo "Design system validado com sucesso."
else
  echo "Validação falhou — veja os detalhes acima."
fi
exit "$status"
