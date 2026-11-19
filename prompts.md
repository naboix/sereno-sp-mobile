# Uso de IA — Mobile Development & IoT

**Integrantes:** Luan Orllandeli (RM554747) · Jorge Luiz (RM554418) · Arthur Bobadilla (RM555056)

Conforme o combinado da GS (p. 21): a IA foi usada como **copiloto**, e a equipe deve saber explicar cada linha.

| Item | Registro |
|---|---|
| Ferramenta | Claude (Anthropic), modelo Claude Opus 5.5 |
| Data | 18/11/2026 |
| Papel da IA | Leitura do PDF da FIAP, da proposta e do backend; geração do código do app, dos testes e da documentação |
| Papel da equipe | Definição do problema, da proposta e do backend; revisão; execução contra a API real; vídeo |

## Prompt principal (resumo fiel)

> Atue como engenheiro de software sênior em React Native, TypeScript, Expo e integração com .NET. Desenvolva integralmente a entrega de **Mobile Development & IoT** (p. 34 do PDF da FIAP) do projeto **Sereno SP**, sem mudar a ideia aprovada. Use o backend existente (`sereno-sp.zip`) como referência dos contratos: leia controllers, DTOs, services, entidades e enums; não invente endpoints nem campos; documente diferenças. Implemente Expo Router, consumo da API real com camada de serviços, SQLite (perfil, preferências, favoritos, check-ins, cache), funcionamento offline sem apresentar dado antigo como atual, acessibilidade para público 60+, testes, README com a Ficha CitizenTech e roteiro de vídeo de até 3 minutos. Nunca invente resultados de testes nem prints.

## Prompts de apoio usados durante o desenvolvimento

1. "Liste rotas, parâmetros, códigos HTTP e formato JSON de cada controller da Sereno.Api."
2. "Quais funcionalidades da proposta não existem no backend? Como tratar sem inventar API?"
3. "Escreva testes que provem: contraste WCAG AA, cache offline com origem, 404 sem uso de cache e arredondamento da localização."
4. "Gere prints reais da build web percorrendo a jornada pelo papel e nome acessível dos elementos."

## O que a equipe deve conferir antes de entregar

- [ ] Rodar `npm run typecheck` e `npm test` na máquina da equipe.
- [ ] Executar o roteiro com a API real (`docs/TESTES.md`) e substituir/adicionar prints com a faixa "Dados recebidos do Sereno SP".
- [ ] Preencher integrantes, link do repositório e link do vídeo no README.
- [ ] Saber explicar: `src/services/dados.ts` (cache e origem), `src/db/repositorios.ts` (SQL), `src/services/serenoApi.ts` (rotas) e `src/components/SeloRisco.tsx` (acessibilidade).
