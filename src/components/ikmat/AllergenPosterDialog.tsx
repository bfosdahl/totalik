import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Printer, FileImage, AlertTriangle, Check, X, QrCode } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Allergen {
  name: string;
  present: boolean;
  controlMeasures: string;
}

interface AllergenPosterDialogProps {
  allergens: Allergen[];
  companyName: string;
}

// Standard EU allergen icons (using text abbreviations for now)
const allergenIcons: Record<string, string> = {
  "Gluten": "🌾",
  "Melk": "🥛",
  "Egg": "🥚",
  "Fisk": "🐟",
  "Skalldyr": "🦐",
  "Nøtter": "🥜",
  "Peanøtter": "🥜",
  "Soya": "🫘",
  "Selleri": "🥬",
  "Sennep": "🟡",
  "Sesam": "⚪",
  "Sulfitter": "🍷",
  "Lupin": "🌸",
  "Bløtdyr": "🐚",
};

const getIcon = (allergenName: string): string => {
  const lowerName = allergenName.toLowerCase();
  for (const [key, icon] of Object.entries(allergenIcons)) {
    if (lowerName.includes(key.toLowerCase())) {
      return icon;
    }
  }
  return "⚠️";
};

export const AllergenPosterDialog = ({ allergens, companyName }: AllergenPosterDialogProps) => {
  const [open, setOpen] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);
  const qrPosterRef = useRef<HTMLDivElement>(null);

  const presentAllergens = allergens.filter(a => a.present);
  const absentAllergens = allergens.filter(a => !a.present);

  // Generate a URL for the allergen info (could be a public page in the future)
  const allergenUrl = `${window.location.origin}/allergen-info/${encodeURIComponent(companyName)}`;

  const handlePrint = (type: 'poster' | 'qr') => {
    const content = type === 'poster' ? posterRef.current : qrPosterRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Allergenplakat - ${companyName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: system-ui, -apple-system, sans-serif;
              padding: 20mm;
              background: white;
            }
            @media print {
              body { padding: 10mm; }
              @page { size: A4; margin: 10mm; }
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileImage className="mr-2 h-4 w-4" />
          Lag plakat
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Allergenplakat</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="poster" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="poster">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Full plakat
            </TabsTrigger>
            <TabsTrigger value="qr">
              <QrCode className="mr-2 h-4 w-4" />
              QR-kode plakat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="poster" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => handlePrint('poster')}>
                <Printer className="mr-2 h-4 w-4" />
                Skriv ut
              </Button>
            </div>

            {/* Printable Poster */}
            <div 
              ref={posterRef}
              className="bg-white border-2 border-gray-200 rounded-lg p-8 print:p-4"
              style={{ minHeight: '600px' }}
            >
              {/* Header */}
              <div className="text-center mb-8 border-b-4 border-amber-500 pb-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <AlertTriangle className="h-10 w-10 text-amber-500" style={{ width: 40, height: 40 }} />
                  <h1 className="text-4xl font-bold text-gray-900" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                    ALLERGENINFORMASJON
                  </h1>
                  <AlertTriangle className="h-10 w-10 text-amber-500" style={{ width: 40, height: 40 }} />
                </div>
                <p className="text-xl text-gray-600" style={{ fontSize: '1.25rem' }}>{companyName}</p>
              </div>

              {/* Present Allergens */}
              {presentAllergens.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-red-600 mb-4 flex items-center gap-2" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>
                    <X className="h-6 w-6" style={{ width: 24, height: 24 }} />
                    Allergener i vår meny:
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    {presentAllergens.map((allergen, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center gap-3 bg-red-50 border-2 border-red-200 rounded-lg p-4"
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '12px',
                          backgroundColor: '#fef2f2',
                          border: '2px solid #fecaca',
                          borderRadius: '8px',
                          padding: '16px'
                        }}
                      >
                        <span className="text-3xl" style={{ fontSize: '2rem' }}>{getIcon(allergen.name)}</span>
                        <span className="font-semibold text-lg text-gray-900" style={{ fontWeight: '600', fontSize: '1.125rem' }}>
                          {allergen.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Absent Allergens */}
              {absentAllergens.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-green-600 mb-4 flex items-center gap-2" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>
                    <Check className="h-6 w-6" style={{ width: 24, height: 24 }} />
                    Allergener vi IKKE bruker:
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {absentAllergens.map((allergen, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3 text-sm"
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          backgroundColor: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderRadius: '8px',
                          padding: '12px',
                          fontSize: '0.875rem'
                        }}
                      >
                        <span className="text-xl" style={{ fontSize: '1.25rem' }}>{getIcon(allergen.name)}</span>
                        <span className="text-gray-700">{allergen.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="mt-8 pt-6 border-t-2 border-gray-200 text-center" style={{ marginTop: '32px', paddingTop: '24px', borderTop: '2px solid #e5e7eb' }}>
                <p className="text-gray-600 mb-2" style={{ color: '#4b5563', marginBottom: '8px' }}>
                  Vennligst informer personalet om eventuelle allergier.
                </p>
                <p className="text-sm text-gray-500" style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Oppdatert: {new Date().toLocaleDateString('nb-NO', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="qr" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => handlePrint('qr')}>
                <Printer className="mr-2 h-4 w-4" />
                Skriv ut
              </Button>
            </div>

            {/* QR Code Poster */}
            <div 
              ref={qrPosterRef}
              className="bg-white border-2 border-gray-200 rounded-lg p-8 text-center"
              style={{ minHeight: '500px' }}
            >
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <AlertTriangle className="h-8 w-8 text-amber-500" style={{ width: 32, height: 32 }} />
                  <h1 className="text-3xl font-bold text-gray-900" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                    ALLERGENINFORMASJON
                  </h1>
                  <AlertTriangle className="h-8 w-8 text-amber-500" style={{ width: 32, height: 32 }} />
                </div>
                <p className="text-xl text-gray-600" style={{ fontSize: '1.25rem' }}>{companyName}</p>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center mb-8" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
                <div className="bg-white p-6 rounded-xl shadow-lg border-4 border-amber-500 inline-block" style={{ padding: '24px', borderRadius: '12px', border: '4px solid #f59e0b' }}>
                  <QRCodeSVG 
                    value={allergenUrl}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="mt-6 text-2xl font-bold text-gray-800" style={{ marginTop: '24px', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  Skann for allergeninformasjon
                </p>
              </div>

              {/* Quick Summary */}
              {presentAllergens.length > 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 inline-block" style={{ backgroundColor: '#fef2f2', border: '2px solid #fecaca', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
                  <p className="text-red-700 font-semibold mb-2" style={{ color: '#b91c1c', fontWeight: '600', marginBottom: '8px' }}>
                    Vår meny inneholder:
                  </p>
                  <div className="flex flex-wrap justify-center gap-2" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
                    {presentAllergens.slice(0, 6).map((allergen, idx) => (
                      <span 
                        key={idx}
                        className="bg-white px-3 py-1 rounded-full text-sm font-medium border border-red-300"
                        style={{ backgroundColor: 'white', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: '500', border: '1px solid #fca5a5' }}
                      >
                        {getIcon(allergen.name)} {allergen.name}
                      </span>
                    ))}
                    {presentAllergens.length > 6 && (
                      <span className="text-red-600 text-sm" style={{ color: '#dc2626', fontSize: '0.875rem' }}>
                        +{presentAllergens.length - 6} flere
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="text-center" style={{ textAlign: 'center' }}>
                <p className="text-gray-600" style={{ color: '#4b5563' }}>
                  Vennligst informer personalet om eventuelle allergier.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
