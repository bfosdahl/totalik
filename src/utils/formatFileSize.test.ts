import { formatFileSize } from "./formatFileSize";

test("formatFileSize", () => {
  expect(formatFileSize(512)).toBe("512 B");
  expect(formatFileSize(1536)).toBe("1.5 KB");
  expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
  expect(formatFileSize(0)).toBe("0 B");
  expect(formatFileSize(null, "")).toBe("");
  expect(formatFileSize(0, "Ukjent størrelse")).toBe("Ukjent størrelse");
  expect(formatFileSize(2048, "Ukjent størrelse")).toBe("2.0 KB");
});
