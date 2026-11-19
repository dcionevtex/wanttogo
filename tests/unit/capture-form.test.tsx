import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CaptureForm } from "@/components/inbox/capture-form";
const refresh = vi.fn();
const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, replace }) }));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
describe("capture persistence feedback", () => {
  it("keeps input and never shows success after a server failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { error: "Storage unavailable. Retry." },
            { status: 503 },
          ),
        ),
    );
    render(<CaptureForm />);
    fireEvent.change(screen.getByLabelText("Link to save"), {
      target: { value: "https://example.com/place" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save link" }));
    await screen.findByRole("alert");
    expect(screen.getByLabelText("Link to save")).toHaveValue(
      "https://example.com/place",
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });
  it("prevents repeated submission while waiting for persistence", async () => {
    let resolve!: (response: Response) => void;
    const fetch = vi.fn().mockImplementation(
      () =>
        new Promise<Response>((r) => {
          resolve = r;
        }),
    );
    vi.stubGlobal("fetch", fetch);
    render(<CaptureForm />);
    fireEvent.change(screen.getByLabelText("Link to save"), {
      target: { value: "https://example.com/place" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save link" }));
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    resolve(
      Response.json(
        { sourceId: "id", status: "pending", duplicate: false },
        { status: 201 },
      ),
    );
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Saved to your Inbox",
      ),
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Link to save")).toHaveValue("");
    expect(refresh).toHaveBeenCalledTimes(1);
  });
  it("offers reauthentication when the session expires and preserves the URL", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ error: "Please sign in again." }, { status: 401 }),
        ),
    );
    render(<CaptureForm />);
    fireEvent.change(screen.getByLabelText("Link to save"), {
      target: { value: "https://example.com/place" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save link" }));
    expect(
      await screen.findByRole("link", { name: "Sign in again" }),
    ).toHaveAttribute("href", "/login");
    expect(screen.getByLabelText("Link to save")).toHaveValue(
      "https://example.com/place",
    );
  });
});
