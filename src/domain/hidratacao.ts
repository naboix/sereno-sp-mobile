/**
 * Lembrete de hidratação calculado no próprio app.
 *
 * O Sereno SP não envia notificações push (o backend não tem esse
 * recurso). O lembrete é exibido na tela Início com o horário sugerido
 * para o próximo copo de água, a partir do último registro "Bebi água".
 */
export function proximoLembrete(
  ultimoRegistroIso: string | null,
  intervaloMin: number,
  agora: Date = new Date(),
): { horario: Date; atrasado: boolean } | null {
  if (!ultimoRegistroIso) return null;
  const ultimo = new Date(ultimoRegistroIso).getTime();
  if (Number.isNaN(ultimo)) return null;
  const horario = new Date(ultimo + intervaloMin * 60000);
  return { horario, atrasado: horario.getTime() <= agora.getTime() };
}
