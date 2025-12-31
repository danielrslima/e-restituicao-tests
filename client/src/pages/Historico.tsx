import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Search, FileText, Download, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export default function Historico() {
  const [search, setSearch] = useState("");
  const [selectedForm, setSelectedForm] = useState<number | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<{ formId: number; type: string } | null>(null);

  const { data: forms, isLoading } = trpc.irpf.list.useQuery({
    search: search || undefined,
  });

  const { data: formDetails, isLoading: detailsLoading } = trpc.irpf.getById.useQuery(
    { id: selectedForm! },
    { enabled: !!selectedForm }
  );

  // Mutations para gerar PDFs
  const esclarecimentosMutation = trpc.pdf.esclarecimentos.useMutation({
    onSuccess: (data) => {
      // Converter base64 para blob e fazer download
      const byteCharacters = atob(data.pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
      
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
      // Converter base64 para blob e fazer download
      const byteCharacters = atob(data.pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success("PDF de Planilha RT baixado com sucesso!");
      setDownloadingPdf(null);
    },
    onError: (error) => {
      toast.error("Erro ao gerar PDF: " + error.message);
      setDownloadingPdf(null);
    },
  });

  const handleDownloadEsclarecimentos = (formId: number) => {
    setDownloadingPdf({ formId, type: 'esclarecimentos' });
    esclarecimentosMutation.mutate({ formId });
  };

  const handleDownloadPlanilhaRT = (formId: number) => {
    setDownloadingPdf({ formId, type: 'planilhaRT' });
    planilhaRTMutation.mutate({ formId });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value / 100);
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
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
                    {forms.map((form) => (
                      <TableRow key={form.id}>
                        <TableCell className="font-medium">{form.nomeCliente}</TableCell>
                        <TableCell>{form.cpf}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{form.numeroProcesso}</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {formatCurrency(form.irpfRestituir)}
                        </TableCell>
                        <TableCell>{getStatusBadge(form.statusPagamento)}</TableCell>
                        <TableCell>{formatDate(form.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedForm(form.id)}
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Cálculo</DialogTitle>
              <DialogDescription>
                Informações completas do cálculo de restituição
              </DialogDescription>
            </DialogHeader>
            {detailsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </div>
            ) : formDetails ? (
              <div className="space-y-6">
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
                      <p className="font-medium">{formDetails.fontePagadora}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">CNPJ</p>
                      <p className="font-medium">{formDetails.cnpj}</p>
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
                      <p className="font-medium">{formDetails.proporcao}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Base de Cálculo</p>
                      <p className="font-medium">{formatCurrency(formDetails.baseCalculo)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">IR Devido</p>
                      <p className="font-medium">{formatCurrency(formDetails.irDevido)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">IRPF a Restituir</p>
                      <p className="font-bold text-green-700 text-lg">
                        {formatCurrency(formDetails.irpfRestituir)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botões de Download no Modal */}
                <div className="flex gap-3 pt-4 border-t">
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
      </div>
    </DashboardLayout>
  );
}
