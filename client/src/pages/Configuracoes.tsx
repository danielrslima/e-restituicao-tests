import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, User, Shield, Bell, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function Configuracoes() {
  const { user, logout } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas preferências e informações da conta
          </p>
        </div>

        {/* Perfil do Usuário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-600" />
              Perfil do Usuário
            </CardTitle>
            <CardDescription>
              Suas informações de conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-green-700">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="font-medium text-lg">{user?.name || 'Usuário'}</p>
                <p className="text-sm text-muted-foreground">{user?.email || '-'}</p>
                <Badge variant="outline" className="mt-1">
                  {user?.role === 'admin' ? 'Administrador' : 'Usuário'}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={user?.name || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input value={user?.email || ''} disabled />
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              As informações do perfil são gerenciadas pelo sistema de autenticação Manus OAuth.
            </p>
          </CardContent>
        </Card>

        {/* Segurança */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Segurança
            </CardTitle>
            <CardDescription>
              Configurações de segurança da sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Autenticação</p>
                <p className="text-sm text-muted-foreground">
                  Conectado via Manus OAuth
                </p>
              </div>
              <Badge className="bg-green-100 text-green-700">Ativo</Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Último acesso</p>
                <p className="text-sm text-muted-foreground">
                  {user?.lastSignedIn 
                    ? new Date(user.lastSignedIn).toLocaleString('pt-BR')
                    : 'Não disponível'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Sessão atual</p>
                <p className="text-sm text-muted-foreground">
                  Encerre sua sessão para sair do sistema
                </p>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={logout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-green-600" />
              Preferências de Notificação
            </CardTitle>
            <CardDescription>
              Configure como deseja receber atualizações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">E-mail de confirmação</p>
                <p className="text-sm text-muted-foreground">
                  Receber confirmação após cada cálculo realizado
                </p>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-600">
                Ativo
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Lembretes de prazo</p>
                <p className="text-sm text-muted-foreground">
                  Receber lembretes sobre prazos importantes do IRPF
                </p>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-600">
                Ativo
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Novidades do sistema</p>
                <p className="text-sm text-muted-foreground">
                  Receber informações sobre novas funcionalidades
                </p>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-600">
                Ativo
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Sobre o Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-green-600" />
              Sobre o Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sistema</span>
                <span className="font-medium">e-Restituição IRPF</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Versão</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ambiente</span>
                <span className="font-medium">Produção</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
