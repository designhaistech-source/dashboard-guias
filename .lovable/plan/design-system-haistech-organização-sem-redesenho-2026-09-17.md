# Design System HaisTech — organização sem redesenho

## Objetivo e limite
Organizar a base existente para reutilização em outros produtos HaisTech, preservando a aparência, o layout e o comportamento de todas as telas, inclusive documentos impressos. Não trocar bibliotecas, fontes, cores ou componentes por alternativas novas.

## Diagnóstico inicial confirmado
- Os tokens de cores e famílias tipográficas já estão centralizados em `src/styles.css`, com temas claro e escuro. Há papéis equivalentes com nomes diferentes (`text`/`foreground`, superfícies e cores de apoio); alguns deixam de ser equivalentes no tema escuro. Não serão fundidos automaticamente.
- A documentação apresenta rótulos de campos como 14px e cor principal, mas `Field` utiliza 12px, peso 500, altura de linha `leading-snug` e cor de apoio. Documentar a implementação real, sem alterar os campos.
- A página de referência descreve duas famílias, embora existam três: Plus Jakarta Sans, Vazirmatn e JetBrains Mono.
- `Button` usa altura padrão de 36px; `Input` usa 40px em telas pequenas e 36px nas maiores. O checklist generaliza alturas iguais. Preservar a diferença e documentá-la.
- `SurfaceCard` e `SectionCard` compartilham aparência básica, mas diferem em espaçamento, texto auxiliar e comportamento de expansão. Não são intercambiáveis sem análise.
- O botão primário usa `primary/90` no estado de passagem do mouse, embora exista `primary-hover`. Trocar a referência mudaria a cor: fica pendente de aprovação específica.
- Tamanhos, alturas de linha, sombras e parte dos raios dependem dos padrões do Tailwind. Precisam constar no catálogo com seus valores efetivos, sem aproximar medidas.
- As verificações atuais de tokens e lint identificaram duas ocorrências de `max-w-[850px]` nos modais de guias de internação e guias emitidas. Uma referência compartilhada deve manter exatamente 850px.

## Organização proposta
### 1. Inventário completo e classificação
Catalogar os componentes efetivamente usados, suas variantes, tamanhos, estados e dependências:
- Botões e ações; inputs, selects, buscas, checkboxes, switches e demais campos.
- Tabelas, paginação, cards, tags, badges e filtros.
- Dropdowns, menus, modais, tooltips e navegação.
- Sucesso, alerta, erro, carregamento, vazio, somente leitura e desabilitado.
- Outros padrões reutilizáveis: cabeçalhos, barras de ação, indicadores de salvamento e composições de formulário.

Separar **fundamentos**, **componentes básicos**, **composições compartilhadas** e **componentes específicos de produto**. Documentos A4/A5 e formulários TISS permanecem específicos do HaisGuias.

### 2. Referência única dos fundamentos
Manter uma única fonte dos valores de cor e tema. Organizar os estilos globais em seções ou módulos com importação central, preservando a ordem da cascata e todos os valores.

Registrar famílias, tamanhos, pesos, alturas de linha, espaçamentos, raios, bordas, sombras, ícones e ajustes ópticos. Tornar explícitos os valores herdados apenas quando houver comprovação de equivalência com o resultado atual.

### 3. Componentes prontos para reutilização
Definir uma entrada pública e documentação de uso para o núcleo reutilizável, reaproveitando as implementações existentes, sem criar uma biblioteca paralela.

Preservar os caminhos de importação atuais por compatibilidade. Consolidar apenas duplicações realmente equivalentes; diferenças visuais ou comportamentais serão registradas, não substituídas. Separar dependências de marca, navegação, dados médicos e preferências específicas do produto.

### 4. Documentação e adoção
Organizar o catálogo existente e os guias de uso com exemplos das implementações reais. Documentar quais componentes escolher, quais são específicos do produto e como adotar o padrão em outro produto HaisTech, incluindo fontes, tema e dependências mínimas.

Correções textuais no catálogo serão apenas documentação; não haverá redesenho da página de referência nem das telas de uso.

### 5. Verificação de preservação
- Registrar referências visuais antes de qualquer extração que afete estilos compartilhados.
- Comparar as telas e componentes afetados em temas claro/escuro e larguras pequenas/grandes.
- Executar verificações de tokens, lint e testes relevantes; conferir as verificações automáticas de compilação.
- Validar estados e interações dos componentes envolvidos, não apenas suas capturas de tela.
- Relatar falhas preexistentes separadamente, sem declarar conformidade total indevida.

## Mudanças que exigirão aviso e aprovação específicos
Não executar nesta etapa: unificar alturas ou espaçamentos diferentes; trocar cores de hover/foco; alterar pesos, alinhamento óptico ou espaçamento entre letras; substituir cards com geometrias distintas; modificar contraste, bordas, sombras ou estilos de feedback.

Cada proposta posterior deverá informar a inconsistência, as telas afetadas e a mudança visual necessária antes da implementação.

## Detalhes técnicos
Preservar React 19, TanStack Start, Tailwind v4, Radix, CVA e Lucide existentes. Manter tokens semânticos, compatibilidade dos imports, ausência de ciclos e separação entre o núcleo visual e funcionalidades de domínio. Não criar infraestrutura, publicar pacote, alterar dados ou adicionar serviços.

## Entrega
Base visual organizada, inventário rastreável, referência de uso entre produtos e lista de inconsistências pendentes — sem mudar as telas atuais.
