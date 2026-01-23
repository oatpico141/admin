import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import Contacts from "./pages/Contacts";
import Reports from "./pages/Reports";
import Performance from "./pages/Performance";
import AdminStaff from "./pages/AdminStaff";
import ImportData from "./pages/ImportData";
import ExportData from "./pages/ExportData";
import CommissionSettings from "./pages/CommissionSettings";
import UserManagement from "./pages/UserManagement";
import Procedures from "./pages/Procedures";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/contacts" component={Contacts} />
        <Route path="/reports" component={Reports} />
        <Route path="/performance" component={Performance} />
        <Route path="/admin-staff" component={AdminStaff} />
        <Route path="/import" component={ImportData} />
        <Route path="/export" component={ExportData} />
        <Route path="/commission" component={CommissionSettings} />
        <Route path="/procedures" component={Procedures} />
        <Route path="/users" component={UserManagement} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
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
