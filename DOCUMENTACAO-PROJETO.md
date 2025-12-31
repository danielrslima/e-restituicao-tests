# e-Restituição IRPF - Documentação Completa

## Visão Geral do Projeto

O **e-Restituição IRPF** é um sistema web para calcular a restituição de Imposto de Renda de Pessoa Física (IRPF) em ações trabalhistas. Ele automatiza os cálculos complexos que antes eram feitos manualmente em planilhas Excel.

### O que o sistema faz:
- Calcula rendimentos tributáveis por exercício fiscal
- Aplica índices IPCA-E para deflação de valores
- Distribui proporcionalmente DARF entre alvarás
- Calcula imposto devido usando tabela progressiva RRA
- Atualiza valores pela taxa SELIC
- Gera PDFs de Esclarecimentos e Planilha RT para cada exercício

---

## Tecnologias Utilizadas

- **Frontend**: React 19 + Tailwind CSS 4 + shadcn/ui
- **Backend**: Express 4 + tRPC 11
- **Banco de Dados**: MySQL/TiDB (via Drizzle ORM)
- **Geração de PDF**: PDFKit
- **Autenticação**: Manus OAuth

---

## Estrutura de Arquivos Principais

```
e-restituicao-irpf/
├── client/src/
│   ├── pages/
│   │   ├── Home.tsx          # Dashboard principal
│   │   ├── NovoCalculo.tsx   # Formulário de novo cálculo
│   │   ├── Historico.tsx     # Lista de cálculos com modal de detalhes
│   │   └── Exportar.tsx      # Exportação de PDFs e JSON
│   └── components/
│       └── DashboardLayout.tsx
├── server/
│   ├── routers.ts            # Rotas tRPC (API)
│   ├── db.ts                 # Funções de banco de dados
│   └── services/
│       ├── irpfCalculationService.ts  # Motor de cálculo principal
│       ├── ipcaService.ts             # Índices IPCA-E e SELIC
│       ├── pdfEsclarecimentosService.ts  # Geração PDF Esclarecimentos
│       └── pdfPlanilhaRTService.ts       # Geração PDF Planilha RT
├── drizzle/
│   └── schema.ts             # Schema do banco de dados
└── assets/
    ├── logotipo-e-restituicao.png
    └── logotipo-ir360.png
```

---

## Motor de Cálculo - Lógica Principal

### Fórmulas Validadas (100% iguais à planilha Excel):

1. **Proporção Tributável** = Tributável Homologado / Bruto Homologado

2. **DARF Proporcional por Alvará** = (Valor Alvará / Total Alvarás) × Total DARF

3. **RT Alvará** = (Alvará + DARF Proporcional) × Proporção Tributável

4. **RT Honorários** = Honorário × Proporção Tributável

5. **Rendimentos Tributáveis** = RT Alvará - RT Honorários (mínimo 0)

6. **Seleção da Tabela de Alíquotas**:
   - Se data do DARF ≤ abril/2023 → usa tabela 2023 (dedução 869,36)
   - Se data do DARF > abril/2023 → usa tabela 2024 (dedução 884,96)

7. **IR Devido** = (Alíquota × RRA - Dedução) × Meses

8. **IRPF a Restituir** = IR Retido - IR Devido

### Detecção Automática de Múltiplos Exercícios:
- Se alvarás em anos diferentes OU DARFs em anos diferentes → múltiplos exercícios
- Gera PDFs separados para cada exercício fiscal

---

## Banco de Dados - Tabelas Principais

### Tabela `irpf_forms`:
- `id`, `userId`, `nomeCliente`, `cpf`, `dataNascimento`, `email`
- `numeroProcesso`, `vara`, `comarca`, `fontePagadora`, `cnpj`
- `brutoHomologado`, `tributavelHomologado`, `numeroMeses`
- `alvaraValor`, `alvaraData`, `darfValor`, `darfData`, `honorariosValor`, `honorariosAno`
- `proporcao`, `baseCalculo`, `irDevido`, `irpfRestituir`
- `resultadosPorExercicio` (JSON com resultados de cada ano)
- `statusPagamento`, `createdAt`, `updatedAt`

---

## Rotas da API (tRPC)

### Cálculos:
- `irpf.create` - Criar novo cálculo
- `irpf.list` - Listar cálculos do usuário
- `irpf.getById` - Obter detalhes de um cálculo
- `irpf.updateStatus` - Atualizar status de pagamento

### PDFs:
- `pdf.esclarecimentos` - Gerar PDF de Esclarecimentos
- `pdf.planilhaRT` - Gerar PDF de Planilha RT

### Cálculo Externo (para integração futura):
- `calculoExterno.calcular` - Rota pública para receber dados externos

---

## Casos de Teste Validados

### José Ramos Conceição (Exercício Único):
- Bruto: R$ 2.533.329,85
- Tributável: R$ 985.587,96
- Meses: 58
- **Resultado**: R$ 74.028,67 a restituir

### Ana Carmen Collodetti Brugger (Múltiplos Exercícios):
- Bruto: R$ 2.096.383,50
- Tributável: R$ 1.495.895,65
- Meses: 49
- **Resultados**:
  - 2022: -R$ 14.184,81 (pagar)
  - 2023: R$ 20.247,37 (restituir)
  - 2025: R$ 21.452,80 (restituir)
  - **Total**: R$ 27.515,36 a restituir

---

## Funcionalidades Implementadas

### ✅ Concluídas:
- [x] Motor de cálculo validado contra planilha Excel
- [x] Dashboard com resumo de cálculos
- [x] Formulário de novo cálculo
- [x] Histórico com lista de cálculos
- [x] Modal de detalhes com botão de imprimir
- [x] Geração de PDF Esclarecimentos
- [x] Geração de PDF Planilha RT
- [x] Suporte a múltiplos exercícios
- [x] Downloads individuais por exercício
- [x] Página de exportação (PDF e JSON)
- [x] Detecção automática de múltiplos exercícios

### ⏳ Pendentes:
- [ ] Integração com site externo restituicaoia.com.br
- [ ] Edição de cálculos existentes
- [ ] Exclusão de cálculos
- [ ] Notificações por email
- [ ] Relatório consolidado de múltiplos clientes

---

## Como Retomar o Projeto

### 1. Verificar o estado atual:
```bash
cd /home/ubuntu/e-restituicao-irpf
pnpm test -- --run  # Deve passar 26 testes
```

### 2. Iniciar o servidor de desenvolvimento:
```bash
pnpm dev
```

### 3. Acessar o sistema:
- URL: https://3000-iab0rqttzvrkuuia3px9x-1683be43.sg1.manus.computer

### 4. Verificar banco de dados:
- Os dados estão no TiDB (MySQL compatível)
- Conexão via `DATABASE_URL` no ambiente

---

## Checkpoints Importantes

| Versão | Data | Descrição |
|--------|------|-----------|
| 941e612b | 30/12/2024 | Projeto inicial |
| fcc3184b | 30/12/2024 | Motor de cálculo corrigido |
| e2595400 | 30/12/2024 | Detecção automática de múltiplos exercícios |
| 6b0b6e22 | 30/12/2024 | Geração de PDFs implementada |
| 9bf1926b | 30/12/2024 | Botões de download funcionais |
| 961628cf | 31/12/2024 | Suporte a múltiplos exercícios nos PDFs |
| 62e4e704 | 31/12/2024 | Modal de detalhes melhorado |
| e157625e | 31/12/2024 | Documentação completa para retomada |

---

## Comando para Próxima Tarefa

Para continuar o desenvolvimento, use este prompt:

```
Continuar o desenvolvimento do sistema e-Restituição IRPF.

O projeto está no diretório /home/ubuntu/e-restituicao-irpf.
Último checkpoint: 62e4e704

Ler o arquivo DOCUMENTACAO-PROJETO.md para entender o estado atual.
Ler o arquivo todo.md para ver as tarefas pendentes.

Próximos passos sugeridos:
1. Integração com site externo restituicaoia.com.br
2. Funcionalidade de edição de cálculos
3. Validação dos PDFs gerados contra os modelos de referência
```

---

## Contato e Suporte

Este projeto foi desenvolvido para automatizar cálculos de restituição de IRPF em ações trabalhistas, substituindo planilhas Excel manuais.

**Arquivos de referência importantes:**
- Planilha Excel de validação: `/home/ubuntu/logica-calculos/`
- PDFs de modelo: `/home/ubuntu/upload/`
