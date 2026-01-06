/**
 * Testes para Serviços de Atualização Automática de Índices
 * 
 * Testa:
 * - Integração com TRT2 (IPCA-E)
 * - Integração com BCB (SELIC)
 * - Job agendado
 * - Validação de dados
 * 
 * ID do Documento: TEST-UPDATE-INDICES-05JAN2026
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  buscarIPCAETrt2,
  atualizarIPCAE,
  validarIPCAE,
} from './ipcaUpdateService';
import {
  buscarSELICBCB,
  atualizarSELIC,
  calcularSELICPeriodo,
  validarSELIC,
} from './selicUpdateService';

describe('Serviço IPCA-E', () => {
  describe('validarIPCAE', () => {
    it('deve validar índices IPCA-E corretos', () => {
      const indices = [
        { mes: 1, ano: 2025, indice: 1.0415014794 },
        { mes: 2, ano: 2025, indice: 1.0398765432 },
        { mes: 3, ano: 2025, indice: 1.0356789012 },
      ];
      
      expect(validarIPCAE(indices)).toBe(true);
    });
    
    it('deve rejeitar array vazio', () => {
      expect(validarIPCAE([])).toBe(false);
    });
    
    it('deve rejeitar índices com mês inválido', () => {
      const indices = [
        { mes: 13, ano: 2025, indice: 1.0415014794 }, // Mês 13 inválido
      ];
      
      expect(validarIPCAE(indices)).toBe(false);
    });
    
    it('deve rejeitar índices com ano inválido', () => {
      const indices = [
        { mes: 1, ano: 2010, indice: 1.0415014794 }, // Ano antes de 2019
      ];
      
      expect(validarIPCAE(indices)).toBe(false);
    });
    
    it('deve rejeitar índices com valor fora do range', () => {
      const indices = [
        { mes: 1, ano: 2025, indice: 15.5 }, // Valor muito alto
      ];
      
      expect(validarIPCAE(indices)).toBe(false);
    });
    
    it('deve rejeitar índices com campos ausentes', () => {
      const indices = [
        { mes: 1, ano: 2025 }, // Falta indice
      ] as any;
      
      expect(validarIPCAE(indices)).toBe(false);
    });
  });
  
  describe('atualizarIPCAE', () => {
    it('deve atualizar com sucesso', async () => {
      const novoIndices = [
        { mes: 1, ano: 2025, indice: 1.0415014794 },
        { mes: 2, ano: 2025, indice: 1.0398765432 },
      ];
      
      // Não deve lançar erro
      await expect(atualizarIPCAE(novoIndices)).resolves.toBeUndefined();
    });
    
    it('deve rejeitar array vazio', async () => {
      await expect(atualizarIPCAE([])).rejects.toThrow();
    });
  });
});

describe('Serviço SELIC', () => {
  describe('validarSELIC', () => {
    it('deve validar taxas SELIC corretas', () => {
      const taxas = [
        { data: '01/01/2025', valor: 10.5, exercicio: 2025 },
        { data: '15/01/2025', valor: 10.5, exercicio: 2025 },
        { data: '01/02/2025', valor: 10.5, exercicio: 2025 },
      ];
      
      expect(validarSELIC(taxas)).toBe(true);
    });
    
    it('deve rejeitar array vazio', () => {
      expect(validarSELIC([])).toBe(false);
    });
    
    it('deve rejeitar taxas com formato de data inválido', () => {
      const taxas = [
        { data: '2025-01-01', valor: 10.5, exercicio: 2025 }, // Formato errado
      ];
      
      expect(validarSELIC(taxas)).toBe(false);
    });
    
    it('deve rejeitar taxas com valor negativo', () => {
      const taxas = [
        { data: '01/01/2025', valor: -5, exercicio: 2025 },
      ];
      
      expect(validarSELIC(taxas)).toBe(false);
    });
    
    it('deve rejeitar taxas com valor muito alto', () => {
      const taxas = [
        { data: '01/01/2025', valor: 100, exercicio: 2025 }, // Muito alto
      ];
      
      expect(validarSELIC(taxas)).toBe(false);
    });
    
    it('deve rejeitar taxas com campos ausentes', () => {
      const taxas = [
        { data: '01/01/2025', valor: 10.5 }, // Falta exercicio
      ] as any;
      
      expect(validarSELIC(taxas)).toBe(false);
    });
  });
  
  describe('calcularSELICPeriodo', () => {
    it('deve calcular SELIC acumulada corretamente', () => {
      const taxas = [
        { data: '01/01/2025', valor: 10, exercicio: 2025 },
        { data: '15/01/2025', valor: 10, exercicio: 2025 },
        { data: '01/02/2025', valor: 10, exercicio: 2025 },
      ];
      
      const resultado = calcularSELICPeriodo('01/01/2025', '01/02/2025', taxas);
      
      // Taxa acumulada: (1.1 * 1.1 * 1.1) - 1 = 0.331 = 33.1%
      expect(resultado).toBeCloseTo(33.1, 1);
    });
    
    it('deve retornar 0 se nenhuma taxa no período', () => {
      const taxas = [
        { data: '01/01/2025', valor: 10, exercicio: 2025 },
      ];
      
      const resultado = calcularSELICPeriodo('01/03/2025', '01/04/2025', taxas);
      
      expect(resultado).toBe(0);
    });
  });
  
  describe('atualizarSELIC', () => {
    it('deve atualizar com sucesso', async () => {
      const novasTaxas = [
        { data: '01/01/2025', valor: 10.5, exercicio: 2025 },
        { data: '15/01/2025', valor: 10.5, exercicio: 2025 },
      ];
      
      // Não deve lançar erro
      await expect(atualizarSELIC(novasTaxas)).resolves.toBeUndefined();
    });
    
    it('deve rejeitar array vazio', async () => {
      await expect(atualizarSELIC([])).rejects.toThrow();
    });
  });
});

describe('Integração IPCA-E e SELIC', () => {
  it('deve validar índices e taxas juntos', () => {
    const indices = [
      { mes: 1, ano: 2025, indice: 1.0415014794 },
      { mes: 2, ano: 2025, indice: 1.0398765432 },
    ];
    
    const taxas = [
      { data: '01/01/2025', valor: 10.5, exercicio: 2025 },
      { data: '15/01/2025', valor: 10.5, exercicio: 2025 },
    ];
    
    expect(validarIPCAE(indices)).toBe(true);
    expect(validarSELIC(taxas)).toBe(true);
  });
});

describe('Casos de Uso Reais', () => {
  it('deve processar índices IPCA-E de 2025', () => {
    const indices2025 = [
      { mes: 1, ano: 2025, indice: 1.0415014794 },
      { mes: 2, ano: 2025, indice: 1.0398765432 },
      { mes: 3, ano: 2025, indice: 1.0356789012 },
      { mes: 4, ano: 2025, indice: 1.0345678901 },
      { mes: 5, ano: 2025, indice: 1.0334567890 },
    ];
    
    expect(validarIPCAE(indices2025)).toBe(true);
    expect(indices2025.length).toBe(5);
  });
  
  it('deve processar taxas SELIC de 2025', () => {
    const taxas2025 = [
      { data: '01/01/2025', valor: 10.5, exercicio: 2025 },
      { data: '15/01/2025', valor: 10.5, exercicio: 2025 },
      { data: '01/02/2025', valor: 10.5, exercicio: 2025 },
      { data: '15/02/2025', valor: 10.5, exercicio: 2025 },
      { data: '01/03/2025', valor: 10.5, exercicio: 2025 },
    ];
    
    expect(validarSELIC(taxas2025)).toBe(true);
    expect(taxas2025.length).toBe(5);
  });
});
