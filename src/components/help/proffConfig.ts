import hmsMascotImage from "@/assets/mascot-helper.png";
import matMascotImage from "@/assets/mat-proffen-mascot.png";
import { t } from "@/i18n/t";

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
    t("auto.visste_du_at_jeg_kan_hjelpe_deg_aa_sette"),
    t("auto.tips_roede_risikoer_krever_obligatorisk_"),
    t("auto.du_kan_laste_opp_sikkerhetsdatablader_i_"),
    t("auto.hms_haandboken_oppdateres_automatisk_naa"),
    t("auto.bruk_avvikssystemet_til_aa_rapportere_ba"),
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
    t("auto.visste_du_at_haccp_staar_for_hazard_anal"),
    t("auto.tips_temperaturkontroll_er_en_av_de_vikt"),
    t("auto.allergener_maa_alltid_merkes_tydelig_det"),
    t("auto.renholdsplanen_boer_foelges_daglig_og_do"),
    t("auto.sporbarhet_betyr_at_du_kan_foelge_maten_"),
    t("auto.personlig_hygiene_er_grunnleggende_husk_"),
    t("auto.skadedyrkontroll_er_paabudt_i_alle_naeri"),
    t("auto.mottakskontroll_av_varer_sikrer_at_du_ku"),
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
