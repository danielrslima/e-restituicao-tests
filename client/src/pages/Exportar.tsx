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

  // Mutations para gerar PDFs
  const esclarecimentosMutation = trpc.pdf.esclarecimentos.useMutation();
  const planilhaRTMutation = trpc.pdf.planilhaRT.useMutation();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value / 100);
  };

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
      // Gerar os dois PDFs
      const [esclarecimentosResult, planilhaRTResult] = await Promise.all([
        esclarecimentosMutation.mutateAsync({ formId: formDetails.id }),
        planilhaRTMutation.mutateAsync({ formId: formDetails.id }),
      ]);

      // Baixar PDF de Esclarecimentos
      downloadPdfFromBase64(esclarecimentosResult.pdf, esclarecimentosResult.filename);
      
      // Pequeno delay para não sobrecarregar o navegador
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Baixar PDF de Planilha RT
      downloadPdfFromBase64(planilhaRTResult.pdf, planilhaRTResult.filename);

      toast.success("PDFs exportados com sucesso! (Esclarecimentos e Planilha RT)");
    } catch (error) {
      console.error("Erro ao gerar PDFs:", error);
      toast.error("Erro ao gerar PDFs. Tente novamente.");
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

              {selectedFormId && (
                <p className="text-xs text-muted-foreground text-center">
                  O botão "Exportar PDF" baixa 2 arquivos: Esclarecimentos e Planilha RT
                </p>
              )}
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
                  <span className="font-medium">PDF (Kit IR)</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Exporta dois documentos prontos para protocolar na Receita Federal:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside ml-2">
                  <li><strong>Esclarecimentos</strong> - Documento explicativo com dados da ação e valores</li>
                  <li><strong>Planilha RT</strong> - Demonstrativo de apuração das verbas tributáveis</li>
                </ul>
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
