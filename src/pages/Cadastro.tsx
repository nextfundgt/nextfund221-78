import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { EmailInput } from "@/components/EmailInput";
import { PasswordInput } from "@/components/PasswordInput";
import { NameInput } from "@/components/NameInput";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Cadastro() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    affiliateCode: "",
  });
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signUp, loading } = useAuth();

  useEffect(() => {
    // Check for affiliate referral
    const ref = searchParams.get('ref');
    if (ref) {
      setFormData(prev => ({ ...prev, affiliateCode: ref }));
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.email || !formData.password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    if (formData.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    // Get affiliate code for referral (either from form or URL)
    const affiliateRef = formData.affiliateCode || searchParams.get('ref');
    
    const { error } = await signUp(formData.email, formData.password, formData.name, affiliateRef);
    
    if (error) {
      if (error.message.includes('User already registered')) {
        setError("Este email já está cadastrado.");
      } else if (error.message.includes('Password should be at least 6 characters')) {
        setError("A senha deve ter pelo menos 6 caracteres.");
      } else {
        setError(error.message || "Erro ao criar conta");
      }
    }
  };

  return (
    <AuthLayout
      title=""
      subtitle="Preencha para criar sua conta"
    >
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/60 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao início
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <NameInput
          id="name"
          name="name"
          placeholder="Seu nome completo"
          value={formData.name}
          onChange={handleInputChange}
          label="Nome completo"
          required
        />

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
          placeholder="Crie uma senha"
          value={formData.password}
          onChange={handleInputChange}
          label="Senha"
          autoComplete="new-password"
          required
        />

        <div className="space-y-2">
          <Label htmlFor="affiliateCode" className="text-sm font-medium text-white">
            Código de indicação (opcional)
          </Label>
          <Input
            id="affiliateCode"
            name="affiliateCode"
            type="text"
            placeholder="Digite o código se foi indicado"
            value={formData.affiliateCode}
            onChange={handleInputChange}
          />
          <p className="text-xs text-white/70">
            Se alguém te indicou, digite o código de afiliado aqui
          </p>
        </div>

        <Button
          type="submit"
          variant="nextfund"
          className="w-full py-3 text-base"
          disabled={loading}
        >
          {loading ? "CRIANDO CONTA..." : "CRIAR CONTA"}
        </Button>
      </form>

      <div className="text-center mt-6">
        <span className="text-white/70">Já tem uma conta? </span>
        <Link
          to="/login"
          className="text-primary hover:text-primary/80 transition-colors font-medium"
        >
          Fazer login
        </Link>
      </div>
    </AuthLayout>
  );
}