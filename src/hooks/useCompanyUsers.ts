import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CompanyUser {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

export function useCompanyUsers() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!profile?.company_id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, user_id, first_name, last_name, email")
          .eq("company_id", profile.company_id)
          .eq("is_active", true);

        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error("Error fetching company users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [profile?.company_id]);

  const getUserDisplayName = (user: CompanyUser) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ""} ${user.last_name || ""}`.trim();
    }
    return user.email || "Ukjent bruker";
  };

  return { users, isLoading, getUserDisplayName };
}
