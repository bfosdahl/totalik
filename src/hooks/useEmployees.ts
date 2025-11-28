import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface EmployeeDocument {
  id: string;
  company_id: string;
  employee_id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  description: string | null;
  uploaded_by: string | null;
  uploaded_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeCourse {
  id: string;
  company_id: string;
  employee_id: string;
  course_name: string;
  course_provider: string | null;
  certificate_number: string | null;
  completed_date: string;
  expiry_date: string | null;
  validity_years: number | null;
  status: string;
  notes: string | null;
  reminder_sent_30_days: boolean;
  reminder_sent_7_days: boolean;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  user_id: string;
  company_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  next_of_kin_name: string | null;
  next_of_kin_phone: string | null;
  next_of_kin_relation: string | null;
  hms_card_required: boolean | null;
  hms_card_obtained: boolean | null;
  hms_card_number: string | null;
  hms_card_expiry_date: string | null;
  hms_card_reminder_sent_30_days: boolean | null;
  hms_card_reminder_sent_7_days: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface HmsCardRequest {
  id: string;
  company_id: string;
  employee_id: string;
  status: string;
  notes: string | null;
  requested_by: string | null;
  requested_by_name: string;
  created_at: string;
  updated_at: string;
}

export function useEmployees() {
  const { company } = useAuth();

  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ["employees", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("company_id", company.id)
        .eq("is_active", true)
        .order("first_name");

      if (error) throw error;
      return data as Employee[];
    },
    enabled: !!company?.id,
  });

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ["employee-courses", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      
      const { data, error } = await supabase
        .from("employee_courses")
        .select("*")
        .eq("company_id", company.id)
        .order("expiry_date", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as EmployeeCourse[];
    },
    enabled: !!company?.id,
  });

  return {
    employees,
    courses,
    isLoading: employeesLoading || coursesLoading,
  };
}

export function useEmployeeDocuments(employeeId: string | null) {
  const { company } = useAuth();
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery({
    queryKey: ["employee-documents", employeeId],
    queryFn: async () => {
      if (!employeeId || !company?.id) return [];
      
      const { data, error } = await supabase
        .from("employee_documents")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as EmployeeDocument[];
    },
    enabled: !!employeeId && !!company?.id,
  });

  const uploadDocument = useMutation({
    mutationFn: async ({ 
      file, 
      description, 
      employeeId,
      uploaderName 
    }: { 
      file: File; 
      description: string;
      employeeId: string;
      uploaderName: string;
    }) => {
      if (!company?.id) throw new Error("Ingen bedrift valgt");

      const filePath = `${company.id}/${employeeId}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("employee-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from("employee_documents")
        .insert({
          company_id: company.id,
          employee_id: employeeId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          description,
          uploaded_by_name: uploaderName,
        });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-documents"] });
      toast({ title: "Dokument lastet opp" });
    },
    onError: (error) => {
      toast({ 
        title: "Feil ved opplasting", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (document: EmployeeDocument) => {
      const { error: storageError } = await supabase.storage
        .from("employee-documents")
        .remove([document.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("employee_documents")
        .delete()
        .eq("id", document.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-documents"] });
      toast({ title: "Dokument slettet" });
    },
    onError: (error) => {
      toast({ 
        title: "Feil ved sletting", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  return {
    documents,
    isLoading,
    uploadDocument,
    deleteDocument,
  };
}

export function useEmployeeCourses(employeeId: string | null) {
  const { company } = useAuth();
  const queryClient = useQueryClient();

  const { data: courses, isLoading } = useQuery({
    queryKey: ["employee-courses-single", employeeId],
    queryFn: async () => {
      if (!employeeId || !company?.id) return [];
      
      const { data, error } = await supabase
        .from("employee_courses")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("company_id", company.id)
        .order("expiry_date", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as EmployeeCourse[];
    },
    enabled: !!employeeId && !!company?.id,
  });

  const addCourse = useMutation({
    mutationFn: async (courseData: {
      course_name: string;
      course_provider?: string;
      certificate_number?: string;
      completed_date: string;
      expiry_date?: string;
      validity_years?: number;
      notes?: string;
    }) => {
      if (!company?.id || !employeeId) throw new Error("Manglende data");

      const { error } = await supabase
        .from("employee_courses")
        .insert({
          company_id: company.id,
          employee_id: employeeId,
          ...courseData,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-courses"] });
      queryClient.invalidateQueries({ queryKey: ["employee-courses-single"] });
      toast({ title: "Kurs lagt til" });
    },
    onError: (error) => {
      toast({ 
        title: "Feil ved lagring", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const updateCourse = useMutation({
    mutationFn: async ({ id, ...data }: Partial<EmployeeCourse> & { id: string }) => {
      const { error } = await supabase
        .from("employee_courses")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-courses"] });
      queryClient.invalidateQueries({ queryKey: ["employee-courses-single"] });
      toast({ title: "Kurs oppdatert" });
    },
    onError: (error) => {
      toast({ 
        title: "Feil ved oppdatering", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const deleteCourse = useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase
        .from("employee_courses")
        .delete()
        .eq("id", courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-courses"] });
      queryClient.invalidateQueries({ queryKey: ["employee-courses-single"] });
      toast({ title: "Kurs slettet" });
    },
    onError: (error) => {
      toast({ 
        title: "Feil ved sletting", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  return {
    courses,
    isLoading,
    addCourse,
    updateCourse,
    deleteCourse,
  };
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Employee> & { id: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast({ title: "Ansatt oppdatert" });
    },
    onError: (error) => {
      toast({ 
        title: "Feil ved oppdatering", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}