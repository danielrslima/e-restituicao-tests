import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Download, FileJson, FileText, Loader2, CheckCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function Exportar() {
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [exporting, setExporting] = useState(false);

  const { data: forms, isLoading } = trpc.irpf.list.useQuery({});

  const { data: formDetails } = trpc.irpf.getById.useQuery(
    { id: parseInt(selectedFormId) },
    { enabled: !!selectedFormId }
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value / 100);
  };

  const exportToJSON = () => {
    if (!formDetails) return;

    const dataStr = JSON.stringify(formDetails, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `restituicao-${formDetails.cpf}-${formDetails.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo JSON exportado com sucesso!");
  };

  const exportToPDF = async () => {
    if (!formDetails) return;

    setExporting(true);
    try {
      // Criar conteúdo HTML para o PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Relatório de Restituição IRPF</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #16a34a; border-bottom: 2px solid #16a34a; padding-bottom: 10px; }
            h2 { color: #374151; margin-top: 30px; }
            .section { margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .label { color: #6b7280; }
            .value { font-weight: 600; }
            .result { background: #f0fdf4; padding: 20px; border-radius: 8px; margin-top: 20px; }
            .result h2 { color: #16a34a; margin-top: 0; }
            .total { font-size: 24px; color: #16a34a; font-weight: bold; }
            .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Relatório de Restituição IRPF</h1>
          
          <div class="section">
            <h2>Dados Pessoais</h2>
            <div class="row"><span class="label">Nome:</span><span class="value">${formDetails.nomeCliente}</span></div>
            <div class="row"><span class="label">CPF:</span><span class="value">${formDetails.cpf}</span></div>
            <div class="row"><span class="label">Data de Nascimento:</span><span class="value">${formDetails.dataNascimento}</span></div>
            <div class="row"><span class="label">E-mail:</span><span class="value">${formDetails.email}</span></div>
          </div>

          <div class="section">
            <h2>Dados Processuais</h2>
            <div class="row"><span class="label">Número do Processo:</span><span class="value">${formDetails.numeroProcesso}</span></div>
            <div class="row"><span class="label">Vara:</span><span class="value">${formDetails.vara}</span></div>
            <div class="row"><span class="label">Comarca:</span><span class="value">${formDetails.comarca}</span></div>
            <div class="row"><span class="label">Fonte Pagadora:</span><span class="value">${formDetails.fontePagadora}</span></div>
            <div class="row"><span class="label">CNPJ:</span><span class="value">${formDetails.cnpj}</span></div>
          </div>

          <div class="section">
            <h2>Valores Informados</h2>
            <div class="row"><span class="label">Rendimento Bruto Homologado:</span><span class="value">${formatCurrency(formDetails.brutoHomologado)}</span></div>
            <div class="row"><span class="label">Rendimento Tributável Homologado:</span><span class="value">${formatCurrency(formDetails.tributavelHomologado)}</span></div>
            <div class="row"><span class="label">Valor do Alvará:</span><span class="value">${formatCurrency(formDetails.alvaraValor)}</span></div>
            <div class="row"><span class="label">DARF/IR Retido:</span><span class="value">${formatCurrency(formDetails.darfValor)}</span></div>
            <div class="row"><span class="label">Honorários Advocatícios:</span><span class="value">${formatCurrency(formDetails.honorariosValor)}</span></div>
            <div class="row"><span class="label">Número de Meses (RRA):</span><span class="value">${formDetails.numeroMeses}</span></div>
          </div>

          <div class="result">
            <h2>Resultado do Cálculo</h2>
            <div class="row"><span class="label">Proporção Tributável:</span><span class="value">${formDetails.proporcao}</span></div>
            <div class="row"><span class="label">Base de Cálculo:</span><span class="value">${formatCurrency(formDetails.baseCalculo)}</span></div>
            <div class="row"><span class="label">IR Devido:</span><span class="value">${formatCurrency(formDetails.irDevido)}</span></div>
            <div class="row"><span class="label">IRPF a Restituir:</span><span class="total">${formatCurrency(formDetails.irpfRestituir)}</span></div>
          </div>

          <div class="footer">
            <p>Documento gerado pelo sistema e-Restituição IRPF</p>
            <p>Data de geração: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
          </div>
        </body>
        </html>
      `;

      // Abrir em nova janela para impressão/PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
      }

      toast.success("Relatório PDF gerado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar PDF");
    } finally {
      setExporting(false);
    }
  };

  const exportAllToJSON = () => {
    if (!forms || forms.length === 0) return;

    const dataStr = JSON.stringify(forms, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todos-calculos-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Todos os cálculos exportados com sucesso!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exportar Dados</h1>
          <p className="text-muted-foreground mt-1">
            Exporte seus cálculos de restituição em diferentes formatos
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Exportar Individual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Exportar Cálculo Individual
              </CardTitle>
              <CardDescription>
                Selecione um cálculo para exportar em PDF ou JSON
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Selecione o cálculo</label>
                <Select value={selectedFormId} onValueChange={setSelectedFormId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um cálculo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoading ? (
                      <SelectItem value="loading" disabled>Carregando...</SelectItem>
                    ) : forms && forms.length > 0 ? (
                      forms.map((form) => (
                        <SelectItem key={form.id} value={form.id.toString()}>
                          {form.nomeCliente} - {form.cpf}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="empty" disabled>Nenhum cálculo disponível</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {formDetails && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">{formDetails.nomeCliente}</p>
                  <p className="text-sm text-muted-foreground">Processo: {formDetails.numeroProcesso}</p>
                  <p className="text-sm font-medium text-green-600">
                    Restituição: {formatCurrency(formDetails.irpfRestituir)}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={exportToPDF}
                  disabled={!selectedFormId || exporting}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {exporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Exportar PDF
                </Button>
                <Button
                  onClick={exportToJSON}
                  disabled={!selectedFormId}
                  variant="outline"
                  className="flex-1"
                >
                  <FileJson className="h-4 w-4 mr-2" />
                  Exportar JSON
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Exportar Todos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-green-600" />
                Exportar Todos os Cálculos
              </CardTitle>
              <CardDescription>
                Baixe todos os seus cálculos em um único arquivo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">
                    {forms?.length || 0} cálculo(s) disponível(is)
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  O arquivo JSON conterá todos os dados de todos os seus cálculos de restituição.
                </p>
              </div>

              <Button
                onClick={exportAllToJSON}
                disabled={!forms || forms.length === 0}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Todos (JSON)
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Informações sobre os formatos */}
        <Card>
          <CardHeader>
            <CardTitle>Sobre os Formatos de Exportação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-red-500" />
                  <span className="font-medium">PDF</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Formato ideal para impressão e arquivamento. Contém um relatório formatado 
                  com todos os dados do cálculo, pronto para ser anexado aos documentos do processo.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileJson className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">JSON</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Formato técnico para backup e integração com outros sistemas. 
                  Contém todos os dados estruturados que podem ser importados posteriormente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
