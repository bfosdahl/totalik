import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "totalik_cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      /* localStorage utilgjengelig */
    }
  }, []);

  const decide = (value: "accepted" | "necessary") => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignorer */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card p-4 shadow-xl safe-area-bottom">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Vi bruker kun nødvendige informasjonskapsler for at siden skal fungere.{" "}
          <Link to="/personvern" className="underline text-primary">
            Les personvernerklæringen
          </Link>
          .
        </p>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => decide("necessary")}>
            Kun nødvendige
          </Button>
          <Button className="flex-1 sm:flex-none" onClick={() => decide("accepted")}>
            Godta
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CookieBanner;
