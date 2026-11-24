import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DistrictSelector } from "@/components/layout/AppHeader";

const { select } = vi.hoisted(() => ({ select: vi.fn() }));
vi.mock("@/lib/district", () => ({ useDistrict: () => ({
  districtId: "pudukkottai", setDistrictId: select,
  districts: [
    { id: "pudukkottai", name: "Pudukkottai", tamilName: "புதுக்கோட்டை" },
    { id: "chennai", name: "Chennai", tamilName: "சென்னை" },
    { id: "tiruchirappalli", name: "Tiruchirappalli", tamilName: "திருச்சிராப்பள்ளி" },
  ],
}) }));
beforeAll(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => { cleanup(); select.mockClear(); });

function open() {
  render(<QueryClientProvider client={new QueryClient()}><DistrictSelector /></QueryClientProvider>);
  fireEvent.click(screen.getByRole("combobox", { name: "Select district" }));
  return screen.getByRole("combobox", { name: "Search district" });
}

describe("Searchable district selector", () => {
  it.each(["Chennai", "சென்னை"])("finds and switches district using %s", async (query) => {
    fireEvent.change(open(), { target: { value: query } });
    const option = await screen.findByRole("option", { name: /Chennai/ });
    await waitFor(() => expect(screen.queryByRole("option", { name: /Pudukkottai/ })).toBeNull());
    fireEvent.click(option);
    expect(select).toHaveBeenCalledWith("chennai");
    expect(screen.queryByRole("combobox", { name: "Search district" })).toBeNull();
  });
  it("supports Trichy alias and Enter selection", async () => {
    const input = open();
    fireEvent.change(input, { target: { value: "Trichy" } });
    await screen.findByRole("option", { name: /Tiruchirappalli/ });
    await waitFor(() => expect(screen.queryByRole("option", { name: /Chennai/ })).toBeNull());
    fireEvent.keyDown(input, { key: "Enter", code: "Enter", keyCode: 13 });
    expect(select).toHaveBeenCalledWith("tiruchirappalli");
  });
  it("explains when there is no matching district", async () => {
    fireEvent.change(open(), { target: { value: "not-a-district" } });
    expect(await screen.findByText("No matching district found.")).toBeInTheDocument();
  });
});
