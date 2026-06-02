import { useState } from "react";
import { FAQ_MODULES } from "@/data/faqContent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Search, HelpCircle } from "lucide-react";

export default function HjelpFaq() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  return (
    <div className="container max-w-4xl py-6 md:py-10 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <HelpCircle className="w-6 h-6" />
          <h1 className="text-2xl md:text-3xl font-bold">Hjelp og FAQ</h1>
        </div>
        <p className="text-muted-foreground">
          Svar på de vanligste spørsmålene om HMS Proffen. Finner du ikke det du
          leter etter? Spør HMS Proffen, MAT Proffen eller Bygg Proffen i
          chatten – de kjenner innholdet her.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Søk i spørsmål og svar..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="hms" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {FAQ_MODULES.map((m) => (
            <TabsTrigger key={m.key} value={m.key}>
              {m.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {FAQ_MODULES.map((mod) => {
          const filteredSections = mod.sections
            .map((s) => ({
              ...s,
              items: s.items.filter(
                (it) =>
                  !q ||
                  it.q.toLowerCase().includes(q) ||
                  it.a.toLowerCase().includes(q),
              ),
            }))
            .filter((s) => s.items.length > 0);

          return (
            <TabsContent key={mod.key} value={mod.key} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{mod.title}</CardTitle>
                  <CardDescription>{mod.subtitle}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {filteredSections.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Ingen treff på "{query}".
                    </p>
                  )}
                  {filteredSections.map((sec) => (
                    <div key={sec.title} className="space-y-2">
                      <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">
                        {sec.title}
                      </h2>
                      <Accordion type="multiple" className="w-full">
                        {sec.items.map((it, idx) => (
                          <AccordionItem
                            key={idx}
                            value={`${sec.title}-${idx}`}
                          >
                            <AccordionTrigger className="text-left">
                              {it.q}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground leading-relaxed">
                              {it.a}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
