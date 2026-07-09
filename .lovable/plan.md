## Objetivo
Substituir a página densa de "Emitir prescrição" por um fluxo em 3 etapas (wizard), reduzindo a poluição visual sem perder funcionalidades existentes (autosave, histórico, kits, validações, receita especial, drag-and-drop, PDF).

## Estrutura do wizard

```text
┌─────────────────────────────────────────────────────────┐
│  Emitir prescrição                     [rascunho salvo] │
│  ●──────────●──────────○                                │
│  1 Paciente   2 Medicamentos   3 Revisar e emitir       │
└─────────────────────────────────────────────────────────┘
```

Header fino com:
- Título + indicador discreto de autosave (só ícone + tooltip)
- Stepper clicável (permite voltar a etapas já visitadas)
- Botão "Histórico" e "Kits" recolhidos num menu "..."

### Etapa 1 — Paciente
- Nome, CPF, CEP, endereço (CPF/CEP/endereço só obrigatórios se Receita especial estiver ligada)
- Toggle "Receituário especial" com explicação inline (tarja vermelha)
- Botão "Continuar" desabilitado até nome preenchido (e demais campos se especial)
- Sem painel de pendências no topo — validação inline por campo

### Etapa 2 — Medicamentos
- Coluna única: busca em cima, resultados abaixo, receita montada em painel lateral colapsável (drawer à direita) OU abaixo em mobile
- Chips de tipo movidos para dentro de um popover "Filtros" (mostra contador)
- Cada resultado abre posologia inline (como hoje), mas sem sticky bar
- Lista de medicamentos selecionados fica visível sempre com contador; drag-and-drop mantido
- Botão "Continuar" mostra qtd. de itens

### Etapa 3 — Revisar e emitir
- Preview limpo da receita (paciente + itens numerados + posologias)
- Se houver pendências (posologia inválida, campos faltando), aparecem como lista compacta com link "corrigir" que volta à etapa
- Ações: **Imprimir**, **Baixar PDF**, **Salvar como kit** (recolhido em menu secundário)
- Botão "Voltar" para etapa 2

## Elementos removidos/movidos
- Banner "Rascunho recuperado" → toast único ao carregar
- Indicador "salvo às HH:MM" → ícone de nuvem com tooltip
- Painel de pendências grande → validação inline por campo/etapa
- Card "Dados obrigatórios" duplicado → integrado na etapa 1
- Sticky bar da receita → substituído pelo footer do wizard
- Kits/Histórico → botões no menu "..." (Sheet/Dialog)
- Atalhos Ctrl+P/Ctrl+S mantidos, mas hint só na etapa 3

## Preservado (sem mudanças de lógica)
- Autosave em localStorage (`hg:prescricao:rascunho`)
- Histórico (`hg:prescricao:historico`) e reutilização
- Kits salvos
- Validação de CPF (dígito verificador), CEP, endereço
- Validação de posologia (intervalo/quantidade mínimos)
- Drag-and-drop de reordenação
- Geração de PDF (jsPDF) com tarja vermelha no modo especial
- Auto-preenchimento por convênio

## Detalhes técnicos
- Estado `step: 1 | 2 | 3` controla a renderização; validação por etapa determina se `Continuar` habilita
- Componentes internos: `StepPaciente`, `StepMedicamentos`, `StepRevisar`, `WizardHeader`, `WizardFooter`
- Reaproveitar componentes existentes (`MedRow`, `PosologiaPanel`, `HistoricoPanel`) sem reescrever lógica
- Um único arquivo `src/routes/prescricao.tsx` continua sendo o ponto de entrada; se ficar acima de ~1.5k linhas depois da limpeza, extraio os steps em `src/components/prescricao/*.tsx`

## Fora do escopo
- Não mexer em rotas/sidebar
- Não alterar dados mockados (medicamentos, kits)
- Sem mudanças em outras páginas