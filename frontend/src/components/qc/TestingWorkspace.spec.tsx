import { render, screen, waitFor } from "@testing-library/react";
import { TestingWorkspace } from "./TestingWorkspace";
jest.mock("next-intl", () => ({ useLocale: () => "en" }));
jest.mock("@/i18n/routing", () => ({
  Link: ({ href, children }: any) => <a href={href}>{children}</a>,
}));
it("shows configured partner names and explicit empty operational instructions", async () => {
  Object.defineProperty(global.crypto, "randomUUID", {
    configurable: true,
    value: () => "test-key",
  });
  global.fetch = jest.fn(async (url: string) => ({
    ok: true,
    json: async () =>
      url.endsWith("manage")
        ? { requests: [], reports: [], batches: [], notifications: [] }
        : [
            {
              id: "db-partner",
              name: "DYNAMIC TEST LAB",
              services: ["Configured service"],
            },
          ],
  })) as any;
  render(<TestingWorkspace />);
  await screen.findByText("Testing & Quality Documents");
  expect(
    screen.getAllByRole("option", { name: "DYNAMIC TEST LAB" })[0],
  ).toBeInTheDocument();
  expect(screen.getAllByText(/Awaiting admin confirmation/)).toHaveLength(5);
  expect(screen.queryByText(/50ml/)).not.toBeInTheDocument();
  await waitFor(() =>
    expect(screen.getByText("No requests yet.")).toBeInTheDocument(),
  );
});
