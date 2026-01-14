import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import {
  formatProcesso,
  formatData,
  formatValor,
  formatAno,
  formatCPF,
  formatCNPJ,
  isDataValida,
  isAnoValido,
  parseValor,
  formatCurrency,
  formatNome,
  formatComarca,
  formatFontePagadora,
  formatVara,
  formatMeses,
  isMesesValido,
} from "@/lib/formatters";
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Calculator, User, FileText, DollarSign, Loader2, Trash2, Plus } from "lucide-react";

interface Alvara {
  id: string;
  valor: string;
  data: string;
}

interface Darf {
  id: string;
  valor: string;
  data: string;
}

interface Honorario {
  id: string;
  valor: string;
  ano: string;
}

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
    // Valores principais
    brutoHomologado: "",
    tributavelHomologado: "",
    numeroMeses: "",
  });

  const [alvaras, setAlvaras] = useState<Alvara[]>([
    { id: "1", valor: "", data: "" },
  ]);

  const [darfs, setDarfs] = useState<Darf[]>([
    { id: "1", valor: "", data: "" },
  ]);

  const [honorarios, setHonorarios] = useState<Honorario[]>([
    { id: "1", valor: "", ano: new Date().getFullYear().toString() },
  ]);

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

  // Refs para navegação TAB entre campos
  const alvaraValueRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const alvaraDataRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const darfValueRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const darfDataRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const honorarioValueRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const honorarioAnoRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

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

  const handleAlvaraChange = (id: string, field: "valor" | "data", value: string) => {
    setAlvaras(prev => prev.map(a => 
      a.id === id 
        ? { 
            ...a, 
            [field]: field === "valor" ? formatValor(value) : formatData(value)
          }
        : a
    ));
  };

  const handleDarfChange = (id: string, field: "valor" | "data", value: string) => {
    setDarfs(prev => prev.map(d => 
      d.id === id 
        ? { 
            ...d, 
            [field]: field === "valor" ? formatValor(value) : formatData(value)
          }
        : d
    ));
  };

  const handleHonorarioChange = (id: string, field: "valor" | "ano", value: string) => {
    setHonorarios(prev => prev.map(h => 
      h.id === id 
        ? { 
            ...h, 
            [field]: field === "valor" ? formatValor(value) : formatAno(value)
          }
        : h
    ));
  };

  const handleTabKey = (e: React.KeyboardEvent, type: "alvara" | "darf" | "honorario", id: string, isLastField: boolean) => {
    if (e.key === "Tab" && !e.shiftKey && isLastField) {
      e.preventDefault();
      
      // Obter lista de items e encontrar índice atual
      const items = type === "alvara" ? alvaras : type === "darf" ? darfs : honorarios;
      const currentIndex = items.findIndex(item => item.id === id);
      const isLastRow = currentIndex === items.length - 1;
      
      if (isLastRow) {
        // É a última linha: criar nova linha e focar no Valor dela
        const newId = Date.now().toString();
        if (type === "alvara") {
          setAlvaras(prev => [...prev, { id: newId, valor: "", data: "" }]);
          // Usar setTimeout para garantir que o novo input foi renderizado
          setTimeout(() => {
            alvaraValueRefs.current[newId]?.focus();
          }, 0);
        } else if (type === "darf") {
          setDarfs(prev => [...prev, { id: newId, valor: "", data: "" }]);
          setTimeout(() => {
            darfValueRefs.current[newId]?.focus();
          }, 0);
        } else {
          setHonorarios(prev => [...prev, { id: newId, valor: "", ano: new Date().getFullYear().toString() }]);
          setTimeout(() => {
            honorarioValueRefs.current[newId]?.focus();
          }, 0);
        }
      } else {
        // NÃO é a última linha: focar no Valor da próxima linha
        const nextId = items[currentIndex + 1].id;
        if (type === "alvara") {
          alvaraValueRefs.current[nextId]?.focus();
        } else if (type === "darf") {
          darfValueRefs.current[nextId]?.focus();
        } else {
          honorarioValueRefs.current[nextId]?.focus();
        }
      }
    }
  };

  const addAlvara = () => {
    const newId = Date.now().toString();
    setAlvaras(prev => [...prev, { id: newId, valor: "", data: "" }]);
  };

  const removeAlvara = (id: string) => {
    if (alvaras.length > 1) {
      setAlvaras(prev => prev.filter(a => a.id !== id));
    }
  };

  const addDarf = () => {
    const newId = Date.now().toString();
    setDarfs(prev => [...prev, { id: newId, valor: "", data: "" }]);
  };

  const removeDarf = (id: string) => {
    if (darfs.length > 1) {
      setDarfs(prev => prev.filter(d => d.id !== id));
    }
  };

  const addHonorario = () => {
    const newId = Date.now().toString();
    setHonorarios(prev => [...prev, { id: newId, valor: "", ano: new Date().getFullYear().toString() }]);
  };

  const removeHonorario = (id: string) => {
    if (honorarios.length > 1) {
      setHonorarios(prev => prev.filter(h => h.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validações básicas
    if (!formData.nomeCliente || !formData.cpf || !formData.email) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Validar datas
    for (const alvara of alvaras) {
      if (alvara.valor && !isDataValida(alvara.data)) {
        toast.error("Data do alvará inválida. Use DD/MM/YYYY");
        return;
      }
    }

    for (const darf of darfs) {
      if (darf.valor && !isDataValida(darf.data)) {
        toast.error("Data do DARF inválida. Use DD/MM/YYYY");
        return;
      }
    }

    for (const honorario of honorarios) {
      if (honorario.valor && !isAnoValido(honorario.ano)) {
        toast.error("Ano do honorário inválido. Use YYYY (4 dígitos)");
        return;
      }
    }

    // Usar apenas o primeiro alvará, DARF e honorário por enquanto
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
      brutoHomologado: parseValor(formData.brutoHomologado),
      tributavelHomologado: parseValor(formData.tributavelHomologado),
      numeroMeses: parseInt(formData.numeroMeses) || 1,
      alvaraValor: parseValor(alvaras[0]?.valor || ""),
      alvaraData: alvaras[0]?.data || "",
      darfValor: parseValor(darfs[0]?.valor || ""),
      darfData: darfs[0]?.data || "",
      honorariosValor: parseValor(honorarios[0]?.valor || ""),
      honorariosAno: honorarios[0]?.ano || "",
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
            <CardContent className="grid gap-4 md:grid-cols-3">
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
              <div className="space-y-2 md:col-span-2">
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
              <div className="space-y-2">
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
                  onChange={(e) => setFormData(prev => ({ ...prev, numeroProcesso: formatProcesso(e.target.value) }))}
                  placeholder="0000000-00.0000.0.00.0000"
                  maxLength={27}
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

          {/* Valores Principais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Valores Principais
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
                  onChange={(e) => setFormData(prev => ({ ...prev, brutoHomologado: formatValor(e.target.value) }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, tributavelHomologado: formatValor(e.target.value) }))}
                  placeholder="0,00"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="numeroMeses">Número de Meses (RRA) *</Label>
                <Input
                  id="numeroMeses"
                  name="numeroMeses"
                  type="number"
                  value={formData.numeroMeses}
                  onChange={handleChange}
                  placeholder="Ex: 24"
                  min="1"
                  max="120"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Alvarás */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Alvarás</CardTitle>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addAlvara}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {alvaras.map((alvara, index) => (
                <div key={alvara.id} className="flex gap-3 items-end">
                  <div className="flex-1 space-y-2">
                    <Label>Valor (R$)</Label>
                    <Input
                      ref={(el) => { if (el) alvaraValueRefs.current[alvara.id] = el; }}
                      value={alvara.valor}
                      onChange={(e) => handleAlvaraChange(alvara.id, "valor", e.target.value)}
                      onKeyDown={(e) => handleTabKey(e, "alvara", alvara.id, false)}
                      placeholder="0,00"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>Data</Label>
                    <Input
                      ref={(el) => { if (el) alvaraDataRefs.current[alvara.id] = el; }}
                      value={alvara.data}
                      onChange={(e) => handleAlvaraChange(alvara.id, "data", e.target.value)}
                      onKeyDown={(e) => handleTabKey(e, "alvara", alvara.id, true)}
                      placeholder="DD/MM/YYYY"
                      maxLength={10}
                    />
                  </div>
                  {alvaras.length > 1 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeAlvara(alvara.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* DARFs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>DARFs / IR Retido</CardTitle>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addDarf}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {darfs.map((darf, index) => (
                <div key={darf.id} className="flex gap-3 items-end">
                  <div className="flex-1 space-y-2">
                    <Label>Valor (R$)</Label>
                    <Input
                      ref={(el) => { if (el) darfValueRefs.current[darf.id] = el; }}
                      value={darf.valor}
                      onChange={(e) => handleDarfChange(darf.id, "valor", e.target.value)}
                      onKeyDown={(e) => handleTabKey(e, "darf", darf.id, false)}
                      placeholder="0,00"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>Data</Label>
                    <Input
                      ref={(el) => { if (el) darfDataRefs.current[darf.id] = el; }}
                      value={darf.data}
                      onChange={(e) => handleDarfChange(darf.id, "data", e.target.value)}
                      onKeyDown={(e) => handleTabKey(e, "darf", darf.id, true)}
                      placeholder="DD/MM/YYYY"
                      maxLength={10}
                    />
                  </div>
                  {darfs.length > 1 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeDarf(darf.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Honorários */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Honorários Advocatícios</CardTitle>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addHonorario}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {honorarios.map((honorario, index) => (
                <div key={honorario.id} className="flex gap-3 items-end">
                  <div className="flex-1 space-y-2">
                    <Label>Valor (R$)</Label>
                    <Input
                      ref={(el) => { if (el) honorarioValueRefs.current[honorario.id] = el; }}
                      value={honorario.valor}
                      onChange={(e) => handleHonorarioChange(honorario.id, "valor", e.target.value)}
                      onKeyDown={(e) => handleTabKey(e, "honorario", honorario.id, false)}
                      placeholder="0,00"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>Ano Pago</Label>
                    <Input
                      ref={(el) => { if (el) honorarioAnoRefs.current[honorario.id] = el; }}
                      value={honorario.ano}
                      onChange={(e) => handleHonorarioChange(honorario.id, "ano", e.target.value)}
                      onKeyDown={(e) => handleTabKey(e, "honorario", honorario.id, true)}
                      placeholder="YYYY"
                      maxLength={4}
                    />
                  </div>
                  {honorarios.length > 1 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeHonorario(honorario.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Resultado */}
          {resultado && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-700">Resultado do Cálculo</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-600">Proporção Tributável</p>
                  <p className="text-2xl font-bold text-green-700">{resultado.proporcao}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Base de Cálculo</p>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(resultado.baseCalculo)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">IR Mensal</p>
                  <p className="text-2xl font-bold text-green-700">{resultado.irMensal}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">IR Devido</p>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(resultado.irDevido)}</p>
                </div>
                <div className="md:col-span-2 border-t pt-4">
                  <p className="text-sm text-gray-600">IRPF a Restituir</p>
                  <p className="text-3xl font-bold text-green-700">{formatCurrency(resultado.irpfRestituir)}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/dashboard")}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="gap-2 bg-green-600 hover:bg-green-700"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {createMutation.isPending ? "Calculando..." : "Calcular Restituição"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
