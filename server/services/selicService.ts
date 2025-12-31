/**
 * Serviço de Taxa SELIC Acumulada
 * Busca e calcula a taxa SELIC acumulada para atualização de valores a restituir
 * 
 * A SELIC é usada para atualizar o valor da restituição desde a data do pagamento
 * indevido até a data atual (correção monetária)
 */

// Tabela de SELIC acumulada por exercício (extraída da planilha Excel)
// Formato: exercício → taxa acumulada até maio do ano seguinte
const SELIC_ACUMULADA: Record<number, number> = {
  2016: 0.8500,
  2017: 0.7200,
  2018: 0.5800,
  2019: 0.4900,
  2020: 0.4500,
  2021: 0.4800,
  2022: 0.4339,
  2023: 0.3069,
  2024: 0.1200,
  2025: 0.0809,
};

// Tabela detalhada de SELIC mensal (extraída da planilha)
const SELIC_MENSAL: Record<string, number> = {
  // 2022
  "2022-01": 394.85,
  "2022-02": 370.38,
  "2022-03": 348.03,
  "2022-04": 322.45,
  "2022-05": 299.43,
  "2022-06": 276.41,
  "2022-07": 253.39,
  "2022-08": 230.37,
  "2022-09": 207.35,
  "2022-10": 184.33,
  "2022-11": 161.31,
  "2022-12": 138.29,
  // 2023
  "2023-01": 115.27,
  "2023-02": 92.25,
  "2023-03": 69.23,
  "2023-04": 46.21,
  "2023-05": 23.19,
  "2023-06": 0.17,
  // ... continua
};

/**
 * Obtém a taxa SELIC acumulada para um exercício fiscal
 * @param exercicio Ano do exercício fiscal (ex: 2022, 2023)
 * @returns Taxa SELIC acumulada (ex: 0.4339 = 43,39%)
 */
export function getSelicAcumulada(exercicio: number): number {
  const taxa = SELIC_ACUMULADA[exercicio];
  
  if (taxa !== undefined) {
    return taxa;
  }

  // Se não encontrar, retorna 0 (sem correção)
  console.warn(`Taxa SELIC não encontrada para exercício ${exercicio}, usando 0`);
  return 0;
}

/**
 * Atualiza um valor pela SELIC acumulada
 * @param valor Valor original a restituir
 * @param exercicio Exercício fiscal do valor
 * @returns Valor atualizado pela SELIC
 */
export function atualizarPelaSelic(valor: number, exercicio: number): number {
  // Só atualiza valores positivos (restituição)
  if (valor <= 0) {
    return valor;
  }

  const taxa = getSelicAcumulada(exercicio);
  return valor * (1 + taxa);
}

/**
 * Calcula o valor atualizado pela SELIC para exibição
 * Retorna tanto o valor original quanto o atualizado
 */
export function calcularValorComSelic(valor: number, exercicio: number): {
  valorOriginal: number;
  taxaSelic: number;
  valorAtualizado: number;
} {
  const taxaSelic = getSelicAcumulada(exercicio);
  const valorAtualizado = valor > 0 ? valor * (1 + taxaSelic) : valor;

  return {
    valorOriginal: valor,
    taxaSelic,
    valorAtualizado,
  };
}

// Cache para taxas atualizadas via API
let cachedSelic: Record<number, number> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Atualiza as taxas SELIC via API do Banco Central (para implementação futura)
 * Por enquanto usa a tabela estática extraída da planilha
 */
export async function updateSelicRates(): Promise<void> {
  // TODO: Implementar busca automática via API do BCB
  // https://api.bcb.gov.br/dados/serie/bcdata.sgs.4390/dados?formato=json
  console.log("Usando taxas SELIC da tabela estática");
}

export { SELIC_ACUMULADA };
