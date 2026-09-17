import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import {
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Loader2,
  Star,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageSeo } from "@/components/seo/PageSeo";
import { CookieBanner } from "@/components/public/CookieBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const leadSchema = z.object({
  orgNumber: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s/g, ""))
    .pipe(z.string().regex(/^\d{9}$/, "Organisasjonsnummer må ha 9 siffer")),
  companyName: z.string().trim().min(2, "Skriv inn bedriftsnavn").max(150),
  contactName: z.string().trim().min(2, "Skriv inn kontaktperson").max(120),
  email: z.string().trim().email("Ugyldig e-postadresse").max(200),
  phone: z
    .string()
    .trim()
    .min(8, "Skriv inn telefonnummer")
    .max(30)
    .refine((v) => v.replace(/\D/g, "").length >= 8, "Ugyldig telefonnummer"),
});

export interface NyRegLandingProps {
  source: string;
  path: string;
  seoTitle: string;
  seoDescription: string;
  heading: string;
  subheading: string;
  intro: string;
  benefits: { icon: LucideIcon; text: string }[];
  lawPoints: string[];
  termsPath: string;
}

const priceTerms = [
  "0 kr i 6 måneder – ingen betalingsinformasjon kreves ved aktivering",
  "Ingen fakturering i gratisperioden",
  "Dere må si opp skriftlig på e-post til post@athenahms.no innen 180 dager etter at systemet ble opprettet dersom dere ikke ønsker å fortsette",
  "Uten oppsigelse innen fristen fortsetter avtalen automatisk med 12 måneders binding til kr 6 990,- per år (fritatt mva). Ordinær pris for IK/HMS er kr 9 990,- per år",
  "Nettsiden er gratis så lenge abonnementet løper. Ønsker dere kun nettsiden etter oppsigelse: kr 2 990,-",
  "Systemet er klart innen 48 timer etter aktivering",
];

const steps = [
  { n: "1", title: "Bekreft bedriftsinformasjon", text: "Org.nr hentes automatisk fra Brønnøysundregistrene." },
  { n: "2", title: "Les og godta vilkårene", text: "Åpne og trygge vilkår – ingen skjulte kostnader." },
  { n: "3", title: "Vi setter i gang", text: "Systemet er klart innen 48 timer etter aktivering." },
];

export function NyRegLanding({
  source,
  path,
  seoTitle,
  seoDescription,
  heading,
  subheading,
  intro,
  benefits,
  lawPoints,
  termsPath,
}: NyRegLandingProps) {
  const [form, setForm] = useState({
    orgNumber: "",
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
  });
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [brregLoading, setBrregLoading] = useState(false);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const lookupBrreg = async (org: string) => {
    const digits = org.replace(/\s/g, "");
    if (!/^\d{9}$/.test(digits)) return;
    setBrregLoading(true);
    try {
      const res = await fetch(`https://data.brreg.no/enhetsregisteret/api/enheter/${digits}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.navn) setForm((prev) => ({ ...prev, companyName: data.navn }));
      }
    } catch {
      /* stille feil – brukeren kan skrive navnet selv */
    } finally {
      setBrregLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!terms) {
      setErrors({ terms: "Du må godta vilkårene" });
      return;
    }

    const parsed = leadSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = String(issue.path[0]);
        if (!next[key]) next[key] = issue.message;
      });
      setErrors(next);
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-nybygg-lead", {
        body: { ...parsed.data, termsAccepted: true, source },
      });
      if (error || (data as { error?: string } | null)?.error) {
        throw new Error((data as { error?: string } | null)?.error || error?.message);
      }
      setDone(true);
    } catch (err) {
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : "Noe gikk galt. Ring Viktor på 941 49 311 så hjelper vi deg."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageSeo title={seoTitle} description={seoDescription} path={path} />

      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <span className="text-lg font-bold tracking-tight text-primary">Total-IK</span>
          <a
            href="tel:+4794149311"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            941 49 311
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="px-5 py-12 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-4 py-1.5 text-sm font-semibold text-success">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Gratis i 6 måneder
          </span>
          <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
            {heading}
          </h1>
          <p className="mt-4 text-xl font-semibold text-primary sm:text-2xl">{subheading}</p>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {intro}
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 h-14 w-full bg-success text-success-foreground hover:bg-success/90 sm:w-auto sm:px-10"
          >
            <a href="#aktiver">Aktiver min gratis konto</a>
          </Button>
          <p className="mt-3 text-sm text-muted-foreground">
            Ingen betalingsinfo nødvendig • Klar innen 48 timer
          </p>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-foreground">
            <Star className="h-4 w-4 text-primary" aria-hidden="true" />
            800+ bedrifter bruker Total-IK
          </p>
        </div>
      </section>

      {/* Hva du får */}
      <section className="bg-secondary/50 px-5 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Dette får dere gratis i 6 måneder
          </h2>
          <ul className="mt-8 space-y-4">
            {benefits.map(({ icon: Icon, text }) => (
              <li key={text} className="flex gap-4 rounded-xl bg-card p-4 shadow-card">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <span className="text-base leading-relaxed text-foreground">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Lovkrav */}
      <section className="px-5 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Lovpålagte krav</h2>
          <ul className="mt-6 space-y-3">
            {lawPoints.map((point) => (
              <li key={point} className="flex gap-3 text-base leading-relaxed text-foreground">
                <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Pris */}
      <section className="bg-secondary/50 px-5 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Pris</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Card className="border-border">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Verdi</p>
                <p className="mt-1 text-2xl font-bold text-foreground line-through">6 485 kr</p>
              </CardContent>
            </Card>
            <Card className="border-success/40 bg-success/5">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Din pris nå</p>
                <p className="mt-1 text-2xl font-bold text-success">0 kr</p>
                <p className="text-sm text-muted-foreground">i 6 måneder</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Deretter</p>
                <p className="mt-1 text-2xl font-bold text-foreground">6 990 kr/år</p>
                <p className="text-sm text-muted-foreground">fritatt mva</p>
              </CardContent>
            </Card>
          </div>

          <h3 className="mt-10 text-xl font-bold text-foreground">Vilkår</h3>
          <ul className="mt-4 space-y-3">
            {priceTerms.map((term) => (
              <li key={term} className="flex gap-3 text-base leading-relaxed text-foreground">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
                {term}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Steg */}
      <section className="px-5 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Slik kommer dere i gang
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {steps.map((step) => (
              <Card key={step.n} className="border-border">
                <CardContent className="p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {step.n}
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Skjema */}
      <section id="aktiver" className="bg-secondary/50 px-5 py-12 sm:py-16">
        <div className="mx-auto max-w-xl">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Aktiver min gratis konto
          </h2>

          {done ? (
            <Card className="mt-6 border-success/40">
              <CardContent className="space-y-3 p-6 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-success" aria-hidden="true" />
                <h3 className="text-xl font-semibold text-foreground">
                  Takk! Aktiveringen er mottatt
                </h3>
                <p className="text-muted-foreground">
                  Vi tar kontakt innen 48 timer, og systemet er klart til bruk. Du har også fått en
                  bekreftelse på e-post.
                </p>
                <p className="text-sm text-muted-foreground">
                  Haster det? Ring Viktor på{" "}
                  <a href="tel:+4794149311" className="font-medium text-primary underline">
                    941 49 311
                  </a>
                </p>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
              <div className="space-y-2">
                <Label htmlFor="orgNumber">Organisasjonsnummer</Label>
                <Input
                  id="orgNumber"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={11}
                  placeholder="9 siffer"
                  value={form.orgNumber}
                  onChange={(e) => set("orgNumber")(e.target.value)}
                  onBlur={(e) => lookupBrreg(e.target.value)}
                />
                {brregLoading && (
                  <p className="text-xs text-muted-foreground">Henter bedriftsnavn…</p>
                )}
                {errors.orgNumber && <p className="text-sm text-destructive">{errors.orgNumber}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Bedriftsnavn</Label>
                <Input
                  id="companyName"
                  autoComplete="organization"
                  maxLength={150}
                  value={form.companyName}
                  onChange={(e) => set("companyName")(e.target.value)}
                />
                {errors.companyName && (
                  <p className="text-sm text-destructive">{errors.companyName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactName">Kontaktperson</Label>
                <Input
                  id="contactName"
                  autoComplete="name"
                  maxLength={120}
                  value={form.contactName}
                  onChange={(e) => set("contactName")(e.target.value)}
                />
                {errors.contactName && (
                  <p className="text-sm text-destructive">{errors.contactName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-post</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  maxLength={200}
                  value={form.email}
                  onChange={(e) => set("email")(e.target.value)}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={30}
                  value={form.phone}
                  onChange={(e) => set("phone")(e.target.value)}
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-card p-4">
                <Checkbox
                  id="terms"
                  checked={terms}
                  onCheckedChange={(v) => setTerms(v === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="terms" className="text-sm font-normal leading-relaxed">
                  Jeg har lest og godtar{" "}
                  <Link to={termsPath} className="text-primary underline">
                    vilkårene
                  </Link>
                </Label>
              </div>
              {errors.terms && <p className="text-sm text-destructive">{errors.terms}</p>}

              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="h-14 w-full bg-success text-base text-success-foreground hover:bg-success/90"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                    Sender…
                  </>
                ) : (
                  "Aktiver min gratis konto"
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Ingen betalingsinfo nødvendig • Klar innen 48 timer
              </p>
            </form>
          )}
        </div>
      </section>

      {/* Kontakt */}
      <section className="px-5 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl space-y-4">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Lurer du på noe?</h2>
          <p className="text-muted-foreground">
            Viktor Ørnelund, HMS-rådgiver. Ring{" "}
            <a href="tel:+4794149311" className="font-medium text-primary underline">
              941 49 311
            </a>{" "}
            eller send e-post til{" "}
            <a href="mailto:viktor@athenahms.no" className="font-medium text-primary underline">
              viktor@athenahms.no
            </a>
            . Vi tar kontakt med deg innen 48 timer etter aktivering.
          </p>
        </div>
      </section>

      <footer className="border-t border-border bg-card px-5 py-10">
        <div className="mx-auto max-w-3xl space-y-2 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Athena Kurs og Internkontroll AS</p>
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4" aria-hidden="true" /> Grønland 1, 1767 Halden
          </p>
          <p>Org.nr 934 606 450</p>
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4" aria-hidden="true" /> Viktor Ørnelund – +47 941 49 311
          </p>
          <p className="flex items-center gap-2">
            <Mail className="h-4 w-4" aria-hidden="true" /> viktor@athenahms.no
          </p>
          <p className="pt-3">
            <Link to={termsPath} className="underline">
              Vilkår
            </Link>{" "}
            ·{" "}
            <Link to="/personvern" className="underline">
              Personvern
            </Link>
          </p>
        </div>
      </footer>

      <CookieBanner />
    </div>
  );
}

export default NyRegLanding;
