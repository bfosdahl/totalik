import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Department {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserDepartment {
  id: string;
  user_id: string;
  department_id: string;
  is_department_admin: boolean;
  created_at: string;
  department?: Department;
}

export function useDepartments(companyId?: string) {
  const { profile, company } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const targetCompanyId = companyId || company?.id;

  const fetchDepartments = useCallback(async () => {
    if (!targetCompanyId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("company_departments")
        .select("*")
        .eq("company_id", targetCompanyId)
        .order("name");

      if (error) throw error;
      setDepartments((data as Department[]) || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [targetCompanyId]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const createDepartment = async (
    data: Omit<Department, "id" | "created_at" | "updated_at" | "company_id">
  ) => {
    if (!targetCompanyId) return null;

    try {
      const { data: newDept, error } = await supabase
        .from("company_departments")
        .insert({
          ...data,
          company_id: targetCompanyId,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success("Avdeling opprettet");
      await fetchDepartments();
      return newDept as Department;
    } catch (error) {
      console.error("Error creating department:", error);
      toast.error("Kunne ikke opprette avdeling");
      return null;
    }
  };

  const updateDepartment = async (id: string, data: Partial<Department>) => {
    try {
      const { error } = await supabase
        .from("company_departments")
        .update(data)
        .eq("id", id);

      if (error) throw error;
      toast.success("Avdeling oppdatert");
      await fetchDepartments();
      return true;
    } catch (error) {
      console.error("Error updating department:", error);
      toast.error("Kunne ikke oppdatere avdeling");
      return false;
    }
  };

  const deleteDepartment = async (id: string) => {
    try {
      const { error } = await supabase
        .from("company_departments")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Avdeling slettet");
      await fetchDepartments();
      return true;
    } catch (error) {
      console.error("Error deleting department:", error);
      toast.error("Kunne ikke slette avdeling");
      return false;
    }
  };

  return {
    departments,
    isLoading,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    refetch: fetchDepartments,
  };
}

export function useUserDepartments(userId?: string) {
  const [userDepartments, setUserDepartments] = useState<UserDepartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserDepartments = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_departments")
        .select(`
          *,
          department:company_departments(*)
        `)
        .eq("user_id", userId);

      if (error) throw error;
      setUserDepartments((data as unknown as UserDepartment[]) || []);
    } catch (error) {
      console.error("Error fetching user departments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserDepartments();
  }, [fetchUserDepartments]);

  const assignUserToDepartment = async (
    userId: string,
    departmentId: string,
    isDepartmentAdmin = false
  ) => {
    try {
      const { error } = await supabase.from("user_departments").insert({
        user_id: userId,
        department_id: departmentId,
        is_department_admin: isDepartmentAdmin,
      });

      if (error) throw error;
      toast.success("Bruker lagt til avdeling");
      await fetchUserDepartments();
      return true;
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Bruker er allerede i denne avdelingen");
      } else {
        console.error("Error assigning user to department:", error);
        toast.error("Kunne ikke legge til bruker i avdeling");
      }
      return false;
    }
  };

  const removeUserFromDepartment = async (userId: string, departmentId: string) => {
    try {
      const { error } = await supabase
        .from("user_departments")
        .delete()
        .eq("user_id", userId)
        .eq("department_id", departmentId);

      if (error) throw error;
      toast.success("Bruker fjernet fra avdeling");
      await fetchUserDepartments();
      return true;
    } catch (error) {
      console.error("Error removing user from department:", error);
      toast.error("Kunne ikke fjerne bruker fra avdeling");
      return false;
    }
  };

  return {
    userDepartments,
    isLoading,
    assignUserToDepartment,
    removeUserFromDepartment,
    refetch: fetchUserDepartments,
  };
}
