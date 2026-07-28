import { useCallback } from "react";
import type {
  ChecklistAnswer,
  ChecklistQuestion,
} from "@/components/audits/EditableChecklistSection";

export type SectionQuestions = Record<string, ChecklistQuestion[]>;
export type ChecklistAnswers = Record<
  string,
  Record<string, ChecklistAnswer>
>;

/**
 * Consolidates the sectionQuestions + checklistAnswers CRUD that used to be
 * copy-pasted across DagligDriftForm and FysiskeArbeidsforholdForm.
 *
 * The state itself lives in the parent FormData (so it serializes cleanly to
 * form_data JSON); this hook just returns pure mutators that operate on that
 * slice via a setter you pass in.
 */
export function useChecklistSectionsState<
  T extends {
    sectionQuestions: SectionQuestions;
    checklistAnswers: ChecklistAnswers;
  },
>(setFormData: React.Dispatch<React.SetStateAction<T>>) {
  const updateAnswer = useCallback(
    (
      sectionId: string,
      questionId: string,
      field: "answer" | "comment",
      value: string,
    ) => {
      setFormData((prev) => ({
        ...prev,
        checklistAnswers: {
          ...prev.checklistAnswers,
          [sectionId]: {
            ...prev.checklistAnswers[sectionId],
            [questionId]: {
              ...(prev.checklistAnswers[sectionId]?.[questionId] || {
                answer: "",
                comment: "",
              }),
              [field]: value,
            },
          },
        },
      }));
    },
    [setFormData],
  );

  const addQuestion = useCallback(
    (sectionId: string, question: string) => {
      const newId = `custom_${Date.now()}`;
      setFormData((prev) => ({
        ...prev,
        sectionQuestions: {
          ...prev.sectionQuestions,
          [sectionId]: [
            ...(prev.sectionQuestions[sectionId] || []),
            { id: newId, question },
          ],
        },
        checklistAnswers: {
          ...prev.checklistAnswers,
          [sectionId]: {
            ...prev.checklistAnswers[sectionId],
            [newId]: { answer: "", comment: "" },
          },
        },
      }));
    },
    [setFormData],
  );

  const editQuestion = useCallback(
    (sectionId: string, questionId: string, newQuestion: string) => {
      setFormData((prev) => ({
        ...prev,
        sectionQuestions: {
          ...prev.sectionQuestions,
          [sectionId]: (prev.sectionQuestions[sectionId] || []).map((q) =>
            q.id === questionId ? { ...q, question: newQuestion } : q,
          ),
        },
      }));
    },
    [setFormData],
  );

  const deleteQuestion = useCallback(
    (sectionId: string, questionId: string) => {
      setFormData((prev) => {
        const { [questionId]: _removed, ...remainingAnswers } =
          prev.checklistAnswers[sectionId] || {};
        return {
          ...prev,
          sectionQuestions: {
            ...prev.sectionQuestions,
            [sectionId]: (prev.sectionQuestions[sectionId] || []).filter(
              (q) => q.id !== questionId,
            ),
          },
          checklistAnswers: {
            ...prev.checklistAnswers,
            [sectionId]: remainingAnswers,
          },
        };
      });
    },
    [setFormData],
  );

  return { updateAnswer, addQuestion, editQuestion, deleteQuestion };
}

/**
 * Build the initial sectionQuestions + checklistAnswers slice from a
 * declarative section list. Use this in the form's getInitialFormData().
 */
export function initChecklistState(
  sections: { id: string; questions: ChecklistQuestion[] }[],
): { sectionQuestions: SectionQuestions; checklistAnswers: ChecklistAnswers } {
  const sectionQuestions: SectionQuestions = {};
  const checklistAnswers: ChecklistAnswers = {};
  sections.forEach((section) => {
    sectionQuestions[section.id] = section.questions.map((q) => ({
      id: q.id,
      question: q.question,
    }));
    checklistAnswers[section.id] = {};
    section.questions.forEach((q) => {
      checklistAnswers[section.id][q.id] = { answer: "", comment: "" };
    });
  });
  return { sectionQuestions, checklistAnswers };
}
