import { describe, it, expect } from "vitest";
import { getInitials } from "./getInitials";

describe("getInitials", () => {
  it("uses the first letter of first and last name", () => {
    expect(getInitials("Test", "Admin")).toBe("TA");
    expect(getInitials("åse", "ødegård")).toBe("ÅØ");
  });
  it("falls back to the first name, then the email, then ?", () => {
    expect(getInitials("Test", null)).toBe("T");
    expect(getInitials(null, null, "a@b.no")).toBe("A");
    expect(getInitials(null, null, null)).toBe("?");
    expect(getInitials()).toBe("?");
  });
  it("splits a single full name into two initials", () => {
    expect(getInitials("Test Admin")).toBe("TA");
    expect(getInitials("Test Admin Bruker")).toBe("TA");
    expect(getInitials("Test")).toBe("T");
  });
});
