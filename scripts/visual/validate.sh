#!/usr/bin/env bash
# Validação completa do design system:
#   1. tipos, 2. tokens de cor, 3. alinhamento ícone/texto, 4. visual regression,
#   5. abas Comparecimento, 6. abas entre rotas, 7. cabeçalho de procedimentos, 8. etapas da Guia SP/SADT, 9. Visão geral em vários viewports.
# Uso: bash scripts/visual/validate.sh [--update]
set -uo pipefail

status=0

echo "==> 1/9 Typecheck"
bunx tsgo --noEmit || status=1

echo
echo "==> 2/9 Tokens de cor"
node scripts/visual/check-design-tokens.mjs || status=1

echo
echo "==> 3/9 Alinhamento ícone/texto"
python3 scripts/visual/check-icon-alignment.py || status=1

echo
echo "==> 4/9 Visual regression"
python3 scripts/visual/visual-regression.py "$@" || status=1

echo
echo "==> 5/9 Visual da aba Comparecimento (mobile + desktop)"
python3 scripts/visual/check-comparecimento-visual.py "$@" || status=1

echo
echo "==> 6/9 Abas em Documentos, CID-10 e Emitir guia (alinhamento entre rotas)"
python3 scripts/visual/check-tabs-cross-route.py "$@" || status=1

echo
echo "==> 7/9 Cabeçalho de Procedimentos solicitados (larguras + zooms)"
python3 scripts/visual/check-proc-headers-visual.py "$@" || status=1

echo
echo "==> 8/9 Títulos das etapas da Guia SP/SADT (desktop + mobile)"
python3 scripts/visual/check-sadt-steps-visual.py "$@" || status=1

echo
echo "==> 9/9 Visão geral em vários tamanhos de viewport"
python3 scripts/visual/check-visao-geral-visual.py "$@" || status=1

echo
if [ "$status" -eq 0 ]; then
  echo "Design system validado com sucesso."
else
  echo "Validação falhou — veja os detalhes acima."
fi
exit "$status"
