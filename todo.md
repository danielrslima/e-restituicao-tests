# e-Restituição IRPF - TODO

## Funcionalidades Principais

- [x] Sistema de autenticação e login com Manus OAuth integrado ao banco de dados MySQL via Drizzle ORM
- [x] Dashboard principal para visualização de dados de restituição de IRPF do usuário
- [x] Formulário de entrada de dados fiscais (rendimentos, deduções, dependentes) com validação
- [x] Cálculo automático de restituição de IRPF com base nos dados fornecidos e tabela SELIC
- [x] Persistência de dados fiscais do usuário no banco de dados com histórico de declarações
- [x] Visualização de histórico de cálculos e declarações anteriores
- [x] Exportação de dados e relatórios de restituição em formato PDF ou JSON
- [x] Sistema de notificações para alertar o proprietário sobre novos cálculos ou submissões

## Funcionalidades do Checkpoint Anterior a Restaurar

- [x] Schema do banco de dados (tabelas: users, irpfForms, notes)
- [x] Rotas tRPC para CRUD de formulários IRPF
- [x] Funções de banco de dados para consultas e filtros
- [x] Lógica de cálculo de IRPF com proporção e RRA
- [x] Sistema de notas/observações por formulário
- [ ] Agendamento de emails (7 dias após pagamento)
- [ ] Gestão de Kit IR (segundo pagamento)
- [x] Interface do Dashboard com DashboardLayout
- [x] Logo e-Restituição no canto superior esquerdo
- [x] Notificações recentes na interface

## Infraestrutura

- [x] Configurar schema Drizzle com tabelas do checkpoint
- [x] Executar migrações do banco de dados
- [x] Validar conexão com MySQL/TiDB
- [x] Testes unitários com Vitest

## Correções do Motor de Cálculo (30/12/2024)

- [x] Corrigir proporção tributável (Tributável Homologado / Bruto Homologado)
- [x] Corrigir uso de UTC para datas (evitar problemas de fuso horário)
- [x] Corrigir seleção da tabela de alíquotas baseada na data do DARF (não do exercício)
- [x] Validar cálculos contra planilha Excel (100% idênticos)
- [x] Todos os 25 testes passando

## Status

**Fase atual:** Motor de cálculo corrigido e validado
**Última atualização:** 2024-12-30 - Motor de cálculo 100% validado contra planilha Excel
