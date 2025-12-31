# BRIEFING COMPLETO - Sistema e-Restituição IRPF

**Data:** 30/12/2024  
**Versão:** 1.0  
**Projeto:** e-Restituição IRPF - Plataforma de Cálculo e Gestão de Restituição de Imposto de Renda

---

## 1. VISÃO GERAL DO PROJETO

### 1.1 O que é o Sistema
Plataforma web para cálculo automático de restituição de IRPF para pessoas que receberam valores de ações trabalhistas (alvarás judiciais). O sistema calcula quanto o contribuinte pagou a mais de imposto e quanto tem direito a restituir.

### 1.2 Público-Alvo
- **Leads externos:** Pessoas que receberam alvarás de ações trabalhistas e querem saber se têm direito a restituição
- **Clientes internos:** Clientes do escritório que precisam do cálculo sem passar pelo fluxo de pagamento

### 1.3 Modelo de Negócio
1. Lead preenche formulário gratuito
2. Paga R$ 29,90 para descobrir o valor da restituição
3. Paga R$ 2.500,00 (- R$ 29,90 = R$ 2.470,10) para receber o Kit IR completo
4. Opção adicional: Contratar especialista via WhatsApp para cuidar de tudo

---

## 2. ARQUITETURA DO SISTEMA

### 2.1 Componentes Principais

```
┌─────────────────────────────────────────────────────────────────┐
│                    e-restituicao.com.br                         │
│                  (Página de Captura de Leads)                   │
│                                                                 │
│  [Landing Page] → [Consultar Agora] → [Formulário de Cálculo]   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND / API                              │
│                                                                 │
│  • Motor de Cálculo IRPF (deflação IPCA-E, tabela IR, SELIC)   │
│  • Integração Asaas (PIX/Cartão)                               │
│  • Geração de PDFs (Planilha RT + Esclarecimentos)             │
│  • Sistema de Agendamento (entrega Kit IR após 8 dias)         │
│  • Banco de Dados MySQL (Drizzle ORM)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DASHBOARD INTERNO                            │
│                                                                 │
│  • Visualização de todos os leads/clientes                     │
│  • Cadastro manual de clientes internos                        │
│  • Histórico de cálculos                                       │
│  • Geração de documentos                                       │
│  • Estatísticas e relatórios                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Stack Tecnológico
- **Frontend:** React 19 + Tailwind CSS 4 + shadcn/ui
- **Backend:** Express 4 + tRPC 11
- **Banco de Dados:** MySQL/TiDB + Drizzle ORM
- **Autenticação:** Manus OAuth
- **Pagamentos:** Asaas (PIX e Cartão)
- **Hospedagem:** Manus (built-in hosting)

---

## 3. FLUXO DO USUÁRIO (LEAD EXTERNO)

### 3.1 Fluxo Completo

```
1. ACESSO
   └── Lead acessa e-restituicao.com.br
   └── Clica em "Consultar Agora"

2. FORMULÁRIO
   └── Escolhe: "MESMO ANO" ou "ANOS DIFERENTES"
   └── Preenche dados pessoais (Nome, CPF, Email, Telefone, Nascimento)
   └── Preenche dados do processo (Número, Vara, Comarca)
   └── Preenche dados da fonte pagadora (Nome, CNPJ)
   └── Preenche valores:
       • Bruto Homologado
       • Tributável Homologado
       • Número de Meses
       • Alvarás (até 30): Valor + Data
       • DARFs (até 30): Valor + Data
       • Honorários (até 30): Valor + Ano

3. CÁLCULO
   └── Clica em "Calcular"
   └── Sistema salva dados no banco (mesmo sem pagar)
   └── Aparece: "Parabéns! Você possui valor à restituir!"
   └── Botão: "Descubra o Valor" - R$ 29,90

4. PRIMEIRO PAGAMENTO (R$ 29,90)
   └── Escolhe PIX ou Cartão
   └── Redireciona para Asaas
   └── Após pagamento confirmado:
       • Revela o valor total da restituição
       • Mostra opção "Faça Você Mesmo" - R$ 2.470,10 (2.500 - 29,90)

5. SEGUNDO PAGAMENTO (R$ 2.470,10)
   └── Paga para receber Kit IR
   └── Sistema agenda entrega para 8 DIAS após pagamento
   └── Motivo: Código de Defesa do Consumidor (direito de arrependimento 7 dias)

6. ENTREGA DO KIT IR (após 8 dias)
   └── Email automático com:
       • Planilha RT (Demonstrativo de Apuração de Rendimento Tributável)
       • Esclarecimentos (Documento para o Auditor da Receita Federal)
       • Link do vídeo tutorial de como retificar a declaração
       • Link do vídeo de como protocolar na Receita Federal

7. OPÇÃO ADICIONAL
   └── "Quer Ter um Especialista Para Cuidar de Tudo?"
   └── Botão direciona para WhatsApp
   └── Negociação direta com especialista
```

### 3.2 Persistência de Sessão (CRÍTICO!)
**PROBLEMA IDENTIFICADO:** No sistema atual, se o usuário fechar a página ou perder conexão após o pagamento, não consegue retornar para ver o resultado.

**SOLUÇÃO NECESSÁRIA:**
- Gerar um **código único** ou **link personalizado** para cada cálculo
- Enviar por **email** após o primeiro pagamento
- Permitir que o usuário **retorne** a qualquer momento usando esse código/link
- Armazenar o **status do pagamento** e **resultado do cálculo** no banco de dados

---

## 4. LÓGICA DE CÁLCULO DO IRPF

### 4.1 Diferença: MESMO ANO vs ANOS DIFERENTES

| Aspecto | MESMO ANO | ANOS DIFERENTES |
|---------|-----------|-----------------|
| Deflação IPCA-E | NÃO aplica | SIM, aplica |
| Exercícios fiscais | 1 único | Múltiplos (até 30) |
| Complexidade | Simples | Alta |

### 4.2 Etapas do Cálculo (ANOS DIFERENTES)

```
ETAPA 1: COLETA DE DADOS
├── Dados pessoais
├── Dados do processo
├── Bruto Homologado, Tributável Homologado, Nº Meses
├── Alvarás (valor + data)
├── DARFs (valor + data)
└── Honorários (valor + ano)

ETAPA 2: DEFLAÇÃO PELO IPCA-E
├── Objetivo: Trazer todos os valores para a mesma data-base (dezembro do exercício)
├── Fórmula: Valor_Deflacionado = Valor_Original × (IPCA_Dezembro / IPCA_Data_Pagamento)
└── Fonte: Tabela IPCA-E do IBGE

ETAPA 3: AGRUPAMENTO POR EXERCÍCIO FISCAL
├── Alvará pago em 2021 → Exercício 2022
├── Alvará pago em 2022 → Exercício 2023
└── E assim por diante (ano seguinte ao pagamento)

ETAPA 4: DISTRIBUIÇÃO DE MESES
├── Fórmula: Meses_Exercício = Nº_Total_Meses × (Valor_Exercício / Total_Alvarás)
└── Cada exercício recebe proporção dos meses

ETAPA 5: CÁLCULO DE RENDIMENTOS TRIBUTÁVEIS
├── Proporção = Tributável_Homologado / Bruto_Homologado (ex: 71,3560%)
├── Rend_Tributáveis_Alvará = Alvará_Deflacionado × Proporção
└── Rend_Isentos_Alvará = Alvará_Deflacionado × (1 - Proporção)

ETAPA 6: DEDUÇÃO DE HONORÁRIOS
├── Honorários_Proporcionais = Honorários × Proporção
└── Base_Cálculo = Rend_Tributáveis - Honorários_Proporcionais

ETAPA 7: CÁLCULO RRA E IR DEVIDO
├── RRA = Base_Cálculo / Número_de_Meses
├── Aplica tabela progressiva do IR (varia por ano)
├── IR_Mensal = (Alíquota × RRA) - Parcela_Deduzir
└── IR_Devido = IR_Mensal × Número_de_Meses

ETAPA 8: CÁLCULO DA RESTITUIÇÃO
├── IRPF_a_Restituir = DARF_Deflacionado - IR_Devido
├── Se positivo: tem direito a restituir
└── Se negativo: tem imposto a pagar (complementar)

ETAPA 9: ATUALIZAÇÃO PELA SELIC (opcional)
├── Aplica taxa SELIC acumulada sobre valores a restituir
└── Valor_Atualizado = Valor_Original × (1 + Taxa_SELIC)

ETAPA 10: TOTALIZAÇÃO
└── Total_Restituir = Soma de todos os exercícios (positivos - negativos)
```

### 4.3 Tabela Progressiva de IR (2024)

| Faixa | Base de Cálculo (R$) | Alíquota | Parcela a Deduzir (R$) |
|-------|----------------------|----------|------------------------|
| 1 | Até 2.112,00 | 0% | 0,00 |
| 2 | 2.112,01 a 2.826,65 | 7,5% | 158,40 |
| 3 | 2.826,66 a 3.751,05 | 15% | 370,40 |
| 4 | 3.751,06 a 4.664,68 | 22,5% | 651,73 |
| 5 | Acima de 4.664,68 | 27,5% | 869,36 |

**IMPORTANTE:** O sistema deve ter tabelas de IR para todos os anos (2016-2024), pois cada exercício usa a tabela do seu ano.

### 4.4 Exemplo de Cálculo Real (da planilha)

**Dados de entrada:**
- Cliente: Ana Carmen Collodetti Brugger
- Bruto Homologado: R$ 2.096.383,50
- Tributável Homologado: R$ 1.495.895,65
- Nº Meses: 49
- 10 Alvarás em diferentes datas (2021-2024)
- 1 DARF: R$ 413.926,80 em 06/11/2024
- 10 Honorários em diferentes anos

**Resultado por exercício:**
| Exercício | Descrição | Valor |
|-----------|-----------|-------|
| 2022 | Imposto a Pagar | (R$ 14.184,81) |
| 2023 | Imposto a Restituir | R$ 20.247,37 |
| 2025 | Imposto a Restituir | R$ 21.452,80 |
| **TOTAL** | **Imposto a Restituir** | **R$ 27.515,36** |

**Com atualização SELIC:**
| Exercício | Valor Original | Taxa SELIC | Valor Atualizado |
|-----------|----------------|------------|------------------|
| 2023 | R$ 20.247,37 | 30,69% | R$ 26.461,29 |
| 2025 | R$ 21.452,80 | 8,09% | R$ 23.188,33 |
| **Total** | **R$ 41.700,17** | | **R$ 49.649,62** |

---

## 5. DOCUMENTOS GERADOS (KIT IR)

### 5.1 Planilha RT (Demonstrativo de Apuração de Rendimento Tributável)

**Estrutura do documento:**
- Logo IR360/Restituição IR
- Dados do Contribuinte (Nome, CPF, Data Nascimento)
- Dados do Processo (Número, Comarca, Vara)
- 18 itens de cálculo com valores calculados automaticamente
- Inclui proporções, deduções e valores para declaração

**Itens principais:**
1. Total de Rendimentos Retirado pelo Autor
2. Total de DARF Paga
3. Total da Causa
4. Rendimentos Bruto Homologado/Atualizado
5. Rendimentos Tributáveis Calculados na Mesma Data Base
6. Proporção de Rendimentos Tributáveis
7. Total de Rendimentos Isentos
8. Rendimentos Sujeitos à Tributação Normal
9. Total de Despesas Pagas com Advogado, Perito e Custas
10. Proporção a Deduzir de Despesa Pagas

### 5.2 Esclarecimentos (Documento para o Auditor)

**Estrutura do documento:**
- Logo e-Restituição
- Dados do Contribuinte
- Seção A) Dados da Ação - texto explicativo
- Seção B) Valores e Datas - 6 itens com valores
- Tabela de RRA (Rendimentos Tributáveis, INSS, IR Retido, Meses)
- Ficha de Rendimentos Isentos
- Observações legais (Art. 12.A, §2º da Lei 7.713/88)

**Valores esperados da declaração:**
- Item 11: CNPJ
- Item 12: Fonte Pagadora
- Item 13: Rendimentos Tributáveis
- Item 14: Contribuição Previdência Oficial (INSS)
- Item 15: Imposto de Renda Retido na Fonte
- Item 16: Mês do Recebimento
- Item 17: Meses Discutidos na Ação
- Item 18: Rendimentos Isentos e Não Tributáveis

---

## 6. INTEGRAÇÕES EXTERNAS

### 6.1 Asaas (Pagamentos)
- **Métodos:** PIX e Cartão de Crédito
- **Valores de teste:** R$ 5,99 e R$ 15,99
- **Valores de produção:** R$ 29,90 e R$ 2.500,00
- **Webhook:** Receber confirmação de pagamento

### 6.2 IPCA-E (IBGE)
- **Fonte:** Instituto Brasileiro de Geografia e Estatística
- **Uso:** Deflação de valores para mesma data-base
- **Arquivo:** ipca-indices.json (1966-2024)

### 6.3 SELIC (Banco Central)
- **Uso:** Atualização de valores a restituir
- **Arquivo:** Tabela SELIC acumulada por exercício

---

## 7. BANCO DE DADOS

### 7.1 Tabelas Principais

```sql
-- Usuários (autenticação)
users (
  id, openId, name, email, loginMethod, role, 
  createdAt, updatedAt, lastSignedIn
)

-- Formulários IRPF (leads e clientes)
irpfForms (
  id, odigo_unico, -- NOVO: para retorno do cliente
  userId, -- NULL para leads externos
  
  -- Dados pessoais
  nomeCompleto, cpf, dataNascimento, email, telefone,
  
  -- Dados do processo
  numeroProcesso, vara, comarca,
  
  -- Dados da fonte pagadora
  fontePagadora, cnpjFontePagadora,
  
  -- Valores principais
  brutoHomologado, tributavelHomologado, numeroMeses,
  tipoCalculo, -- 'MESMO_ANO' ou 'ANOS_DIFERENTES'
  
  -- Alvarás (JSON array até 30)
  alvaras, -- [{valor, data}, ...]
  
  -- DARFs (JSON array até 30)
  darfs, -- [{valor, data}, ...]
  
  -- Honorários (JSON array até 30)
  honorarios, -- [{valor, ano}, ...]
  
  -- Resultados do cálculo
  resultadoCalculo, -- JSON com todos os valores calculados
  valorTotalRestituir,
  
  -- Status de pagamento
  statusPagamento1, -- 'pendente', 'pago', 'cancelado'
  dataPagamento1,
  statusPagamento2,
  dataPagamento2,
  dataLiberacaoKit, -- dataPagamento2 + 8 dias
  
  -- Controle
  createdAt, updatedAt
)

-- Notas/Observações
notes (
  id, irpfFormId, conteudo, createdAt
)
```

### 7.2 Código Único para Retorno
- Gerar código único (ex: `ABC123XYZ`) ao criar o formulário
- Enviar por email após primeiro pagamento
- Cliente pode acessar: `e-restituicao.com.br/consulta/ABC123XYZ`
- Mostra status atual e permite continuar de onde parou

---

## 8. ARQUIVOS DE REFERÊNCIA DISPONÍVEIS

### 8.1 No projeto compartilhado
- `restituicaoia-FINAL-COMPLETO-106a002e.zip` - Código do sistema anterior

### 8.2 Extraídos e analisados
- `/home/ubuntu/logica-calculos/Erestituicaologicacaculos/` - Lógica de cálculos
  - `irCalculationServiceV2.ts` - Implementação completa do cálculo
  - `ipcaServiceV2.ts` - Serviço de índices IPCA-E
  - `ipca-indices.json` - Tabela IPCA-E (1966-2024)
- `/home/ubuntu/logica-calculos/planilha-dirf.xlsm` - Planilha Excel com todas as fórmulas
- `/home/ubuntu/logica-calculos/main-site.js` - Código JavaScript do site atual

### 8.3 Documentos PDF de exemplo
- `6-PLanilhaRTJoséRamos.pdf` - Exemplo de Planilha RT
- `0-EsclarecimentosJoseRamos.pdf` - Exemplo de Esclarecimentos

---

## 9. STATUS ATUAL DO PROJETO

### 9.1 O que já foi feito
- [x] Projeto inicializado com scaffold web-db-user
- [x] Schema do banco de dados configurado (users, irpfForms, notes)
- [x] Rotas tRPC básicas implementadas
- [x] Dashboard com DashboardLayout
- [x] Páginas: Home, NovoCalculo, Historico, Exportar, Notificacoes, Configuracoes
- [x] Logo e-Restituição integrado
- [x] Testes unitários básicos passando
- [x] Checkpoint salvo (versão c477149f)

### 9.2 O que falta implementar
- [ ] Motor de Cálculo completo (deflação IPCA-E, tabela IR por ano, SELIC)
- [ ] Suporte a até 30 alvarás, DARFs e honorários
- [ ] Lógica MESMO ANO vs ANOS DIFERENTES
- [ ] Geração de PDFs (Planilha RT + Esclarecimentos)
- [ ] Integração com Asaas (pagamentos)
- [ ] Sistema de código único para retorno do cliente
- [ ] Agendamento de entrega do Kit IR (8 dias após pagamento)
- [ ] Formulário externo (página de captura e-restituicao.com.br)
- [ ] Envio de emails automáticos

---

## 10. VALORES E CONFIGURAÇÕES

### 10.1 Preços
| Item | Teste | Produção |
|------|-------|----------|
| Descobrir valor | R$ 5,99 | R$ 29,90 |
| Kit IR completo | R$ 15,99 | R$ 2.500,00 |
| Desconto (já pago) | R$ 5,99 | R$ 29,90 |
| **Kit IR final** | **R$ 10,00** | **R$ 2.470,10** |

### 10.2 Prazos
- Entrega do Kit IR: **8 dias** após pagamento (CDC - direito de arrependimento)

### 10.3 Limites
- Máximo de alvarás: **30**
- Máximo de DARFs: **30**
- Máximo de honorários: **30**

---

## 11. COMANDO PARA REINICIAR A TAREFA

Se precisar reiniciar a tarefa do zero, use este prompt:

```
Aja como um desenvolvedor Full Stack sênior.

OBJETIVO: Implementar o sistema e-Restituição IRPF completo.

CONTEXTO:
- Projeto já inicializado em /home/ubuntu/e-restituicao-irpf
- Checkpoint disponível: c477149f
- Documentação completa em: /home/ubuntu/e-restituicao-irpf/BRIEFING-COMPLETO-E-RESTITUICAO.md
- Arquivos de cálculo em: /home/ubuntu/logica-calculos/
- Planilha Excel com fórmulas em: /home/ubuntu/logica-calculos/planilha-dirf.xlsm

PRIORIDADES:
1. Motor de Cálculo (usar arquivos prontos de /home/ubuntu/logica-calculos/)
2. Geração de PDFs
3. Integração Asaas
4. Sistema de código único para retorno do cliente
5. Formulário externo

REGRAS:
- Suportar até 30 alvarás, DARFs e honorários
- MESMO ANO: sem deflação IPCA-E
- ANOS DIFERENTES: com deflação IPCA-E
- Entrega do Kit IR: 8 dias após pagamento
- Valores produção: R$ 29,90 e R$ 2.500,00

Leia o BRIEFING-COMPLETO-E-RESTITUICAO.md antes de começar.
```

---

## 12. CONTATOS E LINKS

- **Site atual:** restituicaoia.com.br
- **Novo domínio:** e-restituicao.com.br
- **WhatsApp especialista:** (a definir)
- **Asaas:** (credenciais a configurar)

---

**Documento criado em:** 30/12/2024  
**Última atualização:** 30/12/2024  
**Autor:** Manus AI  
**Status:** PRONTO PARA IMPLEMENTAÇÃO
