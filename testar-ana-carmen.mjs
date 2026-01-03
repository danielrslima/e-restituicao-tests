/**
 * Teste com dados reais de Ana Carmen
 * Compara resultado do código com resultado da planilha Excel
 */

import { calcularIRPF } from './server/services/irpfCalculationService.ts';

// Dados de Ana Carmen (extraídos da planilha Excel)
const dadosAnaCarmen = {
  nomeCliente: "ANA CARMEN COLLODETTI BRUGGER",
  cpf: "267.035.801-20",
  dataNascimento: new Date("1961-10-16"),
  numeroProcesso: "0001453-21.2013.5.10.0018",
  comarca: "BRASÍLIA",
  vara: "18ª VARA DO TRABALHO",
  brutoHomologado: 2096383.50,
  tributavelHomologado: 1495895.65,
  numeroMeses: 49,
  
  // Estrutura: linhas com alvará + honorário
  linhas: [
    // Linha 1
    { valorAlvara: 365830.67, dataAlvara: new Date("2021-02-18"), valorHonorario: 8000.00, anoPagoHonorario: 2021 },
    // Linha 2
    { valorAlvara: 28450.55, dataAlvara: new Date("2021-02-19"), valorHonorario: 64766.00, anoPagoHonorario: 2021 },
    // Linha 3
    { valorAlvara: 143637.42, dataAlvara: new Date("2021-03-17"), valorHonorario: 43222.00, anoPagoHonorario: 2021 },
    // Linha 4
    { valorAlvara: 291808.08, dataAlvara: new Date("2021-05-12"), valorHonorario: 26379.00, anoPagoHonorario: 2022 },
    // Linha 5
    { valorAlvara: 194740.66, dataAlvara: new Date("2021-10-18"), valorHonorario: 119367.03, anoPagoHonorario: 2022 },
    // Linha 6
    { valorAlvara: 118851.12, dataAlvara: new Date("2022-04-06"), valorHonorario: 0, anoPagoHonorario: undefined },
    // Linha 7
    { valorAlvara: 168560.31, dataAlvara: new Date("2024-02-02"), valorHonorario: 168560.31, anoPagoHonorario: 2024 },
    // Linha 8
    { valorAlvara: 346802.89, dataAlvara: new Date("2024-03-01"), valorHonorario: 97214.31, anoPagoHonorario: 2024 },
    // Linha 9
    { valorAlvara: 246734.82, dataAlvara: new Date("2024-05-10"), valorHonorario: 25353.18, anoPagoHonorario: 2024 },
    // Linha 10
    { valorAlvara: 127139.13, dataAlvara: new Date("2024-11-06"), valorHonorario: 0, anoPagoHonorario: undefined },
  ],
  
  // DARF único
  darfs: [
    { valor: 413926.80, data: new Date("2024-11-06") }
  ],
  
  usarDeflacao: true
};

console.log("╔════════════════════════════════════════════════════════════════╗");
console.log("║         TESTE COM DADOS DE ANA CARMEN                          ║");
console.log("╚════════════════════════════════════════════════════════════════╝\n");

console.log("📋 DADOS DE ENTRADA:");
console.log(`  Nome: ${dadosAnaCarmen.nomeCliente}`);
console.log(`  CPF: ${dadosAnaCarmen.cpf}`);
console.log(`  Bruto Homologado: R$ ${dadosAnaCarmen.brutoHomologado.toFixed(2)}`);
console.log(`  Tributável Homologado: R$ ${dadosAnaCarmen.tributavelHomologado.toFixed(2)}`);
console.log(`  Número de Meses: ${dadosAnaCarmen.numeroMeses}`);
console.log(`  Alvarás: ${dadosAnaCarmen.linhas.length}`);
console.log(`  DARFs: ${dadosAnaCarmen.darfs.length}`);
console.log(`  Honorários: ${dadosAnaCarmen.linhas.filter(l => l.valorHonorario > 0).length}\n`);

try {
  // Executar cálculo
  const resultado = calcularIRPF(dadosAnaCarmen);
  
  console.log("📊 RESULTADO DO CÁLCULO:\n");
  
  // Mostrar por exercício
  resultado.exercicios.forEach(ex => {
    console.log(`  Exercício ${ex.exercicio}:`);
    console.log(`    Rendimentos Tributáveis: R$ ${ex.rendimentosTributaveis.toFixed(2)}`);
    console.log(`    IRRF (DARF): R$ ${ex.irrf.toFixed(2)}`);
    console.log(`    Meses: ${ex.numeroMeses.toFixed(2)}`);
    console.log(`    IRPF: R$ ${ex.irpf.toFixed(2)} (${ex.descricao})`);
    console.log(``);
  });
  
  console.log(`  TOTAL IRPF: R$ ${resultado.totalIrpf.toFixed(2)} (${resultado.descricaoTotal})\n`);
  
  // Comparar com valores esperados da planilha
  console.log("📈 COMPARAÇÃO COM PLANILHA EXCEL:\n");
  
  const valoresEsperados = [
    { exercicio: 2022, irpf: -14184.81 },
    { exercicio: 2023, irpf: 20247.37 },
    { exercicio: 2025, irpf: 21452.80 }
  ];
  
  const totalEsperado = 27515.36;
  
  let todosCorretos = true;
  
  valoresEsperados.forEach(esperado => {
    const calculado = resultado.exercicios.find(ex => ex.exercicio === esperado.exercicio);
    
    if (!calculado) {
      console.log(`  ❌ Exercício ${esperado.exercicio}: NÃO ENCONTRADO`);
      todosCorretos = false;
      return;
    }
    
    const diferenca = Math.abs(calculado.irpf - esperado.irpf);
    const percentual = (diferenca / Math.abs(esperado.irpf)) * 100;
    
    if (percentual < 0.01) {
      console.log(`  ✅ Exercício ${esperado.exercicio}: CORRETO`);
      console.log(`     Esperado: R$ ${esperado.irpf.toFixed(2)}`);
      console.log(`     Calculado: R$ ${calculado.irpf.toFixed(2)}`);
      console.log(`     Diferença: R$ ${diferenca.toFixed(2)} (${percentual.toFixed(4)}%)\n`);
    } else {
      console.log(`  ❌ Exercício ${esperado.exercicio}: DIFERENÇA SIGNIFICATIVA`);
      console.log(`     Esperado: R$ ${esperado.irpf.toFixed(2)}`);
      console.log(`     Calculado: R$ ${calculado.irpf.toFixed(2)}`);
      console.log(`     Diferença: R$ ${diferenca.toFixed(2)} (${percentual.toFixed(2)}%)\n`);
      todosCorretos = false;
    }
  });
  
  // Verificar total
  const diferencaTotal = Math.abs(resultado.totalIrpf - totalEsperado);
  const percentualTotal = (diferencaTotal / totalEsperado) * 100;
  
  if (percentualTotal < 0.01) {
    console.log(`  ✅ TOTAL: CORRETO`);
    console.log(`     Esperado: R$ ${totalEsperado.toFixed(2)}`);
    console.log(`     Calculado: R$ ${resultado.totalIrpf.toFixed(2)}`);
    console.log(`     Diferença: R$ ${diferencaTotal.toFixed(2)} (${percentualTotal.toFixed(4)}%)\n`);
  } else {
    console.log(`  ❌ TOTAL: DIFERENÇA SIGNIFICATIVA`);
    console.log(`     Esperado: R$ ${totalEsperado.toFixed(2)}`);
    console.log(`     Calculado: R$ ${resultado.totalIrpf.toFixed(2)}`);
    console.log(`     Diferença: R$ ${diferencaTotal.toFixed(2)} (${percentualTotal.toFixed(2)}%)\n`);
    todosCorretos = false;
  }
  
  // Resultado final
  console.log("╔════════════════════════════════════════════════════════════════╗");
  if (todosCorretos) {
    console.log("║  ✅ TESTE PASSOU - CÓDIGO ESTÁ CORRETO!                       ║");
  } else {
    console.log("║  ❌ TESTE FALHOU - CÓDIGO PRECISA DE AJUSTES                  ║");
  }
  console.log("╚════════════════════════════════════════════════════════════════╝\n");
  
  process.exit(todosCorretos ? 0 : 1);
  
} catch (error) {
  console.error("\n❌ ERRO AO EXECUTAR CÁLCULO:");
  console.error(error);
  process.exit(1);
}
