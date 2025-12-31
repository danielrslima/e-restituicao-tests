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
import { calcularIRPF as calcularIRPFCompleto, DadosEntrada } from "./services/irpfCalculationService";
import { irpfForms, users } from "../drizzle/schema";
import { eq, like, or } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";
import { generateEsclarecimentosPDF, EsclarecimentosData } from "./services/pdfEsclarecimentosService";
import { generatePlanilhaRTPDF, PlanilhaRTData } from "./services/pdfPlanilhaRTService";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user?.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a administradores' });
  }
  return next({ ctx });
});

// Schema para linha de alvará/honorário (usado pela página externa)
const linhaCalculoSchema = z.object({
  valorAlvara: z.number().min(0),
  dataAlvara: z.string().min(1), // formato: YYYY-MM-DD
  valorHonorario: z.number().optional(),
  anoPagoHonorario: z.number().optional(),
});

// Schema para DARF (usado pela página externa)
const darfSchema = z.object({
  valor: z.number().min(0),
  data: z.string().min(1), // formato: YYYY-MM-DD
  fontePagadora: z.string().optional(),
  cnpj: z.string().optional(),
});

// Schema para cálculo externo com múltiplos exercícios
const calculoExternoSchema = z.object({
  // Dados pessoais
  nomeCliente: z.string().min(1, "Nome é obrigatório"),
  cpf: z.string().min(11, "CPF inválido"),
  dataNascimento: z.string().min(1, "Data de nascimento é obrigatória"),
  email: z.string().email("Email inválido"),
  telefone: z.string().optional(),
  // Dados processuais
  numeroProcesso: z.string().min(1, "Número do processo é obrigatório"),
  vara: z.string().min(1, "Vara é obrigatória"),
  comarca: z.string().min(1, "Comarca é obrigatória"),
  fontePagadora: z.string().optional(),
  cnpj: z.string().optional(),
  // Valores homologados
  brutoHomologado: z.number().min(0),
  tributavelHomologado: z.number().min(0),
  numeroMeses: z.number().min(1),
  // Múltiplas linhas de alvarás/honorários
  linhas: z.array(linhaCalculoSchema).min(1, "Pelo menos uma linha de alvará é obrigatória"),
  // Múltiplos DARFs
  darfs: z.array(darfSchema).min(1, "Pelo menos um DARF é obrigatório"),
  // Opções (ignoradas - sistema detecta automaticamente)
  tipoCalculo: z.enum(["mesmo_ano", "anos_diferentes"]).optional(), // IGNORADO
});

// Schema de validação para formulário IRPF (simples - uma linha)
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
  // Cálculo Externo (página restituicaoia.com.br)
  // ============================================================================
  calculoExterno: router({
    /**
     * Rota pública para receber dados da página externa restituicaoia.com.br
     * Detecta automaticamente se é caso de múltiplos exercícios baseado nos dados
     * A escolha do usuário (mesmo_ano/anos_diferentes) é IGNORADA
     */
    calcular: publicProcedure
      .input(calculoExternoSchema)
      .mutation(async ({ input }) => {
        // Detectar automaticamente se é múltiplos exercícios baseado nos ANOS dos alvarás e DARFs
        const anosAlvaras = new Set(input.linhas.map(l => new Date(l.dataAlvara).getUTCFullYear()));
        const anosDarfs = new Set(input.darfs.map(d => new Date(d.data).getUTCFullYear()));
        const isMultiplosExercicios = anosAlvaras.size > 1 || anosDarfs.size > 1;

        let resultado;

        if (isMultiplosExercicios) {
          // MÚTIPLOS EXERCÍCIOS: usar motor completo
          const dadosCalculo: DadosEntrada = {
            nomeCliente: input.nomeCliente,
            cpf: input.cpf,
            dataNascimento: new Date(input.dataNascimento),
            numeroProcesso: input.numeroProcesso,
            comarca: input.comarca,
            vara: input.vara,
            brutoHomologado: input.brutoHomologado / 100, // centavos para reais
            tributavelHomologado: input.tributavelHomologado / 100,
            numeroMeses: input.numeroMeses,
            linhas: input.linhas.map(l => ({
              valorAlvara: l.valorAlvara / 100,
              dataAlvara: new Date(l.dataAlvara),
              valorHonorario: l.valorHonorario ? l.valorHonorario / 100 : undefined,
              anoPagoHonorario: l.anoPagoHonorario,
            })),
            darfs: input.darfs.map(d => ({
              valor: d.valor / 100,
              data: new Date(d.data),
              fontePagadora: d.fontePagadora,
              cnpj: d.cnpj,
            })),
            usarDeflacao: true, // Múltiplos anos = usar deflação IPCA
          };

          resultado = calcularIRPFCompleto(dadosCalculo);
        } else {
          // EXERCÍCIO ÚNICO: usar motor simples (mais rápido)
          // Somar todos os alvarás, DARFs e honorários
          const totalAlvara = input.linhas.reduce((sum, l) => sum + l.valorAlvara, 0);
          const totalDarf = input.darfs.reduce((sum, d) => sum + d.valor, 0);
          const totalHonorarios = input.linhas.reduce((sum, l) => sum + (l.valorHonorario || 0), 0);

          const calculoSimples = calcularIRPF({
            brutoHomologado: input.brutoHomologado,
            tributavelHomologado: input.tributavelHomologado,
            numeroMeses: input.numeroMeses,
            alvaraValor: totalAlvara,
            darfValor: totalDarf,
            honorariosValor: totalHonorarios,
          });

          // Converter para formato compatível
          const anoExercicio = Array.from(anosAlvaras)[0] + 1; // Exercício = ano alvará + 1
          resultado = {
            proporcaoTributavel: parseFloat(calculoSimples.proporcao) / 100,
            totalAlvarasDeflacionados: totalAlvara / 100,
            totalDarfOriginal: totalDarf / 100,
            exercicios: [{
              exercicio: anoExercicio,
              rendimentosTributaveis: calculoSimples.baseCalculo / 100,
              irrf: totalDarf / 100,
              numeroMeses: input.numeroMeses,
              irpf: calculoSimples.irpfRestituir / 100,
              descricao: calculoSimples.irpfRestituir >= 0 ? "Imposto a Restituir" : "Imposto a Pagar",
            }],
            totalIrpf: calculoSimples.irpfRestituir / 100,
          };
        }

        // Salvar no banco de dados (se necessário)
        const db = await getDb();
        if (db) {
          // Salvar o primeiro exercício como registro principal
          const primeiroExercicio = resultado.exercicios[0];
          if (primeiroExercicio) {
            await db.insert(irpfForms).values({
              nomeCliente: input.nomeCliente,
              cpf: input.cpf,
              dataNascimento: input.dataNascimento,
              email: input.email,
              telefone: input.telefone,
              numeroProcesso: input.numeroProcesso,
              vara: input.vara,
              comarca: input.comarca,
              fontePagadora: input.fontePagadora || input.darfs[0]?.fontePagadora || "",
              cnpj: input.cnpj || input.darfs[0]?.cnpj || "",
              brutoHomologado: input.brutoHomologado,
              tributavelHomologado: input.tributavelHomologado,
              numeroMeses: input.numeroMeses,
              alvaraValor: input.linhas.reduce((sum, l) => sum + l.valorAlvara, 0),
              alvaraData: input.linhas[0]?.dataAlvara || "",
              darfValor: input.darfs.reduce((sum, d) => sum + d.valor, 0),
              darfData: input.darfs[0]?.data || "",
              honorariosValor: input.linhas.reduce((sum, l) => sum + (l.valorHonorario || 0), 0),
              honorariosAno: input.linhas[0]?.anoPagoHonorario?.toString() || new Date().getFullYear().toString(),
              proporcao: (resultado.proporcaoTributavel * 100).toFixed(4) + "%",
              rendimentosTributavelAlvara: Math.round(primeiroExercicio.rendimentosTributaveis * 100),
              rendimentosTributavelHonorarios: 0, // Calculado internamente
              baseCalculo: Math.round(primeiroExercicio.rendimentosTributaveis * 100),
              rra: (primeiroExercicio.rendimentosTributaveis / primeiroExercicio.numeroMeses).toFixed(2),
              irMensal: "0",
              irDevido: Math.round((primeiroExercicio.irrf - primeiroExercicio.irpf) * 100),
              irpfRestituir: Math.round(resultado.totalIrpf * 100),
            });
          }

          // Notificar proprietário
          await notifyOwner({
            title: "Novo Cálculo Externo de IRPF",
            content: `Cálculo recebido de ${input.nomeCliente} (CPF: ${input.cpf}). ` +
              `Tipo: ${isMultiplosExercicios ? "Múltiplos Exercícios" : "Exercício Único"}. ` +
              `Total a restituir: R$ ${resultado.totalIrpf.toFixed(2)}`,
          });
        }

        return {
          success: true,
          isMultiplosExercicios,
          anosDetectados: {
            alvaras: Array.from(anosAlvaras),
            darfs: Array.from(anosDarfs),
          },
          proporcaoTributavel: resultado.proporcaoTributavel,
          exercicios: resultado.exercicios.map(ex => ({
            exercicio: ex.exercicio,
            rendimentosTributaveis: ex.rendimentosTributaveis,
            irrf: ex.irrf,
            numeroMeses: ex.numeroMeses,
            irpf: ex.irpf,
            descricao: ex.descricao,
          })),
          totalIrpf: resultado.totalIrpf,
          totalIrpfFormatado: `R$ ${resultado.totalIrpf.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        };
      }),
  }),

  // ============================================================================
  // Notes Router
  // ============================================================================
  // ============================================================================
  // PDF Generation Router
  // ============================================================================
  pdf: router({
    // Gerar PDF de Esclarecimentos
    esclarecimentos: protectedProcedure
      .input(z.object({ formId: z.number(), exercicio: z.number().optional() }))
      .mutation(async ({ input, ctx }) => {
        const form = await getIrpfFormById(input.formId);
        if (!form) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Formulário não encontrado' });
        }
        if (ctx.user?.role !== 'admin' && form.userId !== ctx.user?.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }

        // Calcular proporção tributável
        const proporcao = form.tributavelHomologado && form.brutoHomologado 
          ? form.tributavelHomologado / form.brutoHomologado 
          : 0;

        // Calcular valores
        const totalRecebido = form.alvaraValor || 0;
        const irRetido = form.darfValor || 0;
        const valorBrutoAcao = totalRecebido + irRetido;
        const rendimentosTributaveis = form.baseCalculo || 0;
        const deducoes = Math.round((form.honorariosValor || 0) * proporcao);
        const rendimentosIsentos = totalRecebido - rendimentosTributaveis;

        const esclarecimentosData: EsclarecimentosData = {
          nomeCliente: form.nomeCliente || '',
          cpf: form.cpf || '',
          dataNascimento: form.dataNascimento || '',
          numeroProcesso: form.numeroProcesso || '',
          vara: form.vara || '',
          comarca: form.comarca || '',
          fontePagadora: form.fontePagadora || '',
          cnpj: form.cnpj || '',
          exercicio: input.exercicio || (form.alvaraData ? new Date(form.alvaraData).getFullYear() + 1 : new Date().getFullYear()),
          totalRecebido,
          irRetido,
          valorBrutoAcao,
          rendimentosTributaveis,
          proporcao,
          deducoes,
          rendimentosIsentos,
          meses: form.numeroMeses || 0,
          inssReclamante: 0,
        };

        const pdfBuffer = await generateEsclarecimentosPDF(esclarecimentosData);
        return {
          pdf: pdfBuffer.toString('base64'),
          filename: `Esclarecimentos-${form.nomeCliente?.replace(/\s+/g, '-')}-${esclarecimentosData.exercicio}.pdf`,
        };
      }),

    // Gerar PDF de Planilha RT
    planilhaRT: protectedProcedure
      .input(z.object({ formId: z.number(), exercicio: z.number().optional() }))
      .mutation(async ({ input, ctx }) => {
        const form = await getIrpfFormById(input.formId);
        if (!form) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Formulário não encontrado' });
        }
        if (ctx.user?.role !== 'admin' && form.userId !== ctx.user?.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }

        // Calcular proporção tributável
        const proporcao = form.tributavelHomologado && form.brutoHomologado 
          ? form.tributavelHomologado / form.brutoHomologado 
          : 0;

        // Calcular valores
        const totalRendimentos = form.alvaraValor || 0;
        const totalDarf = form.darfValor || 0;
        const totalCausa = totalRendimentos + totalDarf;
        const rendimentosTributaveis = form.baseCalculo || 0;
        const rendimentosIsentos = totalRendimentos - rendimentosTributaveis;
        const totalDespesas = form.honorariosValor || 0;
        const proporcaoDespesas = Math.round(totalDespesas * proporcao);

        // Determinar mês do recebimento
        const meses = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
        const mesRecebimento = form.alvaraData ? meses[new Date(form.alvaraData).getMonth()] : 'DEZEMBRO';

        const planilhaData: PlanilhaRTData = {
          nomeCliente: form.nomeCliente || '',
          cpf: form.cpf || '',
          dataNascimento: form.dataNascimento || '',
          numeroProcesso: form.numeroProcesso || '',
          vara: form.vara || '',
          comarca: form.comarca || '',
          fontePagadora: form.fontePagadora || '',
          cnpj: form.cnpj || '',
          exercicio: input.exercicio || (form.alvaraData ? new Date(form.alvaraData).getFullYear() + 1 : new Date().getFullYear()),
          mesRecebimento,
          totalRendimentos,
          totalDarf,
          totalCausa,
          brutoHomologado: form.brutoHomologado || 0,
          tributaveisHomologado: form.tributavelHomologado || 0,
          proporcao,
          rendimentosIsentos,
          rendimentosTributaveis,
          totalDespesas,
          proporcaoDespesas,
          meses: form.numeroMeses || 0,
          inssReclamante: 0,
        };

        const pdfBuffer = await generatePlanilhaRTPDF(planilhaData);
        return {
          pdf: pdfBuffer.toString('base64'),
          filename: `PlanilhaRT-${form.nomeCliente?.replace(/\s+/g, '-')}-${planilhaData.exercicio}.pdf`,
        };
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

  // ============================================================================
  // Users Router (Admin only)
  // ============================================================================
  users: router({
    // Listar usuários
    list: adminProcedure
      .input(z.object({
        search: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

        let query = db.select().from(users);
        
        if (input?.search) {
          const searchTerm = `%${input.search}%`;
          query = query.where(
            or(
              like(users.name, searchTerm),
              like(users.email, searchTerm)
            )
          ) as typeof query;
        }
        
        return await query;
      }),

    // Atualizar role do usuário
    updateRole: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(["user", "admin"]),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

        await db.update(users)
          .set({ role: input.role })
          .where(eq(users.id, input.userId));
        
        return { success: true };
      }),

    // Atualizar permissão de edição
    updateCanEdit: adminProcedure
      .input(z.object({
        userId: z.number(),
        canEdit: z.enum(["yes", "no"]),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

        await db.update(users)
          .set({ canEdit: input.canEdit })
          .where(eq(users.id, input.userId));
        
        return { success: true };
      }),

    // Deletar usuário
    delete: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Não permitir deletar a si mesmo
        if (input.userId === ctx.user?.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Você não pode remover a si mesmo' });
        }

        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

        await db.delete(users).where(eq(users.id, input.userId));
        
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
