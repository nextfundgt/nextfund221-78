import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface PasswordInputProps {
  id: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  autoComplete?: string;
  required?: boolean;
}

export const PasswordInput = ({
  id,
  name,
  placeholder,
  value,
  onChange,
  label,
  autoComplete = "current-password",
  required = false,
}: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-white">
        {label}
      </Label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <Lock className="h-4 w-4 text-white/70" />
        </div>
        <Input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required={required}
          className="pl-10 pr-12 bg-input/50 border-border focus:border-primary transition-colors"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-primary transition-colors"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
};