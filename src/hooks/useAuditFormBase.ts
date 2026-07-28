import { useCallback, useState } from "react";
import {
  useAuditFormResponses,
  type AuditFormResponse,
  type FormType,
} from "@/hooks/useAuditFormResponses";
import type { Json } from "@/integrations/supabase/types";

interface SaveMetadata {
  revision_date?: string;
  participants?: string;
  auditor_name?: string;
  manager_name?: string;
}

/**
 * Shared persistence + list/select/delete lifecycle for revisjons-skjemaer.
 *
 * Owns the FormData object of type T and exposes the same helpers that used
 * to live duplicated in each *Form.tsx (create-new, select, back-to-list,
 * save-draft, save-completed, delete). The caller owns:
 *   - the initial-data factory (so we don't guess field names)
 *   - the metadata mapper (each form maps its own fields to
 *     revision_date/participants/auditor_name/manager_name).
 */
export function useAuditFormBase<T>(options: {
  formType: FormType;
  getInitialData: () => T;
  buildMetadata: (data: T) => SaveMetadata;
  /** Merge a saved response back into a fresh initial object. Defaults to shallow spread. */
  hydrate?: (initial: T, saved: Partial<T>) => T;
}) {
  const { formType, getInitialData, buildMetadata, hydrate } = options;
  const { responses, saveFormResponse, deleteFormResponse, isSaving } =
    useAuditFormResponses();

  const [formData, setFormData] = useState<T>(getInitialData);
  const [existingId, setExistingId] = useState<string | undefined>();
  const [showForm, setShowForm] = useState(false);

  const formTypeResponses = responses.filter((r) => r.form_type === formType);

  const handleCreateNew = useCallback(() => {
    setFormData(getInitialData());
    setExistingId(undefined);
    setShowForm(true);
  }, [getInitialData]);

  const handleSelectResponse = useCallback(
    (response: AuditFormResponse) => {
      if (response.form_data) {
        const saved = response.form_data as unknown as Partial<T>;
        const fresh = getInitialData();
        setFormData(hydrate ? hydrate(fresh, saved) : { ...fresh, ...saved });
      }
      setExistingId(response.id);
      setShowForm(true);
    },
    [getInitialData, hydrate],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteFormResponse(id);
      if (existingId === id) {
        setExistingId(undefined);
        setShowForm(false);
      }
    },
    [deleteFormResponse, existingId],
  );

  const handleBackToList = useCallback(() => setShowForm(false), []);

  const save = useCallback(
    async (status: "draft" | "completed") => {
      const result = await saveFormResponse(
        formType,
        formData as unknown as Json,
        buildMetadata(formData),
        status,
        existingId,
      );
      if (result) setExistingId(result.id);
      return result;
    },
    [formType, formData, buildMetadata, existingId, saveFormResponse],
  );

  return {
    formData,
    setFormData,
    existingId,
    showForm,
    isSaving,
    formTypeResponses,
    handleCreateNew,
    handleSelectResponse,
    handleDelete,
    handleBackToList,
    handleSaveDraft: () => save("draft"),
    handleSaveCompleted: () => save("completed"),
  };
}
