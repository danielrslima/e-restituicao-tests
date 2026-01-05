import { calcularIRPF, formatarMoeda, formatarPercentual } from './server/services/irpfCalculationService.js';

// Dados extraídos da planilha Excel - EXATAMENTE COMO NO TESTE
const dadosTeste = {
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
  linhas: [
    { valorAlvara: 365830.67, dataAlvara: new Date("2021-02-18"), valorHonorario: 8000.00, anoPagoHonorario: 2021 },
    { valorAlvara: 28450.55, dataAlvara: new Date("2021-02-19"), valorHonorario: 64766.00, anoPagoHonorario: 2021 },
    { valorAlvara: 143637.42, dataAlvara: new Date("2021-03-17"), valorHonorario: 43222.00, anoPagoHonorario: 2021 },
    { valorAlvara: 291808.08, dataAlvara: new Date("2021-05-12"), valorHonorario: 26379.00, anoPagoHonorario: 2022 },
    { valorAlvara: 194740.66, dataAlvara: new Date("2021-10-18"), valorHonorario: 119367.03, anoPagoHonorario: 2022 },
    { valorAlvara: 118851.12, dataAlvara: new Date("2022-04-06"), valorHonorario: 168560.31, anoPagoHonorario: 2024 },
    { valorAlvara: 168560.31, dataAlvara: new Date("2024-02-02"), valorHonorario: 97214.31, anoPagoHonorario: 2024 },
    { valorAlvara: 346802.89, dataAlvara: new Date("2024-03-01"), valorHonorario: 25353.18, anoPagoHonorario: 2024 },
    { valorAlvara: 246734.82, dataAlvara: new Date("2024-05-10"), valorHonorario: 0 },
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
  
  usarDeflacao: true,
};

console.log("╔════════════════════════════════════════════════════════════════╗");
console.log("║  SISTEMA DE CÁLCULOS - e-Restituição IRPF (CÓDIGO REAL)       ║");
console.log("║  Caso: ANA CARMEN COLLODETTI BRUGGER                          ║");
console.log("║  Data: 05/01/2026 - 06:19 (Horário de Brasília)               ║");
console.log("╚════════════════════════════════════════════════════════════════╝\n");

try {
  const resultado = calcularIRPF(dadosTeste);
  
  console.log("✅ CÁLCULO REALIZADO COM SUCESSO\n");
  
  console.log("📊 DADOS DO CLIENTE:");
  console.log(`  Nome: ${resultado.dadosContribuinte.nome}`);
  console.log(`  CPF: ${resultado.dadosContribuinte.cpf}`);
  console.log(`  Processo: ${resultado.dadosProcesso.numero}`);
  console.log(`  Comarca: ${resultado.dadosProcesso.comarca}`);
  console.log(`  Vara: ${resultado.dadosProcesso.vara}\n`);
  
  console.log("📈 DADOS HOMOLOGADOS:");
  console.log(`  Bruto Homologado: ${formatarMoeda(dadosTeste.brutoHomologado)}`);
  console.log(`  Tributável Homologado: ${formatarMoeda(dadosTeste.tributavelHomologado)}`);
  console.log(`  Proporção Tributável: ${formatarPercentual(resultado.proporcaoTributavel)}`);
  console.log(`  Número de Meses: ${dadosTeste.numeroMeses}`);
  console.log(`  Total Alvarás Deflacionados: ${formatarMoeda(resultado.totalAlvarasDeflacionados)}`);
  console.log(`  Total DARF Original: ${formatarMoeda(resultado.totalDarfOriginal)}\n`);
  
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("RESULTADO POR EXERCÍCIO");
  console.log("═══════════════════════════════════════════════════════════════════\n");
  
  for (const exercicio of resultado.exercicios) {
    console.log(`📅 EXERCÍCIO ${exercicio.exercicio}:`);
    console.log(`  Rendimentos Tributáveis: ${formatarMoeda(exercicio.rendimentosTributaveis)}`);
    console.log(`  IRRF (DARF): ${formatarMoeda(exercicio.irrf)}`);
    console.log(`  Meses: ${exercicio.numeroMeses.toFixed(2)}`);
    console.log(`  IR Devido: ${formatarMoeda(exercicio.irrf - exercicio.irpf)}`);
    console.log(`  IRPF (Original): ${formatarMoeda(exercicio.irpf)}`);
    console.log(`  Taxa SELIC: ${formatarPercentual(exercicio.taxaSelic)}`);
    console.log(`  IRPF (Atualizado): ${formatarMoeda(exercicio.valorAtualizado)}`);
    console.log(`  Status: ${exercicio.descricao}\n`);
  }
  
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("RESULTADO FINAL");
  console.log("═══════════════════════════════════════════════════════════════════\n");
  
  console.log(`✅ CLIENTE ${resultado.descricaoTotal.toUpperCase()}`);
  console.log(`   Valor Original: ${formatarMoeda(resultado.totalIrpf)}`);
  console.log(`   Valor Atualizado (com SELIC): ${formatarMoeda(resultado.totalAtualizado)}\n`);
  
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("✅ CÁLCULO CONCLUÍDO COM SUCESSO");
  console.log("═══════════════════════════════════════════════════════════════════");
  
} catch (error) {
  console.error("❌ ERRO:", error.message);
  process.exit(1);
}
