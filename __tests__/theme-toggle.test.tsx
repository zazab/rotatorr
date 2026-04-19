import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "@/components/theme-toggle";

function mockLocalStorage() {
  const storage = new Map<string, string>();

  Object.defineProperty(window, "localStorage", {
    writable: true,
    value: {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage.set(key, value);
      }),
      removeItem: vi.fn((key: string) => {
        storage.delete(key);
      })
    }
  });
}

function mockMatchMedia(matches: boolean) {
  const addEventListener = vi.fn();
  const removeEventListener = vi.fn();

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addEventListener,
      removeEventListener,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  });

  return { addEventListener, removeEventListener };
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    mockLocalStorage();
    delete document.documentElement.dataset.theme;
  });

  it("uses the system theme on first render and persists a manual toggle", async () => {
    const user = userEvent.setup();
    const mediaQuery = mockMatchMedia(true);

    render(<ThemeToggle />);

    expect(await screen.findByRole("button", { name: "Switch to light mode" })).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(mediaQuery.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));

    await user.click(screen.getByRole("button", { name: "Switch to light mode" }));

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(window.localStorage.getItem("theme-preference")).toBe("light");
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeInTheDocument();
  });

  it("prefers a stored theme over the system setting", async () => {
    window.localStorage.setItem("theme-preference", "light");
    const mediaQuery = mockMatchMedia(true);

    render(<ThemeToggle />);

    expect(await screen.findByRole("button", { name: "Switch to dark mode" })).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(mediaQuery.addEventListener).not.toHaveBeenCalled();
  });
});
