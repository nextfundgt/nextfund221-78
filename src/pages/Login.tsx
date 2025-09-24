import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { EmailInput } from "@/components/EmailInput";
import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const { signIn, loading } = useAuth();

  useEffect(() => {
    // Check for affiliate referral
    const ref = searchParams.get('ref');
    if (ref) {
      localStorage.setItem('affiliate_ref', ref);
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRememberChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, remember: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    const { error } = await signIn(formData.email, formData.password);
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError("Email ou senha incorretos.");
      } else if (error.message.includes('Email not confirmed')) {
        setError("Por favor, confirme seu email antes de fazer login.");
      } else {
        setError(error.message || "Erro ao fazer login");
      }
    }
  };

  return (
    <AuthLayout
      title=""
      subtitle="Acesse sua conta para gerenciar suas tarefas"
    >
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <EmailInput
          id="email"
          name="email"
          placeholder="seu@email.com"
          value={formData.email}
          onChange={handleInputChange}
          label="Email"
          required
        />

        <PasswordInput
          id="password"
          name="password"
          placeholder="Sua senha"
          value={formData.password}
          onChange={handleInputChange}
          label="Senha"
          required
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={formData.remember}
              onCheckedChange={handleRememberChange}
            />
            <Label htmlFor="remember" className="text-sm text-white">
              Lembre-se
            </Label>
          </div>
          <Link
            to="/recuperar"
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Esqueceu a senha?
          </Link>
        </div>

        <Button
          type="submit"
          variant="nextfund"
          className="w-full py-3 text-base"
          disabled={loading}
        >
          {loading ? "ENTRANDO..." : "ENTRAR"}
        </Button>
      </form>

      <div className="text-center mt-6">
        <span className="text-white/70">Não tem uma conta? </span>
        <Link
          to="/cadastro"
          className="text-primary hover:text-primary/80 transition-colors font-medium"
        >
          Criar conta
        </Link>
      </div>
    </AuthLayout>
  );
}