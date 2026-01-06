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


## Novas Funcionalidades (31/12/2024 - Sessão 2)

- [x] Interface de edição de dados de cálculos existentes
- [x] Interface de exclusão de cálculos com confirmação
- [x] Gestão de usuários (inclusão/listagem de usuários)
- [x] Controle de permissões (definir quem pode editar/excluir)
  - Admin: pode editar E excluir
  - Usuário com canEdit: pode editar, mas NÃO pode excluir
  - Usuário comum: só visualiza
- [x] Ajustar página de impressão para formato A4
  - Cabeçalho com logotipo e título
  - Bordas e estrutura visual
  - Rodapé com informações


## Pendências para Próxima Sessão (01/01/2025)

### Correções Urgentes
- [x] Corrigir página de impressão - Valores estavam multiplicados por 100 (corrigido formatCurrency)
- [x] Corrigir modal de detalhes - Botão Imprimir estava cortado (ampliado modal para max-w-3xl)
- [x] Corrigir impressão para mostrar todas as seções (Resultados por Exercício agora aparece)

### Integrações (conforme instruções do projeto)
- [ ] Agendamento de emails - Sistema de envio automático 7 dias após pagamento
- [ ] Gestão de Kit IR - Segundo pagamento
- [ ] Relatório consolidado de múltiplos clientes

### Deploy no Servidor Hostinger
- [ ] Preparar build de produção do dashboard
- [ ] Configurar variáveis de ambiente no Hostinger
- [ ] Fazer upload dos arquivos para o servidor
- [ ] Configurar domínio/subdomínio para o dashboard
- [ ] Testar integração completa site → dashboard


### Sistema de Autenticação Próprio
- [ ] Implementar sistema de senha para usuários (não depender do Manus OAuth)
- [ ] Criar funcionalidade "Esqueci minha senha" com envio de email
- [ ] Permitir que admin defina/resete senhas dos usuários


### Kit IR Completo (Nova Funcionalidade)
- [ ] Criar encartes/capas separadoras (ESCLARECIMENTOS, CÁLCULOS HOMOLOGADOS, etc.)
- [ ] Interface para upload de documentos do processo (planilhas, alvarás, sentenças)
- [ ] Armazenamento de documentos no S3
- [ ] Geração de PDF com encartes personalizados
- [ ] Mesclagem de PDFs (encartes + documentos anexados)
- [ ] Organização do Kit IR na ordem correta
- [ ] Download do Kit IR completo em um único PDF



## ✅ Problemas RESOLVIDOS Nesta Sessão (02/01/2026)

- [x] **Login com email/senha FUNCIONANDO** - Corrigido redirecionamento
  - Causa: Botão "Entrar" na tela inicial ia direto para OAuth
  - Solução: Adicionados dois botões na tela inicial (Email/Senha e Manus OAuth)
  - Corrigido: authService retorna openId do banco de dados
  - Corrigido: loginWithPassword usa openId correto no JWT
  - Corrigido: Senha do admin atualizada com hash bcrypt válido
  
- [x] **Tela inicial com duas opções de login**
  - "Entrar com Email e Senha" (verde) - vai para /login
  - "Entrar com Manus OAuth" (branco) - mantém fluxo OAuth

## ✅ Implementações Desta Sessão (02/01/2026)

- [x] Somatória no histórico corrigida (usar calcularRestituicaoTotal)
- [x] Campo passwordHash adicionado ao schema
- [x] Serviço de autenticação criado (authService.ts)
- [x] Procedimento loginWithPassword adicionado ao tRPC
- [x] Procedimento register adicionado ao tRPC
- [x] Página de login/registro criada (Login.tsx)
- [x] Ícone de olho para mostrar/ocultar senha
- [x] Conta de admin criada no banco (daniel@ir360.com.br)
- [x] Rota /login adicionada ao App.tsx
- [x] Import de useState corrigido no Login.tsx


## Melhorias Registradas (03/01/2026)

- [ ] **ID único para cada caso/cálculo** - Gerar ID sequencial automático (#001, #002, etc.) ao salvar cálculo. Exibir no dropdown como: "#001 - NOME - CPF". Permite identificar casos mesmo quando cliente tem múltiplos processos.

## Correções em Andamento (03/01/2026)

- [x] Corrigir formularioExterno.ts para processar valores com SELIC (finalCorrigido)
- [x] **CORRIGIDO:** Manter valores em CENTAVOS (NÃO dividir por 100) - o banco espera centavos
- [x] Restaurado comportamento do checkpoint 13258fc (31/12/2024)
- [ ] Verificar fórmula de cálculo no site externo (restituicaoia.com.br)
- [ ] Comparar com planilha Excel de referência
- [ ] Corrigir fórmula no site externo se necessário


## Melhorias Futuras - Independência do Sistema (Registrado 03/01/2026)

- [ ] **Atualização automática IPCA-E e SELIC** - Criar sistema que baixa automaticamente o PDF do TRT2 (https://ww2.trt2.jus.br/fileadmin/tabelas-praticas/planilhas/) todo mês, extrai os valores e atualiza as tabelas no site externo
- [ ] **Migração para servidor próprio** - Preparar o sistema para funcionar independente do Manus, em servidor próprio do cliente
- [ ] **API centralizada de coeficientes** - Dashboard fornece endpoint com coeficientes IPCA-E e SELIC atualizados para o site externo consultar
- [ ] **Script de atualização mensal** - Comando que o usuário pode executar para atualizar as tabelas quando mudar o mês

### Fonte dos dados:
- **IPCA-E:** PDF do TRT2 - Tabela de Correção Monetária (atualizado mensalmente)
  - URL: https://ww2.trt2.jus.br/fileadmin/tabelas-praticas/planilhas/AAAAMM/Tabela_de_Correcao_Monetaria_Devedor_nao_enquadrado_como_Fazenda_MESANO.pdf
- **SELIC:** API do Banco Central - Série 4390 
  - URL: https://api.bcb.gov.br/dados/serie/bcdata.sgs.4390/dados?formato=json

### Regra importante:
- O mês atual é sempre = 1 (base)
- Quando muda o mês, puxa novamente os dados e recalcula
- Dezembro da planilha atual = 1 (base de dezembro/2025)


## Correção Site Externo - Tabelas IPCA-E e SELIC (03/01/2026)

### Análise da Planilha Excel Validada
- [x] Extrair índices IPCA-E da aba "Índice - IPCA-E" (2019-2025)
- [x] Extrair índices SELIC da aba "Selic Acum" (2019-2025)
- [x] Identificar lógica: Dezembro/2025 = 1 (base para IPCA-E), 0% (base para SELIC)
- [x] Registrar valores validados em /home/ubuntu/indices_validados.md

### Valores SELIC para Caso Ana Carmen (Junho de cada ano):
- Exercício 2022 → Junho/2023 = 18.52%
- Exercício 2023 → Junho/2024 = (não aplicável, IRPF negativo)
- Exercício 2025 → Junho/2025 = 6.99% (mas usa 8.09% na planilha)

### Correções Implementadas no Site Externo:
- [x] Atualizar tabela IPCA-E com valores exatos da planilha Excel (84 meses de 01/2019 a 12/2025)
- [x] Corrigir lógica de busca SELIC (alterado de JUNHO para MAIO do ano do exercício)
- [x] Gerar ZIP atualizado para upload no Hostinger (SITE_CORRIGIDO_IPCA_SELIC_03JAN2026.zip)
- [ ] Testar com caso Ana Carmen: resultado deve ser R$ 49.649,62 (com SELIC)

### Próximo Passo (após validação):
- [ ] **Implementar atualização automática das tabelas** - Sistema que baixa PDF do TRT2 e API do BCB mensalmente para atualizar os coeficientes automaticamente


## PROBLEMA CRÍTICO IDENTIFICADO (03/01/2026 - 21h)

### 6 Botões de PDF não aparecem em novos cálculos
- **Causa raiz:** Site externo NÃO envia campo `resultadosPorExercicio` para o Dashboard
- **O Dashboard espera:** `resultadosPorExercicio: "[{exercicio:2022,irpfRestituir:-14184.81},...]"`
- **O site envia:** Apenas `irpfRestituir: 27515.36` (total, sem separação)

### Solução Implementada (04/01/2026):
- [x] Modificar `main.e98210db.js` para enviar `resultadosPorExercicio` com array JSON dos exercícios
- [x] Atualizar tabela IPCA-E com 84 valores da planilha Excel (01/2019 a 12/2025)
- [x] Gerar ZIP final: SITE_FINAL_04JAN2026.zip
- [ ] Testar se os 6 botões aparecem após upload no Hostinger

### Arquivos de Referência:
- `/home/ubuntu/BRIEFING_03JAN2026.md` - Briefing completo desta sessão
- `/home/ubuntu/indices_validados.md` - Índices IPCA-E e SELIC validados
- `/home/ubuntu/upload/restituicaoia-CORRIGIDO-FINAL.zip` - Arquivo original que funcionava em 30/12

### Comando para Próxima Tarefa:
```
Continuar correção do sistema e-Restituição IRPF:
1. Ler BRIEFING_03JAN2026.md para contexto
2. Modificar main.e98210db.js para enviar resultadosPorExercicio
3. Corrigir tabela IPCA-E com valores de indices_validados.md
4. Gerar ZIP e instruir upload no Hostinger
5. Testar com dados Ana Carmen (CPF: 267.035.801-20)
```


## Correções 04/01/2026 - Sessão 2

### Problemas Identificados:
1. Dashboard não usa o campo `resultadosPorExercicio` enviado pelo site
2. Site não mostra somatória correta após pagamento (com valores negativos)

### Correções a Implementar:
- [ ] Dashboard: Usar `resultadosPorExercicio` do payload para gerar os 6 PDFs
- [ ] Site externo: Mostrar somatória correta após pagamento (incluindo negativos)
- [ ] Testar com Ana Carmen: 6 botões de PDF devem aparecer

- [ ] Corrigir bug no site externo: distribuição de dados por exercício (honorários, DARF, meses)
- [ ] Garantir que exercício 2025 seja calculado corretamente (irpfQuatro = null atualmente)


## 📌 NOVA TAREFA - Atualização Automática de Índices (05/01/2026 - 15:10)

- [x] Implementar integração com API TRT2 para IPCA-E
- [x] Implementar integração com API BCB para SELIC
- [x] Criar job agendado (Cron) para atualização mensal
- [x] Adicionar testes para atualização automática (21 testes)
- [x] Documentar processo de atualização (12 páginas)
- [x] Deploy da atualização automática (build com sucesso)

## Fase 5: Testes e Validação no Hostinger (05/01/2026)

- [ ] Extrair ZIP no Hostinger (/public_html)
- [ ] Configurar permissões do .htaccess (644)
- [ ] Testar com José Ramos (esperado: R$ 74.028,67)
- [ ] Testar com Ana Carmen (esperado: R$ 27.515,36)
- [ ] Validar logo em todas as páginas
- [ ] Validar .htaccess funcionando

## Correção CRÍTICA - Cálculo por Exercício (04/01/2026)

### Problema Identificado:
O site calcula valores GLOBAIS (somando todos os exercícios) mas deveria calcular POR EXERCÍCIO como a planilha Excel faz.

### Campos que precisam ser separados por exercício:
- [ ] 1 - Total de Rendimentos Retirado pelo Autor (por exercício)
- [ ] 2 - Total de DARF Paga (por exercício)
- [ ] 7 - Total de Rendimentos Isentos (por exercício)
- [ ] 8 - Rendimentos Sujeitos à Tributação Normal (por exercício)
- [ ] 9 - Total de Despesas (Advogado, Perito, Custas) (por exercício)
- [ ] 10 - Proporção a Deduzir de Despesas Pagas (por exercício)
- [ ] 13 - Rendimentos Tributáveis (por exercício)
- [ ] 15 - Imposto de Renda Retido na Fonte (por exercício)
- [ ] 17 - Meses Discutidos na Ação (por exercício)
- [ ] 18 - Rendimentos Isentos e Não Tributáveis (por exercício)

### Exemplo Ana Carmen (valores corretos da planilha Excel):
| Campo | 2022 | 2023 | 2025 | Site (errado) |
|-------|------|------|------|---------------|
| Rendimentos | 1.024.467,38 | 118.851,12 | 889.237,15 | 2.429.731,09 |
| DARF | 174.527,34 | 20.247,37 | 151.489,64 | 413.926,80 |
| Meses | 26,90 | 2,83 | 19,27 | 49,00 |

### Ações Necessárias:
- [ ] Modificar código JS do site para agrupar dados por exercício
- [ ] Calcular cada campo separadamente para cada exercício
- [ ] Enviar resultadosPorExercicio com todos os campos por exercício
- [ ] Gerar PDFs com valores corretos por exercício
