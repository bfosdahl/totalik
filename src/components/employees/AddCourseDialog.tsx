import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEmployeeCourses } from "@/hooks/useEmployees";
import { addYears, format } from "date-fns";

interface AddCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
}

const COMMON_COURSES = [
  { name: "Varme arbeider", validityYears: 5 },
  { name: "Førstehjelpskurs", validityYears: 2 },
  { name: "HMS-kurs for ledere", validityYears: 0 },
  { name: "Truckkurs (T1)", validityYears: 0 },
  { name: "Truckkurs (T2)", validityYears: 0 },
  { name: "Truckkurs (T4)", validityYears: 0 },
  { name: "Fallsikring", validityYears: 0 },
  { name: "Arbeid i høyden", validityYears: 0 },
  { name: "Asbest", validityYears: 5 },
  { name: "El-sikkerhet", validityYears: 0 },
  { name: "Brannvern", validityYears: 0 },
  { name: "Annet", validityYears: 0 },
];

export function AddCourseDialog({ open, onOpenChange, employeeId }: AddCourseDialogProps) {
  const { addCourse } = useEmployeeCourses(employeeId);
  const [formData, setFormData] = useState({
    course_name: "",
    course_provider: "",
    certificate_number: "",
    completed_date: format(new Date(), "yyyy-MM-dd"),
    validity_years: "",
    notes: "",
  });

  const handleCourseSelect = (courseName: string) => {
    const course = COMMON_COURSES.find(c => c.name === courseName);
    setFormData(prev => ({
      ...prev,
      course_name: courseName === "Annet" ? "" : courseName,
      validity_years: course?.validityYears ? String(course.validityYears) : "",
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validityYears = formData.validity_years ? parseInt(formData.validity_years) : undefined;
    const expiryDate = validityYears && validityYears > 0
      ? format(addYears(new Date(formData.completed_date), validityYears), "yyyy-MM-dd")
      : undefined;

    addCourse.mutate({
      course_name: formData.course_name,
      course_provider: formData.course_provider || undefined,
      certificate_number: formData.certificate_number || undefined,
      completed_date: formData.completed_date,
      expiry_date: expiryDate,
      validity_years: validityYears,
      notes: formData.notes || undefined,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setFormData({
          course_name: "",
          course_provider: "",
          certificate_number: "",
          completed_date: format(new Date(), "yyyy-MM-dd"),
          validity_years: "",
          notes: "",
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Legg til kurs</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Velg kurs</Label>
            <Select onValueChange={handleCourseSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Velg fra liste..." />
              </SelectTrigger>
              <SelectContent>
                {COMMON_COURSES.map(course => (
                  <SelectItem key={course.name} value={course.name}>
                    {course.name}
                    {course.validityYears > 0 && ` (${course.validityYears} år)`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="course_name">Kursnavn *</Label>
            <Input
              id="course_name"
              value={formData.course_name}
              onChange={(e) => setFormData(prev => ({ ...prev, course_name: e.target.value }))}
              placeholder="Navn på kurset"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course_provider">Kursleverandør</Label>
              <Input
                id="course_provider"
                value={formData.course_provider}
                onChange={(e) => setFormData(prev => ({ ...prev, course_provider: e.target.value }))}
                placeholder="f.eks. Norsk Brannvernforening"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="certificate_number">Sertifikatnummer</Label>
              <Input
                id="certificate_number"
                value={formData.certificate_number}
                onChange={(e) => setFormData(prev => ({ ...prev, certificate_number: e.target.value }))}
                placeholder="Valgfritt"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="completed_date">Fullført dato *</Label>
              <Input
                id="completed_date"
                type="date"
                value={formData.completed_date}
                onChange={(e) => setFormData(prev => ({ ...prev, completed_date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validity_years">Gyldighet (år)</Label>
              <Input
                id="validity_years"
                type="number"
                min="0"
                max="20"
                value={formData.validity_years}
                onChange={(e) => setFormData(prev => ({ ...prev, validity_years: e.target.value }))}
                placeholder="0 = ingen utløp"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notater</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Eventuelle notater..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={addCourse.isPending}>
              {addCourse.isPending ? "Lagrer..." : "Legg til"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}