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
import { Printer, FileImage, AlertTriangle, QrCode, UtensilsCrossed } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Allergen {
  id: string;
  name: string;
  present: boolean;
  controlMeasures: string;
}

interface MenuItem {
  id: string;
  name: string;
  allergenIds: string[];
}

interface AllergenPosterDialogProps {
  allergens: Allergen[];
  menuItems: MenuItem[];
  companyName: string;
}

// Standard EU allergen icons
const allergenIcons: Record<string, string> = {
  "Gluten": "🌾",
  "Melk": "🥛",
  "Egg": "🥚",
  "Fisk": "🐟",
  "Skalldyr": "🦐",
  "Krepsdyr": "🦐",
  "Nøtter": "🥜",
  "Peanøtter": "🥜",
  "Soya": "🫘",
  "Selleri": "🥬",
  "Sennep": "🟡",
  "Sesam": "⚪",
  "Sesamfrø": "⚪",
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

export const AllergenPosterDialog = ({ allergens, menuItems, companyName }: AllergenPosterDialogProps) => {
  const [open, setOpen] = useState(false);
  const menuPosterRef = useRef<HTMLDivElement>(null);
  const qrPosterRef = useRef<HTMLDivElement>(null);

  const presentAllergens = allergens.filter(a => a.present);
  
  // Get allergen names for a menu item
  const getAllergenNames = (item: MenuItem): string[] => {
    return item.allergenIds
      .map(id => allergens.find(a => a.id === id)?.name)
      .filter(Boolean) as string[];
  };

  // Generate a URL for the allergen info
  const allergenUrl = `${window.location.origin}/allergen-info/${encodeURIComponent(companyName)}`;

  const handlePrint = (type: 'menu' | 'qr') => {
    const content = type === 'menu' ? menuPosterRef.current : qrPosterRef.current;
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

  // Filter menu items that have allergens
  const menuItemsWithAllergens = menuItems.filter(item => item.allergenIds.length > 0);

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

        <Tabs defaultValue="menu" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="menu">
              <UtensilsCrossed className="mr-2 h-4 w-4" />
              Menyplakat
            </TabsTrigger>
            <TabsTrigger value="qr">
              <QrCode className="mr-2 h-4 w-4" />
              QR-kode plakat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="menu" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => handlePrint('menu')}>
                <Printer className="mr-2 h-4 w-4" />
                Skriv ut
              </Button>
            </div>

            {/* Menu-based Allergen Poster */}
            <div 
              ref={menuPosterRef}
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

              {/* Menu Items with Allergens */}
              {menuItemsWithAllergens.length > 0 ? (
                <div className="space-y-4" style={{ marginBottom: '32px' }}>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>
                    <UtensilsCrossed className="h-6 w-6" style={{ width: 24, height: 24 }} />
                    Allergener i våre retter:
                  </h2>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {menuItemsWithAllergens.map((item) => {
                      const allergenNames = getAllergenNames(item);
                      return (
                        <div 
                          key={item.id}
                          className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4"
                          style={{ 
                            backgroundColor: '#fffbeb',
                            border: '2px solid #fde68a',
                            borderRadius: '8px',
                            padding: '16px'
                          }}
                        >
                          <div className="flex flex-wrap items-center gap-2" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                            <span className="font-bold text-lg text-gray-900" style={{ fontWeight: 'bold', fontSize: '1.125rem', color: '#111827' }}>
                              I vår {item.name}
                            </span>
                            <span className="text-gray-600" style={{ color: '#4b5563' }}>inneholder:</span>
                            <div className="flex flex-wrap gap-2" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {allergenNames.map((name, idx) => (
                                <span 
                                  key={idx}
                                  className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full font-semibold"
                                  style={{ 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    gap: '4px',
                                    backgroundColor: '#fee2e2',
                                    color: '#991b1b',
                                    padding: '4px 12px',
                                    borderRadius: '9999px',
                                    fontWeight: '600'
                                  }}
                                >
                                  <span style={{ fontSize: '1rem' }}>{getIcon(name)}</span>
                                  {name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12" style={{ padding: '48px 0' }}>
                  <UtensilsCrossed className="h-16 w-16 text-gray-300 mx-auto mb-4" style={{ width: 64, height: 64, color: '#d1d5db', margin: '0 auto 16px' }} />
                  <p className="text-gray-500 text-lg" style={{ color: '#6b7280', fontSize: '1.125rem' }}>
                    Ingen retter med allergener i menyen ennå.
                  </p>
                  <p className="text-gray-400 mt-2" style={{ color: '#9ca3af', marginTop: '8px' }}>
                    Legg til retter i menyen for å generere plakat.
                  </p>
                </div>
              )}

              {/* Allergen Legend */}
              {presentAllergens.length > 0 && (
                <div className="mt-8 pt-6 border-t-2 border-gray-200" style={{ marginTop: '32px', paddingTop: '24px', borderTop: '2px solid #e5e7eb' }}>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3" style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                    Alle allergener i vår meny:
                  </h3>
                  <div className="flex flex-wrap gap-2" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {presentAllergens.map((allergen, idx) => (
                      <span 
                        key={idx}
                        className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          fontSize: '0.875rem'
                        }}
                      >
                        <span>{getIcon(allergen.name)}</span>
                        {allergen.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="mt-8 pt-6 border-t-2 border-gray-200 text-center" style={{ marginTop: '32px', paddingTop: '24px', borderTop: '2px solid #e5e7eb' }}>
                <p className="text-gray-600 mb-2" style={{ color: '#4b5563', marginBottom: '8px' }}>
                  Vennligst informer personalet om eventuelle allergier.
                </p>
                <p className="text-xs text-gray-400" style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                  Merking i henhold til EU No 1169/2011. Tar ikke hensyn til kryssforurensning.
                </p>
                <p className="text-sm text-gray-500 mt-2" style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '8px' }}>
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

              {/* Menu Summary */}
              {menuItemsWithAllergens.length > 0 && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 mb-6 text-left" style={{ backgroundColor: '#fffbeb', border: '2px solid #fde68a', borderRadius: '8px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
                  <p className="text-amber-800 font-semibold mb-3" style={{ color: '#92400e', fontWeight: '600', marginBottom: '12px' }}>
                    Allergener i våre retter:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {menuItemsWithAllergens.slice(0, 5).map((item) => {
                      const allergenNames = getAllergenNames(item);
                      return (
                        <div key={item.id} style={{ fontSize: '0.875rem' }}>
                          <span className="font-medium" style={{ fontWeight: '500' }}>{item.name}:</span>{' '}
                          <span className="text-gray-600" style={{ color: '#4b5563' }}>
                            {allergenNames.map(n => `${getIcon(n)} ${n}`).join(', ')}
                          </span>
                        </div>
                      );
                    })}
                    {menuItemsWithAllergens.length > 5 && (
                      <p className="text-amber-600 text-sm italic" style={{ color: '#d97706', fontSize: '0.875rem', fontStyle: 'italic' }}>
                        +{menuItemsWithAllergens.length - 5} flere retter - skann QR-koden for full oversikt
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="text-center" style={{ textAlign: 'center' }}>
                <p className="text-gray-600" style={{ color: '#4b5563' }}>
                  Vennligst informer personalet om eventuelle allergier.
                </p>
                <p className="text-xs text-gray-400 mt-2" style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '8px' }}>
                  Merking i henhold til EU No 1169/2011
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
