import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { FileText, Calculator, TrendingUp, Clock, Plus, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: forms, isLoading: formsLoading } = trpc.irpf.list.useQuery({});
  const { data: stats, isLoading: statsLoading } = trpc.irpf.statistics.useQuery(undefined, {
    enabled: user?.role === 'admin',
  });

  const isAdmin = user?.role === 'admin';

  // Calcular estatísticas do usuário
  const userStats = {
    totalCalculos: forms?.length || 0,
    calculosPendentes: forms?.filter(f => f.statusPagamento === 'pendente').length || 0,
    totalRestituicao: forms?.reduce((acc, f) => acc + (f.irpfRestituir > 0 ? f.irpfRestituir : 0), 0) || 0,
    ultimoCalculo: forms?.[0]?.createdAt,
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Olá, {user?.name?.split(' ')[0] || 'Usuário'}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Bem-vindo ao sistema de cálculo de restituição de IRPF
            </p>
          </div>
          <Button 
            onClick={() => setLocation('/novo-calculo')}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Cálculo
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Cálculos</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formsLoading ? '...' : (isAdmin ? stats?.totalForms : userStats.totalCalculos)}
              </div>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? 'em todo o sistema' : 'seus cálculos'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formsLoading ? '...' : (isAdmin ? stats?.formsPendentes : userStats.calculosPendentes)}
              </div>
              <p className="text-xs text-muted-foreground">
                aguardando pagamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total a Restituir</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formsLoading ? '...' : formatCurrency(isAdmin ? (stats?.totalRestituicao || 0) : userStats.totalRestituicao)}
              </div>
              <p className="text-xs text-muted-foreground">
                valor estimado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Último Cálculo</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formsLoading ? '...' : formatDate(userStats.ultimoCalculo)}
              </div>
              <p className="text-xs text-muted-foreground">
                data do último registro
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Cálculos Recentes</CardTitle>
              <CardDescription>
                Seus últimos cálculos de restituição
              </CardDescription>
            </CardHeader>
            <CardContent>
              {formsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : forms && forms.length > 0 ? (
                <div className="space-y-3">
                  {forms.slice(0, 5).map(form => (
                    <div 
                      key={form.id} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => setLocation(`/historico?id=${form.id}`)}
                    >
                      <div>
                        <p className="font-medium text-sm">{form.nomeCliente}</p>
                        <p className="text-xs text-muted-foreground">
                          Processo: {form.numeroProcesso}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm text-green-600">
                          {formatCurrency(form.irpfRestituir)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(form.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-muted-foreground">Nenhum cálculo realizado ainda</p>
                  <Button 
                    variant="link" 
                    onClick={() => setLocation('/novo-calculo')}
                    className="mt-2 text-green-600"
                  >
                    Fazer primeiro cálculo
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Como Funciona</CardTitle>
              <CardDescription>
                Passos para calcular sua restituição
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-semibold text-sm">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-sm">Preencha os dados</p>
                    <p className="text-xs text-muted-foreground">
                      Informe seus dados pessoais e processuais
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-semibold text-sm">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-sm">Cálculo automático</p>
                    <p className="text-xs text-muted-foreground">
                      O sistema calcula sua restituição com base na tabela SELIC
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-semibold text-sm">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-sm">Gere o Kit IR</p>
                    <p className="text-xs text-muted-foreground">
                      Exporte os documentos para protocolar na Receita Federal
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-semibold text-sm">
                    4
                  </div>
                  <div>
                    <p className="font-medium text-sm">Receba sua restituição</p>
                    <p className="text-xs text-muted-foreground">
                      Acompanhe o status e receba o valor devido
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
