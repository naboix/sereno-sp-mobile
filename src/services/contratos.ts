/**
 * Validação em tempo de execução dos contratos da Sereno.Api.
 *
 * O TypeScript só confere tipos na compilação. Como o JSON vem da rede,
 * cada resposta é conferida aqui antes de chegar às telas: se o backend
 * mudar um campo, o app mostra "resposta inesperada" em vez de exibir
 * um valor errado ao cidadão.
 */
import { normalizarNivel } from '@/domain/risco';
import type {
  AlertaDto,
  LeituraDto,
  PontoRefrescoDto,
  PrevisaoDto,
  TotemDto,
} from '@/domain/types';
import { ErroApi } from './http';

type Obj = Record<string, unknown>;

function obj(v: unknown): Obj {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) {
    throw new ErroApi('resposta_invalida', null);
  }
  return v as Obj;
}

function str(o: Obj, k: string): string {
  const v = o[k];
  if (typeof v !== 'string') throw new ErroApi('resposta_invalida', null);
  return v;
}

function num(o: Obj, k: string): number {
  const v = o[k];
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new ErroApi('resposta_invalida', null);
  return v;
}

function bool(o: Obj, k: string): boolean {
  const v = o[k];
  if (typeof v !== 'boolean') throw new ErroApi('resposta_invalida', null);
  return v;
}

function nivel(o: Obj, k: string) {
  const n = normalizarNivel(o[k]);
  if (!n) throw new ErroApi('resposta_invalida', null);
  return n;
}

function lista<T>(v: unknown, item: (x: unknown) => T): T[] {
  if (!Array.isArray(v)) throw new ErroApi('resposta_invalida', null);
  return v.map(item);
}

export function validarTotem(v: unknown): TotemDto {
  const o = obj(v);
  const ponto = o.pontoRefrescoId;
  return {
    id: str(o, 'id'),
    codigo: str(o, 'codigo'),
    ativo: bool(o, 'ativo'),
    pontoRefrescoId: typeof ponto === 'string' ? ponto : null,
  };
}

export function validarLeitura(v: unknown): LeituraDto {
  const o = obj(v);
  return {
    id: str(o, 'id'),
    totemCodigo: str(o, 'totemCodigo'),
    temperatura: num(o, 'temperatura'),
    umidade: num(o, 'umidade'),
    indiceCalor: num(o, 'indiceCalor'),
    nivel: nivel(o, 'nivel'),
    coletadaEm: str(o, 'coletadaEm'),
  };
}

export function validarAlerta(v: unknown): AlertaDto {
  const o = obj(v);
  return {
    id: str(o, 'id'),
    leituraSensorId: str(o, 'leituraSensorId'),
    totemCodigo: str(o, 'totemCodigo'),
    origem: str(o, 'origem'),
    nivel: nivel(o, 'nivel'),
    mensagem: str(o, 'mensagem'),
    ativo: bool(o, 'ativo'),
    criadoEm: str(o, 'criadoEm'),
  };
}

export function validarPonto(v: unknown): PontoRefrescoDto {
  const o = obj(v);
  const d = o.distanciaKm;
  return {
    id: str(o, 'id'),
    nome: str(o, 'nome'),
    endereco: str(o, 'endereco'),
    latitude: num(o, 'latitude'),
    longitude: num(o, 'longitude'),
    temAgua: bool(o, 'temAgua'),
    temSombra: bool(o, 'temSombra'),
    distanciaKm: typeof d === 'number' && Number.isFinite(d) ? d : null,
  };
}

export function validarPrevisao(v: unknown): PrevisaoDto {
  const o = obj(v);
  return {
    id: str(o, 'id'),
    dataReferencia: str(o, 'dataReferencia'),
    probabilidade: num(o, 'probabilidade'),
    probabilidadePercentual: num(o, 'probabilidadePercentual'),
    nivel: nivel(o, 'nivel'),
    mensagem: str(o, 'mensagem'),
    versaoModelo: str(o, 'versaoModelo'),
    criadoEm: str(o, 'criadoEm'),
  };
}

export const validarListaTotens = (v: unknown) => lista(v, validarTotem);
export const validarListaAlertas = (v: unknown) => lista(v, validarAlerta);
export const validarListaPontos = (v: unknown) => lista(v, validarPonto);
