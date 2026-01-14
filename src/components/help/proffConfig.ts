import hmsMascotImage from "@/assets/mascot-helper.png";
import matMascotImage from "@/assets/mat-proffen-mascot.png";

export interface ProffConfig {
  id: 'hms' | 'mat';
  name: string;
  welcomeMessage: string;
  mascotImage: string;
  edgeFunction: string;
  tips: string[];
  primaryColor: string;
}

export const hmsProffConfig: ProffConfig = {
  id: 'hms',
  name: 'HMS Proffen',
  welcomeMessage: 'Hei! 👋 Jeg er HMS Proffen. Spør meg om hva som helst om HMS-systemet, så skal jeg prøve å hjelpe deg!',
  mascotImage: hmsMascotImage,
  edgeFunction: 'mascot-chat',
  primaryColor: 'hsl(var(--primary))',
  tips: [
    "Visste du at jeg kan hjelpe deg å sette opp HMS-systemet automatisk basert på din bransje? ✨",
    "Tips: Røde risikoer krever obligatorisk revurdering etter at tiltak er iverksatt. 🔴",
    "Du kan laste opp sikkerhetsdatablader i Stoffkartoteket, så fyller systemet ut informasjonen automatisk! 📄",
    "HMS-håndboken oppdateres automatisk når du gjør endringer i systemet. 📚",
    "Bruk avvikssystemet til å rapportere både kvalitetsavvik og uønskede hendelser (RUH). ⚠️",
    "Ansatte kan stemple inn og ut med QR-kode i timeregistreringssystemet. ⏰",
    "Vernerunder bør gjennomføres jevnlig - systemet hjelper deg å dokumentere funnene. 🔍",
    "Du kan eksportere timelister til Excel for lønnskjøring. 📊",
  ],
};

export const matProffConfig: ProffConfig = {
  id: 'mat',
  name: 'MAT Proffen',
  welcomeMessage: 'Hei! 👋 Jeg er MAT Proffen - din ekspert på mattrygghet og IK-Mat! Spør meg om HACCP, hygiene, allergener eller noe annet relatert til næringsmiddelhåndtering!',
  mascotImage: matMascotImage,
  edgeFunction: 'mat-proff-chat',
  primaryColor: 'hsl(25, 95%, 53%)', // Orange for food/mat
  tips: [
    "Visste du at HACCP står for Hazard Analysis Critical Control Points? Det er grunnlaget for all mattrygghet! 🍽️",
    "Tips: Temperaturkontroll er en av de viktigste CCP-ene. Kjølevarer under 4°C, varmholdt over 60°C! 🌡️",
    "Allergener må alltid merkes tydelig - det kan være livsfarlig å glemme! ⚠️",
    "Renholdsplanen bør følges daglig og dokumenteres for sporbarhet. 🧹",
    "Sporbarhet betyr at du kan følge maten fra råvare til ferdig produkt - viktig ved tilbakekalling! 📦",
    "Personlig hygiene er grunnleggende - husk håndvask før matlaging! 🧼",
    "Skadedyrkontroll er påbudt i alle næringsmiddelbedrifter. Sjekk fellene jevnlig! 🪤",
    "Mottakskontroll av varer sikrer at du kun tar imot godkjente råvarer. ✅",
  ],
};

export function getProffConfig(pathname: string): ProffConfig {
  // Check if we're in IK-MAT routes
  if (pathname.startsWith('/ik-mat')) {
    return matProffConfig;
  }
  // Default to HMS Proffen
  return hmsProffConfig;
}
