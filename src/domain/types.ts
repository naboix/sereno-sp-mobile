/**
 * Contratos da Sereno.Api (.NET 10).
 *
 * Cada tipo abaixo espelha um DTO de resposta do backend existente
 * (Sereno.Application/DTOs). O ASP.NET Core serializa as propriedades
 * em camelCase por padrão (System.Text.Json), por isso "TotemCodigo"
 * vira "totemCodigo" no JSON.
 *
 * Regras de serialização confirmadas no código:
 *  - Guid ........ string
 *  - DateTime .... string ISO 8601 (colunas "timestamp with time zone", UTC)
 *  - DateOnly .... string "yyyy-MM-dd"
 *  - NivelRisco .. string produzida por Enum.ToString(): "Normal" | "Atencao" | "Perigo"
 *
 * Nenhum campo foi inventado. Campos que a proposta previa e o backend
 * NÃO possui (ex.: horário de funcionamento do ponto) ficam fora destes
 * tipos e são tratados na interface como "não informado pela API".
 */

/** Sereno.Domain/Enums/NivelRisco.cs */
export type NivelRisco = 'Normal' | 'Atencao' | 'Perigo';

/** Sereno.Application/DTOs/TotemRespostaDto.cs — GET /api/totens */
export interface TotemDto {
  id: string;
  codigo: string;
  ativo: boolean;
  pontoRefrescoId: string | null;
}

/** Sereno.Application/DTOs/LeituraRespostaDto.cs — GET /api/leituras/ultima */
export interface LeituraDto {
  id: string;
  totemCodigo: string;
  temperatura: number;
  umidade: number;
  indiceCalor: number;
  nivel: NivelRisco;
  coletadaEm: string;
}

/** Sereno.Application/DTOs/AlertaRespostaDto.cs — GET /api/alertas */
export interface AlertaDto {
  id: string;
  leituraSensorId: string;
  totemCodigo: string;
  origem: string;
  nivel: NivelRisco;
  mensagem: string;
  ativo: boolean;
  criadoEm: string;
}

/** Sereno.Application/DTOs/PontoRefrescoRespostaDto.cs — GET /api/pontos[/proximos|/{id}] */
export interface PontoRefrescoDto {
  id: string;
  nome: string;
  endereco: string;
  latitude: number;
  longitude: number;
  temAgua: boolean;
  temSombra: boolean;
  /** Preenchido apenas por GET /api/pontos/proximos. */
  distanciaKm: number | null;
}

/** Sereno.Application/DTOs/PrevisaoRespostaDto.cs — GET /api/previsoes/amanha */
export interface PrevisaoDto {
  id: string;
  dataReferencia: string;
  probabilidade: number;
  probabilidadePercentual: number;
  nivel: NivelRisco;
  mensagem: string;
  versaoModelo: string;
  criadoEm: string;
}

/** Corpo anônimo de Sereno.Api/Controllers/HealthController.cs — GET /health */
export interface HealthDto {
  status: string;
  api: string;
  banco: string;
}

/** Corpo de erro usado por todos os controllers: new { erro = ex.Message } */
export interface ErroApiDto {
  erro: string;
}

/**
 * De onde veio o dado exibido. A interface SEMPRE mostra isso ao
 * cidadão, para que uma leitura antiga nunca pareça atual.
 *  - api ........ resposta recebida agora da Sereno.Api
 *  - simulado ... resposta recebida agora do servidor de contrato de demonstração
 *  - cache ...... última resposta salva no SQLite do celular
 *  - mock ....... dados de demonstração embutidos no app (modo mock)
 */
export type OrigemDado = 'api' | 'simulado' | 'cache' | 'mock';

export interface ResultadoComOrigem<T> {
  dado: T;
  origem: OrigemDado;
  /** Quando o dado foi obtido/salvo no aparelho (ISO). */
  obtidoEm: string;
}
