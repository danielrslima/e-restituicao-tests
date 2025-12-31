/**
 * Rota REST para receber dados do site externo restituicaoia.com.br
 * 
 * O site externo envia dados via POST para /api/formulario/receber
 * Os dados já vêm com os cálculos prontos do site
 */

import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { irpfForms } from "../../drizzle/schema";
import { notifyOwner } from "../_core/notification";

const router = Router();

// Interface para os dados recebidos do site externo
// Baseada no arquivo formulario-externo.ts original
interface FormularioExternoPayload {
  // Dados pessoais
  nomeCompleto?: string;
  nomeCliente?: string;
  cpf: string;
  dataNascimento: string;
  email: string;
  telefone?: string;
  
  // Dados processuais
  numeroProcesso: string;
  vara: string;
  comarca: string;
  fontePagadora: string;
  cnpj: string;
  
  // Valores de entrada
  brutoHomologado: number;
  tributavelHomologado: number;
  numeroMeses: number;
  
  // Arrays de valores (estrutura aninhada)
  alvaras?: Array<{ valor: number; data: string }>;
  darfs?: Array<{ valor: number; data: string }>;
  honorarios?: Array<{ valor: number; ano: string }>;
  
  // Cálculos (podem vir diretamente ou dentro de valorCalculos)
  proporcao?: number | string;
  rendimentosTributavelAlvara?: number;
  rendimentosTributavelHonorarios?: number;
  baseCalculo?: number;
  rra?: string;
  irMensal?: string;
  irDevido?: number;
  irpfRestituir?: number;
  
  // Objetos originais (para compatibilidade)
  userData?: any;
  valorCalculos?: any;
  
  // Campos de controle
  statusPagamento?: 'pendente' | 'pago' | 'cancelado';
  categoria?: 'free' | 'starter' | 'builder' | 'specialist';
  
  // Suporte para múltiplos exercícios fiscais
  anosdiferentes?: boolean;
  pdfs?: Array<{ nome: string; url: string }>;
  exercicios?: Array<any>; // Array de dados por exercício fiscal
  
  // ID do app (para referência)
  idApp?: string;
}

/**
 * POST /api/formulario/receber
 * Recebe dados do formulário do site externo restituicaoia.com.br
 */
router.post("/receber", async (req: Request, res: Response) => {
  try {
    const payload: FormularioExternoPayload = req.body;
    
    console.log('[Formulário Externo] Recebido payload completo');
    console.log('[Formulário Externo] Nome:', payload.nomeCompleto || payload.nomeCliente);
    console.log('[Formulário Externo] Alvarás:', payload.alvaras);
    console.log('[Formulário Externo] DARFs:', payload.darfs);
    console.log('[Formulário Externo] Honorários:', payload.honorarios);
    console.log('[Formulário Externo] IRPF a Restituir:', payload.irpfRestituir);

    // Mapear nomeCompleto para nomeCliente (compatibilidade)
    const nomeCliente = payload.nomeCompleto || payload.nomeCliente || payload.userData?.nome || '';
    
    // Validar campos obrigatórios mínimos
    if (!nomeCliente || !payload.cpf) {
      console.error('[Formulário Externo] Campos obrigatórios faltando: nome ou cpf');
      return res.status(400).json({ 
        success: false, 
        error: 'Campos obrigatórios faltando: nome e cpf são obrigatórios' 
      });
    }

    // ===== EXTRAIR ARRAYS DE ALVARÁS, DARFS E HONORÁRIOS =====
    // Pegar o primeiro elemento de cada array (ou somar todos se necessário)
    const primeiroAlvara = payload.alvaras && payload.alvaras.length > 0 ? payload.alvaras[0] : null;
    const primeiroDarf = payload.darfs && payload.darfs.length > 0 ? payload.darfs[0] : null;
    const primeiroHonorario = payload.honorarios && payload.honorarios.length > 0 ? payload.honorarios[0] : null;

    // Somar todos os valores (para casos com múltiplos alvarás/darfs/honorários)
    const somaAlvaras = payload.alvaras?.reduce((sum, a) => sum + (a.valor || 0), 0) || 0;
    const somaDarfs = payload.darfs?.reduce((sum, d) => sum + (d.valor || 0), 0) || 0;
    const somaHonorarios = payload.honorarios?.reduce((sum, h) => sum + (h.valor || 0), 0) || 0;

    console.log('[Formulário Externo] Soma Alvarás:', somaAlvaras);
    console.log('[Formulário Externo] Soma DARFs:', somaDarfs);
    console.log('[Formulário Externo] Soma Honorários:', somaHonorarios);

    // ===== EXTRAIR VALORES CALCULADOS =====
    // Podem vir diretamente no payload ou dentro de valorCalculos
    const valorCalculos = payload.valorCalculos || {};
    
    const proporcao = payload.proporcao || valorCalculos.proporcao || '';
    const rendimentosTributavelAlvara = payload.rendimentosTributavelAlvara || valorCalculos.rendimentosTributavelAlvara || 0;
    const rendimentosTributavelHonorarios = payload.rendimentosTributavelHonorarios || valorCalculos.rendimentosTributavelHonorarios || 0;
    const baseCalculo = payload.baseCalculo || valorCalculos.baseCalculo || 0;
    const rra = payload.rra || valorCalculos.rra || '';
    const irMensal = payload.irMensal || valorCalculos.irMensal || '';
    const irDevido = payload.irDevido || valorCalculos.irDevido || 0;
    const irpfRestituir = payload.irpfRestituir || valorCalculos.irpfRestituir || 0;

    console.log('[Formulário Externo] Valores calculados extraídos:');
    console.log('  - Proporção:', proporcao);
    console.log('  - Rend. Trib. Alvará:', rendimentosTributavelAlvara);
    console.log('  - Base Cálculo:', baseCalculo);
    console.log('  - IR Devido:', irDevido);
    console.log('  - IRPF a Restituir:', irpfRestituir);

    const db = await getDb();
    if (!db) {
      console.error('[Formulário Externo] Banco de dados não disponível');
      return res.status(500).json({ 
        success: false, 
        error: 'Banco de dados não disponível' 
      });
    }

    // Preparar dados para salvar
    // Armazenar exercícios e PDFs como JSON no campo resultadosPorExercicio
    const dadosExtras = {
      anosdiferentes: payload.anosdiferentes,
      pdfs: payload.pdfs,
      exercicios: payload.exercicios,
      idApp: payload.idApp,
    };

    // Inserir novo formulário com TODOS os dados extraídos
    await db.insert(irpfForms).values({
      nomeCliente: nomeCliente,
      cpf: payload.cpf,
      dataNascimento: payload.dataNascimento || '',
      email: payload.email || '',
      telefone: payload.telefone || '',
      numeroProcesso: payload.numeroProcesso || '',
      vara: payload.vara || '',
      comarca: payload.comarca || '',
      fontePagadora: payload.fontePagadora || '',
      cnpj: payload.cnpj || '',
      brutoHomologado: payload.brutoHomologado || 0,
      tributavelHomologado: payload.tributavelHomologado || 0,
      numeroMeses: payload.numeroMeses || 1,
      
      // Usar a SOMA de todos os alvarás/darfs/honorários
      alvaraValor: somaAlvaras,
      alvaraData: primeiroAlvara?.data || '',
      darfValor: somaDarfs,
      darfData: primeiroDarf?.data || '',
      honorariosValor: somaHonorarios,
      honorariosAno: primeiroHonorario?.ano || '',
      
      // Valores calculados extraídos corretamente
      proporcao: String(proporcao),
      rendimentosTributavelAlvara: rendimentosTributavelAlvara,
      rendimentosTributavelHonorarios: rendimentosTributavelHonorarios,
      baseCalculo: baseCalculo,
      rra: String(rra),
      irMensal: String(irMensal),
      irDevido: irDevido,
      irpfRestituir: irpfRestituir,
      
      statusPagamento: payload.statusPagamento || 'pendente',
      categoria: payload.categoria || 'starter',
      tipoAcesso: 'pago',
      
      // Salvar dados extras como JSON
      resultadosPorExercicio: JSON.stringify(dadosExtras),
    });

    console.log('[Formulário Externo] ✅ Salvo com sucesso!');
    console.log('[Formulário Externo] Nome:', nomeCliente);
    console.log('[Formulário Externo] CPF:', payload.cpf);
    console.log('[Formulário Externo] IRPF a Restituir:', irpfRestituir);
    console.log('[Formulário Externo] Anos Diferentes:', payload.anosdiferentes);
    console.log('[Formulário Externo] PDFs:', payload.pdfs?.length || 0);
    console.log('[Formulário Externo] Exercícios:', payload.exercicios?.length || 0);

    // Notificar proprietário
    try {
      await notifyOwner({
        title: "Novo Formulário Externo Recebido",
        content: `Formulário recebido de ${nomeCliente} (CPF: ${payload.cpf}). ` +
          `IRPF a Restituir: R$ ${(irpfRestituir / 100).toFixed(2)}. ` +
          `Anos Diferentes: ${payload.anosdiferentes ? 'Sim' : 'Não'}.`,
      });
    } catch (notifyError) {
      console.error('[Formulário Externo] Erro ao notificar:', notifyError);
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Formulário recebido e salvo com sucesso',
      nomeCliente: nomeCliente,
      cpf: payload.cpf,
      irpfRestituir: irpfRestituir,
      alvaraValor: somaAlvaras,
      darfValor: somaDarfs,
      honorariosValor: somaHonorarios
    });
  } catch (error) {
    console.error('[Formulário Externo] Erro:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro ao processar formulário',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * GET /api/formulario/status
 * Endpoint de verificação de status (para testes)
 */
router.get("/status", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "API de formulário externo está funcionando",
    timestamp: new Date().toISOString(),
    endpoint: "/api/formulario/receber",
    method: "POST",
  });
});

export default router;
