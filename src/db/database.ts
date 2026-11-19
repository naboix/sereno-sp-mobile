/**
 * Banco local (expo-sqlite): inicialização e migrações.
 *
 * Princípio de minimização: o banco guarda só o necessário para a
 * jornada do cidadão funcionar sem internet. NÃO são armazenados:
 * nome civil, CPF, telefone, e-mail, condição de saúde nem a
 * localização GPS do aparelho.
 */

/** Subconjunto da API do SQLiteDatabase usado pelo app (facilita testes). */
export interface BancoLocal {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: SqlParam[]): Promise<{ changes: number; lastInsertRowId: number }>;
  getAllAsync<T>(sql: string, ...params: SqlParam[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, ...params: SqlParam[]): Promise<T | null>;
}

export type SqlParam = string | number | null;

export const NOME_BANCO = 'sereno.db';
export const VERSAO_ESQUEMA = 1;

const MIGRACAO_V1 = `
CREATE TABLE IF NOT EXISTS perfil (
  id                   INTEGER PRIMARY KEY CHECK (id = 1),
  apelido              TEXT    NOT NULL,
  faixa_etaria         TEXT    NOT NULL,
  bairro               TEXT    NOT NULL,
  consentimento_local  INTEGER NOT NULL CHECK (consentimento_local IN (0, 1)),
  criado_em            TEXT    NOT NULL,
  atualizado_em        TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS preferencias (
  chave  TEXT PRIMARY KEY NOT NULL,
  valor  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS favoritos (
  ponto_id    TEXT PRIMARY KEY NOT NULL,
  nome        TEXT NOT NULL,
  endereco    TEXT NOT NULL,
  latitude    REAL NOT NULL,
  longitude   REAL NOT NULL,
  tem_agua    INTEGER NOT NULL,
  tem_sombra  INTEGER NOT NULL,
  salvo_em    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS checkins (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo           TEXT NOT NULL CHECK (tipo IN ('bebi_agua')),
  registrado_em  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_checkins_data ON checkins (registrado_em);

CREATE TABLE IF NOT EXISTS cache_api (
  chave     TEXT PRIMARY KEY NOT NULL,
  json      TEXT NOT NULL,
  origem    TEXT NOT NULL,
  salvo_em  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS alertas_historico (
  id            TEXT PRIMARY KEY NOT NULL,
  totem_codigo  TEXT NOT NULL,
  nivel         TEXT NOT NULL,
  mensagem      TEXT NOT NULL,
  ativo         INTEGER NOT NULL,
  criado_em     TEXT NOT NULL,
  visto_em      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_alertas_criado ON alertas_historico (criado_em);
`;

/** Executado pelo SQLiteProvider (onInit) antes de qualquer tela abrir. */
export async function migrarBanco(db: BancoLocal): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  const linha = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const atual = linha?.user_version ?? 0;
  if (atual >= VERSAO_ESQUEMA) return;

  if (atual < 1) {
    await db.execAsync(MIGRACAO_V1);
  }
  await db.execAsync(`PRAGMA user_version = ${VERSAO_ESQUEMA}`);
}

/** "Apagar meus dados": remove tudo que o app guardou no aparelho. */
export async function apagarTodosOsDados(db: BancoLocal): Promise<void> {
  await db.execAsync(`
    DELETE FROM perfil;
    DELETE FROM preferencias;
    DELETE FROM favoritos;
    DELETE FROM checkins;
    DELETE FROM cache_api;
    DELETE FROM alertas_historico;
  `);
}
