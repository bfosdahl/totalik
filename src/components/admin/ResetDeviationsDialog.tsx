 import { useState } from "react";
 import { Calendar, Trash2, AlertTriangle, Loader2 } from "lucide-react";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogDescription,
 } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Label } from "@/components/ui/label";
 import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
 import { Calendar as CalendarComponent } from "@/components/ui/calendar";
 import { format } from "date-fns";
 import { nb } from "date-fns/locale";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 import { cn } from "@/lib/utils";
 
 interface ResetDeviationsDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   company: {
     id: string;
     name: string;
   } | null;
 }
 
 export function ResetDeviationsDialog({
   open,
   onOpenChange,
   company,
 }: ResetDeviationsDialogProps) {
   const [startDate, setStartDate] = useState<Date | undefined>(undefined);
   const [isDeleting, setIsDeleting] = useState(false);
   const [previewCount, setPreviewCount] = useState<number | null>(null);
   const [isLoadingPreview, setIsLoadingPreview] = useState(false);
 
   const handleDateSelect = async (date: Date | undefined) => {
     setStartDate(date);
     if (!date || !company) {
       setPreviewCount(null);
       return;
     }
 
     setIsLoadingPreview(true);
     try {
       // Count deviations that would be deleted (before the selected date)
       const { count, error } = await supabase
         .from("deviations")
         .select("*", { count: "exact", head: true })
         .eq("company_id", company.id)
         .lt("created_at", date.toISOString());
 
       if (error) throw error;
       setPreviewCount(count || 0);
     } catch (error) {
       console.error("Error fetching deviation count:", error);
       setPreviewCount(null);
     } finally {
       setIsLoadingPreview(false);
     }
   };
 
   const handleReset = async () => {
     if (!startDate || !company) return;
 
     setIsDeleting(true);
     try {
       // Delete all deviations before the selected date
       const { error, count } = await supabase
         .from("deviations")
         .delete({ count: "exact" })
         .eq("company_id", company.id)
         .lt("created_at", startDate.toISOString());
 
       if (error) throw error;
 
       toast.success(`${count || 0} avvik slettet`, {
         description: `Alle avvik før ${format(startDate, "d. MMMM yyyy", { locale: nb })} er fjernet.`,
       });
 
       onOpenChange(false);
       setStartDate(undefined);
       setPreviewCount(null);
     } catch (error) {
       console.error("Error resetting deviations:", error);
       toast.error("Kunne ikke slette avvik");
     } finally {
       setIsDeleting(false);
     }
   };
 
   const handleClose = () => {
     setStartDate(undefined);
     setPreviewCount(null);
     onOpenChange(false);
   };
 
   return (
     <Dialog open={open} onOpenChange={handleClose}>
       <DialogContent className="sm:max-w-[450px]">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <Trash2 className="w-5 h-5 text-orange-500" />
             Nullstill avvik
           </DialogTitle>
           <DialogDescription>
             Slett alle avvik som ble opprettet FØR kundens oppstartsdato.
           </DialogDescription>
         </DialogHeader>
 
         {company && (
           <div className="space-y-6 py-4">
             <div className="bg-muted/50 rounded-lg p-3">
               <p className="text-sm">
                 <span className="text-muted-foreground">Bedrift:</span>{" "}
                 <span className="font-medium">{company.name}</span>
               </p>
             </div>
 
             <div className="space-y-2">
               <Label>Velg oppstartsdato</Label>
               <p className="text-xs text-muted-foreground mb-2">
                 Alle avvik opprettet FØR denne datoen vil bli slettet.
               </p>
               <Popover>
                 <PopoverTrigger asChild>
                   <Button
                     variant="outline"
                     className={cn(
                       "w-full justify-start text-left font-normal",
                       !startDate && "text-muted-foreground"
                     )}
                   >
                     <Calendar className="mr-2 h-4 w-4" />
                     {startDate
                       ? format(startDate, "PPP", { locale: nb })
                       : "Velg dato"}
                   </Button>
                 </PopoverTrigger>
                 <PopoverContent className="w-auto p-0" align="start">
                   <CalendarComponent
                     mode="single"
                     selected={startDate}
                     onSelect={handleDateSelect}
                     initialFocus
                     locale={nb}
                   />
                 </PopoverContent>
               </Popover>
             </div>
 
             {isLoadingPreview && (
               <div className="flex items-center gap-2 text-sm text-muted-foreground">
                 <Loader2 className="w-4 h-4 animate-spin" />
                 Teller avvik...
               </div>
             )}
 
             {previewCount !== null && !isLoadingPreview && (
               <div className={cn(
                 "rounded-lg p-4 border",
                 previewCount > 0 
                   ? "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800"
                   : "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
               )}>
                 {previewCount > 0 ? (
                   <>
                     <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-medium">
                       <AlertTriangle className="w-4 h-4" />
                       {previewCount} avvik vil bli slettet
                     </div>
                     <p className="text-sm text-orange-600 dark:text-orange-500 mt-1">
                       Alle avvik opprettet før{" "}
                       {format(startDate!, "d. MMMM yyyy", { locale: nb })} vil bli permanent fjernet.
                     </p>
                   </>
                 ) : (
                   <p className="text-sm text-green-700 dark:text-green-400">
                     Ingen avvik å slette før denne datoen.
                   </p>
                 )}
               </div>
             )}
 
             <div className="flex justify-end gap-3 pt-2">
               <Button variant="outline" onClick={handleClose}>
                 Avbryt
               </Button>
               <Button
                 variant="destructive"
                 onClick={handleReset}
                 disabled={!startDate || previewCount === 0 || isDeleting}
               >
                 {isDeleting ? (
                   <>
                     <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                     Sletter...
                   </>
                 ) : (
                   <>
                     <Trash2 className="w-4 h-4 mr-2" />
                     Slett {previewCount || 0} avvik
                   </>
                 )}
               </Button>
             </div>
           </div>
         )}
       </DialogContent>
     </Dialog>
   );
 }