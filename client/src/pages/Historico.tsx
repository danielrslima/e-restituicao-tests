import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { useLocation } from "wouter";
import { Search, FileText, Download, Eye, Loader2, Printer, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ResultadoExercicio {
  exercicio: number;
  irpfRestituir: number;
  rendimentosTributaveis?: number;
  irRetido?: number;
  meses?: number;
  // Campos alternativos do site externo
  ano?: number;
  selicAplicada?: number;
}

interface FormData {
  nomeCliente: string;
  cpf: string;
  dataNascimento: string;
  email: string;
  telefone: string;
  numeroProcesso: string;
  vara: string;
  comarca: string;
  fontePagadora: string;
  cnpj: string;
  brutoHomologado: number;
  tributavelHomologado: number;
  numeroMeses: number;
  alvaraValor: number;
  alvaraData: string;
  darfValor: number;
  darfData: string;
  honorariosValor: number;
  honorariosAno: string;
  statusPagamento: "pendente" | "pago" | "cancelado";
}

export default function Historico() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canEdit = isAdmin || (user as any)?.canEdit === 'yes';
  const canDelete = isAdmin; // Apenas admin pode excluir
  
  const [search, setSearch] = useState("");
  const [selectedForm, setSelectedForm] = useState<number | null>(null);
  const [editingForm, setEditingForm] = useState<number | null>(null);
  const [deletingForm, setDeletingForm] = useState<number | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<{ formId: number; type: string; exercicio?: number } | null>(null);
  const [editFormData, setEditFormData] = useState<FormData | null>(null);

  const utils = trpc.useUtils();

  const { data: forms, isLoading } = trpc.irpf.list.useQuery({
    search: search || undefined,
  });

  const { data: formDetails, isLoading: detailsLoading } = trpc.irpf.getById.useQuery(
    { id: selectedForm! },
    { enabled: !!selectedForm }
  );

  // Mutation para atualizar
  const updateMutation = trpc.irpf.update.useMutation({
    onSuccess: () => {
      toast.success("Cálculo atualizado com sucesso!");
      setEditingForm(null);
      setEditFormData(null);
      utils.irpf.list.invalidate();
      utils.irpf.getById.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  // Mutation para deletar
  const deleteMutation = trpc.irpf.delete.useMutation({
    onSuccess: () => {
      toast.success("Cálculo excluído com sucesso!");
      setDeletingForm(null);
      setSelectedForm(null);
      utils.irpf.list.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao excluir: " + error.message);
    },
  });

  // Mutations para gerar PDFs
  const esclarecimentosMutation = trpc.pdf.esclarecimentos.useMutation({
    onSuccess: (data) => {
      downloadPdfFromBase64(data.pdf, data.filename);
      toast.success("PDF de Esclarecimentos baixado com sucesso!");
      setDownloadingPdf(null);
    },
    onError: (error) => {
      toast.error("Erro ao gerar PDF: " + error.message);
      setDownloadingPdf(null);
    },
  });

  const planilhaRTMutation = trpc.pdf.planilhaRT.useMutation({
    onSuccess: (data) => {
      downloadPdfFromBase64(data.pdf, data.filename);
      toast.success("PDF de Planilha RT baixado com sucesso!");
      setDownloadingPdf(null);
    },
    onError: (error) => {
      toast.error("Erro ao gerar PDF: " + error.message);
      setDownloadingPdf(null);
    },
  });

  const downloadPdfFromBase64 = (base64: string, filename: string) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadEsclarecimentos = (formId: number, exercicio?: number) => {
    setDownloadingPdf({ formId, type: 'esclarecimentos', exercicio });
    esclarecimentosMutation.mutate({ formId, exercicio });
  };

  const handleDownloadPlanilhaRT = (formId: number, exercicio?: number) => {
    setDownloadingPdf({ formId, type: 'planilhaRT', exercicio });
    planilhaRTMutation.mutate({ formId, exercicio });
  };

  const [, setLocation] = useLocation();

  const handlePrint = () => {
    if (selectedForm) {
      // Abre a página de impressão dedicada em nova aba
      window.open(`/imprimir/${selectedForm}`, '_blank');
    }
  };

  const handleEdit = (form: any) => {
    setEditFormData({
      nomeCliente: form.nomeCliente || "",
      cpf: form.cpf || "",
      dataNascimento: form.dataNascimento || "",
      email: form.email || "",
      telefone: form.telefone || "",
      numeroProcesso: form.numeroProcesso || "",
      vara: form.vara || "",
      comarca: form.comarca || "",
      fontePagadora: form.fontePagadora || "",
      cnpj: form.cnpj || "",
      brutoHomologado: form.brutoHomologado || 0,
      tributavelHomologado: form.tributavelHomologado || 0,
      numeroMeses: form.numeroMeses || 0,
      alvaraValor: form.alvaraValor || 0,
      alvaraData: form.alvaraData || "",
      darfValor: form.darfValor || 0,
      darfData: form.darfData || "",
      honorariosValor: form.honorariosValor || 0,
      honorariosAno: form.honorariosAno || "",
      statusPagamento: form.statusPagamento || "pendente",
    });
    setEditingForm(form.id);
  };

  const handleSaveEdit = () => {
    if (!editFormData || !editingForm) return;
    
    updateMutation.mutate({
      id: editingForm,
      data: editFormData,
    });
  };

  const handleDelete = () => {
    if (!deletingForm) return;
    deleteMutation.mutate({ id: deletingForm });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value / 100);
  };

  // Função helper para calcular o valor correto de restituição para cada registro na lista
  const calcularRestituicaoTotal = (form: { irpfRestituir: number; resultadosPorExercicio?: string | null }): number => {
    if (!form.resultadosPorExercicio) {
      return form.irpfRestituir || 0;
    }
    try {
      const resultados: ResultadoExercicio[] = JSON.parse(form.resultadosPorExercicio);
      if (resultados.length > 0) {
        return resultados.reduce((soma, r) => soma + r.irpfRestituir, 0);
      }
      return form.irpfRestituir || 0;
    } catch {
      return form.irpfRestituir || 0;
    }
  };

  const formatCurrencyInput = (value: number) => {
    return (value / 100).toFixed(2);
  };

  const parseCurrencyInput = (value: string) => {
    return Math.round(parseFloat(value.replace(",", ".") || "0") * 100);
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '-';
    const d = new Date(date);
    const dataStr = d.toLocaleDateString('pt-BR');
    const horaStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${dataStr} ${horaStr}`;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pendente: { variant: "secondary", label: "Pendente" },
      pago: { variant: "default", label: "Pago" },
      cancelado: { variant: "destructive", label: "Cancelado" },
    };
    const config = variants[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Extrair exercícios do formDetails
  const getExercicios = (): number[] => {
    if (!formDetails?.resultadosPorExercicio) {
      const exercicioDefault = formDetails?.alvaraData 
        ? new Date(formDetails.alvaraData).getFullYear() + 1 
        : new Date().getFullYear();
      return [exercicioDefault];
    }
    try {
      const parsed = JSON.parse(formDetails.resultadosPorExercicio);
      
      // O campo pode ser um array direto ou estar dentro de dadosExtras.resultadosPorExercicio
      let resultados: ResultadoExercicio[] = [];
      
      if (Array.isArray(parsed)) {
        resultados = parsed;
      } else if (parsed.resultadosPorExercicio && Array.isArray(parsed.resultadosPorExercicio)) {
        resultados = parsed.resultadosPorExercicio;
      }
      
      if (resultados.length === 0) {
        const exercicioDefault = formDetails?.alvaraData 
          ? new Date(formDetails.alvaraData).getFullYear() + 1 
          : new Date().getFullYear();
        return [exercicioDefault];
      }
      
      // Aceitar tanto 'exercicio' quanto 'ano' como campo do exercício
      return resultados.map(r => r.exercicio || r.ano || 0).filter(e => e > 0).sort((a, b) => a - b);
    } catch (e) {
      console.error('Erro ao parsear resultadosPorExercicio:', e);
      const exercicioDefault = formDetails?.alvaraData 
        ? new Date(formDetails.alvaraData).getFullYear() + 1 
        : new Date().getFullYear();
      return [exercicioDefault];
    }
  };

  const exercicios = formDetails ? getExercicios() : [];
  const isMultipleExercicios = exercicios.length > 1;

  // Calcular o total correto somando os valores dos exercícios (quando existirem)
  const getIrpfRestituirTotal = (): number => {
    if (!formDetails?.resultadosPorExercicio) {
      return formDetails?.irpfRestituir || 0;
    }
    try {
      const parsed = JSON.parse(formDetails.resultadosPorExercicio);
      
      // O campo pode ser um array direto ou estar dentro de dadosExtras.resultadosPorExercicio
      let resultados: ResultadoExercicio[] = [];
      
      if (Array.isArray(parsed)) {
        resultados = parsed;
      } else if (parsed.resultadosPorExercicio && Array.isArray(parsed.resultadosPorExercicio)) {
        resultados = parsed.resultadosPorExercicio;
      }
      
      if (resultados.length > 0) {
        // Somar os valores de irpfRestituir de todos os exercícios (incluindo negativos)
        return resultados.reduce((soma, r) => soma + (r.irpfRestituir || 0), 0);
      }
      return formDetails?.irpfRestituir || 0;
    } catch {
      return formDetails?.irpfRestituir || 0;
    }
  };

  const irpfRestituirTotal = formDetails ? getIrpfRestituirTotal() : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Histórico de Cálculos</h1>
            <p className="text-muted-foreground mt-1">
              Visualize e gerencie seus cálculos de restituição
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cálculos Realizados</CardTitle>
            <CardDescription>
              {forms?.length || 0} registro(s) encontrado(s)
              {isAdmin && <span className="ml-2 text-green-600">(Admin - pode editar e excluir)</span>}
              {!isAdmin && canEdit && <span className="ml-2 text-blue-600">(Pode editar)</span>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </div>
            ) : forms && forms.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Processo</TableHead>
                      <TableHead>Restituição</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...forms].sort((a, b) => a.nomeCliente.localeCompare(b.nomeCliente, 'pt-BR')).map((form) => (
                      <TableRow key={form.id}>
                        <TableCell className="font-medium">{form.nomeCliente}</TableCell>
                        <TableCell>{form.cpf}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{form.numeroProcesso}</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {formatCurrency(calcularRestituicaoTotal(form))}
                        </TableCell>
                        <TableCell>{getStatusBadge(form.statusPagamento)}</TableCell>
                        <TableCell>{formatDate(form.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedForm(form.id)}
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(form)}
                                title="Editar"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingForm(form.id)}
                                title="Excluir"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={downloadingPdf?.formId === form.id}
                                  title="Baixar PDFs"
                                >
                                  {downloadingPdf?.formId === form.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Download className="h-4 w-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Baixar PDF</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDownloadEsclarecimentos(form.id)}
                                  disabled={downloadingPdf?.formId === form.id}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Esclarecimentos
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDownloadPlanilhaRT(form.id)}
                                  disabled={downloadingPdf?.formId === form.id}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Planilha RT
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    const dataStr = JSON.stringify(form, null, 2);
                                    const blob = new Blob([dataStr], { type: 'application/json' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `calculo-${form.cpf}-${form.id}.json`;
                                    a.click();
                                  }}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  JSON (dados brutos)
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-muted-foreground">
                  {search ? "Nenhum resultado encontrado" : "Nenhum cálculo realizado ainda"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Detalhes */}
        <Dialog open={!!selectedForm} onOpenChange={() => setSelectedForm(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible">
            <DialogHeader className="print:mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <DialogTitle>Detalhes do Cálculo</DialogTitle>
                  <DialogDescription>
                    Informações completas do cálculo de restituição
                  </DialogDescription>
                </div>
                <div className="flex flex-wrap gap-2 print:hidden">
                  {canEdit && formDetails && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleEdit(formDetails);
                        setSelectedForm(null);
                      }}
                      className="text-blue-600"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  )}
                  {canDelete && formDetails && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDeletingForm(formDetails.id);
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    title="Imprimir"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                </div>
              </div>
            </DialogHeader>
            {detailsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </div>
            ) : formDetails ? (
              <div className="space-y-6" id="print-content">
                {/* Cabeçalho para Impressão */}
                <div className="hidden print:block print:mb-3">
                  <div className="flex items-center justify-between border-b-2 border-green-600 pb-2 mb-2">
                    <div className="flex items-center gap-3">
                      <img src="/logotipo-e-restituicaoIR.png" alt="e-Restituição" className="h-16" />
                      <p className="text-sm text-gray-500">Relatório de Cálculo de Restituição</p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>Data: {new Date().toLocaleDateString('pt-BR')}</p>
                      <p>Hora: {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                </div>

                {/* Dados Pessoais */}
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">DADOS PESSOAIS</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Nome</p>
                      <p className="font-medium">{formDetails.nomeCliente}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">CPF</p>
                      <p className="font-medium">{formDetails.cpf}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Data de Nascimento</p>
                      <p className="font-medium">{formDetails.dataNascimento}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">E-mail</p>
                      <p className="font-medium">{formDetails.email}</p>
                    </div>
                  </div>
                </div>

                {/* Dados Processuais */}
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">DADOS PROCESSUAIS</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Número do Processo</p>
                      <p className="font-medium">{formDetails.numeroProcesso}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Vara</p>
                      <p className="font-medium">{formDetails.vara}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Comarca</p>
                      <p className="font-medium">{formDetails.comarca}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fonte Pagadora</p>
                      <p className="font-medium">{formDetails.fontePagadora || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">CNPJ</p>
                      <p className="font-medium">{formDetails.cnpj || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Valores */}
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">VALORES</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Bruto Homologado</p>
                      <p className="font-medium">{formatCurrency(formDetails.brutoHomologado)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tributável Homologado</p>
                      <p className="font-medium">{formatCurrency(formDetails.tributavelHomologado)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Valor do Alvará</p>
                      <p className="font-medium">{formatCurrency(formDetails.alvaraValor)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">DARF/IR Retido</p>
                      <p className="font-medium">{formatCurrency(formDetails.darfValor)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Honorários</p>
                      <p className="font-medium">{formatCurrency(formDetails.honorariosValor)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Número de Meses (RRA)</p>
                      <p className="font-medium">{formDetails.numeroMeses}</p>
                    </div>
                  </div>
                </div>

                {/* Resultado */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-sm text-green-700 mb-2">RESULTADO DO CÁLCULO</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Proporção</p>
                      <p className="font-medium">{formDetails.proporcao || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Base de Cálculo</p>
                      <p className="font-medium">{formatCurrency(formDetails.baseCalculo || 0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">IR Devido</p>
                      <p className="font-medium">{formatCurrency(formDetails.irDevido || 0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">IRPF a Restituir</p>
                      <p className={`font-bold text-lg ${irpfRestituirTotal >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {formatCurrency(irpfRestituirTotal)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Resultados por Exercício (se múltiplos) */}
                {isMultipleExercicios && formDetails.resultadosPorExercicio && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-sm text-blue-700 mb-3">RESULTADOS POR EXERCÍCIO</h3>
                    <div className="space-y-2">
                      {(() => {
                        try {
                          const resultados: ResultadoExercicio[] = JSON.parse(formDetails.resultadosPorExercicio);
                          return resultados.map((r) => (
                            <div key={r.exercicio} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                              <span className="font-medium">DIRPF {r.exercicio}</span>
                              <span className={r.irpfRestituir >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                {formatCurrency(r.irpfRestituir)}
                              </span>
                            </div>
                          ));
                        } catch {
                          return null;
                        }
                      })()}
                    </div>
                  </div>
                )}

                {/* Rodapé para Impressão */}
                <div className="hidden print:block print:mt-8 print:pt-4 print:border-t print:border-gray-300">
                  <div className="flex justify-between text-xs text-gray-500">
                    <p>Documento gerado pelo sistema e-Restituição IRPF</p>
                    <p>Este documento é meramente informativo e não substitui a declaração oficial</p>
                  </div>
                </div>

                {/* Botões de Download no Modal */}
                <div className="pt-4 border-t print:hidden">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3">BAIXAR DOCUMENTOS</h3>
                  
                  {isMultipleExercicios ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Esclarecimentos</p>
                        <div className="flex flex-wrap gap-2">
                          {exercicios.map((exercicio) => (
                            <Button
                              key={`esc-${exercicio}`}
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadEsclarecimentos(formDetails.id, exercicio)}
                              disabled={downloadingPdf?.formId === formDetails.id && downloadingPdf?.type === 'esclarecimentos' && downloadingPdf?.exercicio === exercicio}
                            >
                              {downloadingPdf?.formId === formDetails.id && downloadingPdf?.type === 'esclarecimentos' && downloadingPdf?.exercicio === exercicio ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4 mr-1" />
                              )}
                              {exercicio}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-2">Planilha RT</p>
                        <div className="flex flex-wrap gap-2">
                          {exercicios.map((exercicio) => (
                            <Button
                              key={`rt-${exercicio}`}
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadPlanilhaRT(formDetails.id, exercicio)}
                              disabled={downloadingPdf?.formId === formDetails.id && downloadingPdf?.type === 'planilhaRT' && downloadingPdf?.exercicio === exercicio}
                            >
                              {downloadingPdf?.formId === formDetails.id && downloadingPdf?.type === 'planilhaRT' && downloadingPdf?.exercicio === exercicio ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4 mr-1" />
                              )}
                              {exercicio}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleDownloadEsclarecimentos(formDetails.id)}
                        disabled={downloadingPdf?.formId === formDetails.id && downloadingPdf?.type === 'esclarecimentos'}
                      >
                        {downloadingPdf?.formId === formDetails.id && downloadingPdf?.type === 'esclarecimentos' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        Esclarecimentos
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleDownloadPlanilhaRT(formDetails.id)}
                        disabled={downloadingPdf?.formId === formDetails.id && downloadingPdf?.type === 'planilhaRT'}
                      >
                        {downloadingPdf?.formId === formDetails.id && downloadingPdf?.type === 'planilhaRT' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        Planilha RT
                      </Button>
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Status do Pagamento</p>
                    {getStatusBadge(formDetails.statusPagamento)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Criado em</p>
                    <p className="font-medium">{formatDate(formDetails.createdAt)}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Modal de Edição */}
        <Dialog open={!!editingForm} onOpenChange={() => { setEditingForm(null); setEditFormData(null); }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Cálculo</DialogTitle>
              <DialogDescription>
                Altere os dados do cálculo. Os valores serão recalculados automaticamente.
              </DialogDescription>
            </DialogHeader>
            {editFormData && (
              <div className="space-y-6">
                {/* Dados Pessoais */}
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3">DADOS PESSOAIS</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nomeCliente">Nome Completo</Label>
                      <Input
                        id="nomeCliente"
                        value={editFormData.nomeCliente}
                        onChange={(e) => setEditFormData({ ...editFormData, nomeCliente: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        value={editFormData.cpf}
                        onChange={(e) => setEditFormData({ ...editFormData, cpf: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                      <Input
                        id="dataNascimento"
                        value={editFormData.dataNascimento}
                        onChange={(e) => setEditFormData({ ...editFormData, dataNascimento: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        value={editFormData.telefone}
                        onChange={(e) => setEditFormData({ ...editFormData, telefone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Dados Processuais */}
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3">DADOS PROCESSUAIS</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="numeroProcesso">Número do Processo</Label>
                      <Input
                        id="numeroProcesso"
                        value={editFormData.numeroProcesso}
                        onChange={(e) => setEditFormData({ ...editFormData, numeroProcesso: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vara">Vara</Label>
                      <Input
                        id="vara"
                        value={editFormData.vara}
                        onChange={(e) => setEditFormData({ ...editFormData, vara: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="comarca">Comarca</Label>
                      <Input
                        id="comarca"
                        value={editFormData.comarca}
                        onChange={(e) => setEditFormData({ ...editFormData, comarca: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fontePagadora">Fonte Pagadora</Label>
                      <Input
                        id="fontePagadora"
                        value={editFormData.fontePagadora}
                        onChange={(e) => setEditFormData({ ...editFormData, fontePagadora: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input
                        id="cnpj"
                        value={editFormData.cnpj}
                        onChange={(e) => setEditFormData({ ...editFormData, cnpj: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Valores */}
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3">VALORES</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="brutoHomologado">Bruto Homologado (R$)</Label>
                      <Input
                        id="brutoHomologado"
                        type="number"
                        step="0.01"
                        value={formatCurrencyInput(editFormData.brutoHomologado)}
                        onChange={(e) => setEditFormData({ ...editFormData, brutoHomologado: parseCurrencyInput(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tributavelHomologado">Tributável Homologado (R$)</Label>
                      <Input
                        id="tributavelHomologado"
                        type="number"
                        step="0.01"
                        value={formatCurrencyInput(editFormData.tributavelHomologado)}
                        onChange={(e) => setEditFormData({ ...editFormData, tributavelHomologado: parseCurrencyInput(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="numeroMeses">Número de Meses (RRA)</Label>
                      <Input
                        id="numeroMeses"
                        type="number"
                        value={editFormData.numeroMeses}
                        onChange={(e) => setEditFormData({ ...editFormData, numeroMeses: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alvaraValor">Valor do Alvará (R$)</Label>
                      <Input
                        id="alvaraValor"
                        type="number"
                        step="0.01"
                        value={formatCurrencyInput(editFormData.alvaraValor)}
                        onChange={(e) => setEditFormData({ ...editFormData, alvaraValor: parseCurrencyInput(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alvaraData">Data do Alvará</Label>
                      <Input
                        id="alvaraData"
                        type="date"
                        value={editFormData.alvaraData}
                        onChange={(e) => setEditFormData({ ...editFormData, alvaraData: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="darfValor">Valor do DARF (R$)</Label>
                      <Input
                        id="darfValor"
                        type="number"
                        step="0.01"
                        value={formatCurrencyInput(editFormData.darfValor)}
                        onChange={(e) => setEditFormData({ ...editFormData, darfValor: parseCurrencyInput(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="darfData">Data do DARF</Label>
                      <Input
                        id="darfData"
                        type="date"
                        value={editFormData.darfData}
                        onChange={(e) => setEditFormData({ ...editFormData, darfData: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="honorariosValor">Valor dos Honorários (R$)</Label>
                      <Input
                        id="honorariosValor"
                        type="number"
                        step="0.01"
                        value={formatCurrencyInput(editFormData.honorariosValor)}
                        onChange={(e) => setEditFormData({ ...editFormData, honorariosValor: parseCurrencyInput(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="honorariosAno">Ano dos Honorários</Label>
                      <Input
                        id="honorariosAno"
                        value={editFormData.honorariosAno}
                        onChange={(e) => setEditFormData({ ...editFormData, honorariosAno: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3">STATUS</h3>
                  <div className="space-y-2">
                    <Label htmlFor="statusPagamento">Status do Pagamento</Label>
                    <Select
                      value={editFormData.statusPagamento}
                      onValueChange={(value: "pendente" | "pago" | "cancelado") => setEditFormData({ ...editFormData, statusPagamento: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => { setEditingForm(null); setEditFormData(null); }}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveEdit} 
                disabled={updateMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Confirmação de Exclusão */}
        <AlertDialog open={!!deletingForm} onOpenChange={() => setDeletingForm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Confirmar Exclusão
              </AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este cálculo? Esta ação não pode ser desfeita.
                Todos os dados relacionados serão permanentemente removidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  "Excluir"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Estilos para impressão */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm 15mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background: white !important;
          }
          body * {
            visibility: hidden;
          }
          #print-content, #print-content * {
            visibility: visible;
          }
          #print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            font-size: 10pt;
            line-height: 1.4;
            background: white;
          }
          #print-content .hidden.print\:block {
            display: block !important;
            visibility: visible !important;
          }
          #print-content > div {
            border: 1px solid #e5e7eb;
            padding: 12px;
            margin-bottom: 12px;
            border-radius: 4px;
            background-color: #fff;
          }
          #print-content > div.hidden {
            border: none;
            padding: 0;
            background: transparent;
          }
          #print-content h3 {
            font-size: 9pt;
            font-weight: 600;
            color: #374151;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #16a34a;
            padding-bottom: 6px;
            margin-bottom: 10px;
          }
          #print-content .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px 20px;
          }
          #print-content .grid > div {
            padding: 4px 0;
          }
          #print-content .grid p.text-muted-foreground {
            font-size: 8pt;
            color: #6b7280;
            margin-bottom: 2px;
          }
          #print-content .grid p.font-medium {
            font-size: 10pt;
            color: #111827;
            font-weight: 500;
          }
          #print-content .bg-green-50 {
            background-color: #f0fdf4 !important;
            border: 2px solid #16a34a !important;
            padding: 16px;
            border-radius: 6px;
          }
          #print-content .bg-green-50 h3 {
            color: #15803d;
            border-bottom-color: #15803d;
          }
          #print-content .bg-blue-50 {
            background-color: #eff6ff !important;
            border: 2px solid #2563eb !important;
            padding: 16px;
            border-radius: 6px;
          }
          #print-content .bg-blue-50 h3 {
            color: #1d4ed8;
            border-bottom-color: #1d4ed8;
          }
          #print-content .text-green-700 {
            color: #15803d !important;
          }
          #print-content .font-bold.text-lg {
            font-size: 14pt !important;
            font-weight: 700 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
