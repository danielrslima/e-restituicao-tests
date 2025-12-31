/**
 * Motor de Cálculo de IRPF - e-Restituição
 * 
 * Implementação baseada nas FÓRMULAS EXATAS da planilha Excel "Formulário-DIRF12.2025.xlsm"
 * 
 * ESTRUTURA DE DADOS:
 * - Cada LINHA contém: Alvará (valor + data) + Honorário (valor + ano pago)
 * - O DARF é único e distribuído proporcionalmente entre todos os alvarás
 * 
 * FÓRMULAS EXTRAÍDAS E VALIDADAS:
 * 
 * 1. Exercício Alvará = Ano da Data do Alvará + 1
 * 2. Exercício Honorário = Ano Pago + 1
 * 3. Proporção Tributável = Tributável Homologado / Bruto Homologado
 * 4. Alvará Deflacionado = Alvará Original × Índice IPCA
 * 5. Total Alvarás Deflacionados = Soma de todos os Alvarás Deflacionados
 * 
 * 6. DARF Proporcional = (DARF Total × (Alvará Deflacionado / Total Alvarás Deflacionados)) / Índice IPCA
 *    NOTA: O DARF é deflacionado de volta (dividido pelo índice) para ficar na mesma base do alvará original!
 * 
 * 7. RT Alvará = (Alvará Original + DARF Proporcional) × Proporção Tributável
 * 
 * 8. RT Honorários = Honorário da LINHA × Proporção Tributável
 * 
 * 9. Rendimentos Tributáveis por Exercício = SUMIF(RT Alvará por exercício alvará) - SUMIF(RT Honorários por exercício honorário)
 *    Se resultado < 0, usa 0
 * 
 * 10. IRRF por Exercício = SUMIF(DARF Proporcional por exercício alvará)
 * 
 * 11. IR Devido = (Alíquota × RRA - Dedução) × Meses
 *     onde RRA = Rendimentos Tributáveis / Meses
 *     IMPORTANTE: A tabela de alíquotas depende da DATA DO DARF, não do exercício!
 *     - Se data DARF <= abril/2023 → tabela 2023
 *     - Se data DARF > abril/2023 → tabela 2024
 * 
 * 12. IRPF = IRRF - IR Devido
 */

import { getIpcaCoefficient, getExercicioFiscal } from './ipcaService';
import { calcularValorComSelic } from './selicService';

// Tabela de Alíquotas do IRPF (até abril/2023)
const TABELA_IR_2023: Array<{ min: number; max: number; aliquota: number; deducao: number }> = [
  { min: 0, max: 1903.98, aliquota: 0, deducao: 0 },
  { min: 1903.99, max: 2826.65, aliquota: 0.075, deducao: 142.80 },
  { min: 2826.66, max: 3751.05, aliquota: 0.15, deducao: 354.80 },
  { min: 3751.06, max: 4664.68, aliquota: 0.225, deducao: 636.13 },
  { min: 4664.69, max: Infinity, aliquota: 0.275, deducao: 869.36 },
];

// Tabela de Alíquotas do IRPF (após abril/2023)
const TABELA_IR_2024: Array<{ min: number; max: number; aliquota: number; deducao: number }> = [
  { min: 0, max: 2112.00, aliquota: 0, deducao: 0 },
  { min: 2112.01, max: 2826.65, aliquota: 0.075, deducao: 158.40 },
  { min: 2826.66, max: 3751.05, aliquota: 0.15, deducao: 370.40 },
  { min: 3751.06, max: 4664.68, aliquota: 0.225, deducao: 651.73 },
  { min: 4664.69, max: Infinity, aliquota: 0.275, deducao: 884.96 },
];

// Data limite para mudança de tabela: fim de abril/2023
const DATA_LIMITE_TABELA = new Date(Date.UTC(2023, 3, 30)); // 30/04/2023 UTC

// Interfaces - ESTRUTURA CORRETA: cada linha tem alvará + honorário
export interface LinhaCalculo {
  // Alvará
  valorAlvara: number;
  dataAlvara: Date;
  
  // Honorário (opcional - pode ser 0 ou não existir)
  valorHonorario?: number;
  anoPagoHonorario?: number;
}

export interface Darf {
  valor: number;
  data: Date;
  fontePagadora?: string;
  cnpj?: string;
}

// Interface legada para compatibilidade
export interface Alvara {
  valor: number;
  data: Date;
}

export interface Honorario {
  anoPago: number;
  valor: number;
}

export interface DadosEntrada {
  nomeCliente: string;
  cpf: string;
  dataNascimento?: Date;
  numeroProcesso: string;
  comarca: string;
  vara: string;
  brutoHomologado: number;
  tributavelHomologado: number;
  numeroMeses: number;
  
  // Nova estrutura: linhas com alvará + honorário
  linhas?: LinhaCalculo[];
  
  // Estrutura legada (para compatibilidade)
  alvaras?: Alvara[];
  honorarios?: Honorario[];
  
  darfs: Darf[];
  usarDeflacao: boolean;
}

export interface ResultadoExercicio {
  exercicio: number;
  rendimentosTributaveis: number;
  irrf: number;
  numeroMeses: number;
  irpf: number;
  descricao: string;
  taxaSelic: number;
  valorOriginal: number;
  valorAtualizado: number;
}

export interface ResultadoCalculo {
  totalIrpf: number;
  totalAtualizado: number;
  descricaoTotal: string;
  exercicios: ResultadoExercicio[];
  proporcaoTributavel: number;
  totalAlvarasDeflacionados: number;
  totalDarfOriginal: number;
  dadosContribuinte: {
    nome: string;
    cpf: string;
    dataNascimento?: string;
  };
  dadosProcesso: {
    numero: string;
    comarca: string;
    vara: string;
  };
}

/**
 * Obtém a tabela de IR correta baseada na data do DARF
 * Se data DARF <= abril/2023 → tabela 2023
 * Se data DARF > abril/2023 → tabela 2024
 */
function getTabelaIR(dataDarf: Date) {
  // Usar fim do mês da data do DARF para comparação
  const fimMesDarf = new Date(Date.UTC(dataDarf.getUTCFullYear(), dataDarf.getUTCMonth() + 1, 0));
  return fimMesDarf <= DATA_LIMITE_TABELA ? TABELA_IR_2023 : TABELA_IR_2024;
}

/**
 * Calcula o IR devido usando a tabela progressiva (RRA)
 */
function calcularIRDevido(baseCalculo: number, numeroMeses: number, dataDarf: Date): number {
  if (baseCalculo <= 0 || numeroMeses <= 0) {
    return 0;
  }

  const tabela = getTabelaIR(dataDarf);
  const rra = baseCalculo / numeroMeses;

  let aliquota = 0;
  let deducao = 0;

  for (const faixa of tabela) {
    if (rra >= faixa.min && (faixa.max === Infinity || rra <= faixa.max)) {
      aliquota = faixa.aliquota;
      deducao = faixa.deducao;
      break;
    }
  }

  const irMensal = (aliquota * rra) - deducao;
  const irDevido = irMensal * numeroMeses;

  return Math.max(0, irDevido);
}

/**
 * Converte estrutura legada (alvaras + honorarios separados) para nova estrutura (linhas)
 */
function converterParaLinhas(alvaras: Alvara[], honorarios: Honorario[]): LinhaCalculo[] {
  return alvaras.map((alvara, index) => {
    const honorario = honorarios[index];
    return {
      valorAlvara: alvara.valor,
      dataAlvara: alvara.data,
      valorHonorario: honorario?.valor || 0,
      anoPagoHonorario: honorario?.anoPago,
    };
  });
}

/**
 * Função principal de cálculo - BASEADA NAS FÓRMULAS EXATAS DA PLANILHA
 */
export function calcularIRPF(dados: DadosEntrada): ResultadoCalculo {
  const { 
    brutoHomologado, 
    tributavelHomologado, 
    numeroMeses, 
    darfs,
    usarDeflacao 
  } = dados;

  // Validação
  if (brutoHomologado <= 0) {
    throw new Error("Bruto Homologado deve ser maior que zero");
  }

  // Converter para nova estrutura se necessário
  let linhas: LinhaCalculo[];
  if (dados.linhas && dados.linhas.length > 0) {
    linhas = dados.linhas;
  } else if (dados.alvaras && dados.alvaras.length > 0) {
    linhas = converterParaLinhas(dados.alvaras, dados.honorarios || []);
  } else {
    return {
      totalIrpf: 0,
      totalAtualizado: 0,
      descricaoTotal: 'Sem dados',
      exercicios: [],
      proporcaoTributavel: 0,
      totalAlvarasDeflacionados: 0,
      totalDarfOriginal: 0,
      dadosContribuinte: {
        nome: dados.nomeCliente,
        cpf: dados.cpf,
        dataNascimento: dados.dataNascimento?.toLocaleDateString('pt-BR'),
      },
      dadosProcesso: {
        numero: dados.numeroProcesso,
        comarca: dados.comarca,
        vara: dados.vara,
      },
    };
  }

  // Obter a data máxima do DARF (usada para determinar a tabela de alíquotas)
  const dataMaxDarf = darfs.reduce((max, d) => d.data > max ? d.data : max, darfs[0]?.data || new Date());

  // 1. Calcular proporção tributável (H18/H17)
  const proporcaoTributavel = tributavelHomologado / brutoHomologado;

  // 2. Processar linhas - calcular índice IPCA e valor deflacionado
  const linhasProcessadas = linhas.map((linha, index) => {
    const exercicioAlvara = getExercicioFiscal(linha.dataAlvara);
    const indiceIpca = getIpcaCoefficient(linha.dataAlvara, usarDeflacao);
    const valorDeflacionado = linha.valorAlvara * indiceIpca;
    
    // Exercício do honorário = ano pago + 1
    const exercicioHonorario = linha.anoPagoHonorario ? linha.anoPagoHonorario + 1 : null;
    
    return {
      index,
      valorAlvaraOriginal: linha.valorAlvara,
      dataAlvara: linha.dataAlvara,
      exercicioAlvara,
      indiceIpca,
      valorDeflacionado,
      valorHonorario: linha.valorHonorario || 0,
      exercicioHonorario,
    };
  });

  // 3. Calcular total de alvarás deflacionados (D18)
  const totalAlvarasDeflacionados = linhasProcessadas.reduce(
    (sum, l) => sum + l.valorDeflacionado, 
    0
  );

  // 4. Calcular DARF total (D17)
  const totalDarfOriginal = darfs.reduce((sum, d) => sum + d.valor, 0);

  // 5. Calcular valores por linha
  interface LinhaCalculada {
    index: number;
    exercicioAlvara: number;
    exercicioHonorario: number | null;
    valorAlvaraOriginal: number;
    valorAlvaraDeflacionado: number;
    indiceIpca: number;
    proporcaoAlvara: number;
    darfProporcional: number;
    mesesProporcionais: number;
    rtAlvara: number;
    rtHonorarios: number;
  }

  const linhasCalculadas: LinhaCalculada[] = linhasProcessadas.map((linha) => {
    // Proporção deste alvará em relação ao total deflacionado
    const proporcaoAlvara = totalAlvarasDeflacionados > 0 
      ? linha.valorDeflacionado / totalAlvarasDeflacionados 
      : 0;
    
    // DARF Proporcional = (DARF Total × (Alvará Deflacionado / Total Alvarás Deflacionados)) / Índice IPCA
    // NOTA: Dividido pelo índice para deflacionar de volta à base original!
    const darfProporcional = (totalDarfOriginal * proporcaoAlvara) / linha.indiceIpca;
    
    // Meses proporcionais
    const mesesProporcionais = numeroMeses * proporcaoAlvara;
    
    // RT Alvará = (Alvará Original + DARF Proporcional) × Proporção Tributável
    const rtAlvara = (linha.valorAlvaraOriginal + darfProporcional) * proporcaoTributavel;
    
    // RT Honorários = Honorário da LINHA × Proporção Tributável
    const rtHonorarios = linha.valorHonorario * proporcaoTributavel;
    
    return {
      index: linha.index,
      exercicioAlvara: linha.exercicioAlvara,
      exercicioHonorario: linha.exercicioHonorario,
      valorAlvaraOriginal: linha.valorAlvaraOriginal,
      valorAlvaraDeflacionado: linha.valorDeflacionado,
      indiceIpca: linha.indiceIpca,
      proporcaoAlvara,
      darfProporcional,
      mesesProporcionais,
      rtAlvara,
      rtHonorarios,
    };
  });

  // 6. Identificar todos os exercícios (do alvará E do honorário)
  const exerciciosAlvara = new Set(linhasCalculadas.map(l => l.exercicioAlvara));
  const exerciciosHonorario = new Set(
    linhasCalculadas
      .filter(l => l.exercicioHonorario !== null)
      .map(l => l.exercicioHonorario as number)
  );
  const todosExercicios = Array.from(new Set([...Array.from(exerciciosAlvara), ...Array.from(exerciciosHonorario)])).sort();

  // 7. Calcular resultados por exercício
  const resultadosExercicios: ResultadoExercicio[] = [];

  for (const exercicio of todosExercicios) {
    // SUMIF RT Alvará por exercício do ALVARÁ
    const somaRtAlvara = linhasCalculadas
      .filter(l => l.exercicioAlvara === exercicio)
      .reduce((sum, l) => sum + l.rtAlvara, 0);
    
    // SUMIF RT Honorários por exercício do HONORÁRIO (não do alvará!)
    const somaRtHonorarios = linhasCalculadas
      .filter(l => l.exercicioHonorario === exercicio)
      .reduce((sum, l) => sum + l.rtHonorarios, 0);
    
    // Rendimentos Tributáveis = RT Alvará - RT Honorários (se < 0, usa 0)
    const rendimentosTributaveis = Math.max(0, somaRtAlvara - somaRtHonorarios);
    
    // IRRF = SUMIF DARF Proporcional por exercício do ALVARÁ
    const irrf = linhasCalculadas
      .filter(l => l.exercicioAlvara === exercicio)
      .reduce((sum, l) => sum + l.darfProporcional, 0);
    
    // Meses = SUMIF Meses Proporcionais por exercício do ALVARÁ
    const meses = linhasCalculadas
      .filter(l => l.exercicioAlvara === exercicio)
      .reduce((sum, l) => sum + l.mesesProporcionais, 0);

    // Se não há RT de alvará nem honorário neste exercício, pular
    if (somaRtAlvara === 0 && somaRtHonorarios === 0) {
      continue;
    }

    // Calcular IR devido (usa data do DARF para determinar tabela)
    const irDevido = calcularIRDevido(rendimentosTributaveis, meses, dataMaxDarf);

    // IRPF = IRRF - IR Devido
    const irpf = irrf - irDevido;

    // Aplicar SELIC (apenas para valores positivos)
    const { taxaSelic, valorAtualizado } = calcularValorComSelic(irpf, exercicio);

    // Descrição
    const descricao = irpf >= 0 ? 'Imposto a Restituir' : 'Imposto a Pagar';

    resultadosExercicios.push({
      exercicio,
      rendimentosTributaveis,
      irrf,
      numeroMeses: meses,
      irpf,
      descricao,
      taxaSelic,
      valorOriginal: irpf > 0 ? irpf : 0,
      valorAtualizado: irpf > 0 ? valorAtualizado : 0,
    });
  }

  // 8. Calcular totais
  const totalIrpf = resultadosExercicios.reduce((sum, r) => sum + r.irpf, 0);
  const totalAtualizado = resultadosExercicios.reduce((sum, r) => sum + r.valorAtualizado, 0);
  const descricaoTotal = totalIrpf >= 0 ? 'Imposto a Restituir' : 'Imposto a Pagar';

  return {
    totalIrpf,
    totalAtualizado,
    descricaoTotal,
    exercicios: resultadosExercicios,
    proporcaoTributavel,
    totalAlvarasDeflacionados,
    totalDarfOriginal,
    dadosContribuinte: {
      nome: dados.nomeCliente,
      cpf: dados.cpf,
      dataNascimento: dados.dataNascimento?.toLocaleDateString('pt-BR'),
    },
    dadosProcesso: {
      numero: dados.numeroProcesso,
      comarca: dados.comarca,
      vara: dados.vara,
    },
  };
}

/**
 * Formata valor em moeda brasileira
 */
export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Formata percentual
 */
export function formatarPercentual(valor: number, casasDecimais: number = 4): string {
  return `${(valor * 100).toFixed(casasDecimais)}%`;
}
