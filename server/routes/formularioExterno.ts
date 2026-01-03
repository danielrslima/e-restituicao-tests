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
import * as fs from 'fs';

const router = Router();

// Middleware CORS para permitir requisições do site externo
router.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Responder imediatamente para requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

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
  processData?: any;  // Dados processuais: numeroProcesso, comarca, vara, fontePagadora, cnpj
  valorCalculos?: any;
  valueData?: any;  // Formato do protótipo original: alvara1, darf1, honorarios1, etc.
  
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
    
    // Log completo do payload para debug
    console.log('[Formulário Externo] ========== PAYLOAD RECEBIDO ==========');
    console.log('[Formulário Externo] Payload completo:', JSON.stringify(payload, null, 2));
    
    // Salvar payload em arquivo para análise
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      fs.writeFileSync(`/home/ubuntu/payload-${timestamp}.json`, JSON.stringify(payload, null, 2));
      console.log(`[Formulário Externo] Payload salvo em /home/ubuntu/payload-${timestamp}.json`);
    } catch (e) {
      console.error('[Formulário Externo] Erro ao salvar payload:', e);
    }
    console.log('[Formulário Externo] Campos de nome disponíveis:');
    console.log('  - nomeCompleto:', payload.nomeCompleto);
    console.log('  - nomeCliente:', payload.nomeCliente);
    console.log('  - nome:', (payload as any).nome);
    console.log('  - userData?.nome:', payload.userData?.nome);
    console.log('[Formulário Externo] CPF:', payload.cpf);
    console.log('[Formulário Externo] Alvarás:', payload.alvaras);
    console.log('[Formulário Externo] DARFs:', payload.darfs);
    console.log('[Formulário Externo] Honorários:', payload.honorarios);
    console.log('[Formulário Externo] IRPF a Restituir:', payload.irpfRestituir);
    console.log('[Formulário Externo] valueData:', JSON.stringify(payload.valueData, null, 2));
    console.log('[Formulário Externo] valorCalculos:', JSON.stringify(payload.valorCalculos, null, 2));
    console.log('[Formulário Externo] processData:', JSON.stringify(payload.processData, null, 2));
    console.log('[Formulário Externo] userData:', JSON.stringify(payload.userData, null, 2));
    console.log('[Formulário Externo] =====================================');

    // Mapear nomeCompleto para nomeCliente (compatibilidade com várias fontes)
    const nomeCliente = payload.nomeCompleto || 
                        payload.nomeCliente || 
                        (payload as any).nome || 
                        payload.userData?.nome || 
                        '';
    
    // Mapear CPF (pode vir de várias fontes)
    const cpf = payload.cpf || (payload as any).userData?.cpf || '';
    
    // Validar campos obrigatórios mínimos - mais flexível
    if (!nomeCliente && !cpf) {
      console.error('[Formulário Externo] Campos obrigatórios faltando: nome E cpf');
      return res.status(400).json({ 
        success: false, 
        error: 'Campos obrigatórios faltando: nome e cpf são obrigatórios',
        receivedFields: Object.keys(payload)
      });
    }
    
    // Se não tem nome, usar CPF como identificador temporário
    const nomeClienteFinal = nomeCliente || `Cliente ${cpf}`;

    // ===== EXTRAIR ARRAYS DE ALVARÁS, DARFS E HONORÁRIOS =====
    // Pegar o primeiro elemento de cada array (ou somar todos se necessário)
    const primeiroAlvara = payload.alvaras && payload.alvaras.length > 0 ? payload.alvaras[0] : null;
    const primeiroDarf = payload.darfs && payload.darfs.length > 0 ? payload.darfs[0] : null;
    const primeiroHonorario = payload.honorarios && payload.honorarios.length > 0 ? payload.honorarios[0] : null;

    // Somar todos os valores (para casos com múltiplos alvarás/darfs/honorários)
    // PRIMEIRO: tentar extrair dos arrays
    let somaAlvaras = payload.alvaras?.reduce((sum, a) => sum + (a.valor || 0), 0) || 0;
    let somaDarfs = payload.darfs?.reduce((sum, d) => sum + (d.valor || 0), 0) || 0;
    let somaHonorarios = payload.honorarios?.reduce((sum, h) => sum + (h.valor || 0), 0) || 0;
    
    // SEGUNDO: se os arrays estiverem vazios, tentar extrair de valorCalculos
    const valorCalculosObj = payload.valorCalculos || {};
    if (somaAlvaras === 0 && valorCalculosObj.somaAlvara) {
      somaAlvaras = valorCalculosObj.somaAlvara;
      console.log('[Formulário Externo] Usando somaAlvara de valorCalculos:', somaAlvaras);
    }
    if (somaDarfs === 0 && valorCalculosObj.somaDarf) {
      somaDarfs = valorCalculosObj.somaDarf;
      console.log('[Formulário Externo] Usando somaDarf de valorCalculos:', somaDarfs);
    }
    
    // TERCEIRO: tentar extrair de valueData (formato do protótipo original: alvara1, alvara2, darf1, darf2, etc.)
    const valueDataObj = payload.valueData || {};
    
    // Variáveis para armazenar as primeiras datas encontradas
    let primeiraDataAlvara = '';
    let primeiraDataDarf = '';
    let primeiroAnoHonorarios = '';
    
    if (somaAlvaras === 0) {
      const alvaraFields = ['alvara1', 'alvara2', 'alvara3', 'alvara4', 'alvara5', 
                           'alvara6', 'alvara7', 'alvara8', 'alvara9', 'alvara10'];
      for (const field of alvaraFields) {
        const val = valueDataObj[field];
        if (val && (typeof val === 'number' || typeof val === 'string')) {
          const numVal = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]/g, '')) : val;
          if (!isNaN(numVal) && numVal > 0) {
            somaAlvaras += numVal;
            // Pegar a data correspondente (ex: alvara1Data)
            const dataField = field + 'Data';
            if (!primeiraDataAlvara && valueDataObj[dataField]) {
              primeiraDataAlvara = String(valueDataObj[dataField]);
            }
          }
        }
      }
      if (somaAlvaras > 0) {
        console.log('[Formulário Externo] Calculado somaAlvaras de valueData:', somaAlvaras);
        console.log('[Formulário Externo] Primeira data de alvará:', primeiraDataAlvara);
      }
    }
    
    if (somaDarfs === 0) {
      const darfFields = ['darf1', 'darf2', 'darf3', 'darf4', 'darf5', 
                          'darf6', 'darf7', 'darf8', 'darf9', 'darf10'];
      for (const field of darfFields) {
        const val = valueDataObj[field];
        if (val && (typeof val === 'number' || typeof val === 'string')) {
          const numVal = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]/g, '')) : val;
          if (!isNaN(numVal) && numVal > 0) {
            somaDarfs += numVal;
            // Pegar a data correspondente (ex: darf1Data)
            const dataField = field + 'Data';
            if (!primeiraDataDarf && valueDataObj[dataField]) {
              primeiraDataDarf = String(valueDataObj[dataField]);
            }
          }
        }
      }
      if (somaDarfs > 0) {
        console.log('[Formulário Externo] Calculado somaDarfs de valueData:', somaDarfs);
        console.log('[Formulário Externo] Primeira data de DARF:', primeiraDataDarf);
      }
    }
    
    // QUARTO: tentar extrair honorários de valueData ou valorCalculos
    if (somaHonorarios === 0) {
      // Tentar de valueData primeiro (honorarios1, honorarios2, etc.)
      const honorariosFieldsValue = ['honorarios1', 'honorarios2', 'honorarios3', 'honorarios4', 'honorarios5',
                                     'honorarios6', 'honorarios7', 'honorarios8', 'honorarios9', 'honorarios10'];
      for (const field of honorariosFieldsValue) {
        const val = valueDataObj[field];
        if (val && (typeof val === 'number' || typeof val === 'string')) {
          const numVal = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]/g, '')) : val;
          if (!isNaN(numVal) && numVal > 0) {
            somaHonorarios += numVal;
            // Pegar a data/ano correspondente (ex: honorarios1Data)
            // O campo é honorarios1Data, não honorarios1Ano
            const dataField = field + 'Data';
            if (!primeiroAnoHonorarios && valueDataObj[dataField]) {
              // Extrair apenas o ano da data (formato DD/MM/YYYY ou YYYY)
              const dataStr = String(valueDataObj[dataField]);
              // Se for uma data completa, pegar o ano
              if (dataStr.includes('/')) {
                const partes = dataStr.split('/');
                primeiroAnoHonorarios = partes[partes.length - 1]; // Última parte é o ano
              } else {
                primeiroAnoHonorarios = dataStr;
              }
            }
          }
        }
      }
      
      // Se ainda zero, tentar de valorCalculos (honorariosUm, honorariosDois, etc.)
      if (somaHonorarios === 0) {
        const honorariosFieldsCalc = ['honorariosUm', 'honorariosDois', 'honorariosTres', 'honorariosQuatro', 
                                      'honorariosCinco', 'honorariosSeis', 'honorariosSete', 'honorariosOito',
                                      'honorariosNove', 'honorariosDez'];
        for (const field of honorariosFieldsCalc) {
          const val = valorCalculosObj[field];
          if (val && typeof val === 'number') {
            somaHonorarios += val;
          }
        }
      }
      
      if (somaHonorarios > 0) {
        console.log('[Formulário Externo] Calculado somaHonorarios:', somaHonorarios);
        console.log('[Formulário Externo] Primeiro ano de honorários:', primeiroAnoHonorarios);
      }
    }
    
    // Log de valueData para debug
    console.log('[Formulário Externo] valueData recebido:', JSON.stringify(valueDataObj, null, 2));

    console.log('[Formulário Externo] Soma Alvarás:', somaAlvaras);
    console.log('[Formulário Externo] Soma DARFs:', somaDarfs);
    console.log('[Formulário Externo] Soma Honorários:', somaHonorarios);

    // ===== EXTRAIR VALORES CALCULADOS =====
    // Podem vir diretamente no payload ou dentro de valorCalculos
    const valorCalculos = payload.valorCalculos || {};
    
    const proporcao = payload.proporcao || valorCalculos.proporcao || '';
    const rendimentosTributavelAlvara = payload.rendimentosTributavelAlvara || valorCalculos.rendimentosTributavelAlvara || 0;
    const rendimentosTributavelHonorarios = payload.rendimentosTributavelHonorarios || valorCalculos.rendimentosTributavelHonorarios || 0;
    // Base de Cálculo = Rendimentos Tributáveis (Item 5 da Planilha RT)
    const baseCalculo = payload.baseCalculo || valorCalculos.baseCalculo || valorCalculos.rendimentosTributavelAlvara || 0;
    const rra = payload.rra || valorCalculos.rra || '';
    const irMensal = payload.irMensal || valorCalculos.irMensal || '';
    const irDevido = payload.irDevido || valorCalculos.irDevido || 0;
    // IRPF a Restituir: primeiro do payload, depois de valorCalculos, depois soma dos irpfUm..irpfDez
    let irpfRestituir = payload.irpfRestituir || valorCalculos.irpfRestituir || 0;
    // Se ainda zero, tentar somar os campos individuais irpfUm, irpfDois, etc.
    if (irpfRestituir === 0) {
      const irpfFields = ['irpfUm', 'irpfDois', 'irpfTres', 'irpfQuatro', 'irpfCinco', 
                          'irpfSeis', 'irpfSete', 'irpfOito', 'irpfNove', 'irpfDez'];
      for (const field of irpfFields) {
        const val = valorCalculos[field];
        if (val && typeof val === 'number') {
          irpfRestituir += val;
        }
      }
    }

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
    // Extrair dados de userData, processData e valueData como fallback
    const userDataObj = payload.userData || {};
    const processDataObj = payload.processData || {};
    
    // Dados pessoais: primeiro do payload direto, depois de userData
    const dataNascimento = payload.dataNascimento || userDataObj.dataNascimento || '';
    const email = payload.email || userDataObj.email || '';
    const telefone = payload.telefone || userDataObj.telefone || '';
    
    // Dados processuais: primeiro do payload direto, depois de processData
    const numeroProcesso = payload.numeroProcesso || processDataObj.numeroProcesso || '';
    const vara = payload.vara || processDataObj.vara || '';
    const comarca = payload.comarca || processDataObj.comarca || '';
    const fontePagadora = payload.fontePagadora || processDataObj.fontePagadora || '';
    const cnpj = payload.cnpj || processDataObj.cnpj || '';
    
    // Valores de entrada: primeiro do payload direto, depois de valueData
    const brutoHomologado = payload.brutoHomologado || valueDataObj.brutoHomologado || 0;
    const tributavelHomologado = payload.tributavelHomologado || valueDataObj.tributavelHomologado || 0;
    const numeroMeses = payload.numeroMeses || valueDataObj.numeroMeses || 1;
    
    console.log('[Formulário Externo] Dados processuais extraídos:');
    console.log('  - Fonte Pagadora:', fontePagadora);
    console.log('  - CNPJ:', cnpj);
    console.log('  - Número Processo:', numeroProcesso);
    console.log('  - Bruto Homologado:', brutoHomologado);
    console.log('  - Tributável Homologado:', tributavelHomologado);
    console.log('  - Número de Meses:', numeroMeses);

    await db.insert(irpfForms).values({
      nomeCliente: nomeClienteFinal,
      cpf: cpf,
      dataNascimento: dataNascimento,
      email: email,
      telefone: telefone,
      numeroProcesso: numeroProcesso,
      vara: vara,
      comarca: comarca,
      fontePagadora: fontePagadora,
      cnpj: cnpj,
      brutoHomologado: brutoHomologado,
      tributavelHomologado: tributavelHomologado,
      numeroMeses: numeroMeses,
      
      // Usar a SOMA de todos os alvarás/darfs/honorários
      // Datas: primeiro tentar do array, depois de valueData
      alvaraValor: somaAlvaras,
      alvaraData: primeiroAlvara?.data || primeiraDataAlvara || '',
      darfValor: somaDarfs,
      darfData: primeiroDarf?.data || primeiraDataDarf || '',
      honorariosValor: somaHonorarios,
      honorariosAno: primeiroHonorario?.ano || primeiroAnoHonorarios || '',
      
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
