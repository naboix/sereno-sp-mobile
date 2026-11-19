# Testes e validação — Sereno SP Mobile

Execução registrada em `docs/evidencias/` (data em `data-execucao.txt`).

| Verificação | Comando | Resultado |
|---|---|---|
| Dependências compatíveis com o SDK 58 | versões de `expo/bundledNativeModules.json` | instaladas |
| Tipagem (app + testes) | `npm run typecheck` | **0 erros** (`typecheck.txt`) |
| Testes automatizados | `npm test` | **9 suítes, 112 testes aprovados** (`testes-jest.txt`) |
| Build completa | `npx expo export -p web` | **gerada sem erros** (todas as rotas empacotadas) |
| Navegação e jornada | Chrome headless sobre a build real (`tools/prints_mobile.py`) | 18 telas capturadas, **0 erros de página** |
| Persistência local | `banco.test.ts` (SQL real) + jornada no navegador (favorito e "Bebi água" sobrevivem ao modo sem conexão) | aprovado |
| Offline | Servidor desligado durante a navegação → faixa "Sem conexão. Mostrando dados salvos…" | aprovado (print 14) |
| Contrato da API | `http-contratos.test.ts` (fixtures no formato dos DTOs) + `integracao.test.ts` (HTTP real contra o servidor de contrato) | aprovado |

## O que NÃO foi possível executar aqui

| Pendência | Motivo | Como executar |
|---|---|---|
| App contra a **Sereno.Api .NET real** | O ambiente de desenvolvimento não tinha o .NET SDK (download bloqueado) | Ver roteiro abaixo |
| Expo Go em celular físico | Sem aparelho no ambiente | `npm start` + QR code |
| TalkBack / VoiceOver | Sem aparelho | `docs/ACESSIBILIDADE.md` |

## Roteiro de validação com a API real (≈ 10 min)

1. `dotnet run --project Sereno.Api --launch-profile http` → abrir `http://localhost:5128/health` → `Healthy`.
2. `SERENO_API_URL=http://localhost:5128 npm run api:seed` → conferir `201` em pontos, totens, leituras e previsão (`409` = já existia).
3. `.env`: `EXPO_PUBLIC_DATA_MODE=api` e a URL correta → `npm start`.
4. Início: a faixa deve dizer **"Dados recebidos do Sereno SP"** (sem "SIMULADOS"), com nível **Calor perigoso** para STN-01.
5. Refresco: 5 pontos fictícios ordenados por distância. Alertas: 1 alerta Perigo.
6. Parar a API → puxar para atualizar → faixa "Sem conexão. Mostrando dados salvos…".
7. Registrar os resultados e prints em `docs/evidencias/`.

## Casos cobertos (resumo)

- **Positivos:** leitura Perigo, previsão 82%, 3 pontos ordenados, favoritar, "Bebi água", preferências salvas, apagar dados.
- **Negativos:** sem conexão, timeout, 404 (sem leitura, sem previsão, ponto inexistente), 503, JSON fora do contrato, nível desconhecido, perfil sem bairro ou sem consentimento, apelido com número de documento.
- **Fuso horário:** suíte executada com TZ=America/Sao_Paulo, UTC e Asia/Tokyo (112/112 nos três). Um defeito real foi encontrado assim: depois das 21h em São Paulo, a previsão SIMULADA saía com a data de depois de amanhã; corrigido em `mockApi.ts` e coberto por teste de regressão.
- **Borda:** leitura com exatamente 15 min, data futura, previsão salva de outro dia, coordenada com 8 casas decimais, `limite=99` (vira 20).
