# Análise da Lógica de Cálculo - Site restituicaoia.com.br

## Estrutura Identificada

### Tabela IRRF por Ano
O sistema possui tabelas de IRRF para diferentes anos (2024, 2023, 2016-2022).

**Tabela 2024:**
| Faixa Início | Faixa Fim | Alíquota | Dedução |
|--------------|-----------|----------|---------|
| 0 | 2.112,00 | 0% | 0,00 |
| 2.112,01 | 2.826,65 | 7,5% | 158,40 |
| 2.826,66 | 3.751,05 | 15% | 370,40 |
| 3.751,06 | 4.664,68 | 22,5% | 651,73 |
| 4.664,69 | Infinito | 27,5% | 869,36 |

### Função calcularIRPF
Parâmetros:
- e = rendaAlvara (Rendimento Tributável do Alvará)
- t = rendaHonorarios (Honorários Tributáveis)
- r = rendaDarf (DARF pago)
- n = rendaMes (Número de Meses)
- a = anoEq (Ano do Exercício)

**Lógica:**
```javascript
// 1. Seleciona tabela do ano ou usa 2016-2022 como padrão
let tabela = tabelaIRRF[ano] || tabelaIRRF["2016-2022"];

// 2. Calcula base de cálculo (em centavos, divide por 100)
let baseCalculo = (parseFloat(rendaAlvara) - parseFloat(rendaHonorarios)) / 100;
if (baseCalculo < 0) baseCalculo = 0;

// 3. Calcula RRA (Rendimento Mensal Médio)
const rra = baseCalculo / numeroMeses;

// 4. Encontra faixa na tabela e aplica alíquota
let aliquota = 0, deducao = 0;
for (let i = 0; i < tabela.length; i++) {
  const faixa = tabela[i].faixa;
  if (rra >= faixa.inicio && rra <= faixa.fim) {
    aliquota = tabela[i].aliquota;
    deducao = tabela[i].deducao;
    break;
  }
  // Se passou de todas as faixas, usa a última
  if (rra > faixa.fim && i === tabela.length - 1) {
    aliquota = tabela[i].aliquota;
    deducao = tabela[i].deducao;
  }
}

// 5. Calcula IR Mensal
const irMensal = aliquota * rra - deducao;

// 6. Calcula IR Devido Total
const irDevido = (irMensal < 0 ? 0 : irMensal) * numeroMeses;

// 7. Calcula IRPF a Restituir
return 100 * (parseFloat(rendaDarf) / 100 - irDevido);
// Resultado = DARF pago - IR Devido
```

### Estrutura de Dados (valorCalculos)
O sistema suporta até 10 exercícios fiscais simultâneos:
- rendTribUm, rendTribDois, ... rendTribDez
- irrfUm, irrfDois, ... irrfDez
- irpfUm, irpfDois, ... irpfDez
- honorariosUm, honorariosDois, ... honorariosDez
- anoHonorariosUm, anoHonorariosDois, ... anoHonorariosDez

### Cálculo Total de Restituição
```javascript
irpfRestituir = irpfUm + irpfDois + irpfTres + irpfQuatro + irpfCinco + 
               irpfSeis + irpfSete + irpfOito + irpfNove + irpfDez
```

## Observações Importantes

1. **Valores em centavos:** O sistema trabalha com valores em centavos (divide por 100)
2. **Suporte multi-ano:** Até 10 exercícios fiscais diferentes
3. **Tabelas históricas:** Possui tabelas de IR de 2016 até 2024
4. **Fórmula principal:** IRPF a Restituir = DARF Pago - IR Devido
