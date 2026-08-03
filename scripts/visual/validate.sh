#!/usr/bin/env bash
# Validação completa do design system:
#   1. tipos, 2. tokens de cor, 3. alinhamento ícone/texto, 4. visual regression,
#   5. abas Comparecimento, 6. abas entre rotas.
# Uso: bash scripts/visual/validate.sh [--update]
set -uo pipefail

status=0

echo "==> 1/6 Typecheck"
bunx tsgo --noEmit || status=1

echo
echo "==> 2/6 Tokens de cor"
node scripts/visual/check-design-tokens.mjs || status=1

echo
echo "==> 3/6 Alinhamento ícone/texto"
python3 scripts/visual/check-icon-alignment.py || status=1

echo
echo "==> 4/6 Visual regression"
python3 scripts/visual/visual-regression.py "$@" || status=1

echo
echo "==> 5/6 Visual da aba Comparecimento (mobile + desktop)"
python3 scripts/visual/check-comparecimento-visual.py "$@" || status=1

echo
echo "==> 6/6 Abas em Documentos, CID-10 e Emitir guia (alinhamento entre rotas)"
python3 scripts/visual/check-tabs-cross-route.py "$@" || status=1

echo
if [ "$status" -eq 0 ]; then
  echo "Design system validado com sucesso."
else
  echo "Validação falhou — veja os detalhes acima."
fi
exit "$status"
