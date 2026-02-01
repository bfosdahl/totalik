import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Vibrate, Volume2, Sun, Calculator } from "lucide-react";
import { VibrationCalculator } from "./calculators/VibrationCalculator";
import { NoiseCalculator } from "./calculators/NoiseCalculator";
import { LightCalculator } from "./calculators/LightCalculator";

export function ExposureCalculators() {
  const [activeCalc, setActiveCalc] = useState("vibrasjon");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Eksponeringskalkulatorer
        </CardTitle>
        <CardDescription>
          Beregn eksponering for vibrasjoner, støy og lys iht. Arbeidstilsynets krav
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeCalc} onValueChange={setActiveCalc}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="vibrasjon" className="gap-2">
              <Vibrate className="h-4 w-4" />
              <span className="hidden sm:inline">Vibrasjon</span>
            </TabsTrigger>
            <TabsTrigger value="stoy" className="gap-2">
              <Volume2 className="h-4 w-4" />
              <span className="hidden sm:inline">Støy</span>
            </TabsTrigger>
            <TabsTrigger value="lys" className="gap-2">
              <Sun className="h-4 w-4" />
              <span className="hidden sm:inline">Lys</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vibrasjon" className="mt-4">
            <VibrationCalculator />
          </TabsContent>

          <TabsContent value="stoy" className="mt-4">
            <NoiseCalculator />
          </TabsContent>

          <TabsContent value="lys" className="mt-4">
            <LightCalculator />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
