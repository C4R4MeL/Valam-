import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BatchReports, ReportSummary } from "./BatchReports";
let mockLocale = "id";
jest.mock("next-intl", () => ({ useLocale: () => mockLocale }));
const report = {
  id: "report-1",
  issuer_snapshot: { name: "LAB FROM DATABASE" },
  report_number: "REPORT-1",
  sample_identity: "SAMPLE-1",
  review_status: "APPROVED",
  parameters: [{ name: "Moisture", value: "0", unit: "%" }],
  conclusion: null,
};
afterEach(() => {
  mockLocale = "id";
  jest.restoreAllMocks();
});
it("shows the actual issuer and preserves zero values without invented dates or evaluation", () => {
  render(<ReportSummary report={report} />);
  expect(screen.getByText("Diuji oleh LAB FROM DATABASE")).toBeInTheDocument();
  expect(screen.getByText("0")).toBeInTheDocument();
  expect(screen.getByText(/Belum dievaluasi/)).toBeInTheDocument();
  expect(screen.getByText("Pratinjau asli")).toHaveAttribute(
    "href",
    expect.stringContaining("/reports/report-1/source"),
  );
  expect(screen.getByText("Unduh asli")).toHaveAttribute(
    "href",
    expect.stringContaining("/reports/report-1/source?download=1"),
  );
});
it("labels demo and pending documents without a tested-by badge", () => {
  const { rerender } = render(
    <ReportSummary report={{ ...report, is_demo: true }} />,
  );
  expect(screen.getByText("DEMONSTRASI")).toBeInTheDocument();
  expect(screen.queryByText(/Diuji oleh/)).not.toBeInTheDocument();
  rerender(<ReportSummary report={{ ...report, review_status: "PENDING" }} />);
  expect(screen.getByText("Menunggu pemeriksaan")).toBeInTheDocument();
  expect(screen.queryByText(/Diuji oleh/)).not.toBeInTheDocument();
});
it("renders English report information and empty values", () => {
  mockLocale = "en";
  render(<ReportSummary report={{ ...report, parameters: [] }} />);
  expect(screen.getByText("Tested by LAB FROM DATABASE")).toBeInTheDocument();
  expect(screen.getByText("Parameters are unavailable.")).toBeInTheDocument();
  expect(screen.getByText("Preview original")).toBeInTheDocument();
});
it("refreshes the public report after revocation and clears stale badges on errors", async () => {
  let rows = [report];
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => rows,
  })) as any;
  render(<BatchReports productId="batch-1" />);
  await screen.findByText("Diuji oleh LAB FROM DATABASE");
  rows = [];
  fireEvent.focus(window);
  await waitFor(() =>
    expect(
      screen.queryByText("Diuji oleh LAB FROM DATABASE"),
    ).not.toBeInTheDocument(),
  );
  expect(screen.getByText(/Belum ada dokumen hasil uji/)).toBeInTheDocument();
});
