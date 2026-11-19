# Integração com a Sereno.Api (.NET 10)

O app foi construído **depois** da leitura de todos os controllers, DTOs, services, entidades e enums do backend (`sereno-sp.zip`). Nenhum endpoint ou campo foi inventado.

## Convenções confirmadas no código

| Item | Comportamento real | Onde |
|---|---|---|
| Nomes no JSON | camelCase (padrão do System.Text.Json no ASP.NET Core) | `Program.cs` → `AddControllers()` |
| `NivelRisco` | string `"Normal"`, `"Atencao"` ou `"Perigo"` (via `ToString()`) | `*Service.ConverterParaDto` |
| `DateTime` | ISO 8601, em UTC (coluna `timestamp with time zone`) | migrations |
| `DateOnly` | `"yyyy-MM-dd"` | `PrevisaoRespostaDto` |
| Erros | `{ "erro": "mensagem" }` com 400, 404 ou 409 | todos os controllers |
| Classificação | índice < 32 Normal · 32–40,99 Atenção · ≥ 41 Perigo | `LeituraService.ClassificarRisco` |
| Previsão | p > 0,70 Perigo · p ≥ 0,40 Atenção | `PrevisaoService.ClassificarProbabilidade` |
| Porta local | `http://localhost:5128` (perfil `http`) | `launchSettings.json` |

## Tabela de integração

| Endpoint | Método | Parâmetros | DTO de resposta | Tela | Tratamento de erros no app |
|---|---|---|---|---|---|
| `/api/totens` | GET | — | `List<TotemRespostaDto>` | Início | Sem rede → usa o totem salvo; lista vazia → "Nenhum totem ativo" |
| `/api/leituras/ultima` | GET | `totemCodigo` (obrigatório) | `LeituraRespostaDto` | Início | 404 → "O totem ainda não enviou medições" (sem usar cache); sem rede → cache com data e hora; > 15 min → aviso "Medição antiga" |
| `/api/previsoes/amanha` | GET | — | `PrevisaoRespostaDto` | Início | 404 → "Previsão indisponível"; cache só vale se `dataReferencia` = amanhã |
| `/api/alertas` | GET | `ativos=true`, `totemCodigo` (opcional) | `List<AlertaRespostaDto>` | Alertas | Lista vazia → "Nenhum alerta de calor agora"; sem rede → últimos vigentes do histórico local |
| `/api/pontos/proximos` | GET | `lat`, `lon` (obrigatórios), `limite` 1–20 | `List<PontoRefrescoRespostaDto>` com `distanciaKm` | Pontos | 400 tratado; sem rede → cache com distância recalculada + favoritos |
| `/api/pontos/{id:guid}` | GET | `id` | `PontoRefrescoRespostaDto` | Detalhe | 404 → "Este ponto não existe mais"; sem rede → cópia do favorito |
| `/api/pontos` | GET | `temAgua`, `temSombra` | `List<PontoRefrescoRespostaDto>` | (cliente pronto; o app usa `/proximos`) | — |
| `/health` | GET | — | `{ status, api, banco }` | Perfil → Testar conexão | 503 → "O servidor do Sereno SP está com problema" |

Endpoints de escrita (`POST /api/leituras`, `/api/totens`, `/api/pontos`, `/api/previsoes`) **não** são chamados pelo app. São usados apenas pelo script `npm run api:seed` para cadastrar dados sintéticos.

## Diferenças entre a proposta e o backend (e como foram resolvidas)

| Previsto na proposta | Situação no backend | Solução no app |
|---|---|---|
| `/api/cidadaos` (perfil) e check-ins | Não existe | Perfil e "Bebi água" 100% locais (SQLite). Sem API inventada |
| Sincronizar check-in ao reconectar | Não há endpoint | Não implementado. Documentado como limitação |
| Horário e acesso do ponto | Campos inexistentes no DTO | "Não informado pela API do Sereno SP" |
| Bairro no alerta | Alerta só tem `totemCodigo` | Exibe o totem de origem |
| Notificações push | Não existe | Lembrete exibido no app, sem push fictício |
| CORS para versão web | Não configurado | Patch opcional e separado em `backend-patch-cors/` |
| `X-Api-Key` do totem | Não implementado | Não afeta o app (só GETs públicos) |

## Endereços por ambiente

| Ambiente | URL |
|---|---|
| Emulador Android | `http://10.0.2.2:5128` (o `localhost` do emulador é o próprio emulador) |
| Simulador iOS / Web | `http://localhost:5128` |
| Celular físico | `http://IP-do-PC:5128`, com a API em `--urls http://0.0.0.0:5128` e a porta liberada no firewall |

## Servidor de contrato simulado

`mock-server/server.ts` reproduz rotas, parâmetros, status e JSON dos controllers, com dados sintéticos. Ele envia `X-Sereno-Ambiente: simulado`, e o app exibe "dados SIMULADOS". Não é um segundo backend: não tem banco, não grava nada permanente e existe só para demonstração e testes.
