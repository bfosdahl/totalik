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
}

const DepartmentContext = createContext<DepartmentContextType | undefined>(undefined);

export function DepartmentProvider({ children }: { children: React.ReactNode }) {
  const { profile, company } = useAuth();
  const [selectedDepartment, setSelectedDepartmentState] = useState<Department | null>(null);
  const [userDepartments, setUserDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const hasDepartments = company?.has_departments ?? false;

  const fetchUserDepartments = useCallback(async () => {
    if (!profile?.id || !company?.id || !hasDepartments) {
      setUserDepartments([]);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch user's department assignments
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
      const departments = (assignments || [])
        .map((a: any) => a.department)
        .filter((d: Department | null): d is Department => d !== null && d.is_active);

      setUserDepartments(departments);

      // If user has a primary department, select it by default
      if (profile.primary_department_id && departments.length > 0) {
        const primaryDept = departments.find((d: Department) => d.id === profile.primary_department_id);
        if (primaryDept) {
          setSelectedDepartmentState(primaryDept);
        }
      }
    } catch (error) {
      console.error("Error fetching user departments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, company?.id, hasDepartments, profile?.primary_department_id]);

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
