import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getAllIrpfForms,
  getIrpfFormById,
  createIrpfForm,
  updateIrpfForm,
  deleteIrpfForm,
  updateKitIRStatus,
  getNotesByFormId,
  createNote,
  updateNote,
  deleteNote,
  calcularIRPF,
  getStatistics,
  getDb,
} from "./db";
import { irpfForms } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user?.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a administradores' });
  }
  return next({ ctx });
});

// Schema de validação para formulário IRPF
const irpfFormInputSchema = z.object({
  nomeCliente: z.string().min(1, "Nome é obrigatório"),
  cpf: z.string().min(11, "CPF inválido"),
  dataNascimento: z.string().min(1, "Data de nascimento é obrigatória"),
  email: z.string().email("Email inválido"),
  telefone: z.string().optional(),
  numeroProcesso: z.string().min(1, "Número do processo é obrigatório"),
  vara: z.string().min(1, "Vara é obrigatória"),
  comarca: z.string().min(1, "Comarca é obrigatória"),
  fontePagadora: z.string().min(1, "Fonte pagadora é obrigatória"),
  cnpj: z.string().min(14, "CNPJ inválido"),
  brutoHomologado: z.number().min(0),
  tributavelHomologado: z.number().min(0),
  numeroMeses: z.number().min(1),
  alvaraValor: z.number().min(0),
  alvaraData: z.string().min(1),
  darfValor: z.number().min(0),
  darfData: z.string().min(1),
  honorariosValor: z.number().min(0),
  honorariosAno: z.string().min(4),
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============================================================================
  // IRPF Forms Router
  // ============================================================================
  irpf: router({
    // Listar formulários (admin vê todos, usuário vê os seus)
    list: protectedProcedure
      .input(z.object({
        statusPagamento: z.string().optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        const isAdmin = ctx.user?.role === 'admin';
        const forms = await getAllIrpfForms({
          statusPagamento: input?.statusPagamento,
          search: input?.search,
          userId: isAdmin ? undefined : ctx.user?.id,
        });
        return forms;
      }),

    // Obter formulário por ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const form = await getIrpfFormById(input.id);
        if (!form) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Formulário não encontrado' });
        }
        // Verificar permissão
        if (ctx.user?.role !== 'admin' && form.userId !== ctx.user?.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Sem permissão para acessar este formulário' });
        }
        return form;
      }),

    // Criar novo formulário com cálculo automático
    create: protectedProcedure
      .input(irpfFormInputSchema)
      .mutation(async ({ input, ctx }) => {
        // Calcular valores
        const calculados = calcularIRPF({
          brutoHomologado: input.brutoHomologado,
          tributavelHomologado: input.tributavelHomologado,
          numeroMeses: input.numeroMeses,
          alvaraValor: input.alvaraValor,
          darfValor: input.darfValor,
          honorariosValor: input.honorariosValor,
        });

        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

        await db.insert(irpfForms).values({
          userId: ctx.user?.id,
          ...input,
          ...calculados,
        });

        // Notificar proprietário sobre novo cálculo
        await notifyOwner({
          title: "Novo Cálculo de IRPF",
          content: `Um novo cálculo de IRPF foi realizado por ${input.nomeCliente} (CPF: ${input.cpf}). Valor a restituir: R$ ${(calculados.irpfRestituir / 100).toFixed(2)}`,
        });

        return { success: true, calculados };
      }),

    // Atualizar formulário (recalcula automaticamente)
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        data: irpfFormInputSchema.extend({
          statusPagamento: z.enum(["pendente", "pago", "cancelado"]).optional(),
          categoria: z.enum(["free", "starter", "builder", "specialist"]).optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

        // Recalcular valores
        const calculados = calcularIRPF({
          brutoHomologado: input.data.brutoHomologado,
          tributavelHomologado: input.data.tributavelHomologado,
          numeroMeses: input.data.numeroMeses,
          alvaraValor: input.data.alvaraValor,
          darfValor: input.data.darfValor,
          honorariosValor: input.data.honorariosValor,
        });

        await db.update(irpfForms)
          .set({
            ...input.data,
            ...calculados,
          })
          .where(eq(irpfForms.id, input.id));

        return { success: true, calculados };
      }),

    // Deletar formulário
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteIrpfForm(input.id);
        return { success: true };
      }),

    // Atualizar status do Kit IR
    updateKitIRStatus: adminProcedure
      .input(z.object({
        formId: z.number(),
        statusKitIR: z.enum(["nao_solicitado", "pendente", "pago", "enviado", "cancelado"]),
      }))
      .mutation(async ({ input }) => {
        await updateKitIRStatus(input.formId, input.statusKitIR);
        return { success: true };
      }),

    // Exportar formulário como JSON
    exportJson: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const form = await getIrpfFormById(input.id);
        if (!form) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Formulário não encontrado' });
        }
        if (ctx.user?.role !== 'admin' && form.userId !== ctx.user?.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return form;
      }),

    // Estatísticas (admin only)
    statistics: adminProcedure.query(async () => {
      return getStatistics();
    }),
  }),

  // ============================================================================
  // Notes Router
  // ============================================================================
  notes: router({
    list: protectedProcedure
      .input(z.object({ formId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        if (input.formId === 0) return [];
        return getNotesByFormId(input.formId);
      }),

    create: adminProcedure
      .input(z.object({
        formId: z.number(),
        conteudo: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        await createNote(input.formId, input.conteudo);
        return { success: true };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        conteudo: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        await updateNote(input.id, input.conteudo);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteNote(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
