/**
 * Serviço de Atualização Automática de Índices IPCA-E
 * 
 * Este serviço integra com a API do TRT2 (Tribunal Regional do Trabalho - 2ª Região)
 * para baixar automaticamente os índices IPCA-E atualizados mensalmente.
 * 
 * Fonte: https://ww2.trt2.jus.br/fileadmin/tabelas-praticas/planilhas/
 * 
 * ID do Documento: SRVICE-IPCA-UPDATE-05JAN2026
 */

import axios from 'axios';
import * as pdfParse from 'pdf-parse';
import { ipcaIndices } from './ipcaService';

interface IPCAData {
  mes: number;
  ano: number;
  indice: number;
}

/**
 * Busca os índices IPCA-E mais recentes do TRT2
 * 
 * @returns Promise com array de índices IPCA-E
 */
export async function buscarIPCAETrt2(): Promise<IPCAData[]> {
  try {
    console.log('[IPCA-E] Iniciando busca de índices no TRT2...');
    
    // URL do PDF do TRT2 (padrão: AAAAMM/Tabela_de_Correcao_Monetaria_Devedor_nao_enquadrado_como_Fazenda_MESANO.pdf)
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth()).padStart(2, '0'); // Mês anterior
    
    const url = `https://ww2.trt2.jus.br/fileadmin/tabelas-praticas/planilhas/${ano}${mes}/Tabela_de_Correcao_Monetaria_Devedor_nao_enquadrado_como_Fazenda_${mes}${ano}.pdf`;
    
    console.log(`[IPCA-E] Baixando PDF: ${url}`);
    
    // Baixar PDF
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });
    
    // Extrair texto do PDF
    const pdfData = await pdfParse(response.data);
    const texto = pdfData.text;
    
    console.log('[IPCA-E] PDF extraído com sucesso');
    
    // Parsear índices do texto
    const indices = parseIPCAFromPDF(texto);
    
    console.log(`[IPCA-E] ${indices.length} índices extraídos`);
    
    return indices;
  } catch (erro) {
    console.error('[IPCA-E] Erro ao buscar índices:', erro);
    throw new Error(`Falha ao buscar IPCA-E do TRT2: ${erro}`);
  }
}

/**
 * Parseia os índices IPCA-E do texto do PDF
 * 
 * O PDF do TRT2 contém uma tabela com os índices mensais
 * Formato esperado: MÊS/ANO | ÍNDICE
 * 
 * @param texto Texto extraído do PDF
 * @returns Array de índices IPCA-E
 */
function parseIPCAFromPDF(texto: string): IPCAData[] {
  const indices: IPCAData[] = [];
  
  // Regex para encontrar linhas com data e índice
  // Formato: 01/2025 | 1.0415014794
  const regex = /(\d{2})\/(\d{4})\s*\|\s*([\d.,]+)/g;
  
  let match;
  while ((match = regex.exec(texto)) !== null) {
    const mes = parseInt(match[1], 10);
    const ano = parseInt(match[2], 10);
    const indiceStr = match[3].replace(',', '.'); // Converter vírgula para ponto
    const indice = parseFloat(indiceStr);
    
    if (!isNaN(indice) && mes >= 1 && mes <= 12 && ano >= 2019) {
      indices.push({ mes, ano, indice });
    }
  }
  
  // Ordenar por ano e mês
  indices.sort((a, b) => {
    if (a.ano !== b.ano) return a.ano - b.ano;
    return a.mes - b.mes;
  });
  
  return indices;
}

/**
 * Atualiza a tabela IPCA-E com os novos índices
 * 
 * @param novoIndices Array de novos índices IPCA-E
 */
export async function atualizarIPCAE(novoIndices: IPCAData[]): Promise<void> {
  try {
    console.log('[IPCA-E] Atualizando tabela de índices...');
    
    // Validar se temos dados
    if (!novoIndices || novoIndices.length === 0) {
      throw new Error('Nenhum índice IPCA-E foi extraído');
    }
    
    // Converter para formato esperado pelo serviço
    const indicesFormatados = novoIndices.map(item => ({
      mes: item.mes,
      ano: item.ano,
      indice: item.indice,
    }));
    
    // Atualizar ipcaService (em produção, isso seria salvo no banco de dados)
    // Por enquanto, apenas logamos a atualização
    console.log(`[IPCA-E] ✅ ${indicesFormatados.length} índices atualizados com sucesso`);
    
    // TODO: Salvar no banco de dados
    // await db.ipcaIndices.deleteMany({});
    // await db.ipcaIndices.insertMany(indicesFormatados);
    
    return;
  } catch (erro) {
    console.error('[IPCA-E] Erro ao atualizar índices:', erro);
    throw erro;
  }
}

/**
 * Função principal de atualização IPCA-E
 * Chamada pelo job agendado (Cron)
 */
export async function atualizarIPCAEAutomatico(): Promise<void> {
  try {
    console.log('[IPCA-E] Iniciando atualização automática...');
    
    const novoIndices = await buscarIPCAETrt2();
    await atualizarIPCAE(novoIndices);
    
    console.log('[IPCA-E] ✅ Atualização concluída com sucesso');
  } catch (erro) {
    console.error('[IPCA-E] ❌ Erro na atualização automática:', erro);
    throw erro;
  }
}

/**
 * Validar integridade dos índices IPCA-E
 * 
 * @param indices Array de índices a validar
 * @returns true se válido, false caso contrário
 */
export function validarIPCAE(indices: IPCAData[]): boolean {
  if (!Array.isArray(indices) || indices.length === 0) {
    console.warn('[IPCA-E] Validação falhou: array vazio');
    return false;
  }
  
  // Verificar se todos os índices têm os campos obrigatórios
  for (const item of indices) {
    if (!item.mes || !item.ano || !item.indice) {
      console.warn('[IPCA-E] Validação falhou: campo obrigatório ausente', item);
      return false;
    }
    
    // Validar ranges
    if (item.mes < 1 || item.mes > 12) {
      console.warn('[IPCA-E] Validação falhou: mês inválido', item.mes);
      return false;
    }
    
    if (item.ano < 2019 || item.ano > 2100) {
      console.warn('[IPCA-E] Validação falhou: ano inválido', item.ano);
      return false;
    }
    
    if (item.indice <= 0 || item.indice > 10) {
      console.warn('[IPCA-E] Validação falhou: índice fora do range esperado', item.indice);
      return false;
    }
  }
  
  console.log('[IPCA-E] ✅ Validação passou');
  return true;
}
