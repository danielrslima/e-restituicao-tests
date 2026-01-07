import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function TestarMotor() {
  const [testCase, setTestCase] = useState<'jose' | 'ana'>('jose');
  const [resultado, setResultado] = useState<any>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Dados de teste - José Ramos (mesmo ano 2020)
  const dadosJose = {
    brutoHomologado: 2533329.85,
    tributavelHomologado: 985587.96,
    numeroMeses: 58,
    linhas: [
      {
        valorAlvara: 2315218.05,
        dataAlvara: '2020-12-24',
        valorHonorario: 694572.02,
        anoPagoHonorario: 2020,
      },
    ],
    darfs: [
      {
        valor: 220597.31,
        data: '2020-12-24',
      },
    ],
  };

  // Dados de teste - Ana Carmen (múltiplos anos 2021, 2022, 2024)
  const dadosAna = {
    brutoHomologado: 3500000,
    tributavelHomologado: 1400000,
    numeroMeses: 84,
    linhas: [
      {
        valorAlvara: 1200000,
        dataAlvara: '2021-06-15',
        valorHonorario: 150000,
        anoPagoHonorario: 2021,
      },
      {
        valorAlvara: 1100000,
        dataAlvara: '2022-08-20',
        valorHonorario: 140000,
        anoPagoHonorario: 2022,
      },
      {
        valorAlvara: 900000,
        dataAlvara: '2024-03-10',
        valorHonorario: 120000,
        anoPagoHonorario: 2024,
      },
    ],
    darfs: [
      {
        valor: 100000,
        data: '2021-06-15',
      },
      {
        valor: 95000,
        data: '2022-08-20',
      },
      {
        valor: 85000,
        data: '2024-03-10',
      },
    ],
  };

  const dados = testCase === 'jose' ? dadosJose : dadosAna;

  const testarMotor = async () => {
    try {
      setCarregando(true);
      setErro(null);
      setResultado(null);

      // Usar useMutation para chamar o endpoint
      const response = await fetch('/api/trpc/calcular.motor?input=' + encodeURIComponent(JSON.stringify(dados)))
        .then(r => r.json())
        .then(r => r.result.data);
      setResultado(response);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Testar Motor de Cálculo IRPF</CardTitle>
            <CardDescription>
              Teste o motor com casos validados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={testCase} onValueChange={(v) => setTestCase(v as 'jose' | 'ana')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="jose">José Ramos (Mesmo Ano)</TabsTrigger>
                <TabsTrigger value="ana">Ana Carmen (Múltiplos Anos)</TabsTrigger>
              </TabsList>

              <TabsContent value="jose" className="space-y-4 mt-4">
                <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Caso: José Ramos</p>
                  <p className="text-xs text-slate-600">Bruto Homologado: R$ 2.533.329,85</p>
                  <p className="text-xs text-slate-600">Tributável Homologado: R$ 985.587,96</p>
                  <p className="text-xs text-slate-600">Alvará: R$ 2.315.218,05 em 24/12/2020</p>
                  <p className="text-xs text-slate-600">DARF: R$ 220.597,31 em 24/12/2020</p>
                  <p className="text-xs text-slate-600">Meses: 58</p>
                  <p className="text-xs font-medium text-green-600 mt-2">Resultado esperado: R$ 74.028,67</p>
                </div>
              </TabsContent>

              <TabsContent value="ana" className="space-y-4 mt-4">
                <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Caso: Ana Carmen</p>
                  <p className="text-xs text-slate-600">Bruto Homologado: R$ 3.500.000,00</p>
                  <p className="text-xs text-slate-600">Tributável Homologado: R$ 1.400.000,00</p>
                  <p className="text-xs text-slate-600">Alvarás: 3 exercícios (2021, 2022, 2024)</p>
                  <p className="text-xs text-slate-600">DARFs: 3 exercícios (2021, 2022, 2024)</p>
                  <p className="text-xs text-slate-600">Meses: 84</p>
                  <p className="text-xs font-medium text-green-600 mt-2">Resultado esperado: R$ 27.515,36</p>
                </div>
              </TabsContent>
            </Tabs>

            <Button onClick={testarMotor} disabled={carregando} className="w-full mt-6">
              {carregando ? 'Calculando...' : 'Executar Cálculo'}
            </Button>
          </CardContent>
        </Card>

        {erro && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">Erro</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-800">{erro}</p>
            </CardContent>
          </Card>
        )}

        {resultado && (
          <Card>
            <CardHeader>
              <CardTitle>Resultado do Cálculo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-slate-600">Total IRPF</p>
                <p className="text-2xl font-bold text-green-700">
                  R$ {(resultado.totalIrpf / 100).toFixed(2)}
                </p>
                <p className="text-sm text-slate-600 mt-1">{resultado.descricaoTotal}</p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Detalhes por Exercício:</h3>
                {resultado.exercicios.map((ex: any, idx: number) => (
                  <div key={idx} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Exercício {ex.exercicio}</p>
                        <p className="text-sm text-slate-600">{ex.descricao}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">R$ {(ex.irpf / 100).toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 pt-2 border-t">
                      <div>
                        <p>Rendimentos Tributáveis</p>
                        <p className="font-medium text-slate-900">R$ {(ex.rendimentosTributaveis / 100).toFixed(2)}</p>
                      </div>
                      <div>
                        <p>IRRF</p>
                        <p className="font-medium text-slate-900">R$ {(ex.irrf / 100).toFixed(2)}</p>
                      </div>
                      <div>
                        <p>Meses</p>
                        <p className="font-medium text-slate-900">{ex.numeroMeses.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Proporção Tributável:</span>
                  <span className="font-medium">{(resultado.proporcaoTributavel * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Alvarás (deflacionados):</span>
                  <span className="font-medium">R$ {(resultado.totalAlvarasDeflacionados / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total DARF (original):</span>
                  <span className="font-medium">R$ {(resultado.totalDarfOriginal / 100).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
