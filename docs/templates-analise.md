# Análise dos Templates de Documentos - e-Restituição IRPF

## 1. Planilha RT (Demonstrativo de Apuração das Verbas Tributáveis)

**Cabeçalho:**
- Logo IR360
- Título: "DEMONSTRATIVO DE APURAÇÃO DAS VERBAS TRIBUTÁVEIS REFERENTES À RECLAMAÇÃO TRABALHISTA"
- DIRPF + Ano (ex: 2021)

**DADOS DO CONTRIBUINTE:**
- Nome do Cliente
- CPF
- Data de Nascimento

**DADOS DO PROCESSO:**
- Nº Processo
- Comarca
- Vara

**CÁLCULOS:**
| Item | Descrição | Exemplo |
|------|-----------|---------|
| 1 | TOTAL DE RENDIMENTOS RETIRADO PELO AUTOR | 2.315.218,05 |
| 2 | TOTAL DE DARF PAGA | 220.597,31 |
| 3 | TOTAL DA CAUSA | 2.535.815,36 |

**APURAÇÃO DOS RENDIMENTOS ISENTOS DE TRIBUTAÇÃO:**
| Item | Descrição | Exemplo |
|------|-----------|---------|
| 4 | RENDIMENTOS BRUTO HOMOLOGADO/ATUALIZADO | 2.533.329,85 |
| 5 | RENDIMENTOS TRIBUTÁVEIS CALCULADOS NA MESMA DATA BASE | 985.527,96 |
| 6 | PROPORÇÃO DE RENDIMENTOS TRIBUTÁVEIS | 38,9048% |
| 7 | TOTAL DE RENDIMENTOS ISENTOS | 1.549.260,42 |
| 8 | RENDIMENTOS SUJEITOS À TRIBUTAÇÃO NORMAL | 986.554,94 |
| 9 | TOTAL DE DESPESAS PAGAS COM ADVOGADO, PERITO E CUSTAS | 694.572,02 |
| 10 | PROPORÇÃO A DEDUZIR DE DESPESAS PAGAS | 270.222,14 |

**VALORES ESPERADOS DA DECLARAÇÃO DE AJUSTE ANUAL DO IR:**
| Item | Descrição | Exemplo |
|------|-----------|---------|
| 11 | CNPJ | 33.592.510/0001-54 |
| 12 | FONTE PAGADORA | VALE S/A |
| 13 | RENDIMENTOS TRIBUTÁVEIS | 716.332,80 |
| 14 | CONTRIBUIÇÃO PREVIDÊNCIA OFICIAL (INSS) | - |
| 15 | IMPOSTO DE RENDA RETIDO NA FONTE | 220.597,31 |
| 16 | MÊS DO RECEBIMENTO | DEZEMBRO |
| 17 | MESES DISCUTIDOS NA AÇÃO | 58,00 |
| 18 | RENDIMENTOS ISENTOS E NÃO TRIBUTÁVEIS | 1.549.260,42 |

---

## 2. Esclarecimentos (Documento para o Auditor)

**Cabeçalho:**
- Logo e-Restituição
- Título: "ESCLARECIMENTOS SOBRE OS RENDIMENTOS RECEBIDOS ACUMULADAMENTE AO SETOR DE MALHA FISCAL DA RECEITA FEDERAL DO BRASIL"
- DIRPF + Ano (ex: 2021)

**DADOS DO CONTRIBUINTE:**
- CONTRIBUINTE: Nome completo
- CPF: xxx.xxx.xxx-xx
- DATA DE NASCIMENTO: dd/mm/aaaa

**A) DADOS DA AÇÃO:**
- Texto padrão referenciando a Ação Judicial Trabalhista
- Número do processo
- Vara do Trabalho
- Comarca

**B) VALORES E DATAS:**
- Item 2: Valor total levantado pelo contribuinte (R$ 2.533.329,85)
- Item 3: Imposto de renda retido pela Reclamada (R$ 220.597,31) + CNPJ
- Item 4: Valor bruto da ação (soma alvará + DARF) = R$ 2.535.815,36 (Item 3 da planilha)
- Item 5: Valor atualizado apurado (Item 8 da planilha) = R$ 986.553,89 + proporção 38,9048%
- Item 6: Valor total de despesas dedutíveis = R$ 270.221,85

**CAMPOS E VALORES DECLARADOS NA FICHA DE RRA DA DIRPF:**
| Campo | Valor |
|-------|-------|
| A) RENDIMENTOS TRIBUTÁVEIS RECEBIDOS | R$ 716.332,04 |
| B) INSS RECLAMANTE | R$ 0,00 |
| C) IMPOSTO DE RENDA RETIDO NA FONTE | R$ 220.597,31 |
| D) Nº DE MESES DISCUTIDOS NA AÇÃO | 58,00 |

**FICHA DE RENDIMENTOS ISENTOS:**
| Campo | Valor |
|-------|-------|
| RENDIMENTOS ISENTOS | R$ 1.460.122,49 |

**Observações:**
- a) Os honorários pagos foram lançados na ficha de pagamentos, em item próprio
- b) O valor referente ao rendimento isento foi lançado na ficha de rendimentos isentos e não tributáveis, no item "OUTROS", com a denominação de "Verbas Isentas Ação Judicial", com os mesmos dados da Fonte Pagadora

**Rodapé:**
- Referência legal: Art. 12.A, §2º da Lei 7.713/88
- Logo IR360

---

## Fórmulas de Cálculo Identificadas

### Proporção de Rendimentos Tributáveis (Item 6):
```
Proporção = (Rendimentos Tributáveis / Rendimentos Bruto Homologado) × 100
Proporção = (985.527,96 / 2.533.329,85) × 100 = 38,9048%
```

### Total de Rendimentos Isentos (Item 7):
```
Isentos = Rendimentos Bruto - Rendimentos Tributáveis
Isentos = 2.533.329,85 - 985.527,96 = 1.547.801,89 (aproximado)
```

### Proporção a Deduzir de Despesas (Item 10):
```
Dedução = Honorários × Proporção Tributável
Dedução = 694.572,02 × 38,9048% = 270.222,14
```

### Rendimentos Tributáveis para Declaração (Item 13):
```
RT Declaração = Rendimentos Sujeitos à Tributação - Proporção Despesas
RT Declaração = 986.554,94 - 270.222,14 = 716.332,80
```

---

## Dados de Entrada Necessários

1. **Dados Pessoais:**
   - Nome completo
   - CPF
   - Data de nascimento

2. **Dados do Processo:**
   - Número do processo
   - Vara
   - Comarca

3. **Dados da Fonte Pagadora:**
   - Nome (ex: VALE S/A)
   - CNPJ

4. **Valores:**
   - Rendimento Bruto Homologado
   - Rendimento Tributável Homologado
   - Número de meses (RRA)
   - Valor(es) do(s) Alvará(s) + Data(s)
   - Valor(es) do(s) DARF(s) + Data(s)
   - Valor(es) dos Honorários + Ano(s)
   - INSS Reclamante (opcional)
