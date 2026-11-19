import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Navigation } from "@/components/layout/navigation";
vi.mock("next/navigation", () => ({ usePathname: () => "/inbox" }));

describe("navigation", () => {
  it("exposes all sections and announces only the current destination", () => {
    render(<Navigation />);
    expect(
      screen.getByRole("navigation", { name: "Main navigation" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Inbox" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getAllByRole("link")).toHaveLength(4);
    expect(screen.getByRole("link", { name: "My places" })).toHaveAttribute(
      "href",
      "/places",
    );
    expect(screen.getByRole("link", { name: "Map" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
