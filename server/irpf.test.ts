import { describe, expect, it } from "vitest";
import { calcularIRPF } from "./db";

describe("calcularIRPF", () => {
  it("deve calcular corretamente a proporção tributável", () => {
    const resultado = calcularIRPF({
      brutoHomologado: 10000000, // R$ 100.000,00 em centavos
      tributavelHomologado: 3890480, // R$ 38.904,80 em centavos (38,9048%)
      numeroMeses: 24,
      alvaraValor: 8000000, // R$ 80.000,00
      darfValor: 1500000, // R$ 15.000,00
      honorariosValor: 2000000, // R$ 20.000,00
    });

    expect(resultado.proporcao).toBe("38.9048%");
  });

  it("deve calcular corretamente os rendimentos tributáveis do alvará", () => {
    const resultado = calcularIRPF({
      brutoHomologado: 10000000,
      tributavelHomologado: 5000000, // 50%
      numeroMeses: 12,
      alvaraValor: 8000000,
      darfValor: 1000000,
      honorariosValor: 1000000,
    });

    // 50% de 80.000 = 40.000 (4.000.000 centavos)
    expect(resultado.rendimentosTributavelAlvara).toBe(4000000);
  });

  it("deve calcular corretamente a base de cálculo", () => {
    const resultado = calcularIRPF({
      brutoHomologado: 10000000,
      tributavelHomologado: 5000000, // 50%
      numeroMeses: 12,
      alvaraValor: 8000000, // 80.000
      darfValor: 1000000,
      honorariosValor: 2000000, // 20.000
    });

    // Rendimentos tributáveis do alvará: 50% de 80.000 = 40.000
    // Rendimentos tributáveis dos honorários: 50% de 20.000 = 10.000
    // Base de cálculo: 40.000 - 10.000 = 30.000 (3.000.000 centavos)
    expect(resultado.baseCalculo).toBe(3000000);
  });

  it("deve calcular corretamente o IR devido", () => {
    const resultado = calcularIRPF({
      brutoHomologado: 10000000,
      tributavelHomologado: 5000000, // 50%
      numeroMeses: 12,
      alvaraValor: 8000000,
      darfValor: 1000000,
      honorariosValor: 2000000,
    });

    // Base de cálculo: 3.000.000 centavos
    // IR devido: 27.5% de 3.000.000 = 825.000 centavos
    expect(resultado.irDevido).toBe(825000);
  });

  it("deve calcular corretamente o IRPF a restituir", () => {
    const resultado = calcularIRPF({
      brutoHomologado: 10000000,
      tributavelHomologado: 5000000, // 50%
      numeroMeses: 12,
      alvaraValor: 8000000,
      darfValor: 1500000, // 15.000 retido
      honorariosValor: 2000000,
    });

    // IR devido: 825.000 centavos (R$ 8.250,00)
    // DARF retido: 1.500.000 centavos (R$ 15.000,00)
    // IRPF a restituir: 1.500.000 - 825.000 = 675.000 centavos (R$ 6.750,00)
    expect(resultado.irpfRestituir).toBe(675000);
  });

  it("deve retornar valor negativo quando IR devido é maior que o retido", () => {
    const resultado = calcularIRPF({
      brutoHomologado: 10000000,
      tributavelHomologado: 8000000, // 80%
      numeroMeses: 12,
      alvaraValor: 8000000,
      darfValor: 500000, // Apenas 5.000 retido
      honorariosValor: 1000000,
    });

    // Neste caso, o contribuinte deve IR adicional (valor negativo)
    expect(resultado.irpfRestituir).toBeLessThan(0);
  });

  it("deve calcular corretamente o RRA mensal", () => {
    const resultado = calcularIRPF({
      brutoHomologado: 10000000,
      tributavelHomologado: 5000000, // 50%
      numeroMeses: 24, // 24 meses
      alvaraValor: 8000000,
      darfValor: 1000000,
      honorariosValor: 2000000,
    });

    // Base de cálculo: 3.000.000 centavos
    // RRA mensal: 3.000.000 / 24 / 100 = 1250.00
    expect(resultado.rra).toBe("1250.00");
  });
});

describe("validação de entrada", () => {
  it("deve lidar com valores zero", () => {
    const resultado = calcularIRPF({
      brutoHomologado: 10000000,
      tributavelHomologado: 0,
      numeroMeses: 12,
      alvaraValor: 8000000,
      darfValor: 1000000,
      honorariosValor: 0,
    });

    expect(resultado.proporcao).toBe("0.0000%");
    expect(resultado.rendimentosTributavelAlvara).toBe(0);
    expect(resultado.baseCalculo).toBe(0);
  });

  it("deve lidar com número de meses igual a 1", () => {
    const resultado = calcularIRPF({
      brutoHomologado: 10000000,
      tributavelHomologado: 5000000,
      numeroMeses: 1,
      alvaraValor: 8000000,
      darfValor: 1000000,
      honorariosValor: 2000000,
    });

    // RRA mensal deve ser igual à base de cálculo dividida por 100
    expect(resultado.rra).toBe("30000.00");
  });
});
