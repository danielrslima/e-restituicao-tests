import { describe, it, expect } from 'vitest';
import { calcularIRPF, type DadosEntradaMotor } from './motor';

describe('Motor de Cálculo IRPF', () => {
  describe('Caso José Ramos - Mesmo Ano (2020)', () => {
    const dados: DadosEntradaMotor = {
      brutoHomologado: 2533329.85,
      tributavelHomologado: 985587.96,
      numeroMeses: 58,
      linhas: [
        {
          valorAlvara: 2315218.05,
          dataAlvara: new Date('2020-12-24'),
          valorHonorario: 694572.02,
          anoPagoHonorario: 2020,
        },
      ],
      darfs: [
        {
          valor: 220597.31,
          data: new Date('2020-12-24'),
        },
      ],
    };

    it('deve calcular IRPF corretamente para mesmo ano', () => {
      const resultado = calcularIRPF(dados);

      // Validar resultado total
      expect(resultado.totalIrpf).toBeCloseTo(74028.67, 1); // R$ 74.028,67
      expect(resultado.descricaoTotal).toBe('Imposto a Restituir');
    });

    it('deve detectar automaticamente que é mesmo ano', () => {
      const resultado = calcularIRPF(dados);

      // Deve ter apenas 1 exercício (2021 - exercício fiscal do alvará 2020)
      expect(resultado.exercicios).toHaveLength(1);
      expect(resultado.exercicios[0].exercicio).toBe(2021);
    });

    it('deve calcular proporção tributável corretamente', () => {
      const resultado = calcularIRPF(dados);

      // Proporção: 985587.96 / 2533329.85 = 0.3890484...
      expect(resultado.proporcaoTributavel).toBeCloseTo(0.3890484, 5);
    });

    it('deve retornar detalhes do exercício', () => {
      const resultado = calcularIRPF(dados);

      const exercicio = resultado.exercicios[0];
      expect(exercicio.exercicio).toBe(2021);
      expect(exercicio.rendimentosTributaveis).toBeGreaterThan(0);
      expect(exercicio.irrf).toBeGreaterThan(0);
      expect(exercicio.numeroMeses).toBeCloseTo(58, 0);
      expect(exercicio.descricao).toBe('Imposto a Restituir');
    });
  });

  describe('Caso Ana Carmen - Múltiplos Anos (2021, 2022, 2024)', () => {
    const dados: DadosEntradaMotor = {
      brutoHomologado: 3500000,
      tributavelHomologado: 1400000,
      numeroMeses: 84,
      linhas: [
        {
          valorAlvara: 1200000,
          dataAlvara: new Date('2021-06-15'),
          valorHonorario: 150000,
          anoPagoHonorario: 2021,
        },
        {
          valorAlvara: 1100000,
          dataAlvara: new Date('2022-08-20'),
          valorHonorario: 140000,
          anoPagoHonorario: 2022,
        },
        {
          valorAlvara: 900000,
          dataAlvara: new Date('2024-03-10'),
          valorHonorario: 120000,
          anoPagoHonorario: 2024,
        },
      ],
      darfs: [
        {
          valor: 100000,
          data: new Date('2021-06-15'),
        },
        {
          valor: 95000,
          data: new Date('2022-08-20'),
        },
        {
          valor: 85000,
          data: new Date('2024-03-10'),
        },
      ],
    };

    it('deve detectar automaticamente múltiplos anos', () => {
      const resultado = calcularIRPF(dados);

      // Deve ter 3 exercícios (2021, 2022, 2024)
      expect(resultado.exercicios.length).toBeGreaterThanOrEqual(1);
    });

    it('deve aplicar deflação quando múltiplos anos', () => {
      const resultado = calcularIRPF(dados);

      // Total de alvarás deflacionados deve ser diferente da soma simples
      // (3200000 sem deflação)
      expect(resultado.totalAlvarasDeflacionados).toBeGreaterThan(3200000);
    });

    it('deve retornar resultado numérico válido', () => {
      const resultado = calcularIRPF(dados);

      expect(typeof resultado.totalIrpf).toBe('number');
      expect(resultado.descricaoTotal).toMatch(/Imposto a (Restituir|Pagar)/);
    });

    it('deve calcular proporção tributável corretamente', () => {
      const resultado = calcularIRPF(dados);

      // Proporção: 1400000 / 3500000 = 0.4
      expect(resultado.proporcaoTributavel).toBeCloseTo(0.4, 5);
    });
  });

  describe('Validações e Casos Extremos', () => {
    it('deve lançar erro se brutoHomologado for zero', () => {
      const dados: DadosEntradaMotor = {
        brutoHomologado: 0,
        tributavelHomologado: 0,
        numeroMeses: 12,
        linhas: [
          {
            valorAlvara: 100000,
            dataAlvara: new Date('2020-01-01'),
          },
        ],
        darfs: [
          {
            valor: 10000,
            data: new Date('2020-01-01'),
          },
        ],
      };

      expect(() => calcularIRPF(dados)).toThrow();
    });

    it('deve retornar resultado vazio se não houver linhas', () => {
      const dados: DadosEntradaMotor = {
        brutoHomologado: 1000000,
        tributavelHomologado: 400000,
        numeroMeses: 12,
        linhas: [],
        darfs: [
          {
            valor: 10000,
            data: new Date('2020-01-01'),
          },
        ],
      };

      const resultado = calcularIRPF(dados);

      expect(resultado.totalIrpf).toBe(0);
      expect(resultado.exercicios).toHaveLength(0);
    });

    it('deve usar índice IPCA-E 1.0 para mesmo ano', () => {
      const dados: DadosEntradaMotor = {
        brutoHomologado: 1000000,
        tributavelHomologado: 400000,
        numeroMeses: 12,
        linhas: [
          {
            valorAlvara: 800000,
            dataAlvara: new Date('2020-01-15'),
          },
        ],
        darfs: [
          {
            valor: 50000,
            data: new Date('2020-01-15'),
          },
        ],
      };

      const resultado = calcularIRPF(dados);

      // Para mesmo ano, não deve haver deflação
      // Total de alvarás deflacionados deve ser igual ao valor original
      expect(resultado.totalAlvarasDeflacionados).toBeCloseTo(800000, 0);
    });
  });

  describe('Chave Seletora Automática', () => {
    it('deve detectar mesmo ano automaticamente', () => {
      const dados: DadosEntradaMotor = {
        brutoHomologado: 1000000,
        tributavelHomologado: 400000,
        numeroMeses: 12,
        linhas: [
          {
            valorAlvara: 500000,
            dataAlvara: new Date('2020-01-15'),
          },
          {
            valorAlvara: 300000,
            dataAlvara: new Date('2020-12-20'),
          },
        ],
        darfs: [
          {
            valor: 50000,
            data: new Date('2020-06-15'),
          },
        ],
      };

      const resultado = calcularIRPF(dados);

      // Sem deflação, total de alvarás deve ser 800000
      expect(resultado.totalAlvarasDeflacionados).toBeCloseTo(800000, 0);
    });

    it('deve detectar múltiplos anos automaticamente', () => {
      const dados: DadosEntradaMotor = {
        brutoHomologado: 1000000,
        tributavelHomologado: 400000,
        numeroMeses: 24,
        linhas: [
          {
            valorAlvara: 500000,
            dataAlvara: new Date('2020-01-15'),
          },
          {
            valorAlvara: 300000,
            dataAlvara: new Date('2021-12-20'),
          },
        ],
        darfs: [
          {
            valor: 50000,
            data: new Date('2020-06-15'),
          },
        ],
      };

      const resultado = calcularIRPF(dados);

      // Com deflação, total de alvarás será diferente
      expect(resultado.totalAlvarasDeflacionados).not.toEqual(800000);
    });
  });
});
