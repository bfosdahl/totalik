export interface BrregCompanyInfo {
  name: string;
  address: string;
  orgNumber: string;
}

/**
 * Slår opp en bedrift i Enhetsregisteret (Brønnøysundregistrene).
 * Returnerer null hvis nummeret ikke er gyldig eller ikke finnes.
 */
export async function lookupBrregCompany(orgNumber: string): Promise<BrregCompanyInfo | null> {
  const digits = (orgNumber || "").replace(/\D/g, "");
  if (!/^\d{9}$/.test(digits)) return null;

  try {
    const res = await fetch(`https://data.brreg.no/enhetsregisteret/api/enheter/${digits}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.navn) return null;

    const adr = data.forretningsadresse || data.beliggenhetsadresse || null;
    const street = Array.isArray(adr?.adresse) ? adr.adresse.filter(Boolean).join(", ") : "";
    const address = [street, [adr?.postnummer, adr?.poststed].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join(", ");

    return { name: data.navn as string, address, orgNumber: digits };
  } catch {
    return null;
  }
}

export const isValidOrgNumber = (value: string) => /^\d{9}$/.test((value || "").replace(/\D/g, ""));
