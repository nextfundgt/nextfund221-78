import { Mail } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface EmailInputProps {
  id: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  required?: boolean;
}

export const EmailInput = ({
  id,
  name,
  placeholder,
  value,
  onChange,
  label,
  required = false,
}: EmailInputProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-white">
        {label}
      </Label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <Mail className="h-4 w-4 text-white/70" />
        </div>
        <Input
          id={id}
          name={name}
          type="email"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete="email"
          required={required}
          className="pl-10 bg-input/50 border-border focus:border-primary transition-colors"
        />
      </div>
    </div>
  );
};