# RELATÓRIO DE TRANSFERÊNCIA DE PROJETO

**Projeto:** e-Restituição IRPF Dashboard  
**Data:** 01/01/2026  
**Último Checkpoint:** a0d03af8  

---

## 1. STATUS ATUAL DO PROJETO

### Porcentagem Concluída: **85%**

### Objetivo Final do Projeto
Sistema completo de cálculo e gestão de restituição de IRPF para advogados trabalhistas, composto por:
1. **Site Externo (restituicaoia.com.br)** - Formulário público onde clientes preenchem dados fiscais
2. **Dashboard (e-restituicao-irpf)** - Painel administrativo para gestão dos cálculos

### O que já foi entregue/validado:

#### Site Externo (Hostinger)
- [x] Formulário de entrada de dados fiscais completo
- [x] Cálculo automático de IRPF com correção SELIC
- [x] Suporte a múltiplos exercícios fiscais (até 10 alvarás, DARFs e honorários)
- [x] Integração com dashboard via API
- [x] Geração de resultados por exercício (2022, 2023, 2025, etc.)
- [x] Exibição de PDFs de Esclarecimentos e Planilha RT por exercício

#### Dashboard (Manus)
- [x] Sistema de autenticação com Manus OAuth
- [x] Dashboard principal com métricas
- [x] Histórico de cálculos com busca e filtros
- [x] Visualização detalhada de cada cálculo
- [x] Edição de dados de cálculos existentes (admin e usuários autorizados)
- [x] Exclusão de cálculos (apenas admin)
- [x] Gestão de usuários com controle de permissões
- [x] Geração de PDFs (Esclarecimentos e Planilha RT)
- [x] Download de PDFs por exercício
- [x] Página de impressão formatada para A4
- [x] Sistema de notificações
- [x] Exportação de dados

### O que NÃO está funcionando (pendente):
- [ ] Valor total de restituição na tabela do histórico não soma os exercícios corretamente
- [ ] Sistema de autenticação próprio (independente do Manus OAuth)
- [ ] Funcionalidade "Esqueci minha senha"
- [ ] Agendamento de emails (7 dias após pagamento)
- [ ] Kit IR Completo (upload de documentos e mesclagem de PDFs)

---

## 2. DECISÕES CHAVE E ARQUITETURA

### Tecnologias Utilizadas

| Componente | Tecnologia |
|------------|------------|
| Frontend | React 19 + TypeScript |
| Estilização | Tailwind CSS 4 + shadcn/ui |
| Backend | Express 4 + tRPC 11 |
| Banco de Dados | MySQL (TiDB) via Drizzle ORM |
| Autenticação | Manus OAuth |
| Geração de PDF | PDFKit |
| Hospedagem Dashboard | Manus Platform |
| Hospedagem Site Externo | Hostinger |

### Motor de Cálculo de IRPF

O motor de cálculo está em `server/services/irpfCalculationService.ts` e segue estas regras:

1. **Proporção Tributável** = Tributável Homologado / Bruto Homologado
2. **Base de Cálculo** = Alvará × Proporção - Honorários
3. **Tabela de Alíquotas** = Selecionada pela data do DARF (não do exercício)
4. **Correção SELIC** = Aplicada sobre o valor de IRPF calculado
5. **Múltiplos Exercícios** = Detectados automaticamente por datas diferentes de alvarás

### Estrutura do Banco de Dados

```sql
-- Tabela de Usuários
users (
  id INT PRIMARY KEY,
  openId VARCHAR UNIQUE,
  name VARCHAR,
  email VARCHAR,
  role ENUM('admin', 'user'),
  canEdit ENUM('yes', 'no'),
  lastSignedIn DATETIME
)

-- Tabela de Formulários IRPF
irpfForms (
  id INT PRIMARY KEY,
  nomeCliente VARCHAR,
  cpf VARCHAR,
  dataNascimento DATE,
  email VARCHAR,
  telefone VARCHAR,
  numeroProcesso VARCHAR,
  vara VARCHAR,
  comarca VARCHAR,
  fontePagadora VARCHAR,
  cnpj VARCHAR,
  brutoHomologado INT (centavos),
  tributavelHomologado INT (centavos),
  numeroMeses INT,
  alvaraValor INT (centavos),
  alvaraData DATE,
  darfValor INT (centavos),
  darfData DATE,
  honorariosValor INT (centavos),
  honorariosAno VARCHAR,
  proporcao DECIMAL,
  baseCalculo INT (centavos),
  irDevido INT (centavos),
  irpfRestituir INT (centavos),
  statusPagamento ENUM('pendente', 'pago', 'cancelado'),
  resultadosPorExercicio JSON,
  dadosExtras JSON,
  userId INT,
  createdAt DATETIME,
  updatedAt DATETIME
)

-- Tabela de Notas
notes (
  id INT PRIMARY KEY,
  formId INT,
  content TEXT,
  createdAt DATETIME
)

-- Tabela SELIC
selicTable (
  id INT PRIMARY KEY,
  ano INT,
  mes INT,
  taxa DECIMAL
)
```

### Padrões de Design

1. **Valores Monetários**: Armazenados em **centavos** (INT) para evitar erros de ponto flutuante
2. **Datas**: Armazenadas em UTC para evitar problemas de fuso horário
3. **Permissões**: 
   - Admin: pode editar E excluir
   - Usuário com canEdit='yes': pode editar, NÃO pode excluir
   - Usuário comum: apenas visualiza

### Integração Site Externo → Dashboard

**Endpoint:** `POST /api/formulario/receber`

O site externo envia um JSON com:
- Dados pessoais (nome, CPF, email, telefone)
- Dados processuais (processo, vara, comarca)
- Arrays de alvarás (até 10)
- Arrays de DARFs (até 10)
- Arrays de honorários (até 10)
- Valores calculados (bruto, tributável, proporção, etc.)
- Resultados por exercício

---

## 3. ESTRUTURA DE ARQUIVOS

```
e-restituicao-irpf/
├── client/                          # Frontend React
│   ├── public/                      # Arquivos estáticos
│   │   └── logotipo-e-restituicaoIR.png
│   └── src/
│       ├── _core/                   # Hooks e contextos core
│       │   └── hooks/
│       │       └── useAuth.ts
│       ├── components/              # Componentes reutilizáveis
│       │   ├── ui/                  # shadcn/ui components
│       │   ├── DashboardLayout.tsx  # Layout principal
│       │   └── ...
│       ├── contexts/                # Contextos React
│       ├── hooks/                   # Hooks customizados
│       ├── lib/
│       │   └── trpc.ts              # Cliente tRPC
│       ├── pages/                   # Páginas da aplicação
│       │   ├── Home.tsx             # Dashboard principal
│       │   ├── Historico.tsx        # Histórico de cálculos
│       │   ├── NovoCalculo.tsx      # Formulário de novo cálculo
│       │   ├── Exportar.tsx         # Exportação de dados
│       │   ├── Notificacoes.tsx     # Notificações
│       │   ├── Usuarios.tsx         # Gestão de usuários
│       │   ├── Configuracoes.tsx    # Configurações
│       │   └── ImprimirRelatorio.tsx # Página de impressão
│       ├── App.tsx                  # Rotas e layout
│       ├── main.tsx                 # Entry point
│       └── index.css                # Estilos globais
├── drizzle/                         # Schema do banco
│   └── schema.ts
├── server/                          # Backend Express + tRPC
│   ├── _core/                       # Infraestrutura core
│   │   ├── context.ts
│   │   ├── env.ts
│   │   ├── llm.ts
│   │   ├── notification.ts
│   │   ├── oauth.ts
│   │   └── trpc.ts
│   ├── routes/
│   │   └── formularioExterno.ts     # Endpoint público para site externo
│   ├── services/
│   │   ├── irpfCalculationService.ts # Motor de cálculo IRPF
│   │   ├── pdfEsclarecimentosService.ts # Geração PDF Esclarecimentos
│   │   ├── pdfPlanilhaRTService.ts  # Geração PDF Planilha RT
│   │   └── selicService.ts          # Serviço de taxas SELIC
│   ├── db.ts                        # Funções de banco de dados
│   ├── routers.ts                   # Rotas tRPC
│   └── storage.ts                   # Helpers S3
├── shared/                          # Tipos compartilhados
│   └── types.ts
├── package.json
├── todo.md                          # Lista de tarefas
├── DOCUMENTACAO-PROJETO.md          # Documentação técnica
└── RELATORIO_DE_TRANSFERENCIA.md    # Este arquivo
```

---

## 4. PRÓXIMOS PASSOS (15% Restante)

### 4.1 Correção Urgente: Valor na Tabela do Histórico

**Problema:** A coluna "Restituição" na tabela do histórico mostra o valor `irpfRestituir` do banco, que pode estar incorreto para casos com múltiplos exercícios.

**Solução:** Usar a função `calcularRestituicaoTotal()` que já foi adicionada ao arquivo `Historico.tsx` (linha 246).

**Arquivo a modificar:** `client/src/pages/Historico.tsx`

**Alteração necessária:** Na linha ~383, substituir:
```tsx
{formatCurrency(form.irpfRestituir)}
```
Por:
```tsx
{formatCurrency(calcularRestituicaoTotal(form))}
```

### 4.2 Sistema de Autenticação Próprio

**Arquivos a criar/modificar:**
- `drizzle/schema.ts` - Adicionar campo `passwordHash` na tabela users
- `server/services/authService.ts` - Criar serviço de autenticação
- `server/routers.ts` - Adicionar rotas de login/registro
- `client/src/pages/Login.tsx` - Criar página de login própria
- `client/src/pages/EsqueciSenha.tsx` - Criar página de recuperação

### 4.3 Agendamento de Emails

**Arquivos a criar/modificar:**
- `server/services/emailService.ts` - Serviço de envio de emails
- `server/jobs/emailScheduler.ts` - Job de agendamento
- `drizzle/schema.ts` - Adicionar campos de controle de email

### 4.4 Kit IR Completo

**Arquivos a criar/modificar:**
- `client/src/pages/KitIR.tsx` - Interface de upload
- `server/services/kitIRService.ts` - Serviço de mesclagem de PDFs
- `server/routers.ts` - Rotas para upload e download

---

## 5. DEPENDÊNCIAS

### Dependências de Produção (package.json)

```json
{
  "@aws-sdk/client-s3": "^3.693.0",
  "@aws-sdk/s3-request-presigner": "^3.693.0",
  "@hookform/resolvers": "^5.2.2",
  "@radix-ui/react-*": "vários componentes UI",
  "@tanstack/react-query": "^5.90.2",
  "@trpc/client": "^11.6.0",
  "@trpc/react-query": "^11.6.0",
  "@trpc/server": "^11.6.0",
  "axios": "^1.12.0",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "cookie": "^1.0.2",
  "date-fns": "^4.1.0",
  "dotenv": "^17.2.2",
  "drizzle-orm": "^0.44.5",
  "express": "^4.21.2",
  "jose": "6.1.0",
  "lucide-react": "^0.453.0",
  "mysql2": "^3.15.0",
  "nanoid": "^5.1.5",
  "next-themes": "^0.4.6",
  "pdfkit": "^0.17.2",
  "react": "^19.2.1",
  "react-dom": "^19.2.1",
  "react-hook-form": "^7.64.0",
  "recharts": "^2.15.2",
  "sonner": "^2.0.7",
  "streamdown": "^1.4.0",
  "superjson": "^1.13.3",
  "tailwind-merge": "^3.3.1",
  "tailwindcss": "^4.1.14",
  "wouter": "^3.7.1",
  "zod": "^4.1.12"
}
```

### Dependências de Desenvolvimento

```json
{
  "@types/node": "^24.7.0",
  "@types/pdfkit": "^0.17.4",
  "@types/react": "^19.2.1",
  "@types/react-dom": "^19.2.1",
  "drizzle-kit": "^0.31.5",
  "esbuild": "^0.25.10",
  "postcss": "^8.5.6",
  "prettier": "^3.6.2",
  "tsx": "^4.20.6",
  "typescript": "^5.9.3",
  "vite": "^7.1.9",
  "vitest": "^2.1.9"
}
```

### Variáveis de Ambiente Necessárias

```env
DATABASE_URL=mysql://...
JWT_SECRET=...
VITE_APP_ID=...
OAUTH_SERVER_URL=...
VITE_OAUTH_PORTAL_URL=...
OWNER_OPEN_ID=...
OWNER_NAME=...
BUILT_IN_FORGE_API_URL=...
BUILT_IN_FORGE_API_KEY=...
VITE_FRONTEND_FORGE_API_KEY=...
VITE_FRONTEND_FORGE_API_URL=...
```

---

## 6. COMANDOS ÚTEIS

```bash
# Instalar dependências
pnpm install

# Rodar em desenvolvimento
pnpm dev

# Rodar testes
pnpm test

# Aplicar migrações do banco
pnpm db:push

# Build de produção
pnpm build
```

---

## 7. DIRETRIZES DO PROJETO (IMPORTANTE!)

O proprietário definiu as seguintes diretrizes que DEVEM ser seguidas:

1. **Não alterar o que já foi validado** - Qualquer funcionalidade que esteja funcionando não deve ser modificada
2. **Economia de créditos** - Pensar na alternativa mais simples antes de implementar
3. **Evitar refazer** - Lembrar do que já foi feito e não repetir trabalho
4. **Linguagem acessível** - O proprietário é leigo, usar termos simples
5. **Evitar serviços de terceiros** - Só usar se for essencial para escala
6. **Checkpoints frequentes** - Salvar progresso antes de parar

---

## 8. ARQUIVOS DO SITE EXTERNO (HOSTINGER)

O site externo está hospedado no Hostinger em `restituicaoia.com.br`.

**Estrutura:**
```
public_html/
├── index.html
├── static/
│   ├── css/
│   │   └── main.ae8cae2a.css
│   └── js/
│       └── main.e98210db.js    # Código React compilado
├── selic_acumulada.json
└── ...
```

**ATENÇÃO:** O arquivo `main.e98210db.js` foi modificado incorretamente nesta sessão. Use o arquivo `SITE_ORIGINAL_REVERTER.zip` para restaurar a versão funcional.

---

## 9. CONTATOS E RECURSOS

- **Dashboard URL:** https://3000-iab0rqttzvrkuuia3px9x-1683be43.sg1.manus.computer
- **Site Externo URL:** https://restituicaoia.com.br
- **Endpoint API:** POST /api/formulario/receber

---

## 10. COMANDO DE RETOMADA

```
Continuar o projeto e-Restituição IRPF Dashboard.
Último checkpoint: a0d03af8.
Porcentagem concluída: 85%.

AÇÃO URGENTE: Corrigir a coluna "Restituição" na tabela do histórico 
para usar a função calcularRestituicaoTotal() em vez de form.irpfRestituir.
Arquivo: client/src/pages/Historico.tsx, linha ~383.

DIRETRIZES: Não alterar o que já foi validado. Economia de créditos.
Usar linguagem acessível (proprietário é leigo).

Próximos passos após correção:
1. Sistema de autenticação próprio (senha + "Esqueci minha senha")
2. Agendamento de emails (7 dias após pagamento)
3. Kit IR Completo (upload e mesclagem de PDFs)
```

---

*Relatório gerado em 01/01/2026*
