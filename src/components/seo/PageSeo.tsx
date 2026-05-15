import { Helmet } from "react-helmet-async";

interface PageSeoProps {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
}

const SITE = "https://totalik.no";

export function PageSeo({ title, description, path, noindex }: PageSeoProps) {
  const url = `${SITE}${path}`;
  const fullTitle = title.includes("Total-IK") ? title : `${title} - Total-IK`;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={`${SITE}/pwa-512x512.png`} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${SITE}/pwa-512x512.png`} />
      {noindex ? <meta name="robots" content="noindex,nofollow" /> : null}
    </Helmet>
  );
}
