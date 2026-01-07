// Motor de Cálculo IRPF com 5 Tabelas IRRF (01/04/2015 a 31/12/2026)
// Integração direta do motor JavaScript puro com tipos TypeScript

// Tipos de entrada
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

// ============================================================================
// 1. ÍNDICES IPCA-E (84 meses: 2020-2025)
// ============================================================================

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

// ============================================================================
// 2. TAXAS SELIC ACUMULADAS (2016-2025)
// ============================================================================

const SELIC_ACUMULADA: Record<number, number> = {
  2016: 0.1387,
  2017: 0.0980,
  2018: 0.0623,
  2019: 0.0532,
  2020: 0.0275,
  2021: 0.0375,
  2022: 0.1065,
  2023: 0.1369,
  2024: 0.1069,
  2025: 0.0809,
};

// ============================================================================
// 3. TABELAS DE ALÍQUOTAS DE IR
// ============================================================================

interface TabelaIR {
  min: number;
  max: number;
  aliquota: number;
  deducao: number;
}

const TABELA_IR_2015_2023: TabelaIR[] = [
  { min: 0, max: 1903.98, aliquota: 0, deducao: 0 },
  { min: 1903.99, max: 2826.65, aliquota: 0.075, deducao: 142.80 },
  { min: 2826.66, max: 3751.05, aliquota: 0.15, deducao: 354.80 },
  { min: 3751.06, max: 4664.68, aliquota: 0.225, deducao: 636.13 },
  { min: 4664.69, max: Infinity, aliquota: 0.275, deducao: 869.36 },
];

const TABELA_IR_2023_2024_MAI: TabelaIR[] = [
  { min: 0, max: 2112.00, aliquota: 0, deducao: 0 },
  { min: 2112.01, max: 2826.65, aliquota: 0.075, deducao: 158.40 },
  { min: 2826.66, max: 3751.05, aliquota: 0.15, deducao: 370.40 },
  { min: 3751.06, max: 4664.68, aliquota: 0.225, deducao: 651.73 },
  { min: 4664.69, max: Infinity, aliquota: 0.275, deducao: 884.96 },
];

const TABELA_IR_2024_FEV: TabelaIR[] = [
  { min: 0, max: 2259.20, aliquota: 0, deducao: 0 },
  { min: 2259.21, max: 2826.65, aliquota: 0.075, deducao: 169.44 },
  { min: 2826.66, max: 3751.05, aliquota: 0.15, deducao: 381.44 },
  { min: 3751.06, max: 4664.68, aliquota: 0.225, deducao: 662.77 },
  { min: 4664.69, max: Infinity, aliquota: 0.275, deducao: 896.00 },
];

const TABELA_IR_2025_MAI: TabelaIR[] = [
  { min: 0, max: 2600.00, aliquota: 0, deducao: 0 },
  { min: 2600.01, max: 3781.50, aliquota: 0.075, deducao: 195.00 },
  { min: 3781.51, max: 4971.00, aliquota: 0.15, deducao: 435.75 },
  { min: 4971.01, max: 6433.57, aliquota: 0.225, deducao: 776.25 },
  { min: 6433.58, max: Infinity, aliquota: 0.275, deducao: 1075.50 },
];

const TABELA_IR_2026: TabelaIR[] = [
  { min: 0, max: 2600.00, aliquota: 0, deducao: 0 },
  { min: 2600.01, max: 3781.50, aliquota: 0.075, deducao: 195.00 },
  { min: 3781.51, max: 4971.00, aliquota: 0.15, deducao: 435.75 },
  { min: 4971.01, max: 6433.57, aliquota: 0.225, deducao: 776.25 },
  { min: 6433.58, max: Infinity, aliquota: 0.275, deducao: 1075.50 },
];

// ============================================================================
// 4. DATAS LIMITE DAS TABELAS
// ============================================================================

const DATA_LIMITE_TABELA_1 = new Date(Date.UTC(2023, 3, 30)); // 30/04/2023
const DATA_LIMITE_TABELA_2 = new Date(Date.UTC(2024, 0, 31)); // 31/01/2024
const DATA_LIMITE_TABELA_3 = new Date(Date.UTC(2025, 3, 30)); // 30/04/2025
const DATA_LIMITE_TABELA_4 = new Date(Date.UTC(2025, 11, 31)); // 31/12/2025

// ============================================================================
// 5. FUNÇÕES AUXILIARES
// ============================================================================

function getExercicioFiscal(data: Date): number {
  const ano = data.getUTCFullYear();
  const mes = data.getUTCMonth() + 1;
  // Exercício fiscal: se janeiro-março, é o mesmo ano; se abril-dezembro, é ano + 1
  return mes <= 3 ? ano : ano + 1;
}

function getIpcaCoefficient(data: Date, usarDeflacao: boolean): number {
  if (!usarDeflacao) return 1.0;

  const ano = data.getUTCFullYear();
  const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
  const chave = `${ano}-${mes}`;

  return IPCA_E_INDICES[chave] || 1.0;
}

function getTabelaIR(dataDarf: Date): TabelaIR[] {
  const fimMesDarf = new Date(Date.UTC(dataDarf.getUTCFullYear(), dataDarf.getUTCMonth() + 1, 0));

  if (fimMesDarf <= DATA_LIMITE_TABELA_1) {
    return TABELA_IR_2015_2023;
  } else if (fimMesDarf <= DATA_LIMITE_TABELA_2) {
    return TABELA_IR_2023_2024_MAI;
  } else if (fimMesDarf <= DATA_LIMITE_TABELA_3) {
    return TABELA_IR_2024_FEV;
  } else if (fimMesDarf <= DATA_LIMITE_TABELA_4) {
    return TABELA_IR_2025_MAI;
  } else {
    return TABELA_IR_2026;
  }
}

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
// 6. FUNÇÃO PRINCIPAL DE CÁLCULO
// ============================================================================

export function calcularIRPF(dados: DadosEntradaMotor): ResultadoCalculoIRPF {
  const {
    brutoHomologado,
    tributavelHomologado,
    numeroMeses,
    linhas,
    darfs,
  } = dados;

  // ========== CHAVE SELETORA AUTOMÁTICA ==========
  // Detecta se todos os exercícios são do mesmo ano
  const anosUnicos = new Set<number>();
  linhas.forEach(linha => {
    const ano = linha.dataAlvara.getUTCFullYear();
    anosUnicos.add(ano);
  });

  const ehMesmoAno = anosUnicos.size === 1;
  const usarDeflacao = !ehMesmoAno; // Se mesmo ano, não usa deflação
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
  const linhasProcessadas = linhas.map((linha, index) => {
    const exercicioAlvara = getExercicioFiscal(linha.dataAlvara);
    const indiceIpca = getIpcaCoefficient(linha.dataAlvara, usarDeflacao);
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
  const linhasCalculadas = linhasProcessadas.map((linha) => {
    const proporcaoAlvara = totalAlvarasDeflacionados > 0
      ? linha.valorDeflacionado / totalAlvarasDeflacionados
      : 0;

    const darfProporcional = (totalDarfOriginal * proporcaoAlvara) / linha.indiceIpca;
    const mesesProporcionais = numeroMeses * proporcaoAlvara;
    const rtAlvara = (linha.valorAlvaraOriginal + darfProporcional) * proporcaoTributavel;
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

  // 6. Identificar todos os exercícios
  const exerciciosAlvara = new Set(linhasCalculadas.map(l => l.exercicioAlvara));
  const exerciciosHonorario = new Set(
    linhasCalculadas
      .filter(l => l.exercicioHonorario !== null)
      .map(l => l.exercicioHonorario)
  );
  const todosExercicios = Array.from(
    new Set([...Array.from(exerciciosAlvara), ...Array.from(exerciciosHonorario)])
  ).sort((a, b) => (a ?? 0) - (b ?? 0));

  // 7. Calcular resultados por exercício
  const resultadosExercicios: ResultadoExercicio[] = [];

  for (const exercicio of todosExercicios as number[]) {
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
      numeroMeses: Math.round(meses * 100) / 100,
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
    exercicios: resultadosExercicios,  // Detalhes por exercício
    proporcaoTributavel,
    totalAlvarasDeflacionados,
    totalDarfOriginal,
  };
}
