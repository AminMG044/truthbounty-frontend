import { act, render, screen, waitFor } from "@testing-library/react";
import { PlatformSupportGuard } from "../PlatformSupportGuard";

jest.mock("@/lib/platform-support", () => ({
  detectPlatformSupport: jest.fn(),
}));

const { detectPlatformSupport } = jest.requireMock("@/lib/platform-support");

describe("PlatformSupportGuard", () => {
  beforeEach(() => {
    detectPlatformSupport.mockReset();
  });

  it("mounts application children only after support is verified", async () => {
    detectPlatformSupport.mockReturnValue({
      supported: true,
      missingCapabilities: [],
    });
    render(
      <PlatformSupportGuard>
        <button type="button">Submit mutation</button>
      </PlatformSupportGuard>,
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Submit mutation" })).toBeInTheDocument(),
    );
    expect(detectPlatformSupport).toHaveBeenCalledTimes(1);
  });

  it("renders an accessible unsupported state without mounting children", async () => {
    detectPlatformSupport.mockReturnValue({
      supported: false,
      missingCapabilities: ["fetch", "Web Crypto (subtle)"],
    });
    render(
      <PlatformSupportGuard>
        <button type="button">Submit mutation</button>
      </PlatformSupportGuard>,
    );

    await act(async () => {});

    expect(screen.getByRole("alert")).toHaveAccessibleName(
      "Unsupported browser capabilities",
    );
    expect(screen.getByText("fetch")).toBeInTheDocument();
    expect(screen.getByText("Web Crypto (subtle)")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit mutation" })).toBeNull();
  });
});