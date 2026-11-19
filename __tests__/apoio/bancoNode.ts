/**
 * Adaptador de testes: implementa a interface BancoLocal sobre o SQLite
 * embutido no Node (node:sqlite). Assim os repositórios são testados
 * com SQL REAL, o mesmo motor usado pelo expo-sqlite no celular.
 */
import type { BancoLocal, SqlParam } from '@/db/database';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync } = require('node:sqlite');

export function criarBancoMemoria(): BancoLocal & { fechar: () => void } {
  const db = new DatabaseSync(':memory:');
  return {
    async execAsync(sql: string) {
      db.exec(sql);
    },
    async runAsync(sql: string, ...params: SqlParam[]) {
      const r = db.prepare(sql).run(...params);
      return { changes: Number(r.changes), lastInsertRowId: Number(r.lastInsertRowid) };
    },
    async getAllAsync<T>(sql: string, ...params: SqlParam[]) {
      return db.prepare(sql).all(...params) as T[];
    },
    async getFirstAsync<T>(sql: string, ...params: SqlParam[]) {
      return (db.prepare(sql).get(...params) ?? null) as T | null;
    },
    fechar: () => db.close(),
  };
}
