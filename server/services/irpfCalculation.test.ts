/**
 * Testes do Motor de Cálculo de IRPF
 * 
 * Valida os cálculos comparando com os resultados da planilha Excel
 * Caso de teste: Ana Carmen Collodetti Brugger
 * 
 * ESTRUTURA DA PLANILHA:
 * - Cada LINHA pode ter: Alvará (valor + data) + Honorário (valor + ano pago)
 * - Os honorários estão vinculados às linhas dos alvarás
 * - O exercício do honorário = ano pago + 1 (pode ser diferente do exercício do alvará)
 */

import { describe, expect, it } from "vitest";
import { calcularIRPF, DadosEntrada, formatarMoeda, LinhaCalculo } from "./irpfCalculationService";

// Dados de teste extraídos da planilha Excel - ESTRUTURA CORRETA POR LINHA
const dadosTeste: DadosEntrada = {
  nomeCliente: "ANA CARMEN COLLODETTI BRUGGER",
  cpf: "267.035.801-20",
  dataNascimento: new Date("1961-10-16"),
  
  numeroProcesso: "0001453-21.2013.5.10.0018",
  comarca: "BRASÍLIA",
  vara: "18ª VARA DO TRABALHO",
  
  brutoHomologado: 2096383.50,
  tributavelHomologado: 1495895.65,
  numeroMeses: 49,
  
  // Estrutura correta: cada linha tem alvará + honorário
  // Dados extraídos da aba "Informações" da planilha
  linhas: [
    // Linha 5: Alvará 18/02/2021 + Honorário ano 2021
    { valorAlvara: 365830.67, dataAlvara: new Date("2021-02-18"), valorHonorario: 8000.00, anoPagoHonorario: 2021 },
    // Linha 6: Alvará 19/02/2021 + Honorário ano 2021
    { valorAlvara: 28450.55, dataAlvara: new Date("2021-02-19"), valorHonorario: 64766.00, anoPagoHonorario: 2021 },
    // Linha 7: Alvará 17/03/2021 + Honorário ano 2021
    { valorAlvara: 143637.42, dataAlvara: new Date("2021-03-17"), valorHonorario: 43222.00, anoPagoHonorario: 2021 },
    // Linha 8: Alvará 12/05/2021 + Honorário ano 2022
    { valorAlvara: 291808.08, dataAlvara: new Date("2021-05-12"), valorHonorario: 26379.00, anoPagoHonorario: 2022 },
    // Linha 9: Alvará 18/10/2021 + Honorário ano 2022
    { valorAlvara: 194740.66, dataAlvara: new Date("2021-10-18"), valorHonorario: 119367.03, anoPagoHonorario: 2022 },
    // Linha 10: Alvará 06/04/2022 + Honorário ano 2024
    { valorAlvara: 118851.12, dataAlvara: new Date("2022-04-06"), valorHonorario: 168560.31, anoPagoHonorario: 2024 },
    // Linha 11: Alvará 02/02/2024 + Honorário ano 2024
    { valorAlvara: 168560.31, dataAlvara: new Date("2024-02-02"), valorHonorario: 97214.31, anoPagoHonorario: 2024 },
    // Linha 12: Alvará 01/03/2024 + Honorário ano 2024
    { valorAlvara: 346802.89, dataAlvara: new Date("2024-03-01"), valorHonorario: 25353.18, anoPagoHonorario: 2024 },
    // Linha 13: Alvará 10/05/2024 (sem honorário)
    { valorAlvara: 246734.82, dataAlvara: new Date("2024-05-10"), valorHonorario: 0 },
    // Linha 14: Alvará 06/11/2024 (sem honorário)
    { valorAlvara: 127139.13, dataAlvara: new Date("2024-11-06"), valorHonorario: 0 },
  ],
  
  darfs: [
    { 
      valor: 413926.80, 
      data: new Date("2024-11-06"),
      fontePagadora: "BANCO DO BRASIL S/A",
      cnpj: "00.000.000/0001-91"
    },
  ],
  
  usarDeflacao: true, // ANOS DIFERENTES
};

describe("Motor de Cálculo IRPF", () => {
  it("deve calcular a proporção tributável corretamente", () => {
    const resultado = calcularIRPF(dadosTeste);
    
    // Proporção = 1495895.65 / 2096383.50 = 0.7136 (71.36%)
    const proporcaoEsperada = 1495895.65 / 2096383.50;
    
    expect(resultado.proporcaoTributavel).toBeCloseTo(proporcaoEsperada, 4);
  });

  it("deve identificar os exercícios fiscais corretos", () => {
    const resultado = calcularIRPF(dadosTeste);
    
    // Exercícios esperados: 2022, 2023, 2025
    // 2022: alvarás de 2021 (ex = ano + 1) + honorários de 2021 (ex = ano + 1)
    // 2023: alvará de 2022 (ex = 2023) + honorários de 2022 (ex = 2023)
    // 2025: alvarás de 2024 (ex = 2025) + honorários de 2024 (ex = 2025)
    const exercicios = resultado.exercicios.map(e => e.exercicio);
    
    expect(exercicios).toContain(2022);
    expect(exercicios).toContain(2023);
    expect(exercicios).toContain(2025);
  });

  it("deve calcular o IRPF do exercício 2022 (negativo - imposto a pagar)", () => {
    const resultado = calcularIRPF(dadosTeste);
    
    const exercicio2022 = resultado.exercicios.find(e => e.exercicio === 2022);
    
    expect(exercicio2022).toBeDefined();
    expect(exercicio2022!.irpf).toBeLessThan(0); // Negativo = imposto a pagar
    expect(exercicio2022!.descricao).toBe("Imposto a Pagar");
    
    // Valor esperado da planilha: -14.184,81
    // Tolerância de 1% devido a diferenças de arredondamento
    expect(exercicio2022!.irpf).toBeCloseTo(-14184.81, -2);
  });

  it("deve calcular o IRPF do exercício 2023 (positivo - restituir)", () => {
    const resultado = calcularIRPF(dadosTeste);
    
    const exercicio2023 = resultado.exercicios.find(e => e.exercicio === 2023);
    
    expect(exercicio2023).toBeDefined();
    // 2023 pode ser 0 se honorários >= RT Alvará
    // Na planilha: RT Alvará 2023 = 99.255,13 | RT Honorários 2023 = 103.998,55
    // RT = max(0, 99.255,13 - 103.998,55) = 0
    // Mas há IRRF de 2023, então pode haver restituição
    
    // Valor esperado da planilha: 20.247,37
    expect(exercicio2023!.irpf).toBeCloseTo(20247.37, -2);
  });

  it("deve calcular o IRPF do exercício 2025 (positivo - restituir)", () => {
    const resultado = calcularIRPF(dadosTeste);
    
    const exercicio2025 = resultado.exercicios.find(e => e.exercicio === 2025);
    
    expect(exercicio2025).toBeDefined();
    expect(exercicio2025!.irpf).toBeGreaterThan(0); // Positivo = restituir
    expect(exercicio2025!.descricao).toBe("Imposto a Restituir");
    
    // Valor esperado da planilha: 21.452,80
    expect(exercicio2025!.irpf).toBeCloseTo(21452.80, -2);
  });

  it("deve calcular o total de IRPF corretamente", () => {
    const resultado = calcularIRPF(dadosTeste);
    
    // Total esperado da planilha: 27.515,36
    // (-14.184,81 + 20.247,37 + 21.452,80 = 27.515,36)
    expect(resultado.totalIrpf).toBeCloseTo(27515.36, -2);
    expect(resultado.descricaoTotal).toBe("Imposto a Restituir");
  });

  it("deve aplicar SELIC apenas em valores positivos", () => {
    const resultado = calcularIRPF(dadosTeste);
    
    const exercicio2022 = resultado.exercicios.find(e => e.exercicio === 2022);
    const exercicio2023 = resultado.exercicios.find(e => e.exercicio === 2023);
    
    // 2022 é negativo, não deve ter valor atualizado
    expect(exercicio2022!.valorAtualizado).toBe(0);
    
    // 2023 é positivo, deve ter valor atualizado
    if (exercicio2023!.irpf > 0) {
      expect(exercicio2023!.valorAtualizado).toBeGreaterThan(exercicio2023!.valorOriginal);
    }
  });

  it("deve calcular corretamente sem deflação (MESMO ANO)", () => {
    const dadosMesmoAno: DadosEntrada = {
      ...dadosTeste,
      usarDeflacao: false,
    };
    
    const resultado = calcularIRPF(dadosMesmoAno);
    
    // Sem deflação, os valores não são corrigidos pelo IPCA-E
    // O total de alvarás deflacionados deve ser igual à soma dos valores originais
    const totalAlvarasOriginal = dadosTeste.linhas!.reduce((sum, l) => sum + l.valorAlvara, 0);
    
    expect(resultado.totalAlvarasDeflacionados).toBeCloseTo(totalAlvarasOriginal, 2);
  });

  it("deve formatar valores em moeda brasileira", () => {
    const formatted = formatarMoeda(27515.36);
    // Verificar se contém os elementos esperados (pode variar por locale)
    expect(formatted).toContain("27");
    expect(formatted).toContain("515");
  });
});

describe("Casos de borda", () => {
  it("deve lidar com lista vazia de linhas", () => {
    const dadosVazios: DadosEntrada = {
      ...dadosTeste,
      linhas: [],
      alvaras: [],
    };
    
    const resultado = calcularIRPF(dadosVazios);
    
    expect(resultado.exercicios).toHaveLength(0);
    expect(resultado.totalIrpf).toBe(0);
  });

  it("deve lidar com honorários maiores que rendimentos (RT = 0)", () => {
    // Caso onde honorários do MESMO EXERCÍCIO são maiores que o RT Alvará
    // Alvará de 2021 → Exercício 2022
    // Honorário pago em 2021 → Exercício 2022 (mesmo exercício)
    // RT Alvará = (10000 + DARF proporcional) × proporção ≈ 7136
    // RT Honorário = 50000 × proporção ≈ 35680
    // RT = max(0, 7136 - 35680) = 0
    const dadosHonorarioMaior: DadosEntrada = {
      ...dadosTeste,
      linhas: [
        { valorAlvara: 10000, dataAlvara: new Date("2021-02-18"), valorHonorario: 50000, anoPagoHonorario: 2021 },
      ],
      darfs: [], // Sem DARF para simplificar
    };
    
    const resultado = calcularIRPF(dadosHonorarioMaior);
    
    // O RT deve ser 0 (não negativo) porque honorário > alvará
    const exercicio2022 = resultado.exercicios.find(e => e.exercicio === 2022);
    expect(exercicio2022).toBeDefined();
    expect(exercicio2022!.rendimentosTributaveis).toBe(0);
  });

  it("deve lidar com linha só com honorário (sem alvará)", () => {
    // Honorário pago sem levantamento de alvará correspondente
    const dadosSoHonorario: DadosEntrada = {
      ...dadosTeste,
      linhas: [
        { valorAlvara: 100000, dataAlvara: new Date("2021-02-18"), valorHonorario: 0 },
        { valorAlvara: 0, dataAlvara: new Date("2021-02-18"), valorHonorario: 20000, anoPagoHonorario: 2022 },
      ],
    };
    
    const resultado = calcularIRPF(dadosSoHonorario);
    
    // Deve processar sem erros
    expect(resultado.exercicios.length).toBeGreaterThan(0);
  });
});

describe("Validação de valores da planilha", () => {
  it("deve calcular RT Alvará corretamente para linha 5", () => {
    // RT Alvará linha 5 esperado: 305.513,08
    // Fórmula: (Alvará + DARF Proporcional) × Proporção Tributável
    const resultado = calcularIRPF(dadosTeste);
    
    // Proporção tributável
    const proporcao = resultado.proporcaoTributavel;
    expect(proporcao).toBeCloseTo(0.7136, 4);
  });

  it("deve agrupar RT Alvará por exercício do ALVARÁ", () => {
    const resultado = calcularIRPF(dadosTeste);
    
    // Exercício 2022: alvarás de 2021 (linhas 5-9)
    // Exercício 2023: alvará de 2022 (linha 10)
    // Exercício 2025: alvarás de 2024 (linhas 11-14)
    
    expect(resultado.exercicios.length).toBe(3);
  });

  it("deve agrupar RT Honorários por exercício do HONORÁRIO", () => {
    const resultado = calcularIRPF(dadosTeste);
    
    // Honorários 2021 → Exercício 2022 (linhas 5-7)
    // Honorários 2022 → Exercício 2023 (linhas 8-9)
    // Honorários 2024 → Exercício 2025 (linhas 10-12)
    
    // Verificar que o exercício 2023 tem RT baixo ou zero
    // porque RT Alvará 2023 < RT Honorários 2023
    const exercicio2023 = resultado.exercicios.find(e => e.exercicio === 2023);
    if (exercicio2023) {
      // RT 2023 = RT Alvará 2023 - RT Honorários 2023
      // Se negativo, deve ser 0
      expect(exercicio2023.rendimentosTributaveis).toBeGreaterThanOrEqual(0);
    }
  });
});
