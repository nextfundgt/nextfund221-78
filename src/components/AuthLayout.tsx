import { ReactNode } from "react";
import nextfundLogo from "@/assets/nextfund-logo-new.png";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="bg-black font-sans antialiased text-white overflow-x-hidden min-h-screen flex items-center justify-center p-4 relative" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.05),transparent_50%)]"></div>
      </div>

      <div className="glass-card w-full max-w-md p-8 rounded-xl animate-float">
        <div className="text-center mb-8">
          <img 
            src={nextfundLogo} 
            alt="NextFund Logo" 
            className="h-50 mx-auto -mb-18 animate-pulse-glow"
          />
          <p className="text-white/70 font-['Roboto']">{subtitle}</p>
        </div>
        {children}
        <footer className="text-center mt-8">
          <p className="text-xs text-white/60">
            © 2025 Todos os direitos reservados.
          </p>
        </footer>
      </div>
    </div>
  );
};