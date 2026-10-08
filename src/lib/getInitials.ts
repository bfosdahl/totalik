// Initials for avatars. Accepts either separate name parts (and an email as a
// last resort) or one full name. Always returns 1-2 uppercase letters, or "?".
export function getInitials(
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null,
): string {
  if (lastName === undefined && firstName && /\s/.test(firstName)) {
    return firstName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";
  }
  const first = firstName?.trim()?.[0] || "";
  const last = lastName?.trim()?.[0] || "";
  return (first + last).toUpperCase() || (email?.trim()?.[0] || "?").toUpperCase();
}
