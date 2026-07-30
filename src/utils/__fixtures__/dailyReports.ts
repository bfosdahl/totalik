import { FIXTURE_PHOTOS, type FixturePhoto } from "./dailyReportPhotos";

/**
 * Representative dagsrapporter brukt i PDF-testene.
 * Dekker ulike bildekilder (mobilkamera, drone, skjermbilde, scan, opplasting)
 * og ulike sideforhold i samme rapport.
 */
export interface FixtureDailyReport {
  id: string;
  name: string;
  report_number: string;
  photos: FixturePhoto[];
}

const byId = (id: string): FixturePhoto => {
  const p = FIXTURE_PHOTOS.find((x) => x.id === id);
  if (!p) throw new Error(`Ukjent fixture-bilde: ${id}`);
  return p;
};

export const FIXTURE_REPORTS: FixtureDailyReport[] = [
  {
    id: "kun-mobilkamera",
    name: "Kun mobilkamera (landskap + portrett)",
    report_number: "DR-2026-0001",
    photos: [byId("landskap_4_3"), byId("portrett_3_4")],
  },
  {
    id: "blandet-kilde",
    name: "Blandede kilder og formater",
    report_number: "DR-2026-0002",
    photos: [
      byId("landskap_4_3"),
      byId("kvadrat_1_1"),
      byId("panorama_16_9"),
      byId("odde_5_7"),
    ],
  },
  {
    id: "ekstreme-format",
    name: "Ekstreme sideforhold (panorama + hoyt fasadebilde)",
    report_number: "DR-2026-0003",
    photos: [byId("ultrapanorama_3_1"), byId("hoy_1_4"), byId("miniatyr_4_3")],
  },
  {
    id: "oddetall-bilder",
    name: "Oddetall bilder (siste rad halvfull)",
    report_number: "DR-2026-0004",
    photos: [byId("portrett_3_4"), byId("hoy_1_4"), byId("panorama_16_9")],
  },
  {
    id: "alle-format",
    name: "Alle formater i en rapport (flersidig)",
    report_number: "DR-2026-0005",
    photos: [...FIXTURE_PHOTOS, ...FIXTURE_PHOTOS],
  },
];

export { FIXTURE_PHOTOS };
export type { FixturePhoto };
