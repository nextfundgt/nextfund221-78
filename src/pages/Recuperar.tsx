import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { EmailInput } from "@/components/EmailInput";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Recuperar() {
  const [formData, setFormData] = useState({
    email: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { resetPassword, loading } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (!formData.email) {
        throw new Error("Por favor, insira seu email.");
      }

      const { error } = await resetPassword(formData.email);
      
      if (error) {
        throw error;
      }
      
      setSuccess("Um link de recuperação foi enviado para o seu email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar solicitação");
    }
  };

  return (
    <AuthLayout
      title=""
      subtitle="Recupere sua senha"
    >
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-success bg-success/10">
          <CheckCircle className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">
            {success}{" "}
            <Link to="/login" className="underline hover:no-underline">
              Voltar ao login
            </Link>
          </AlertDescription>
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

        <div className="text-center">
          <Link
            to="/login"
            className="text-sm text-accent hover:text-accent/80 transition-colors"
          >
            Voltar ao login
          </Link>
        </div>

        <Button
          type="submit"
          variant="nextfund"
          className="w-full py-3 text-base"
          disabled={loading}
        >
          {loading ? "ENVIANDO..." : "ENVIAR"}
        </Button>
      </form>
    </AuthLayout>
  );
}