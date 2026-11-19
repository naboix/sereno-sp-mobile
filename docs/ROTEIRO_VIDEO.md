# Roteiro do vídeo (até 3 minutos)

**Preparação:** Sereno.Api rodando + `npm run api:seed` (ou `npm run api:simulada`, avisando no vídeo que os dados são simulados). Celular com Expo Go, tela espelhada.

| Tempo | Cena | Fala sugerida |
|---|---|---|
| 0:00–0:20 | Onboarding | "Este é o Sereno SP, que protege idosos e trabalhadores de rua de Santana contra o calor. O app pede só apelido, faixa de idade e bairro, e guarda tudo no celular com autorização." |
| 0:20–1:00 | Início | "O nível de calor vem do totem da praça pela nossa API .NET: calor perigoso, com cor, ícone e texto. Mostra temperatura, umidade, sensação de calor e o horário da medição." Mostrar a faixa de origem dos dados. |
| 1:00–1:20 | Amanhã | "O aviso de véspera vem do modelo de Machine Learning: amanhã, calor perigoso, 82% de chance." |
| 1:20–2:00 | Refresco e detalhe | Tocar "Onde me refrescar" → lista por distância → detalhe → "Salvar nos favoritos". "Sem permissão de GPS, o app usa a região de Santana. A localização é arredondada e não fica salva." |
| 2:00–2:40 | Bebi água + offline | Tocar "Bebi água" (confirmação + próximo copo sugerido). Desligar a API (ou ativar o modo avião) e puxar para atualizar: "Sem conexão: o app mostra os dados salvos com data e hora, e os favoritos continuam aqui." |
| 2:40–3:00 | Acessibilidade e fechamento | Perfil → "Muito grande" + "Contraste reforçado". "Telas simples, letras grandes e banco SQLite local. O Sereno SP leva a informação a quem mais precisa." |

**Dica:** com o servidor simulado, `curl -X POST "http://localhost:5128/__demo/cenario?nome=antiga"` mostra o aviso de medição antiga ao vivo.
