import { eq, or, like, desc, and, isNull, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, irpfForms, InsertIrpfForm, notes, selicTable, InsertSelicEntry } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// IRPF Forms - CRUD Operations
// ============================================================================

/**
 * Obter todos os formulários IRPF com filtros opcionais
 */
export async function getAllIrpfForms(filters?: {
  statusPagamento?: string;
  search?: string;
  userId?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(irpfForms);

  const conditions = [];

  if (filters?.statusPagamento) {
    conditions.push(eq(irpfForms.statusPagamento, filters.statusPagamento as "pendente" | "pago" | "cancelado"));
  }

  if (filters?.userId) {
    conditions.push(eq(irpfForms.userId, filters.userId));
  }

  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      or(
        like(irpfForms.nomeCliente, searchTerm),
        like(irpfForms.cpf, searchTerm),
        like(irpfForms.numeroProcesso, searchTerm)
      )!
    );
  }

  if (conditions.length > 0) {
    return db.select().from(irpfForms).where(and(...conditions)).orderBy(desc(irpfForms.createdAt));
  }

  return db.select().from(irpfForms).orderBy(desc(irpfForms.createdAt));
}

/**
 * Obter um formulário IRPF por ID
 */
export async function getIrpfFormById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(irpfForms).where(eq(irpfForms.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Criar um novo formulário IRPF
 */
export async function createIrpfForm(data: InsertIrpfForm) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(irpfForms).values(data);
  return result;
}

/**
 * Atualizar um formulário IRPF
 */
export async function updateIrpfForm(id: number, data: Partial<InsertIrpfForm>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(irpfForms).set(data).where(eq(irpfForms.id, id));
}

/**
 * Deletar um formulário IRPF
 */
export async function deleteIrpfForm(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(irpfForms).where(eq(irpfForms.id, id));
}

// ============================================================================
// IRPF Forms - Email Scheduling Helpers
// ============================================================================

/**
 * Obter formulários que precisam de agendamento de email (7 dias após pagamento)
 */
export async function getFormsNeedingEmailScheduling() {
  const db = await getDb();
  if (!db) return [];

  try {
    const query = await db
      .select()
      .from(irpfForms)
      .where(
        and(
          eq(irpfForms.statusPagamento, "pago"),
          isNull(irpfForms.dataAgendamentoEmail)
        )
      );
    return query;
  } catch (error) {
    console.error("[Database] Failed to get forms needing email scheduling:", error);
    return [];
  }
}

/**
 * Obter formulários prontos para envio de email (data agendada chegou)
 */
export async function getFormsReadyForEmailSending() {
  const db = await getDb();
  if (!db) return [];

  try {
    const agora = new Date();
    const query = await db
      .select()
      .from(irpfForms)
      .where(
        and(
          eq(irpfForms.statusEmail, "agendado"),
          lte(irpfForms.dataAgendamentoEmail, agora)
        )
      );
    return query;
  } catch (error) {
    console.error("[Database] Failed to get forms ready for email sending:", error);
    return [];
  }
}

/**
 * Atualizar agendamento de email
 */
export async function updateEmailScheduling(
  formId: number,
  dataAgendamento: Date,
  status: "agendado" | "enviado" | "erro"
) {
  const db = await getDb();
  if (!db) return;

  try {
    await db
      .update(irpfForms)
      .set({
        dataAgendamentoEmail: dataAgendamento,
        statusEmail: status,
      })
      .where(eq(irpfForms.id, formId));
  } catch (error) {
    console.error("[Database] Failed to update email scheduling:", error);
  }
}

// ============================================================================
// Kit IR - Segundo Pagamento
// ============================================================================

/**
 * Obter formulários que precisam de envio de Kit IR (7 dias após pagamento do Kit)
 */
export async function getFormsReadyForKitIRSending() {
  const db = await getDb();
  if (!db) return [];

  try {
    const agora = new Date();
    const query = await db
      .select()
      .from(irpfForms)
      .where(
        and(
          eq(irpfForms.statusKitIR, "pago"),
          eq(irpfForms.statusEnvioKit, "agendado"),
          lte(irpfForms.dataEnvioKit, agora)
        )
      );
    return query;
  } catch (error) {
    console.error("[Database] Failed to get forms ready for Kit IR sending:", error);
    return [];
  }
}

/**
 * Atualizar status do Kit IR
 */
export async function updateKitIRStatus(
  formId: number,
  statusKitIR: "nao_solicitado" | "pendente" | "pago" | "enviado" | "cancelado",
  statusEnvioKit?: "pendente" | "agendado" | "enviado" | "erro",
  dataEnvioKit?: Date
) {
  const db = await getDb();
  if (!db) return;

  try {
    const updateData: Record<string, unknown> = {
      statusKitIR,
    };

    if (statusEnvioKit) {
      updateData.statusEnvioKit = statusEnvioKit;
    }

    if (dataEnvioKit) {
      updateData.dataEnvioKit = dataEnvioKit;
    }

    await db
      .update(irpfForms)
      .set(updateData)
      .where(eq(irpfForms.id, formId));
  } catch (error) {
    console.error("[Database] Failed to update Kit IR status:", error);
  }
}

/**
 * Agendar envio de Kit IR (7 dias após pagamento)
 */
export async function agendarEnvioKitIR(formId: number, dataPagamentoKit: Date) {
  const db = await getDb();
  if (!db) return;

  try {
    const dataEnvio = new Date(dataPagamentoKit);
    dataEnvio.setDate(dataEnvio.getDate() + 7);

    await db
      .update(irpfForms)
      .set({
        statusEnvioKit: "agendado",
        dataEnvioKit: dataEnvio,
      })
      .where(eq(irpfForms.id, formId));

    console.log(`[Kit IR] Envio agendado para ${dataEnvio.toISOString()}`);
  } catch (error) {
    console.error("[Database] Failed to schedule Kit IR sending:", error);
  }
}

// ============================================================================
// Notes - CRUD Operations
// ============================================================================

/**
 * Obter notas de um formulário
 */
export async function getNotesByFormId(formId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(notes).where(eq(notes.formId, formId)).orderBy(desc(notes.criadoEm));
}

/**
 * Criar uma nova nota
 */
export async function createNote(formId: number, conteudo: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(notes).values({ formId, conteudo });
}

/**
 * Atualizar uma nota
 */
export async function updateNote(id: number, conteudo: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(notes).set({ conteudo }).where(eq(notes.id, id));
}

/**
 * Deletar uma nota
 */
export async function deleteNote(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(notes).where(eq(notes.id, id));
}

// ============================================================================
// SELIC Table Operations
// ============================================================================

/**
 * Obter taxa SELIC por ano e mês
 */
export async function getSelicByAnoMes(ano: number, mes: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(selicTable)
    .where(and(eq(selicTable.ano, ano), eq(selicTable.mes, mes)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Obter todas as taxas SELIC
 */
export async function getAllSelicRates() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(selicTable).orderBy(desc(selicTable.ano), desc(selicTable.mes));
}

/**
 * Inserir ou atualizar taxa SELIC
 */
export async function upsertSelicRate(data: InsertSelicEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(selicTable).values(data).onDuplicateKeyUpdate({
    set: {
      taxa: data.taxa,
      acumulada: data.acumulada,
    },
  });
}

// ============================================================================
// IRPF Calculation Helper
// ============================================================================

// Tabela de Alíquotas do IRPF (após abril/2023)
const TABELA_IR: Array<{ min: number; max: number; aliquota: number; deducao: number }> = [
  { min: 0, max: 211200, aliquota: 0, deducao: 0 },           // R$ 2.112,00 em centavos
  { min: 211201, max: 282665, aliquota: 0.075, deducao: 15840 },  // R$ 2.826,65
  { min: 282666, max: 375105, aliquota: 0.15, deducao: 37040 },   // R$ 3.751,05
  { min: 375106, max: 466468, aliquota: 0.225, deducao: 65173 },  // R$ 4.664,68
  { min: 466469, max: Infinity, aliquota: 0.275, deducao: 88496 }, // Acima
];

/**
 * Calcular valores de IRPF com base nos dados fornecidos
 * FÓRMULAS CORRETAS baseadas na planilha Excel:
 * 
 * 1. Proporção Tributável = Tributável Homologado / Bruto Homologado
 * 2. RT Alvará = (Alvará + DARF) × Proporção Tributável
 * 3. RT Honorários = Honorários × Proporção Tributável
 * 4. Base de Cálculo = RT Alvará - RT Honorários (mínimo 0)
 * 5. RRA = Base de Cálculo / Número de Meses
 * 6. IR Devido = (Alíquota × RRA - Dedução) × Número de Meses
 * 7. IRPF = DARF - IR Devido
 */
export function calcularIRPF(data: {
  brutoHomologado: number;  // em centavos
  tributavelHomologado: number;  // em centavos
  numeroMeses: number;
  alvaraValor: number;  // em centavos
  darfValor: number;  // em centavos
  honorariosValor: number;  // em centavos
}) {
  // 1. Proporção de rendimentos tributáveis
  const proporcaoNum = data.brutoHomologado > 0 
    ? data.tributavelHomologado / data.brutoHomologado 
    : 0;
  const proporcao = (proporcaoNum * 100).toFixed(4) + '%';

  // 2. Rendimentos tributáveis do alvará = (Alvará + DARF) × Proporção
  const rendimentosTributavelAlvara = Math.round((data.alvaraValor + data.darfValor) * proporcaoNum);

  // 3. Rendimentos tributáveis dos honorários = Honorários × Proporção
  const rendimentosTributavelHonorarios = Math.round(data.honorariosValor * proporcaoNum);

  // 4. Base de cálculo = RT Alvará - RT Honorários (mínimo 0)
  const baseCalculo = Math.max(0, rendimentosTributavelAlvara - rendimentosTributavelHonorarios);

  // 5. RRA (Rendimento Recebido Acumuladamente) - valor mensal em centavos
  const rraNum = data.numeroMeses > 0 ? baseCalculo / data.numeroMeses : 0;
  const rra = (rraNum / 100).toFixed(2);  // Formata para exibição em reais

  // 6. Encontrar a faixa de alíquota correta
  let aliquota = 0;
  let deducao = 0;
  for (const faixa of TABELA_IR) {
    if (rraNum >= faixa.min && (faixa.max === Infinity || rraNum <= faixa.max)) {
      aliquota = faixa.aliquota;
      deducao = faixa.deducao;
      break;
    }
  }

  // 7. IR Mensal = (Alíquota × RRA) - Dedução
  const irMensalNum = Math.max(0, (aliquota * rraNum) - deducao);
  const irMensal = (irMensalNum / 100).toFixed(2);  // Formata para exibição em reais

  // 8. IR Devido = IR Mensal × Número de Meses
  const irDevido = Math.round(irMensalNum * data.numeroMeses);

  // 9. IRPF a Restituir = DARF - IR Devido
  const irpfRestituir = data.darfValor - irDevido;

  return {
    proporcao,
    rendimentosTributavelAlvara,
    rendimentosTributavelHonorarios,
    baseCalculo,
    rra,
    irMensal,
    irDevido,
    irpfRestituir,
  };
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Obter estatísticas gerais do sistema
 */
export async function getStatistics() {
  const db = await getDb();
  if (!db) return null;

  const allForms = await db.select().from(irpfForms);

  const totalForms = allForms.length;
  const formsPagos = allForms.filter(f => f.statusPagamento === 'pago').length;
  const formsPendentes = allForms.filter(f => f.statusPagamento === 'pendente').length;
  const totalRestituicao = allForms.reduce((acc, f) => acc + (f.irpfRestituir > 0 ? f.irpfRestituir : 0), 0);

  return {
    totalForms,
    formsPagos,
    formsPendentes,
    totalRestituicao,
  };
}
