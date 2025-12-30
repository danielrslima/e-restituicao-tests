import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, CheckCircle, Clock, AlertCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Notificações de exemplo (em produção, viriam do backend)
const notificacoes = [
  {
    id: 1,
    tipo: "sucesso",
    titulo: "Cálculo realizado com sucesso",
    mensagem: "Seu cálculo de restituição foi processado. Valor estimado: R$ 5.432,10",
    data: new Date(Date.now() - 1000 * 60 * 30), // 30 min atrás
    lida: false,
  },
  {
    id: 2,
    tipo: "info",
    titulo: "Bem-vindo ao e-Restituição",
    mensagem: "Comece preenchendo seus dados fiscais para calcular sua restituição de IRPF.",
    data: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
    lida: true,
  },
  {
    id: 3,
    tipo: "aviso",
    titulo: "Prazo de declaração",
    mensagem: "Lembre-se: o prazo para declaração do IRPF 2025 termina em 31/05/2025.",
    data: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 dia atrás
    lida: true,
  },
];

export default function Notificacoes() {
  const getIcon = (tipo: string) => {
    switch (tipo) {
      case "sucesso":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "aviso":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "erro":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes} min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
  };

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
            <p className="text-muted-foreground mt-1">
              Acompanhe as atualizações do seu processo
            </p>
          </div>
          {naoLidas > 0 && (
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              {naoLidas} nova(s)
            </Badge>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-green-600" />
              Notificações Recentes
            </CardTitle>
            <CardDescription>
              Últimas atualizações sobre seus cálculos e processos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notificacoes.length > 0 ? (
              <div className="space-y-4">
                {notificacoes.map((notif) => (
                  <div
                    key={notif.id}
                    className={`flex gap-4 p-4 rounded-lg border transition-colors ${
                      notif.lida ? 'bg-white' : 'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getIcon(notif.tipo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-medium ${notif.lida ? '' : 'text-green-800'}`}>
                          {notif.titulo}
                        </p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(notif.data)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notif.mensagem}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-muted-foreground">Nenhuma notificação ainda</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configurações de Notificação */}
        <Card>
          <CardHeader>
            <CardTitle>Preferências de Notificação</CardTitle>
            <CardDescription>
              Configure como deseja receber atualizações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Notificações por E-mail</p>
                  <p className="text-sm text-muted-foreground">
                    Receba atualizações importantes no seu e-mail
                  </p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Ativo
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Alertas de Prazo</p>
                  <p className="text-sm text-muted-foreground">
                    Seja notificado sobre prazos importantes do IRPF
                  </p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Ativo
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Atualizações de Status</p>
                  <p className="text-sm text-muted-foreground">
                    Receba notificações quando o status do seu processo mudar
                  </p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Ativo
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
