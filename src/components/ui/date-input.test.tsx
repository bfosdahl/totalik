import React from "react";
import { render, fireEvent, act } from "@testing-library/react";
import { useForm, Controller } from "react-hook-form";
import { DateInput, formatTyping, textToIso, splitClassName } from "./date-input";

const typeChars = (el: HTMLInputElement, s: string) => { for (const ch of s) fireEvent.change(el, { target: { value: el.value + ch } }); };
const vis = (c: HTMLElement, i = 0) => c.querySelectorAll('input[type="text"]')[i] as HTMLInputElement;
const hid = (c: HTMLElement, i = 0) => c.querySelectorAll('input[type="hidden"]')[i] as HTMLInputElement;

test("formatTyping", () => {
  expect(formatTyping("24122026")).toBe("24.12.2026");
  expect(formatTyping("1.")).toBe("01.");
  expect(formatTyping("01.5.")).toBe("01.05.");
  expect(formatTyping("1.5.2026")).toBe("01.05.2026");
  expect(formatTyping("1,5,2026")).toBe("01.05.2026");
  expect(formatTyping("01")).toBe("01");
  expect(formatTyping("01.05")).toBe("01.05");
  expect(formatTyping("2026-12-24")).toBe("24.12.2026");
  expect(formatTyping("..")).toBe("");
  expect(textToIso("1.5.2026")).toBe("2026-05-01");
  expect(textToIso("31.02.2026")).toBe(null);
});
test("splitClassName", () => {
  expect(splitClassName("w-40 mt-2 h-8 sm:max-w-xs flex-1 text-xs")).toEqual({ wrapper: "w-40 mt-2 sm:max-w-xs flex-1", input: "h-8 text-xs" });
});

test("controlled: external changes resync, partial typing kept", () => {
  let setV: (v: string) => void = () => {};
  const changes: string[] = [];
  function P() { const [v, s] = React.useState(""); setV = s; return <DateInput value={v} onChange={(e) => { changes.push(e.target.value); s(e.target.value); }} />; }
  const { container: c } = render(<P />);
  typeChars(vis(c), "24122026");
  expect(changes).toEqual(["2026-12-24"]); expect(vis(c).value).toBe("24.12.2026");
  act(() => setV("")); expect(vis(c).value).toBe("");
  typeChars(vis(c), "24.1");
  act(() => setV("")); expect(vis(c).value).toBe("24.1");
  act(() => setV("2027-01-05")); expect(vis(c).value).toBe("05.01.2027");
  fireEvent.change(vis(c), { target: { value: "" } }); expect(changes.at(-1)).toBe("");
});

test("react-hook-form register: defaults, typing, setValue, reset", () => {
  let api: any;
  function F() { const f = useForm<{ d: string }>({ defaultValues: { d: "2026-03-01" } }); api = f; return <form><DateInput type="date" {...f.register("d")} /></form>; }
  const { container: c } = render(<F />);
  expect(vis(c).value).toBe("01.03.2026");
  fireEvent.change(vis(c), { target: { value: "" } }); expect(api.getValues("d")).toBe("");
  typeChars(vis(c), "1.5.2026"); expect(vis(c).value).toBe("01.05.2026"); expect(api.getValues("d")).toBe("2026-05-01");
  act(() => api.setValue("d", "2026-07-04")); expect(vis(c).value).toBe("04.07.2026");
  act(() => api.reset({ d: "" })); expect(vis(c).value).toBe(""); expect(api.getValues("d")).toBe("");
  act(() => api.reset({ d: "2026-09-09" })); expect(vis(c).value).toBe("09.09.2026");
});

test("RHF without defaults (Ny underentreprenør style): type, reset(), remount", () => {
  let api: any;
  function F() { const f = useForm<{ s: string; e: string }>(); api = f; return <form><DateInput type="date" {...f.register("s")} /><DateInput type="date" {...f.register("e")} /></form>; }
  const { container: c, unmount } = render(<F />);
  typeChars(vis(c, 0), "01102026"); typeChars(vis(c, 1), "31122026");
  expect(api.getValues()).toEqual({ s: "2026-10-01", e: "2026-12-31" });
  act(() => api.reset());
  expect(vis(c, 0).value).toBe(""); expect(vis(c, 1).value).toBe(""); expect(api.getValues("s") ?? "").toBe(""); expect(api.getValues("e") ?? "").toBe("");
  typeChars(vis(c, 0), "02102026"); expect(api.getValues("s")).toBe("2026-10-02");
  unmount();
  const r2 = render(<F />); expect(vis(r2.container, 0).value).toBe(""); expect(api.getValues("s") ?? "").toBe("");
});

test("uncontrolled defaultValue + onBlur, min/max, disabled, readOnly, width", () => {
  const blurs: string[] = [];
  const { container: c } = render(<DateInput type="date" name="x" defaultValue="2026-02-02" min="2026-01-01" max="2026-12-31" onBlur={(e) => blurs.push(e.target.name + "=" + e.target.value)} className="w-40 h-8" />);
  expect(vis(c).value).toBe("02.02.2026");
  fireEvent.change(vis(c), { target: { value: "" } }); typeChars(vis(c), "05052027");
  expect(hid(c).value).toBe(""); fireEvent.blur(vis(c)); expect(vis(c).value).toBe("");
  typeChars(vis(c), "05052026"); fireEvent.blur(vis(c));
  expect(blurs).toEqual(["x=", "x=2026-05-05"]); expect(hid(c).value).toBe("2026-05-05");
  const wrap = c.firstElementChild as HTMLElement; expect(wrap.className).toContain("w-40"); expect(wrap.className).not.toContain("w-full");
  expect(vis(c).className).toContain("h-8");
  const d = render(<DateInput type="date" value="2026-01-01" onChange={() => {}} disabled />).container;
  expect(vis(d).disabled).toBe(true); expect(hid(d).disabled).toBe(true); expect((d.querySelector("button") as HTMLButtonElement).disabled).toBe(true);
  const r = render(<DateInput type="date" value="2026-01-01" onChange={() => {}} readOnly />).container;
  expect(vis(r).readOnly).toBe(true); expect((r.querySelector("button") as HTMLButtonElement).disabled).toBe(true);
});

test("uncontrolled defaultValue restored on native form reset", () => {
  const { container: c } = render(<form><DateInput type="date" name="x" defaultValue="2026-02-02" /></form>);
  fireEvent.change(vis(c), { target: { value: "" } }); typeChars(vis(c), "03032026"); expect(hid(c).value).toBe("2026-03-03");
  act(() => (c.querySelector("form") as HTMLFormElement).reset());
  expect(vis(c).value).toBe("02.02.2026"); expect(hid(c).value).toBe("2026-02-02");
});

test("react-hook-form Controller ({...field})", () => {
  let api: any;
  function F() { const f = useForm<{ d: string }>({ defaultValues: { d: "2026-04-04" } }); api = f; return <Controller control={f.control} name="d" render={({ field }) => <DateInput type="date" {...field} />} />; }
  const { container: c } = render(<F />);
  expect(vis(c).value).toBe("04.04.2026");
  fireEvent.change(vis(c), { target: { value: "" } }); typeChars(vis(c), "1.6.2026"); expect(api.getValues("d")).toBe("2026-06-01");
  act(() => api.reset({ d: "" })); expect(vis(c).value).toBe("");
});
