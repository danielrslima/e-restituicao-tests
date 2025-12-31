/**
 * Serviço de Índices IPCA-E
 * Busca e calcula coeficientes de deflação baseados no IPCA-E do IBGE
 * 
 * O IPCA-E é usado para deflacionar valores de alvarás recebidos em datas diferentes,
 * trazendo todos para a mesma base de comparação (data mais recente)
 */

// Tabela de índices IPCA-E extraída da planilha Excel (2020-2025)
// Estes são os coeficientes de correção para trazer valores à data-base mais recente
const IPCA_E_INDICES: Record<string, number> = {
  // 2020
  "2020-01": 1.3867673675,
  "2020-02": 1.3826195089,
  "2020-03": 1.3794467813,
  "2020-04": 1.3732670795,
  "2020-05": 1.3604785808,
  "2020-06": 1.3495472481,
  "2020-07": 1.3867673675,
  "2020-08": 1.3826195089,
  "2020-09": 1.3794467813,
  "2020-10": 1.3732670795,
  "2020-11": 1.3604785808,
  "2020-12": 1.3495472481,
  // 2021
  "2021-01": 1.3353920919,
  "2021-02": 1.3250566501,
  "2021-03": 1.3187267616,
  "2021-04": 1.3065756085,
  "2021-05": 1.2987829110,
  "2021-06": 1.2930933005,
  "2021-07": 1.2824489740,
  "2021-08": 1.2732813483,
  "2021-09": 1.2620491112,
  "2021-10": 1.2478239185,
  "2021-11": 1.2330275875,
  "2021-12": 1.2187680019,
  // 2022
  "2022-01": 1.2093351874,
  "2022-02": 1.2023614907,
  "2022-03": 1.1905748002,
  "2022-04": 1.1793707778,
  "2022-05": 1.1593146347,
  "2022-06": 1.1525147973,
  "2022-07": 1.1446169405,
  "2022-08": 1.1431308703,
  "2022-09": 1.1515370911,
  "2022-10": 1.1558136014,
  "2022-11": 1.1539672538,
  "2022-12": 1.1478834714,
  // 2023
  "2023-01": 1.1419453556,
  "2023-02": 1.1356990110,
  "2023-03": 1.1271328017,
  "2023-04": 1.1194088804,
  "2023-05": 1.1130644133,
  "2023-06": 1.1074165887,
  "2023-07": 1.1069737992,
  "2023-08": 1.1077492236,
  "2023-09": 1.1046561863,
  "2023-10": 1.1008033745,
  "2023-11": 1.0984965318,
  "2023-12": 1.0948834165,
  // 2024
  "2024-01": 1.0905213312,
  "2024-02": 1.0871511626,
  "2024-03": 1.0787370139,
  "2024-04": 1.0748674909,
  "2024-05": 1.0726149994,
  "2024-06": 1.0679161682,
  "2024-07": 1.0637674751,
  "2024-08": 1.0605857179,
  "2024-09": 1.0585744265,
  "2024-10": 1.0572000664,
  "2024-11": 1.0515218485,
  "2024-12": 1.0450425844,
  // 2025
  "2025-01": 1.0415014794,
  "2025-02": 1.0403570866,
  "2025-03": 1.0277161776,
  "2025-04": 1.0211806217,
  "2025-05": 1.0168083458,
  "2025-06": 1.0131609663,
  "2025-07": 1.0105335790,
  "2025-08": 1.0072097867,
  "2025-09": 1.0086218573,
  "2025-10": 1.0038036000,
  "2025-11": 1.0020000000,
  "2025-12": 1.0000000000,
};

/**
 * Obtém o coeficiente IPCA-E para uma data específica
 * @param date Data do alvará/pagamento
 * @param useDeflation Se true, aplica deflação; se false, retorna 1 (sem deflação)
 * @returns Coeficiente de correção
 */
export function getIpcaCoefficient(date: Date, useDeflation: boolean = true): number {
  if (!useDeflation) {
    return 1;
  }

  // Usar UTC para evitar problemas de fuso horário
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const key = `${year}-${month}`;

  // Busca o índice na tabela
  const index = IPCA_E_INDICES[key];
  
  if (index) {
    return index;
  }

  // Se não encontrar, retorna 1 (sem correção)
  // Isso pode acontecer para datas muito antigas ou futuras
  console.warn(`Índice IPCA-E não encontrado para ${key}, usando 1.0`);
  return 1;
}

/**
 * Obtém o último mês do período de uma data (fim do mês)
 * @param date Data de referência
 * @returns Data do último dia do mês
 */
export function getEndOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Calcula o exercício fiscal baseado na data do alvará
 * Exercício = Ano do pagamento + 1
 * Ex: Alvará em 18/02/2021 → Exercício 2022
 */
export function getExercicioFiscal(dataAlvara: Date): number {
  // Usar UTC para evitar problemas de fuso horário
  return dataAlvara.getUTCFullYear() + 1;
}

/**
 * Deflaciona um valor usando o índice IPCA-E
 * @param valor Valor original
 * @param dataOriginal Data do valor original
 * @param useDeflation Se deve aplicar deflação
 * @returns Valor deflacionado
 */
export function deflacionarValor(valor: number, dataOriginal: Date, useDeflation: boolean = true): number {
  const coeficiente = getIpcaCoefficient(dataOriginal, useDeflation);
  return valor * coeficiente;
}

// Cache para índices atualizados via API
let cachedIndices: Record<string, number> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Atualiza os índices IPCA-E via API do IBGE (para implementação futura)
 * Por enquanto usa a tabela estática extraída da planilha
 */
export async function updateIpcaIndices(): Promise<void> {
  // TODO: Implementar busca automática via API do IBGE
  // https://servicodados.ibge.gov.br/api/v3/agregados/7060/periodos/-12/variaveis/63?localidades=N1[all]
  console.log("Usando índices IPCA-E da tabela estática");
}

export { IPCA_E_INDICES };
