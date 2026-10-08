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
    "Spør meg om å registrere et avvik",
    "Jeg kan forklare HMS-regelverket",
    "Be meg lage en rutine",
    "Jeg kan lage en risikovurdering med tiltak",
    "Spør hvordan en funksjon i Totalik virker",
    "Be meg legge til et HMS-mål",
    "Jeg kan registrere et kurs for en ansatt",
    "Be meg legge et stoff i stoffkartoteket",
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
    "Be meg logge en temperatur",
    "Jeg kan legge til et kjøleskap eller en fryser",
    "Be meg legge inn en renholdsoppgave",
    "Jeg kan legge til en leverandør",
    "Be meg legge inn en risiko for mattrygghet",
    "Jeg kan forklare krav til hygiene og HACCP",
    "Spør hvor en funksjon i IK-Mat ligger",
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
