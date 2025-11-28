import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  if (isLoading) {
    return (
      <div className={`flex items-center h-9 px-3 border border-input rounded-md bg-background ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Laster...</span>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {users.map((user) => (
          <SelectItem key={user.id} value={getUserDisplayName(user)}>
            {getUserDisplayName(user)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default UserSelect;
