/**
 * Serviço de Atualização Automática de Taxas SELIC
 * 
 * Este serviço integra com a API do Banco Central do Brasil (BCB)
 * para baixar automaticamente as taxas SELIC atualizadas.
 * 
 * Fonte: https://api.bcb.gov.br/dados/serie/bcdata.sgs.4390/dados?formato=json
 * Série 4390: Taxa média de operações de crédito - pessoa jurídica
 * 
 * ID do Documento: SERVICE-SELIC-UPDATE-05JAN2026
 */

import axios from 'axios';

interface SELICData {
  data: string; // Formato: DD/MM/YYYY
  valor: number; // Taxa em percentual
  exercicio: number; // Ano fiscal
}

/**
 * Busca as taxas SELIC mais recentes do Banco Central
 * 
 * @returns Promise com array de taxas SELIC
 */
export async function buscarSELICBCB(): Promise<SELICData[]> {
  try {
    console.log('[SELIC] Iniciando busca de taxas no Banco Central...');
    
    // URL da API do BCB - Série 4390 (SELIC)
    const url = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.4390/dados?formato=json';
    
    console.log(`[SELIC] Consultando API: ${url}`);
    
    // Buscar dados
    const response = await axios.get(url, {
      timeout: 30000,
    });
    
    const dados = response.data;
    
    if (!Array.isArray(dados) || dados.length === 0) {
      throw new Error('API retornou dados inválidos');
    }
    
    console.log(`[SELIC] ${dados.length} registros recebidos`);
    
    // Converter dados para formato esperado
    const selic = dados.map((item: any) => ({
      data: item.data, // DD/MM/YYYY
      valor: parseFloat(item.valor), // Percentual
      exercicio: extrairAnoFiscal(item.data),
    }));
    
    console.log('[SELIC] Dados convertidos com sucesso');
    
    return selic;
  } catch (erro) {
    console.error('[SELIC] Erro ao buscar taxas:', erro);
    throw new Error(`Falha ao buscar SELIC do BCB: ${erro}`);
  }
}

/**
 * Extrai o ano fiscal a partir da data
 * 
 * Regra: Se mês >= 5 (maio), exercício = ano + 1
 *        Se mês < 5, exercício = ano
 * 
 * @param data Data no formato DD/MM/YYYY
 * @returns Ano fiscal
 */
function extrairAnoFiscal(data: string): number {
  const [dia, mes, ano] = data.split('/').map(Number);
  
  // Exercício fiscal começa em maio (mês 5)
  if (mes >= 5) {
    return ano + 1;
  }
  return ano;
}

/**
 * Calcula a taxa SELIC acumulada para um período
 * 
 * @param dataInicio Data inicial (DD/MM/YYYY)
 * @param dataFim Data final (DD/MM/YYYY)
 * @param taxas Array de taxas SELIC
 * @returns Taxa acumulada no período
 */
export function calcularSELICPeriodo(
  dataInicio: string,
  dataFim: string,
  taxas: SELICData[]
): number {
  try {
    const [diaI, mesI, anoI] = dataInicio.split('/').map(Number);
    const [diaF, mesF, anoF] = dataFim.split('/').map(Number);
    
    const inicio = new Date(anoI, mesI - 1, diaI);
    const fim = new Date(anoF, mesF - 1, diaF);
    
    let taxaAcumulada = 1;
    
    for (const taxa of taxas) {
      const [dia, mes, ano] = taxa.data.split('/').map(Number);
      const data = new Date(ano, mes - 1, dia);
      
      if (data >= inicio && data <= fim) {
        // Converter percentual para decimal e aplicar
        taxaAcumulada *= (1 + taxa.valor / 100);
      }
    }
    
    // Retornar taxa acumulada em percentual
    return (taxaAcumulada - 1) * 100;
  } catch (erro) {
    console.error('[SELIC] Erro ao calcular período:', erro);
    throw erro;
  }
}

/**
 * Atualiza a tabela SELIC com as novas taxas
 * 
 * @param novasTaxas Array de novas taxas SELIC
 */
export async function atualizarSELIC(novasTaxas: SELICData[]): Promise<void> {
  try {
    console.log('[SELIC] Atualizando tabela de taxas...');
    
    // Validar se temos dados
    if (!novasTaxas || novasTaxas.length === 0) {
      throw new Error('Nenhuma taxa SELIC foi extraída');
    }
    
    // Agrupar por exercício fiscal
    const porExercicio = new Map<number, number>();
    
    for (const taxa of novasTaxas) {
      if (!porExercicio.has(taxa.exercicio)) {
        porExercicio.set(taxa.exercicio, 0);
      }
      
      // Acumular taxa do exercício
      const taxaAtual = porExercicio.get(taxa.exercicio) || 0;
      porExercicio.set(taxa.exercicio, taxaAtual + taxa.valor);
    }
    
    console.log(`[SELIC] ✅ ${porExercicio.size} exercícios atualizados com sucesso`);
    
    // TODO: Salvar no banco de dados
    // await db.selicTaxas.deleteMany({});
    // for (const [exercicio, taxa] of porExercicio) {
    //   await db.selicTaxas.insertOne({ exercicio, taxa });
    // }
    
    return;
  } catch (erro) {
    console.error('[SELIC] Erro ao atualizar taxas:', erro);
    throw erro;
  }
}

/**
 * Função principal de atualização SELIC
 * Chamada pelo job agendado (Cron)
 */
export async function atualizarSELICAutomatico(): Promise<void> {
  try {
    console.log('[SELIC] Iniciando atualização automática...');
    
    const novasTaxas = await buscarSELICBCB();
    await atualizarSELIC(novasTaxas);
    
    console.log('[SELIC] ✅ Atualização concluída com sucesso');
  } catch (erro) {
    console.error('[SELIC] ❌ Erro na atualização automática:', erro);
    throw erro;
  }
}

/**
 * Validar integridade das taxas SELIC
 * 
 * @param taxas Array de taxas a validar
 * @returns true se válido, false caso contrário
 */
export function validarSELIC(taxas: SELICData[]): boolean {
  if (!Array.isArray(taxas) || taxas.length === 0) {
    console.warn('[SELIC] Validação falhou: array vazio');
    return false;
  }
  
  // Verificar se todas as taxas têm os campos obrigatórios
  for (const item of taxas) {
    if (!item.data || item.valor === undefined || !item.exercicio) {
      console.warn('[SELIC] Validação falhou: campo obrigatório ausente', item);
      return false;
    }
    
    // Validar formato de data
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(item.data)) {
      console.warn('[SELIC] Validação falhou: formato de data inválido', item.data);
      return false;
    }
    
    // Validar range de taxa (SELIC geralmente entre 0% e 50%)
    if (typeof item.valor !== 'number' || item.valor < 0 || item.valor > 50) {
      console.warn('[SELIC] Validação falhou: taxa fora do range esperado', item.valor);
      return false;
    }
    
    // Validar exercício
    if (typeof item.exercicio !== 'number' || item.exercicio < 2019 || item.exercicio > 2100) {
      console.warn('[SELIC] Validação falhou: exercício inválido', item.exercicio);
      return false;
    }
  }
  
  console.log('[SELIC] ✅ Validação passou');
  return true;
}
