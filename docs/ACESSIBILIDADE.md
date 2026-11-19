# Acessibilidade — Sereno SP Mobile

Público principal: pessoas com 60 anos ou mais e trabalhadores de rua (sol forte na tela, pressa, baixa familiaridade com tecnologia).

## Recursos implementados

| Requisito | Implementação | Arquivo | Verificação |
|---|---|---|---|
| Contraste mínimo | Paleta com todos os pares ≥ 4,5:1 (WCAG 2.1 AA); tema "contraste reforçado" | `src/theme/tema.ts` | **Automática**: `__tests__/contraste.test.ts` (30 pares) |
| Escala de fontes | Corpo de 18 pt; `allowFontScaling` (escala do sistema) × preferência do app (1,0 / 1,15 / 1,35); limite de 2× | `src/components/Texto.tsx` | Print 11 + teste manual |
| Labels | `accessibilityLabel` em botões, selos, linhas de informação, favoritos e abas | componentes | **Automática**: `componentes.test.tsx` |
| Roles | `button`, `radio`/`radiogroup`, `switch`, `header`, `alert`, `progressbar`, `text` | componentes | **Automática** (role button) + manual |
| Estados | `accessibilityState` (`checked`, `selected`, `disabled`, `busy`) | `Campos.tsx`, `Botao.tsx` | Manual |
| Alvos de toque | Mínimo de 56 (acima dos 48 dp recomendados) e `hitSlop` | `ALVO_TOQUE_MIN` | **Automática** |
| Risco sem depender da cor | Cor + ícone + texto ("Calor perigoso") + frase acessível | `SeloRisco.tsx` | **Automática** |
| Ícones com texto | Todo ícone tem texto ao lado; abas com ícone + rótulo | todas as telas | Prints |
| Linguagem simples | Frases curtas; "índice de calor" vem explicado como "Sensação de calor no corpo" | `risco.ts`, `inicio.tsx` | Revisão |
| Feedback de ação | Caixa "Registrado!", anúncio `announceForAccessibility`, vibração opcional | `useConfirmacao.ts` | Print 05 |
| Mensagens dinâmicas | `accessibilityLiveRegion` em erros, faixas de origem e confirmações | `Estados.tsx`, `FaixaOrigem.tsx` | Manual |
| Erros claros | "Sem conexão com o Sereno SP agora." + botão "Tentar de novo"; validação de formulário campo a campo | `http.ts`, `onboarding.tsx` | Prints 02 e 14 |
| Navegação simples | 4 abas fixas, botão "Voltar" com texto no cabeçalho, botão direto "Onde me refrescar" | `_layout.tsx` | Prints |
| Dado antigo explícito | "Medição antiga: feita há 3 horas" e "Sem conexão. Mostrando dados salvos em…" | `inicio.tsx` | Prints 12 e 14 |

## Testes executados

- **Automáticos** (Jest): contraste (dois temas), rótulos acessíveis do selo de risco, role e alvo do botão, textos de origem do dado. Resultado em `docs/evidencias/testes-jest.txt`.
- **Navegação real no Chrome** (Playwright): toda a jornada foi percorrida localizando os elementos **pelo papel e pelo nome acessível** (`get_by_role('radio', name='70 a 79 anos')`, `get_by_role('button', name='Moro em Santana')`). Isso mostra que a árvore de acessibilidade expõe nomes e papéis corretos. Prints em `docs/prints/`.

## Pendentes de validação manual (aparelho físico)

| Teste | Como fazer | Critério |
|---|---|---|
| TalkBack (Android) | Ativar em Configurações > Acessibilidade e percorrer Início → Refresco → Detalhe → Bebi água | Cada elemento é lido com nome e função; o nível de risco é falado |
| VoiceOver (iOS) | Mesmo roteiro | Idem |
| Fonte do sistema no máximo | Configurações > Tela > Tamanho da fonte, no máximo + "Muito grande" no app | Nada cortado; rolagem funciona |
| Sol forte | Tela ao ar livre, brilho médio | Selo de risco legível |
| Teste com usuários | 2 pessoas 60+ (proposta, Etapa 3) | Concluir a jornada sem ajuda |

Esses testes **não foram executados** neste ambiente (sem aparelho físico) e não estão declarados como aprovados.
