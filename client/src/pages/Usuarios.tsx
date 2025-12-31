import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { Search, Loader2, Shield, User, Trash2, AlertTriangle, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useLocation } from "wouter";

interface UserData {
  id: number;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
  canEdit: "yes" | "no";
  createdAt: Date;
}

export default function Usuarios() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isAdmin = user?.role === 'admin';
  
  const [search, setSearch] = useState("");
  const [deletingUser, setDeletingUser] = useState<number | null>(null);

  const utils = trpc.useUtils();

  // Query para listar usuários
  const { data: users, isLoading } = trpc.users.list.useQuery(
    { search: search || undefined },
    { enabled: isAdmin }
  );

  // Mutation para atualizar role do usuário
  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Permissão do usuário atualizada!");
      utils.users.list.invalidate();
    },
    onError: (error: { message: string }) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  // Mutation para atualizar permissão de edição
  const updateCanEditMutation = trpc.users.updateCanEdit.useMutation({
    onSuccess: () => {
      toast.success("Permissão de edição atualizada!");
      utils.users.list.invalidate();
    },
    onError: (error: { message: string }) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  // Mutation para deletar usuário
  const deleteMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      toast.success("Usuário removido com sucesso!");
      setDeletingUser(null);
      utils.users.list.invalidate();
    },
    onError: (error: { message: string }) => {
      toast.error("Erro ao remover: " + error.message);
    },
  });

  const handleUpdateRole = (userId: number, newRole: "admin" | "user") => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const handleUpdateCanEdit = (userId: number, canEdit: boolean) => {
    updateCanEditMutation.mutate({ userId, canEdit: canEdit ? "yes" : "no" });
  };

  const handleDelete = () => {
    if (!deletingUser) return;
    deleteMutation.mutate({ userId: deletingUser });
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return (
        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
          <Shield className="h-3 w-3 mr-1" />
          Admin
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <User className="h-3 w-3 mr-1" />
        Usuário
      </Badge>
    );
  };

  const getCanEditBadge = (canEdit: string, role: string) => {
    // Admin sempre pode editar
    if (role === 'admin') {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          <Check className="h-3 w-3 mr-1" />
          Sim (Admin)
        </Badge>
      );
    }
    if (canEdit === 'yes') {
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
          <Pencil className="h-3 w-3 mr-1" />
          Sim
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-gray-500">
        <X className="h-3 w-3 mr-1" />
        Não
      </Badge>
    );
  };

  // Redirecionar se não for admin
  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Acesso Restrito
              </CardTitle>
              <CardDescription>
                Você não tem permissão para acessar esta página.
                Apenas administradores podem gerenciar usuários.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setLocation("/")} className="w-full">
                Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Usuários</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os usuários e suas permissões no sistema
            </p>
          </div>
          <div className="flex gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Usuários Cadastrados</CardTitle>
            <CardDescription>
              {users?.length || 0} usuário(s) no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </div>
            ) : users && users.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Pode Editar</TableHead>
                      <TableHead>Cadastrado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(users as UserData[]).map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name || '-'}</TableCell>
                        <TableCell>{u.email || '-'}</TableCell>
                        <TableCell>{getRoleBadge(u.role)}</TableCell>
                        <TableCell>{getCanEditBadge(u.canEdit, u.role)}</TableCell>
                        <TableCell>{formatDate(u.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-3">
                            {/* Seletor de Role */}
                            <Select
                              value={u.role}
                              onValueChange={(value: "admin" | "user") => handleUpdateRole(u.id, value)}
                              disabled={u.id === user?.id}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">Usuário</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            {/* Toggle de Pode Editar (só para não-admins) */}
                            {u.role !== 'admin' && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Editar:</span>
                                <Switch
                                  checked={u.canEdit === 'yes'}
                                  onCheckedChange={(checked) => handleUpdateCanEdit(u.id, checked)}
                                  disabled={u.id === user?.id}
                                />
                              </div>
                            )}
                            
                            {/* Botão de Excluir */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingUser(u.id)}
                              disabled={u.id === user?.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title={u.id === user?.id ? "Você não pode remover a si mesmo" : "Remover usuário"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <User className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-muted-foreground">
                  {search ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações sobre permissões */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sobre as Permissões</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 mt-0.5">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
              <div>
                <p className="text-sm text-muted-foreground">
                  Pode visualizar todos os cálculos, <strong>editar</strong>, <strong>excluir</strong> registros e gerenciar usuários.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="mt-0.5">
                <User className="h-3 w-3 mr-1" />
                Usuário
              </Badge>
              <div>
                <p className="text-sm text-muted-foreground">
                  Pode visualizar apenas seus próprios cálculos. <strong>Não pode excluir</strong> registros nem gerenciar usuários.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 mt-0.5">
                <Pencil className="h-3 w-3 mr-1" />
                Pode Editar
              </Badge>
              <div>
                <p className="text-sm text-muted-foreground">
                  Usuários com esta permissão podem <strong>editar</strong> cálculos, mas <strong>nunca excluir</strong>. Apenas admins podem excluir.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modal de Confirmação de Exclusão */}
        <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Confirmar Remoção
              </AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita.
                O usuário perderá acesso ao sistema.
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
                    Removendo...
                  </>
                ) : (
                  "Remover"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
