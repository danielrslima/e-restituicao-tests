import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import NovoCalculo from "./pages/NovoCalculo";
import Historico from "./pages/Historico";
import Exportar from "./pages/Exportar";
import Notificacoes from "./pages/Notificacoes";
import Configuracoes from "./pages/Configuracoes";
import Usuarios from "./pages/Usuarios";
import ImprimirRelatorio from "./pages/ImprimirRelatorio";
import Login from "./pages/Login";
import { TestarMotor } from "./pages/TestarMotor";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={Home} />
      <Route path="/novo-calculo" component={NovoCalculo} />
      <Route path="/historico" component={Historico} />
      <Route path="/exportar" component={Exportar} />
      <Route path="/notificacoes" component={Notificacoes} />
      <Route path="/configuracoes" component={Configuracoes} />
      <Route path="/usuarios" component={Usuarios} />
      <Route path="/imprimir/:id" component={ImprimirRelatorio} />
      <Route path="/testar-motor" component={TestarMotor} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
