import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { AdminSidebar } from "./AdminSidebar";
import AdminLayout from "@/app/[locale]/dashboard/admin/layout";
import CircularProductsPage from "@/app/[locale]/dashboard/admin/circular-products/page";

let mockPath = "/dashboard/admin/circular-products";
let mockLocale = "id";
let mockDesktop = false;
const mockBreakpointListeners = new Set<() => void>();
jest.mock("@/i18n/routing", () => ({
  usePathname: () => mockPath,
  Link: ({ children, onClick, ...props }: React.ComponentProps<"a">) => (
    <a
      {...props}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
    >
      {children}
    </a>
  ),
}));
jest.mock("next-intl", () => ({
  useLocale: () => mockLocale,
  useTranslations: () => (key: string) => key,
}));
jest.mock("@/components/providers/AuthProvider", () => ({
  useAuthContext: () => ({ email: "admin@sidebar.test", logout: jest.fn() }),
}));
jest.mock("@/components/auth/RouteGuard", () => ({
  RouteGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

beforeEach(() => {
  mockPath = "/dashboard/admin/circular-products";
  mockLocale = "id";
  mockDesktop = false;
  mockBreakpointListeners.clear();
  window.matchMedia = jest.fn(() => ({
    get matches() {
      return mockDesktop;
    },
    media: "(min-width: 1024px)",
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
    addEventListener: jest
      .fn()
      .mockImplementation((_event: string, listener: () => void) => {
        mockBreakpointListeners.add(listener);
      }),
    removeEventListener: jest
      .fn()
      .mockImplementation((_event: string, listener: () => void) => {
        mockBreakpointListeners.delete(listener);
      }),
  }));
});
afterEach(() => {
  document.body.style.overflow = "";
});

it("renders only one navigation and one main landmark on Circular Products", async () => {
  const originalFetch = global.fetch;
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => [],
  })) as jest.Mock;
  try {
    render(
      <AdminLayout>
        <CircularProductsPage />
      </AdminLayout>,
    );
    await screen.findByText("Tidak ada produk dalam antrean.");
    expect(
      screen.getAllByRole("navigation", { name: "Menu utama admin" }),
    ).toHaveLength(1);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(document.querySelectorAll("#admin-sidebar")).toHaveLength(1);
    expect(
      screen.getByRole("link", { name: "Circular Products" }),
    ).toHaveAttribute("aria-current", "page");
  } finally {
    global.fetch = originalFetch;
  }
});

it("does not mount a blocking backdrop or change the scroll lock while closed", () => {
  document.body.style.overflow = "auto";
  render(<AdminSidebar />);
  expect(
    screen.queryByRole("button", { name: "Tutup latar navigasi admin" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(document.body.style.overflow).toBe("auto");
});

it("opens from the menu button, closes with Escape, restores focus and the previous scroll state", () => {
  document.body.style.overflow = "auto";
  render(
    <AdminLayout>
      <p>Content</p>
    </AdminLayout>,
  );
  const trigger = screen.getByRole("button", { name: "Buka menu admin" });
  trigger.focus();
  fireEvent.click(trigger);
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(
    screen.getByRole("dialog", { name: "Navigasi admin" }),
  ).toHaveAttribute("aria-modal", "true");
  expect(document.body.style.overflow).toBe("hidden");
  expect(
    screen.getByRole("button", { name: "Tutup menu admin" }),
  ).toHaveFocus();
  fireEvent.keyDown(document, { key: "Escape" });
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(document.body.style.overflow).toBe("auto");
  expect(trigger).toHaveFocus();
});

it("keeps keyboard focus in the open menu and closes when the backdrop is clicked", () => {
  render(
    <AdminLayout>
      <p>Content</p>
    </AdminLayout>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Buka menu admin" }));
  const panel = screen.getByRole("dialog");
  const links = within(panel).getAllByRole("link");
  const logout = within(panel).getByRole("button", { name: "Keluar Akun" });
  logout.focus();
  fireEvent.keyDown(document, { key: "Tab" });
  expect(links[0]).toHaveFocus();
  fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
  expect(logout).toHaveFocus();
  fireEvent.click(
    screen.getByRole("button", { name: "Tutup latar navigasi admin" }),
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("closes immediately when a navigation link is selected, including the current page", () => {
  render(
    <AdminLayout>
      <p>Content</p>
    </AdminLayout>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Buka menu admin" }));
  fireEvent.click(screen.getByRole("link", { name: "Circular Products" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("closes after a route change and marks nested destinations as active", () => {
  const onClose = jest.fn();
  const view = render(<AdminSidebar isOpen onClose={onClose} />);
  expect(onClose).not.toHaveBeenCalled();
  mockPath = "/dashboard/admin/insights/create";
  view.rerender(<AdminSidebar isOpen onClose={onClose} />);
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("link", { name: "Valam Insights" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(
    screen.getByRole("link", { name: "AdminDashboard" }),
  ).not.toHaveAttribute("aria-current");
});

it("closes the mobile menu on the desktop breakpoint and translates its controls", async () => {
  mockLocale = "en";
  render(
    <AdminLayout>
      <p>Content</p>
    </AdminLayout>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Open admin menu" }));
  expect(screen.getByRole("link", { name: "Settings" })).toBeInTheDocument();
  mockDesktop = true;
  act(() => {
    mockBreakpointListeners.forEach((listener) => listener());
  });
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(document.body.style.overflow).toBe("");
});
