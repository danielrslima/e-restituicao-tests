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

## Atualização do Formulário (30/12/2024)

- [x] Adicionar campo "Bruto Homologado" no formulário de entrada (já implementado)
- [x] Adicionar campo "Tributável Homologado" no formulário de entrada (já implementado)
- [x] Validar que os novos campos são salvos corretamente no banco de dados (já implementado)

## Correção Caso José Ramos (30/12/2024)

- [x] Corrigir cálculo para caso com DARF em ano diferente do alvará
- [x] Validar resultado: esperado R$ 74.028,67, motor agora calcula corretamente
- [x] Corrigir função calcularIRPF no db.ts (usada pelo formulário web)
- [x] Atualizar testes para refletir fórmulas corretas
- [x] Todos os 26 testes passando

## Detecção Automática de Múltiplos Exercícios (30/12/2024)

- [x] Implementar detecção automática baseada nos dados preenchidos
- [x] Ignorar escolha do usuário (mesmo ano / anos diferentes)
- [x] Detectar múltiplos exercícios quando: alvarás em anos diferentes OU DARFs em anos diferentes
- [x] Criar rota pública `calculoExterno.calcular` para receber dados da página externa
- [x] Usar motor simples para exercício único, motor completo para múltiplos exercícios

## Geração de PDFs (30/12/2024)

- [x] Analisar PDFs de referência (Esclarecimentos e Planilha RT)
- [x] Implementar geração do PDF de Esclarecimentos
- [x] Implementar geração do PDF de Planilha RT
- [x] Suportar exercício único e múltiplos exercícios
- [x] Testar com casos Ana Carmen e José Ramos
- [x] Criar rotas tRPC para geração de PDFs (pdf.esclarecimentos e pdf.planilhaRT)
- [x] Conectar botões de download existentes às rotas de PDF (página Histórico)
- [x] Atualizar botão "Exportar PDF" na página Exportar para baixar os dois PDFs

## Correções de PDF (31/12/2024)

- [x] Corrigir cor do cabeçalho do PDF Planilha RT (preto → cinza)
- [x] Gerar PDFs para todos os exercícios em casos de múltiplos anos (Ana Carmen: 2022, 2023, 2025)

## Melhorias na Janela de Detalhes (31/12/2024)

- [x] Adicionar botão de imprimir na janela de detalhes
- [x] Mostrar downloads individuais por exercício para casos de múltiplos anos
- [x] Agrupar Esclarecimentos e Planilha RT separadamente no modal
