import { calcularIRPF } from "./server/db";

// Dados do José Ramos em centavos
const resultado = calcularIRPF({
  brutoHomologado: 253332985, // R$ 2.533.329,85
  tributavelHomologado: 98558796, // R$ 985.587,96
  numeroMeses: 58,
  alvaraValor: 231521805, // R$ 2.315.218,05
  darfValor: 22059731, // R$ 220.597,31
  honorariosValor: 69457202, // R$ 694.572,02
});

console.log("Valores calculados para José Ramos:");
console.log("proporcao:", resultado.proporcao);
console.log("rendimentosTributavelAlvara:", resultado.rendimentosTributavelAlvara);
console.log("rendimentosTributavelHonorarios:", resultado.rendimentosTributavelHonorarios);
console.log("baseCalculo:", resultado.baseCalculo);
console.log("rra:", resultado.rra);
console.log("irMensal:", resultado.irMensal);
console.log("irDevido:", resultado.irDevido);
console.log("irpfRestituir:", resultado.irpfRestituir);
console.log("");
console.log("IRPF a Restituir em R$:", (resultado.irpfRestituir / 100).toFixed(2));
