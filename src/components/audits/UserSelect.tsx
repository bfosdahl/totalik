import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useCompanyUsers, type CompanyUser } from "@/hooks/useCompanyUsers";
import { Loader2 } from "lucide-react";

interface UserSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const UserSelect: React.FC<UserSelectProps> = ({
  value,
  onValueChange,
  placeholder = "Velg bruker",
  disabled = false,
  className,
}) => {
  const { users, isLoading, getUserDisplayName } = useCompanyUsers();
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState("");

  // Check if current value is a custom value (not in users list)
  useEffect(() => {
    if (value && users.length > 0) {
      const isExistingUser = users.some(user => getUserDisplayName(user) === value);
      if (!isExistingUser) {
        setShowCustomInput(true);
        setCustomValue(value);
      }
    }
  }, [value, users, getUserDisplayName]);

  if (isLoading) {
    return (
      <div className={`flex items-center h-9 px-3 border border-input rounded-md bg-background ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Laster...</span>
      </div>
    );
  }

  if (showCustomInput) {
    return (
      <div className="space-y-2">
        <Input
          value={customValue}
          onChange={(e) => {
            setCustomValue(e.target.value);
            onValueChange(e.target.value);
          }}
          placeholder="Skriv inn navn..."
          disabled={disabled}
          className={className}
        />
        <button
          type="button"
          onClick={() => {
            setShowCustomInput(false);
            setCustomValue("");
            onValueChange("");
          }}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Tilbake til ansatte
        </button>
      </div>
    );
  }

  return (
    <Select 
      value={value} 
      onValueChange={(val) => {
        if (val === "__custom__") {
          setShowCustomInput(true);
          setCustomValue("");
          onValueChange("");
        } else {
          onValueChange(val);
        }
      }} 
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {users.map((user) => (
          <SelectItem key={user.id} value={getUserDisplayName(user)}>
            {getUserDisplayName(user)}
          </SelectItem>
        ))}
        <SelectItem value="__custom__" className="text-primary font-medium">
          + Annen person (fritekst)
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

export default UserSelect;
