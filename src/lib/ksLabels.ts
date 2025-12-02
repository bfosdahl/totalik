// Mapping functions for KS Bygg labels

export const rutineLabels: Record<string, string> = {
  'ks_rutiner': 'KS rutiner',
  'ue_rutine': 'UE rutiner',
  'kontroll_lukking': 'Kontroll før lukking',
  'ferdigstillelse': 'Ferdigstillelse',
  'egenkontroll': 'Egenkontroll',
  'overtakelse': 'Overtakelse',
  'sluttbefaring': 'Sluttbefaring',
  'vernerunder': 'Vernerunder',
  'garanti': 'Garanti',
  'dokumentasjon': 'Dokumentasjon',
  'sja': 'SJA (Sikker Jobb Analyse)',
  'risikovurdering': 'Risikovurdering',
  'avvikshåndtering': 'Avvikshåndtering',
};

export const sjekklisteLabels: Record<string, string> = {
  'forhandsbefaring': 'Forhåndsbefaring',
  'ferdigbefaring': 'Ferdigbefaring',
  'sluttbefaring': 'Sluttbefaring',
  'overtakelsesbefaring': 'Overtakelsesbefaring',
  '1_ars_garanti': '1-års garantibefaring',
  'tomrerarbeid': 'Tømrerarbeid',
  'vatrom_membran': 'Våtrom før membran',
  'ror_lukking': 'Rør før lukking',
  'elektro_trekking': 'Elektro før trekking',
  'luft_dampsperre': 'Luft-/dampsperre',
  'brannsikring': 'Brannsikring',
  'tekking_tak': 'Tekking / tak',
  'betong_armering': 'Betong / armering',
  'isolasjon': 'Isolasjon',
  'kontroll_lukking': 'Kontroll før lukking',
  'ue_evaluering': 'UE-evaluering',
  'kvalitet_fagarbeid': 'Sjekkliste kvalitet fagarbeid',
};

export function getRutineLabel(id: string): string {
  return rutineLabels[id] || id;
}

export function getSjekklisteLabel(id: string): string {
  return sjekklisteLabels[id] || id;
}
