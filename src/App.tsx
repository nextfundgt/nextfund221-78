import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthGuard } from "@/components/AuthGuard";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Recuperar from "./pages/Recuperar";
import Dashboard from "./pages/Dashboard";
import Wallet from "./pages/Wallet";
import Affiliate from "./pages/Affiliate";
import Profile from "./pages/Profile";
import Support from "./pages/Support";
import Admin from "./pages/Admin";
import Tasks from "./pages/Tasks";
import Team from "./pages/Team";
import Level from "./pages/Level";
import Watch from "./pages/Watch";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Navigate to="/inicio" replace />} />
          <Route path="/inicio" element={<Index />} />
          <Route 
            path="/login" 
            element={
              <AuthGuard requireAuth={false}>
                <Login />
              </AuthGuard>
            } 
          />
          <Route 
            path="/cadastro" 
            element={
              <AuthGuard requireAuth={false}>
                <Cadastro />
              </AuthGuard>
            } 
          />
          <Route 
            path="/recuperar" 
            element={
              <AuthGuard requireAuth={false}>
                <Recuperar />
              </AuthGuard>
            } 
          />
          <Route 
            path="/home" 
            element={
              <AuthGuard requireAuth={true}>
                <Dashboard />
              </AuthGuard>
            } 
          />
          <Route
            path="/wallet" 
            element={
              <AuthGuard requireAuth={true}>
                <Wallet />
              </AuthGuard>
            } 
          />
          <Route 
            path="/tasks" 
            element={
              <AuthGuard requireAuth={true}>
                <Tasks />
              </AuthGuard>
            } 
          />
          <Route 
            path="/team" 
            element={
              <AuthGuard requireAuth={true}>
                <Team />
              </AuthGuard>
            } 
          />
          <Route 
            path="/level" 
            element={
              <AuthGuard requireAuth={true}>
                <Level />
              </AuthGuard>
            } 
          />
          <Route 
            path="/support"
            element={
              <AuthGuard requireAuth={true}>
                <Support />
              </AuthGuard>
            }
          />
          <Route 
            path="/profile" 
            element={
              <AuthGuard requireAuth={true}>
                <Profile />
              </AuthGuard>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <AuthGuard requireAuth={true} requireAdmin={true}>
                <Admin />
              </AuthGuard>
            } 
          />
          <Route 
            path="/watch/:taskId" 
            element={
              <AuthGuard requireAuth={true}>
                <Watch />
              </AuthGuard>
            } 
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
