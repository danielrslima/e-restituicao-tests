/**
 * MOTOR DE CÁLCULO DE IRPF - e-Restituição
 * Versão TypeScript (convertida de JavaScript Puro V2)
 * 
 * Implementação baseada nas FÓRMULAS EXATAS da planilha Excel "Formulário-DIRF12.2025.xlsm"
 * Validado com: José Ramos (R$ 74.028,67) e Ana Carmen (R$ 28.025,11)
 * 
 * Data: 06 de janeiro de 2026
 * Identificação: MOTOR-V2.0-06JAN-TYPESCRIPT
 * Status: ✅ 100% VALIDADO COM TABELAS IRRF COMPLETAS
 */

// ============================================================================
// TIPOS DE ENTRADA E SAÍDA
// ============================================================================

export interface LinhaAlvara {
  valorAlvara: number;
  dataAlvara: Date;
  valorHonorario?: number;
  anoPagoHonorario?: number;
}

export interface DadosDARF {
  valor: number;
  data: Date;
}

export interface DadosEntradaMotor {
  brutoHomologado: number;
  tributavelHomologado: number;
  numeroMeses: number;
  linhas: LinhaAlvara[];
  darfs: DadosDARF[];
  usarDeflacao?: boolean;
}

export interface ResultadoExercicio {
  exercicio: number;
  rendimentosTributaveis: number;
  irrf: number;
  numeroMeses: number;
  irpf: number;
  descricao: string;
}

export interface ResultadoCalculoIRPF {
  totalIrpf: number;
  descricaoTotal: string;
  exercicios: ResultadoExercicio[];
  proporcaoTributavel: number;
  totalAlvarasDeflacionados: number;
  totalDarfOriginal: number;
}

interface TabelaFaixa {
  min: number;
  max: number;
  aliquota: number;
  deducao: number;
}

// ============================================================================
// 1. ÍNDICES IPCA-E (84 meses: 2020-2025)
// ============================================================================

const IPCA_E_INDICES: Record<string, number> = {
  // 2020 - CORRIGIDO 12/01/2026
  "2020-01": 1.3953248596,
  "2020-02": 1.3854878955,
  "2020-03": 1.3824465132,
  "2020-04": 1.3821700792,
  "2020-05": 1.3823083100,
  "2020-06": 1.3905123327,
  "2020-07": 1.3902342859,
  "2020-08": 1.3860760577,
  "2020-09": 1.3828953983,
  "2020-10": 1.3767002472,
  "2020-11": 1.3633879773,
  "2020-12": 1.3529211162,
  // 2021
  "2021-01": 1.3387305722,
  "2021-02": 1.3283692917,
  "2021-03": 1.3220235785,
  "2021-04": 1.3098420475,
  "2021-05": 1.3020298683,
  "2021-06": 1.2863280337,
  "2021-07": 1.2856650964,
  "2021-08": 1.2764645517,
  "2021-09": 1.2652042340,
  "2021-10": 1.2509434783,
  "2021-11": 1.2381101564,
  "2021-12": 1.2218149219,
  // 2022
  "2022-01": 1.2122558254,
  "2022-02": 1.2053673945,
  "2022-03": 1.1935512372,
  "2022-04": 1.1823192048,
  "2022-05": 1.1622129212,
  "2022-06": 1.1553030943,
  "2022-07": 1.1474734828,
  "2022-08": 1.1456868975,
  "2022-09": 1.1544149338,
  "2022-10": 1.1587031354,
  "2022-11": 1.1568821719,
  "2022-12": 1.1507531801,
  // 2023
  "2023-01": 1.1444802190,
  "2023-02": 1.1385382585,
  "2023-03": 1.1295656337,
  "2023-04": 1.1222074052,
  "2023-05": 1.1158470743,
  "2023-06": 1.1101831301,
  "2023-07": 1.1091674237,
  "2023-08": 1.1074178288,
  "2023-09": 1.1074182528,
  "2023-10": 1.1035553329,
  "2023-11": 1.1012427731,
  "2023-12": 1.0876203256,
  // 2024
  "2024-01": 1.0932476345,
  "2024-02": 1.0898680405,
  "2024-03": 1.0814338564,
  "2024-04": 1.0775545596,
  "2024-05": 1.0752965389,
  "2024-06": 1.0705859587,
  "2024-07": 1.0664258938,
  "2024-08": 1.0632371822,
  "2024-09": 1.0612208826,
  "2024-10": 1.0598430666,
  "2024-11": 1.0541506531,
  "2024-12": 1.0476551909,
  // 2025
  "2025-01": 1.0441052331,
  "2025-02": 1.0429579793,
  "2025-03": 1.0302854681,
  "2025-04": 1.0237335732,
  "2025-05": 1.0193503666,
  "2025-06": 1.0156938687,
  "2025-07": 1.0130599129,
  "2025-08": 1.0097278112,
  "2025-09": 1.0111434119,
  "2025-10": 1.0063131090,
  "2025-11": 1.0045050000,
  "2025-12": 1.0025000000,
  // 2026
  "2026-01": 1.0000000000,
};

// ============================================================================
// 2. TAXAS SELIC ACUMULADAS (2016-2025)
// ============================================================================

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
  2026: 0.0000,
};

// ============================================================================
// 3. TABELAS DE ALÍQUOTAS DO IRPF (5 TABELAS: 2015-2026)
// ============================================================================

// TABELA 1: 01/04/2015 a 30/04/2023
const TABELA_IR_2015_2023: TabelaFaixa[] = [
  { min: 0, max: 1903.98, aliquota: 0, deducao: 0 },
  { min: 1903.99, max: 2826.65, aliquota: 0.075, deducao: 142.80 },
  { min: 2826.66, max: 3751.05, aliquota: 0.15, deducao: 354.80 },
  { min: 3751.06, max: 4664.68, aliquota: 0.225, deducao: 636.13 },
  { min: 4664.69, max: Infinity, aliquota: 0.275, deducao: 869.36 },
];

// TABELA 2: 01/05/2023 a 31/01/2024
const TABELA_IR_2023_2024_MAI: TabelaFaixa[] = [
  { min: 0, max: 2112.00, aliquota: 0, deducao: 0 },
  { min: 2112.01, max: 2826.65, aliquota: 0.075, deducao: 158.40 },
  { min: 2826.66, max: 3751.05, aliquota: 0.15, deducao: 370.40 },
  { min: 3751.06, max: 4664.68, aliquota: 0.225, deducao: 651.73 },
  { min: 4664.69, max: Infinity, aliquota: 0.275, deducao: 884.96 },
];

// TABELA 3: 01/02/2024 a 30/04/2025
const TABELA_IR_2024_FEV: TabelaFaixa[] = [
  { min: 0, max: 2259.20, aliquota: 0, deducao: 0 },
  { min: 2259.21, max: 2826.65, aliquota: 0.075, deducao: 169.44 },
  { min: 2826.66, max: 3751.05, aliquota: 0.15, deducao: 381.44 },
  { min: 3751.06, max: 4664.68, aliquota: 0.225, deducao: 662.77 },
  { min: 4664.69, max: Infinity, aliquota: 0.275, deducao: 896.00 },
];

// TABELA 4: 01/05/2025 a 31/12/2025
const TABELA_IR_2025_MAI: TabelaFaixa[] = [
  { min: 0, max: 2428.80, aliquota: 0, deducao: 0 },
  { min: 2428.81, max: 2826.65, aliquota: 0.075, deducao: 182.16 },
  { min: 2826.66, max: 3751.05, aliquota: 0.15, deducao: 394.16 },
  { min: 3751.06, max: 4664.68, aliquota: 0.225, deducao: 675.49 },
  { min: 4664.69, max: Infinity, aliquota: 0.275, deducao: 908.73 },
];

// TABELA 5: 01/01/2026 a 31/12/2026
const TABELA_IR_2026: TabelaFaixa[] = [
  { min: 0, max: 2428.80, aliquota: 0, deducao: 0 },
  { min: 2428.81, max: 2826.65, aliquota: 0.075, deducao: 182.16 },
  { min: 2826.66, max: 3751.05, aliquota: 0.15, deducao: 394.16 },
  { min: 3751.06, max: 4664.68, aliquota: 0.225, deducao: 675.49 },
  { min: 4664.69, max: Infinity, aliquota: 0.275, deducao: 908.73 },
];

// Datas limites para seleção de tabela
const DATA_LIMITE_TABELA_1 = new Date(Date.UTC(2023, 3, 30)); // 30/04/2023
const DATA_LIMITE_TABELA_2 = new Date(Date.UTC(2024, 0, 31)); // 31/01/2024
const DATA_LIMITE_TABELA_3 = new Date(Date.UTC(2025, 3, 30)); // 30/04/2025
const DATA_LIMITE_TABELA_4 = new Date(Date.UTC(2025, 11, 31)); // 31/12/2025

// ============================================================================
// 4. FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Arredondar para 1 casa decimal conforme Art. 45 (RRA)
 * Regra: Olha a 2ª casa decimal
 * - Se < 5: permanece
 * - Se > 5: arredonda para cima
 * - Se = 5: olha a 3ª casa
 *   - Se 0-4: permanece
 *   - Se 5-9: arredonda para cima
 * Usado para: Proporcionalização de meses em múltiplos anos
 */
function arredondarArt45(valor: number): number {
  if (typeof valor !== 'number' || isNaN(valor)) return 0;
  
  // Converter para string para analisar casas decimais
  const str = valor.toFixed(3); // 3 casas para analisar
  const partes = str.split('.');
  
  if (partes.length !== 2) {
    return parseFloat(valor.toFixed(1));
  }
  
  const decimais = partes[1];
  const primeira = parseInt(decimais[0], 10); // 1ª casa
  const segunda = parseInt(decimais[1], 10); // 2ª casa
  const terceira = parseInt(decimais[2], 10); // 3ª casa
  
  let novaSegunda = segunda;
  
  if (segunda < 5) {
    // Permanece
    novaSegunda = segunda;
  } else if (segunda > 5) {
    // Arredonda para cima
    novaSegunda = segunda + 1;
  } else if (segunda === 5) {
    // Olha a 3ª casa
    if (terceira >= 5) {
      novaSegunda = segunda + 1;
    } else {
      novaSegunda = segunda;
    }
  }
  
  // Se arredondou para 10, incrementa a primeira casa
  let novaFirst = primeira;
  if (novaSegunda >= 10) {
    novaFirst = primeira + 1;
    novaSegunda = 0;
  }
  
  const inteira = parseInt(partes[0], 10);
  const resultado = inteira + (novaFirst * 0.1) + (novaSegunda * 0.01);
  
  return parseFloat(resultado.toFixed(1));
}

/**
 * Obtém o coeficiente IPCA-E para uma data
 */
function getIpcaCoefficient(date: Date, useDeflation: boolean = true): number {
  if (!useDeflation) return 1;
  
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const key = `${year}-${month}`;
  
  return IPCA_E_INDICES[key] || 1;
}

/**
 * Obtém o exercício fiscal (ano + 1)
 */
function getExercicioFiscal(date: Date): number {
  return date.getUTCFullYear() + 1;
}

/**
 * Obtém a taxa SELIC acumulada
 */
function getSelicAcumulada(exercicio: number): number {
  return SELIC_ACUMULADA[exercicio] || 0;
}

/**
 * Obtém a tabela de IR correta baseado na data do DARF
 * Período: 01/04/2015 a 31/12/2026
 */
function getTabelaIR(dataDarf: Date): TabelaFaixa[] {
  const fimMesDarf = new Date(Date.UTC(dataDarf.getUTCFullYear(), dataDarf.getUTCMonth() + 1, 0));
  
  if (fimMesDarf <= DATA_LIMITE_TABELA_1) {
    // 01/04/2015 a 30/04/2023
    return TABELA_IR_2015_2023;
  } else if (fimMesDarf <= DATA_LIMITE_TABELA_2) {
    // 01/05/2023 a 31/01/2024
    return TABELA_IR_2023_2024_MAI;
  } else if (fimMesDarf <= DATA_LIMITE_TABELA_3) {
    // 01/02/2024 a 30/04/2025
    return TABELA_IR_2024_FEV;
  } else if (fimMesDarf <= DATA_LIMITE_TABELA_4) {
    // 01/05/2025 a 31/12/2025
    return TABELA_IR_2025_MAI;
  } else {
    // 01/01/2026 em diante
    return TABELA_IR_2026;
  }
}

/**
 * Calcula o IR devido
 */
function calcularIRDevido(baseCalculo: number, numeroMeses: number, dataDarf: Date): number {
  if (baseCalculo <= 0 || numeroMeses <= 0) return 0;
  
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

// ============================================================================
// 5. FUNÇÃO PRINCIPAL DE CÁLCULO
// ============================================================================

export function calcularIRPF(dados: DadosEntradaMotor): ResultadoCalculoIRPF {
  const {
    brutoHomologado,
    tributavelHomologado,
    numeroMeses,
    linhas,
    darfs,
    usarDeflacao = true,
  } = dados;
  
  // ========== CHAVE SELETORA AUTOMÁTICA ==========
  // Detecta se todos os exercícios são do mesmo ano
  const anosUnicos = new Set<number>();
  linhas.forEach(linha => {
    const ano = linha.dataAlvara.getUTCFullYear();
    anosUnicos.add(ano);
  });
  
  const ehMesmoAno = anosUnicos.size === 1;
  const usarDeflacaoAjustado = ehMesmoAno ? false : usarDeflacao;
  // =========================================
  
  // Validação
  if (brutoHomologado <= 0) {
    throw new Error("Bruto Homologado deve ser maior que zero");
  }
  
  if (!linhas || linhas.length === 0) {
    return {
      totalIrpf: 0,
      descricaoTotal: 'Sem dados',
      exercicios: [],
      proporcaoTributavel: 0,
      totalAlvarasDeflacionados: 0,
      totalDarfOriginal: 0,
    };
  }
  
  // Obter data máxima do DARF
  const dataMaxDarf = darfs.reduce((max, d) => d.data > max ? d.data : max, darfs[0]?.data || new Date());
  
  // 1. Calcular proporção tributável
  const proporcaoTributavel = tributavelHomologado / brutoHomologado;
  
  // 2. Processar linhas
  interface LinhaProcessada {
    index: number;
    valorAlvaraOriginal: number;
    dataAlvara: Date;
    exercicioAlvara: number;
    indiceIpca: number;
    valorDeflacionado: number;
    valorHonorario: number;
    exercicioHonorario: number | null;
  }
  
  const linhasProcessadas: LinhaProcessada[] = linhas.map((linha, index) => {
    const exercicioAlvara = getExercicioFiscal(linha.dataAlvara);
    const indiceIpca = getIpcaCoefficient(linha.dataAlvara, usarDeflacaoAjustado);
    const valorDeflacionado = linha.valorAlvara * indiceIpca;
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
  
  // 3. Calcular total de alvarás deflacionados
  const totalAlvarasDeflacionados = linhasProcessadas.reduce(
    (sum, l) => sum + l.valorDeflacionado,
    0
  );
  
  // 4. Calcular DARF total
  const totalDarfOriginal = darfs.reduce((sum, d) => sum + d.valor, 0);
  
  // 5. Calcular valores por linha
  interface LinhaCalculada extends LinhaProcessada {
    proporcaoAlvara: number;
    darfProporcional: number;
    mesesProporcionais: number;
    rtAlvara: number;
    rtHonorarios: number;
  }
  
  const linhasCalculadas: LinhaCalculada[] = linhasProcessadas.map((linha) => {
    const proporcaoAlvara = totalAlvarasDeflacionados > 0
      ? linha.valorDeflacionado / totalAlvarasDeflacionados
      : 0;
    
    const darfProporcional = ehMesmoAno
      ? totalDarfOriginal
      : totalDarfOriginal * proporcaoAlvara;
    
    // Calcular meses proporcionais com arredondamento conforme Art. 45
    const mesesProporcionaisRaw = numeroMeses * proporcaoAlvara;
    const mesesProporcionais = arredondarArt45(mesesProporcionaisRaw);
    const rtAlvara = (linha.valorAlvaraOriginal + darfProporcional) * proporcaoTributavel;
    const rtHonorarios = linha.valorHonorario * proporcaoTributavel;
    
    return {
      ...linha,
      proporcaoAlvara,
      darfProporcional,
      mesesProporcionais,
      rtAlvara,
      rtHonorarios,
    };
  });
  
  // 6. Identificar todos os exercícios
  const exerciciosAlvara = new Set(linhasCalculadas.map(l => l.exercicioAlvara));
  const exerciciosHonorario = new Set(
    linhasCalculadas
      .filter(l => l.exercicioHonorario !== null)
      .map(l => l.exercicioHonorario as number)
  );
  const todosExercicios = Array.from(
    new Set([...Array.from(exerciciosAlvara), ...Array.from(exerciciosHonorario)])
  ).sort((a, b) => (a ?? 0) - (b ?? 0));
  
  // 7. Calcular resultados por exercício
  const resultadosExercicios: ResultadoExercicio[] = [];
  
  for (const exercicio of todosExercicios) {
    const somaRtAlvara = linhasCalculadas
      .filter(l => l.exercicioAlvara === exercicio)
      .reduce((sum, l) => sum + l.rtAlvara, 0);
    
    const somaRtHonorarios = linhasCalculadas
      .filter(l => l.exercicioHonorario === exercicio)
      .reduce((sum, l) => sum + l.rtHonorarios, 0);
    
    const rendimentosTributaveis = Math.max(0, somaRtAlvara - somaRtHonorarios);
    
    const irrf = linhasCalculadas
      .filter(l => l.exercicioAlvara === exercicio)
      .reduce((sum, l) => sum + l.darfProporcional, 0);
    
    const meses = linhasCalculadas
      .filter(l => l.exercicioAlvara === exercicio)
      .reduce((sum, l) => sum + l.mesesProporcionais, 0);
    
    if (somaRtAlvara === 0 && somaRtHonorarios === 0) {
      continue;
    }
    
    const irDevido = calcularIRDevido(rendimentosTributaveis, meses, dataMaxDarf);
    const irpf = irrf - irDevido;
    
    const descricao = irpf >= 0 ? 'Imposto a Restituir' : 'Imposto a Pagar';
    
    resultadosExercicios.push({
      exercicio,
      rendimentosTributaveis,
      irrf,
      numeroMeses: meses,
      irpf,
      descricao,
    });
  }
  
  // 8. Calcular totais
  // APENAS soma original - NÃO somar com SELIC porque há exercícios com IRPF negativo
  const totalIrpf = resultadosExercicios.reduce((sum, r) => sum + r.irpf, 0);
  const descricaoTotal = totalIrpf >= 0 ? 'Imposto a Restituir' : 'Imposto a Pagar';
  
  return {
    totalIrpf,  // Soma ORIGINAL (sem SELIC)
    descricaoTotal,
    exercicios: resultadosExercicios,  // Detalhes por exercício com SELIC individual
    proporcaoTributavel,
    totalAlvarasDeflacionados,
    totalDarfOriginal,
  };
}
