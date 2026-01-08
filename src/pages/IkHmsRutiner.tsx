import { AppLayout } from "@/components/layout/AppLayout";
import { RutinerTab } from "@/components/risikoanalyse/RutinerTab";

export default function IkHmsRutiner() {
  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Rutiner</h1>
          <p className="text-muted-foreground mt-1">
            Administrer bedriftens HMS-rutiner og prosedyrer
          </p>
        </div>
        
        <RutinerTab />
      </div>
    </AppLayout>
  );
}
