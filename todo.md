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

## Pendências Futuras

- [x] Integração com site externo restituicaoia.com.br (receber dados via API)
  - [x] Analisar formato de dados do site externo (arquivo formulario-externo.ts original)
  - [x] Criar endpoint público /api/formulario/receber
  - [ ] Atualizar URL no site externo (Hostinger) para apontar ao novo servidor
  - [ ] Testar integração completa quando banco de dados estabilizar
- [ ] Funcionalidade de edição de cálculos existentes
- [ ] Funcionalidade de exclusão de cálculos
- [x] Validar PDFs gerados pixel a pixel contra modelos de referência
- [ ] Agendamento de emails (7 dias após pagamento)
- [ ] Gestão de Kit IR (segundo pagamento)
- [ ] Relatório consolidado de múltiplos clientes

## Informações para Retomada

**Último checkpoint:** 331c91e3 (31/12/2024)
**Testes:** 26 passando
**Documentação completa:** DOCUMENTACAO-PROJETO.md

## Integração Site Externo (31/12/2024)

**Endpoint criado:** `/api/formulario/receber`
**Formato aceito:** JSON com arrays de alvarás, DARFs e honorários
**URL antiga:** `https://3000-i2r1x5q9skx44agan426j-8549611e.manusvm.computer/api/formulario/receber`
**URL nova:** `https://3000-iab0rqttzvrkuuia3px9x-1683be43.sg1.manus.computer/api/formulario/receber`

**Para completar a integração:**
1. Acessar Hostinger e editar o arquivo `/static/js/main.e98210db.js`
2. Substituir a URL antiga pela nova
3. Testar preenchendo o formulário no site e verificando se aparece no dashboard

## Melhorias na Página de Histórico (31/12/2024)

- [x] Adicionar hora após a data na coluna Data (ex: 31/12/2025 22:54)
- [x] Ordenar lista por nome em ordem alfabética (A-Z)
- [x] Remover texto "LEVANTAMENTO E IMPOSTO RETIDO" do site externo
- [x] Remover radio buttons "ANOS DIFERENTES" e "MESMO ANO" do site externo
- [x] Atualizar URL do endpoint no site externo
- [x] Gerar arquivo ZIP para upload no Hostinger


## Próximas Funcionalidades a Implementar (31/12/2024)

- [ ] Funcionalidade de edição de dados - Permitir corrigir dados de cálculos existentes sem criar novo
- [ ] Ajustar página de impressão - Layout está fora de esquadro, precisa melhorar formatação para A4
- [ ] Implementar agendamento de emails - Sistema de envio automático de emails

## Correções Site Externo (31/12/2024)

- [x] Corrigir envio do nome completo (userData.nome → userData.nomeCompleto)
- [x] Corrigir envio dos arrays de alvarás (valueData.alvaraUm → alvaraUm)
- [x] Corrigir envio dos arrays de DARFs (valueData.darfUm → darfUm)
- [x] Corrigir envio dos arrays de honorários (valorCalculos.honorariosUm → honorariosUm)
