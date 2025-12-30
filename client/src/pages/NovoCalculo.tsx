import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Calculator, User, FileText, DollarSign, Loader2 } from "lucide-react";

export default function NovoCalculo() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const [formData, setFormData] = useState({
    // Dados pessoais
    nomeCliente: "",
    cpf: "",
    dataNascimento: "",
    email: user?.email || "",
    telefone: "",
    // Dados processuais
    numeroProcesso: "",
    vara: "",
    comarca: "",
    fontePagadora: "",
    cnpj: "",
    // Valores
    brutoHomologado: "",
    tributavelHomologado: "",
    numeroMeses: "",
    alvaraValor: "",
    alvaraData: "",
    darfValor: "",
    darfData: "",
    honorariosValor: "",
    honorariosAno: new Date().getFullYear().toString(),
  });

  const [resultado, setResultado] = useState<{
    proporcao: string;
    rendimentosTributavelAlvara: number;
    rendimentosTributavelHonorarios: number;
    baseCalculo: number;
    rra: string;
    irMensal: string;
    irDevido: number;
    irpfRestituir: number;
  } | null>(null);

  const createMutation = trpc.irpf.create.useMutation({
    onSuccess: (data) => {
      toast.success("Cálculo realizado com sucesso!");
      setResultado(data.calculados);
      utils.irpf.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao realizar cálculo");
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value / 100);
  };

  const parseCurrency = (value: string): number => {
    const cleaned = value.replace(/\D/g, '');
    return parseInt(cleaned) || 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validações básicas
    if (!formData.nomeCliente || !formData.cpf || !formData.email) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    createMutation.mutate({
      nomeCliente: formData.nomeCliente,
      cpf: formData.cpf,
      dataNascimento: formData.dataNascimento,
      email: formData.email,
      telefone: formData.telefone || undefined,
      numeroProcesso: formData.numeroProcesso,
      vara: formData.vara,
      comarca: formData.comarca,
      fontePagadora: formData.fontePagadora,
      cnpj: formData.cnpj,
      brutoHomologado: parseCurrency(formData.brutoHomologado),
      tributavelHomologado: parseCurrency(formData.tributavelHomologado),
      numeroMeses: parseInt(formData.numeroMeses) || 1,
      alvaraValor: parseCurrency(formData.alvaraValor),
      alvaraData: formData.alvaraData,
      darfValor: parseCurrency(formData.darfValor),
      darfData: formData.darfData,
      honorariosValor: parseCurrency(formData.honorariosValor),
      honorariosAno: formData.honorariosAno,
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Cálculo de IRPF</h1>
          <p className="text-muted-foreground mt-1">
            Preencha os dados abaixo para calcular sua restituição
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-green-600" />
                Dados Pessoais
              </CardTitle>
              <CardDescription>Informações do contribuinte</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nomeCliente">Nome Completo *</Label>
                <Input
                  id="nomeCliente"
                  name="nomeCliente"
                  value={formData.nomeCliente}
                  onChange={handleChange}
                  placeholder="Nome completo"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  name="cpf"
                  value={formData.cpf}
                  onChange={(e) => setFormData(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
                <Input
                  id="dataNascimento"
                  name="dataNascimento"
                  type="date"
                  value={formData.dataNascimento}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </CardContent>
          </Card>

          {/* Dados Processuais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Dados Processuais
              </CardTitle>
              <CardDescription>Informações do processo judicial</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="numeroProcesso">Número do Processo *</Label>
                <Input
                  id="numeroProcesso"
                  name="numeroProcesso"
                  value={formData.numeroProcesso}
                  onChange={handleChange}
                  placeholder="0000000-00.0000.0.00.0000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vara">Vara *</Label>
                <Input
                  id="vara"
                  name="vara"
                  value={formData.vara}
                  onChange={handleChange}
                  placeholder="Ex: 1ª Vara do Trabalho"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comarca">Comarca *</Label>
                <Input
                  id="comarca"
                  name="comarca"
                  value={formData.comarca}
                  onChange={handleChange}
                  placeholder="Ex: São Paulo/SP"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fontePagadora">Fonte Pagadora *</Label>
                <Input
                  id="fontePagadora"
                  name="fontePagadora"
                  value={formData.fontePagadora}
                  onChange={handleChange}
                  placeholder="Nome da empresa"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="cnpj">CNPJ da Fonte Pagadora *</Label>
                <Input
                  id="cnpj"
                  name="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData(prev => ({ ...prev, cnpj: formatCNPJ(e.target.value) }))}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Valores do Cálculo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Valores do Cálculo
              </CardTitle>
              <CardDescription>Informe os valores em reais (R$)</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="brutoHomologado">Rendimento Bruto Homologado (R$) *</Label>
                <Input
                  id="brutoHomologado"
                  name="brutoHomologado"
                  value={formData.brutoHomologado}
                  onChange={handleChange}
                  placeholder="0,00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tributavelHomologado">Rendimento Tributável Homologado (R$) *</Label>
                <Input
                  id="tributavelHomologado"
                  name="tributavelHomologado"
                  value={formData.tributavelHomologado}
                  onChange={handleChange}
                  placeholder="0,00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numeroMeses">Número de Meses (RRA) *</Label>
                <Input
                  id="numeroMeses"
                  name="numeroMeses"
                  type="number"
                  min="1"
                  value={formData.numeroMeses}
                  onChange={handleChange}
                  placeholder="Ex: 24"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alvaraValor">Valor do Alvará (R$) *</Label>
                <Input
                  id="alvaraValor"
                  name="alvaraValor"
                  value={formData.alvaraValor}
                  onChange={handleChange}
                  placeholder="0,00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alvaraData">Data do Alvará *</Label>
                <Input
                  id="alvaraData"
                  name="alvaraData"
                  type="date"
                  value={formData.alvaraData}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="darfValor">Valor do DARF/IR Retido (R$) *</Label>
                <Input
                  id="darfValor"
                  name="darfValor"
                  value={formData.darfValor}
                  onChange={handleChange}
                  placeholder="0,00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="darfData">Data do DARF *</Label>
                <Input
                  id="darfData"
                  name="darfData"
                  type="date"
                  value={formData.darfData}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="honorariosValor">Honorários Advocatícios (R$) *</Label>
                <Input
                  id="honorariosValor"
                  name="honorariosValor"
                  value={formData.honorariosValor}
                  onChange={handleChange}
                  placeholder="0,00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="honorariosAno">Ano dos Honorários *</Label>
                <Input
                  id="honorariosAno"
                  name="honorariosAno"
                  value={formData.honorariosAno}
                  onChange={handleChange}
                  placeholder="2024"
                  maxLength={4}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Botão de Envio */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation('/')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Calculando...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Calcular Restituição
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Resultado do Cálculo */}
        {resultado && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-700">Resultado do Cálculo</CardTitle>
              <CardDescription>Valores calculados com base nos dados informados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Proporção Tributável</p>
                  <p className="text-xl font-bold">{resultado.proporcao}</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Base de Cálculo</p>
                  <p className="text-xl font-bold">{formatCurrency(resultado.baseCalculo)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">IR Devido</p>
                  <p className="text-xl font-bold">{formatCurrency(resultado.irDevido)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-green-500">
                  <p className="text-sm text-green-600 font-medium">IRPF a Restituir</p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(resultado.irpfRestituir)}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-4">
                <Button
                  onClick={() => setLocation('/historico')}
                  variant="outline"
                >
                  Ver Histórico
                </Button>
                <Button
                  onClick={() => setLocation('/exportar')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Exportar Documentos
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
