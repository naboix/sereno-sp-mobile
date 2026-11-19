/**
 * Repositórios do banco local. Todas as consultas usam parâmetros
 * (?) — nunca concatenação de texto do usuário em SQL.
 */
import type { AlertaDto, OrigemDado, PontoRefrescoDto } from '@/domain/types';
import type { BancoLocal } from './database';

const agoraIso = () => new Date().toISOString();

/* ------------------------------------------------------------------ */
/* Perfil                                                              */
/* ------------------------------------------------------------------ */

export const FAIXAS_ETARIAS = ['Até 59 anos', '60 a 69 anos', '70 a 79 anos', '80 anos ou mais'] as const;
export type FaixaEtaria = (typeof FAIXAS_ETARIAS)[number];

export interface Perfil {
  apelido: string;
  faixaEtaria: FaixaEtaria;
  bairro: string;
  consentimentoLocal: boolean;
}

export interface ErrosPerfil {
  apelido?: string;
  faixaEtaria?: string;
  bairro?: string;
  consentimentoLocal?: string;
}

/** Validação do cadastro mínimo (critério F06 da proposta). */
export function validarPerfil(p: Partial<Perfil>): ErrosPerfil {
  const erros: ErrosPerfil = {};
  const apelido = (p.apelido ?? '').trim();
  if (apelido.length < 2) erros.apelido = 'Informe como quer ser chamado (pelo menos 2 letras).';
  else if (apelido.length > 30) erros.apelido = 'Use um apelido com até 30 letras.';
  else if (/\d{3,}|@/.test(apelido)) {
    erros.apelido = 'Use só um apelido. Não coloque números de documento, telefone ou e-mail.';
  }
  if (!p.faixaEtaria || !FAIXAS_ETARIAS.includes(p.faixaEtaria)) {
    erros.faixaEtaria = 'Escolha sua faixa de idade.';
  }
  if (!(p.bairro ?? '').trim()) erros.bairro = 'Informe seu bairro.';
  if (p.consentimentoLocal !== true) {
    erros.consentimentoLocal = 'Para salvar suas escolhas no celular, marque a autorização.';
  }
  return erros;
}

interface LinhaPerfil {
  apelido: string;
  faixa_etaria: string;
  bairro: string;
  consentimento_local: number;
}

export async function obterPerfil(db: BancoLocal): Promise<Perfil | null> {
  const l = await db.getFirstAsync<LinhaPerfil>(
    'SELECT apelido, faixa_etaria, bairro, consentimento_local FROM perfil WHERE id = 1',
  );
  if (!l) return null;
  return {
    apelido: l.apelido,
    faixaEtaria: l.faixa_etaria as FaixaEtaria,
    bairro: l.bairro,
    consentimentoLocal: l.consentimento_local === 1,
  };
}

export async function salvarPerfil(db: BancoLocal, p: Perfil): Promise<void> {
  const erros = validarPerfil(p);
  if (Object.keys(erros).length > 0) throw new Error(Object.values(erros)[0]);
  const t = agoraIso();
  await db.runAsync(
    `INSERT INTO perfil (id, apelido, faixa_etaria, bairro, consentimento_local, criado_em, atualizado_em)
     VALUES (1, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       apelido = excluded.apelido,
       faixa_etaria = excluded.faixa_etaria,
       bairro = excluded.bairro,
       consentimento_local = excluded.consentimento_local,
       atualizado_em = excluded.atualizado_em`,
    p.apelido.trim(),
    p.faixaEtaria,
    p.bairro.trim(),
    p.consentimentoLocal ? 1 : 0,
    t,
    t,
  );
}

/* ------------------------------------------------------------------ */
/* Preferências                                                        */
/* ------------------------------------------------------------------ */

export type TamanhoFonte = 'normal' | 'grande' | 'muito_grande';

export interface Preferencias {
  tamanhoFonte: TamanhoFonte;
  contrasteReforcado: boolean;
  vibrarAoConfirmar: boolean;
  lembreteAguaAtivo: boolean;
  lembreteIntervaloMin: 60 | 90 | 120;
}

export const PREFERENCIAS_PADRAO: Preferencias = {
  tamanhoFonte: 'grande',
  contrasteReforcado: false,
  vibrarAoConfirmar: true,
  lembreteAguaAtivo: true,
  lembreteIntervaloMin: 60,
};

export async function obterPreferencias(db: BancoLocal): Promise<Preferencias> {
  const linhas = await db.getAllAsync<{ chave: string; valor: string }>(
    'SELECT chave, valor FROM preferencias',
  );
  const m = new Map(linhas.map((l) => [l.chave, l.valor]));
  const fonte = m.get('tamanhoFonte');
  const intervalo = Number(m.get('lembreteIntervaloMin'));
  return {
    tamanhoFonte:
      fonte === 'normal' || fonte === 'grande' || fonte === 'muito_grande'
        ? fonte
        : PREFERENCIAS_PADRAO.tamanhoFonte,
    contrasteReforcado: m.has('contrasteReforcado')
      ? m.get('contrasteReforcado') === '1'
      : PREFERENCIAS_PADRAO.contrasteReforcado,
    vibrarAoConfirmar: m.has('vibrarAoConfirmar')
      ? m.get('vibrarAoConfirmar') === '1'
      : PREFERENCIAS_PADRAO.vibrarAoConfirmar,
    lembreteAguaAtivo: m.has('lembreteAguaAtivo')
      ? m.get('lembreteAguaAtivo') === '1'
      : PREFERENCIAS_PADRAO.lembreteAguaAtivo,
    lembreteIntervaloMin:
      intervalo === 60 || intervalo === 90 || intervalo === 120
        ? intervalo
        : PREFERENCIAS_PADRAO.lembreteIntervaloMin,
  };
}

export async function salvarPreferencias(db: BancoLocal, p: Preferencias): Promise<void> {
  const pares: [string, string][] = [
    ['tamanhoFonte', p.tamanhoFonte],
    ['contrasteReforcado', p.contrasteReforcado ? '1' : '0'],
    ['vibrarAoConfirmar', p.vibrarAoConfirmar ? '1' : '0'],
    ['lembreteAguaAtivo', p.lembreteAguaAtivo ? '1' : '0'],
    ['lembreteIntervaloMin', String(p.lembreteIntervaloMin)],
  ];
  for (const [chave, valor] of pares) {
    await db.runAsync(
      'INSERT INTO preferencias (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor',
      chave,
      valor,
    );
  }
}

/* ------------------------------------------------------------------ */
/* Favoritos                                                           */
/* ------------------------------------------------------------------ */

interface LinhaFavorito {
  ponto_id: string;
  nome: string;
  endereco: string;
  latitude: number;
  longitude: number;
  tem_agua: number;
  tem_sombra: number;
  salvo_em: string;
}

export interface Favorito extends PontoRefrescoDto {
  salvoEm: string;
}

function linhaParaFavorito(l: LinhaFavorito): Favorito {
  return {
    id: l.ponto_id,
    nome: l.nome,
    endereco: l.endereco,
    latitude: l.latitude,
    longitude: l.longitude,
    temAgua: l.tem_agua === 1,
    temSombra: l.tem_sombra === 1,
    distanciaKm: null,
    salvoEm: l.salvo_em,
  };
}

export async function listarFavoritos(db: BancoLocal): Promise<Favorito[]> {
  const linhas = await db.getAllAsync<LinhaFavorito>('SELECT * FROM favoritos ORDER BY nome COLLATE NOCASE');
  return linhas.map(linhaParaFavorito);
}

export async function obterFavorito(db: BancoLocal, pontoId: string): Promise<Favorito | null> {
  const l = await db.getFirstAsync<LinhaFavorito>('SELECT * FROM favoritos WHERE ponto_id = ?', pontoId);
  return l ? linhaParaFavorito(l) : null;
}

export async function ehFavorito(db: BancoLocal, pontoId: string): Promise<boolean> {
  return (await obterFavorito(db, pontoId)) !== null;
}

/** Salva uma cópia do ponto para que o favorito funcione sem internet. */
export async function adicionarFavorito(db: BancoLocal, p: PontoRefrescoDto): Promise<void> {
  await db.runAsync(
    `INSERT INTO favoritos (ponto_id, nome, endereco, latitude, longitude, tem_agua, tem_sombra, salvo_em)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(ponto_id) DO UPDATE SET
       nome = excluded.nome, endereco = excluded.endereco,
       latitude = excluded.latitude, longitude = excluded.longitude,
       tem_agua = excluded.tem_agua, tem_sombra = excluded.tem_sombra`,
    p.id,
    p.nome,
    p.endereco,
    p.latitude,
    p.longitude,
    p.temAgua ? 1 : 0,
    p.temSombra ? 1 : 0,
    agoraIso(),
  );
}

export async function removerFavorito(db: BancoLocal, pontoId: string): Promise<void> {
  await db.runAsync('DELETE FROM favoritos WHERE ponto_id = ?', pontoId);
}

/* ------------------------------------------------------------------ */
/* Check-ins de hidratação                                             */
/* ------------------------------------------------------------------ */

export interface Checkin {
  id: number;
  registradoEm: string;
}

export async function registrarBebiAgua(db: BancoLocal, quando: Date = new Date()): Promise<Checkin> {
  const iso = quando.toISOString();
  const r = await db.runAsync(
    "INSERT INTO checkins (tipo, registrado_em) VALUES ('bebi_agua', ?)",
    iso,
  );
  return { id: r.lastInsertRowId, registradoEm: iso };
}

export async function listarCheckins(db: BancoLocal, limite = 50): Promise<Checkin[]> {
  const linhas = await db.getAllAsync<{ id: number; registrado_em: string }>(
    'SELECT id, registrado_em FROM checkins ORDER BY registrado_em DESC, id DESC LIMIT ?',
    limite,
  );
  return linhas.map((l) => ({ id: l.id, registradoEm: l.registrado_em }));
}

/** Check-ins desde a meia-noite local do aparelho. */
export async function contarCheckinsHoje(db: BancoLocal, agora: Date = new Date()): Promise<number> {
  const inicio = new Date(agora);
  inicio.setHours(0, 0, 0, 0);
  const l = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM checkins WHERE registrado_em >= ?',
    inicio.toISOString(),
  );
  return l?.total ?? 0;
}

export async function removerCheckin(db: BancoLocal, id: number): Promise<void> {
  await db.runAsync('DELETE FROM checkins WHERE id = ?', id);
}

/* ------------------------------------------------------------------ */
/* Cache das respostas da API                                          */
/* ------------------------------------------------------------------ */

export type ChaveCache = 'ultima_leitura' | 'previsao_amanha' | 'pontos' | 'totem_atual';

export interface ItemCache<T> {
  dado: T;
  origem: OrigemDado;
  salvoEm: string;
}

export async function salvarCache<T>(
  db: BancoLocal,
  chave: ChaveCache,
  dado: T,
  origem: OrigemDado,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO cache_api (chave, json, origem, salvo_em) VALUES (?, ?, ?, ?)
     ON CONFLICT(chave) DO UPDATE SET json = excluded.json, origem = excluded.origem, salvo_em = excluded.salvo_em`,
    chave,
    JSON.stringify(dado),
    origem,
    agoraIso(),
  );
}

export async function lerCache<T>(db: BancoLocal, chave: ChaveCache): Promise<ItemCache<T> | null> {
  const l = await db.getFirstAsync<{ json: string; origem: string; salvo_em: string }>(
    'SELECT json, origem, salvo_em FROM cache_api WHERE chave = ?',
    chave,
  );
  if (!l) return null;
  try {
    return { dado: JSON.parse(l.json) as T, origem: l.origem as OrigemDado, salvoEm: l.salvo_em };
  } catch {
    return null;
  }
}

export async function removerCache(db: BancoLocal, chave: ChaveCache): Promise<void> {
  await db.runAsync('DELETE FROM cache_api WHERE chave = ?', chave);
}

/* ------------------------------------------------------------------ */
/* Histórico local de alertas                                          */
/* ------------------------------------------------------------------ */

export interface AlertaHistorico extends AlertaDto {
  vistoEm: string;
}

/** Guarda os alertas recebidos para consulta posterior, inclusive offline. */
export async function registrarAlertasVistos(db: BancoLocal, alertas: AlertaDto[]): Promise<void> {
  const t = agoraIso();
  for (const a of alertas) {
    await db.runAsync(
      `INSERT INTO alertas_historico (id, totem_codigo, nivel, mensagem, ativo, criado_em, visto_em)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET ativo = excluded.ativo, mensagem = excluded.mensagem`,
      a.id,
      a.totemCodigo,
      a.nivel,
      a.mensagem,
      a.ativo ? 1 : 0,
      a.criadoEm,
      t,
    );
  }
}

/**
 * Marca como encerrados no histórico os alertas que deixaram de vir
 * na lista de vigentes da API.
 */
export async function sincronizarVigentes(db: BancoLocal, idsVigentes: string[]): Promise<void> {
  if (idsVigentes.length === 0) {
    await db.runAsync('UPDATE alertas_historico SET ativo = 0 WHERE ativo = 1');
    return;
  }
  const marcadores = idsVigentes.map(() => '?').join(',');
  await db.runAsync(
    `UPDATE alertas_historico SET ativo = 0 WHERE ativo = 1 AND id NOT IN (${marcadores})`,
    ...idsVigentes,
  );
}

export async function listarHistoricoAlertas(db: BancoLocal, limite = 100): Promise<AlertaHistorico[]> {
  const linhas = await db.getAllAsync<{
    id: string;
    totem_codigo: string;
    nivel: string;
    mensagem: string;
    ativo: number;
    criado_em: string;
    visto_em: string;
  }>('SELECT * FROM alertas_historico ORDER BY criado_em DESC LIMIT ?', limite);
  return linhas.map((l) => ({
    id: l.id,
    leituraSensorId: '',
    totemCodigo: l.totem_codigo,
    origem: 'Totem',
    nivel: (l.nivel === 'Perigo' || l.nivel === 'Atencao' ? l.nivel : 'Normal') as AlertaDto['nivel'],
    mensagem: l.mensagem,
    ativo: l.ativo === 1,
    criadoEm: l.criado_em,
    vistoEm: l.visto_em,
  }));
}
