import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Department } from "@/hooks/useDepartments";

interface DepartmentContextType {
  /** Currently selected department (null = all departments / company-wide view) */
  selectedDepartment: Department | null;
  /** All departments the current user has access to */
  userDepartments: Department[];
  /** Whether the company has departments enabled */
  hasDepartments: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Select a specific department or null for all */
  setSelectedDepartment: (department: Department | null) => void;
  /** Get the department_id for filtering queries */
  filterDepartmentId: string | null;
  /** Refresh user departments */
  refetch: () => Promise<void>;
  /** Whether user can view all departments (admins) */
  canViewAllDepartments: boolean;
}

const DepartmentContext = createContext<DepartmentContextType | undefined>(undefined);

export function DepartmentProvider({ children }: { children: React.ReactNode }) {
  const { profile, company, isCompanyAdmin, isSystemAdmin } = useAuth();
  const [selectedDepartment, setSelectedDepartmentState] = useState<Department | null>(null);
  const [userDepartments, setUserDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const hasDepartments = company?.has_departments ?? false;
  const canViewAllDepartments = isCompanyAdmin || isSystemAdmin;

  const fetchUserDepartments = useCallback(async () => {
    if (!profile?.id || !company?.id || !hasDepartments) {
      setUserDepartments([]);
      setIsLoading(false);
      return;
    }

    try {
      let departments: Department[] = [];

      if (canViewAllDepartments) {
        // Company admins and system admins can see ALL departments in the company
        const { data: allDepartments, error: deptError } = await supabase
          .from("company_departments")
          .select("*")
          .eq("company_id", company.id)
          .eq("is_active", true)
          .order("name");

        if (deptError) throw deptError;
        departments = allDepartments || [];
      } else {
        // Regular users only see departments they are assigned to
        const { data: assignments, error: assignError } = await supabase
          .from("user_departments")
          .select(`
            department_id,
            is_department_admin,
            department:company_departments(*)
          `)
          .eq("user_id", profile.id);

        if (assignError) throw assignError;

        // Extract departments from assignments
        departments = (assignments || [])
          .map((a: any) => a.department)
          .filter((d: Department | null): d is Department => d !== null && d.is_active);
      }

      setUserDepartments(departments);

      // If user has a primary department, select it by default (only on initial load)
      if (profile.primary_department_id && departments.length > 0) {
        const storedId = localStorage.getItem("selectedDepartmentId");
        if (!storedId) {
          const primaryDept = departments.find((d: Department) => d.id === profile.primary_department_id);
          if (primaryDept) {
            setSelectedDepartmentState(primaryDept);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user departments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, company?.id, hasDepartments, profile?.primary_department_id, canViewAllDepartments]);

  useEffect(() => {
    fetchUserDepartments();
  }, [fetchUserDepartments]);

  const setSelectedDepartment = (department: Department | null) => {
    setSelectedDepartmentState(department);
    // Store in localStorage for persistence
    if (department) {
      localStorage.setItem("selectedDepartmentId", department.id);
    } else {
      localStorage.removeItem("selectedDepartmentId");
    }
  };

  // Restore selected department from localStorage on mount
  useEffect(() => {
    if (userDepartments.length > 0) {
      const storedId = localStorage.getItem("selectedDepartmentId");
      if (storedId) {
        const dept = userDepartments.find((d) => d.id === storedId);
        if (dept) {
          setSelectedDepartmentState(dept);
        }
      }
    }
  }, [userDepartments]);

  const value: DepartmentContextType = {
    selectedDepartment,
    userDepartments,
    hasDepartments,
    isLoading,
    setSelectedDepartment,
    filterDepartmentId: selectedDepartment?.id ?? null,
    refetch: fetchUserDepartments,
    canViewAllDepartments,
  };

  return (
    <DepartmentContext.Provider value={value}>
      {children}
    </DepartmentContext.Provider>
  );
}

export function useDepartmentContext() {
  const context = useContext(DepartmentContext);
  if (context === undefined) {
    throw new Error("useDepartmentContext must be used within a DepartmentProvider");
  }
  return context;
}
