import React from "react";
import { render, fireEvent, act } from "@testing-library/react";
import { Input } from "./input";

const file = (name: string) => new File(["x"], name, { type: "application/pdf" });

test("file Input shows Norwegian text and file name, forwards ref and onChange", () => {
  const ref = React.createRef<HTMLInputElement>();
  const onChange = vi.fn();
  const { container, getByText } = render(<Input type="file" id="f" accept=".pdf" ref={ref} onChange={onChange} />);
  expect(getByText("Velg fil")).toBeTruthy();
  expect(getByText("Ingen fil valgt")).toBeTruthy();
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  expect(ref.current).toBe(input);
  expect(input.id).toBe("f");
  expect(input.accept).toBe(".pdf");
  fireEvent.change(input, { target: { files: [file("sds.pdf")] } });
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(getByText("sds.pdf")).toBeTruthy();
  act(() => { input.value = ""; });
  expect(getByText("Ingen fil valgt")).toBeTruthy();
});

test("multiple files and disabled", () => {
  const { container, getByText } = render(<Input type="file" multiple disabled />);
  expect(getByText("Velg filer")).toBeTruthy();
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  expect(input.disabled).toBe(true);
  expect((container.querySelector("button") as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(input, { target: { files: [file("a.pdf"), file("b.pdf")] } });
  expect(getByText("2 filer valgt")).toBeTruthy();
});

test("hidden file Input stays a plain native input", () => {
  const { container } = render(<Input type="file" className="hidden" />);
  expect(container.querySelector("button")).toBeNull();
  expect((container.firstElementChild as HTMLElement).tagName).toBe("INPUT");
});
