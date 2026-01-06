/**
 * Job Agendado para Atualização Automática de Índices
 * 
 * Este job é executado automaticamente todo mês para atualizar:
 * - Índices IPCA-E (do TRT2)
 * - Taxas SELIC (do Banco Central)
 * 
 * Agendamento: 1º dia de cada mês às 02:00 (UTC)
 * 
 * ID do Documento: JOB-UPDATE-INDICES-05JAN2026
 */

import cron from 'node-cron';
import { atualizarIPCAEAutomatico } from '../services/ipcaUpdateService';
import { atualizarSELICAutomatico } from '../services/selicUpdateService';
import { notifyOwner } from '../_core/notification';

/**
 * Estado do job
 */
interface JobStatus {
  ultimaExecucao: Date | null;
  proximaExecucao: Date | null;
  status: 'ativo' | 'inativo' | 'erro';
  ultimoErro: string | null;
}

let jobStatus: JobStatus = {
  ultimaExecucao: null,
  proximaExecucao: null,
  status: 'inativo',
  ultimoErro: null,
};

/**
 * Inicia o job agendado
 * 
 * Agendamento: 1º dia de cada mês às 02:00 (UTC)
 * Expressão Cron: 0 2 1 * * (minuto hora dia mês dia_semana)
 */
export function iniciarJobAtualizacaoIndices(): void {
  try {
    console.log('[JOB] Iniciando job de atualização de índices...');
    
    // Agendar para 1º dia de cada mês às 02:00 UTC
    const job = cron.schedule('0 2 1 * *', async () => {
      console.log('[JOB] Executando atualização de índices...');
      
      jobStatus.ultimaExecucao = new Date();
      jobStatus.status = 'ativo';
      
      try {
        // Atualizar IPCA-E
        console.log('[JOB] Atualizando IPCA-E...');
        await atualizarIPCAEAutomatico();
        
        // Atualizar SELIC
        console.log('[JOB] Atualizando SELIC...');
        await atualizarSELICAutomatico();
        
        // Notificar sucesso
        console.log('[JOB] ✅ Atualização concluída com sucesso');
        
        jobStatus.ultimoErro = null;
        jobStatus.status = 'ativo';
        
        // Notificar owner
        await notifyOwner({
          title: '✅ Índices Atualizados com Sucesso',
          content: `
            Os índices foram atualizados automaticamente:
            - IPCA-E: Atualizado do TRT2
            - SELIC: Atualizado do Banco Central
            
            Próxima atualização: ${calcularProximaExecucao().toLocaleString('pt-BR')}
          `,
        });
      } catch (erro) {
        console.error('[JOB] ❌ Erro na atualização:', erro);
        
        jobStatus.ultimoErro = String(erro);
        jobStatus.status = 'erro';
        
        // Notificar erro
        await notifyOwner({
          title: '❌ Erro na Atualização de Índices',
          content: `
            Ocorreu um erro ao atualizar os índices:
            ${String(erro)}
            
            Verifique os logs para mais detalhes.
          `,
        });
      }
    });
    
    jobStatus.proximaExecucao = calcularProximaExecucao();
    jobStatus.status = 'ativo';
    
    console.log('[JOB] ✅ Job iniciado com sucesso');
    console.log(`[JOB] Próxima execução: ${jobStatus.proximaExecucao.toLocaleString('pt-BR')}`);
  } catch (erro) {
    console.error('[JOB] ❌ Erro ao iniciar job:', erro);
    jobStatus.status = 'erro';
    jobStatus.ultimoErro = String(erro);
  }
}

/**
 * Calcula a próxima data de execução (1º dia do próximo mês às 02:00 UTC)
 */
function calcularProximaExecucao(): Date {
  const agora = new Date();
  const proximoMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 1, 2, 0, 0);
  
  return proximoMes;
}

/**
 * Retorna o status atual do job
 */
export function obterStatusJob(): JobStatus {
  return {
    ...jobStatus,
    proximaExecucao: calcularProximaExecucao(),
  };
}

/**
 * Executa a atualização manualmente (para testes)
 */
export async function executarAtualizacaoManual(): Promise<void> {
  try {
    console.log('[JOB] Executando atualização manual...');
    
    jobStatus.ultimaExecucao = new Date();
    jobStatus.status = 'ativo';
    
    // Atualizar IPCA-E
    console.log('[JOB] Atualizando IPCA-E...');
    await atualizarIPCAEAutomatico();
    
    // Atualizar SELIC
    console.log('[JOB] Atualizando SELIC...');
    await atualizarSELICAutomatico();
    
    console.log('[JOB] ✅ Atualização manual concluída com sucesso');
    
    jobStatus.ultimoErro = null;
    jobStatus.status = 'ativo';
  } catch (erro) {
    console.error('[JOB] ❌ Erro na atualização manual:', erro);
    
    jobStatus.ultimoErro = String(erro);
    jobStatus.status = 'erro';
    
    throw erro;
  }
}

/**
 * Para o job agendado
 */
export function pararJob(): void {
  console.log('[JOB] Parando job...');
  jobStatus.status = 'inativo';
}

/**
 * Retorna informações detalhadas do job
 */
export function obterInfoJob(): {
  status: JobStatus;
  agendamento: string;
  descricao: string;
} {
  return {
    status: jobStatus,
    agendamento: '1º dia de cada mês às 02:00 UTC',
    descricao: 'Atualiza automaticamente os índices IPCA-E (TRT2) e SELIC (BCB)',
  };
}
