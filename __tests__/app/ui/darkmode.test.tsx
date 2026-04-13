import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";

jest.mock("next-themes", () => ({
  useTheme: jest.fn(() => ({ setTheme: jest.fn() })),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

jest.mock("lucide-react", () => ({
  Sun: () => <svg data-testid="sun-icon" />,
  Moon: () => <svg data-testid="moon-icon" />,
}));

import { ModeToggle } from "@/app/ui/darkmode";

const getMockSetTheme = () => {
  const { useTheme } = require("next-themes");
  const mockSetTheme = jest.fn();
  useTheme.mockReturnValue({ setTheme: mockSetTheme });
  return mockSetTheme;
};

describe("ModeToggle", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    const { useTheme } = require("next-themes");
    useTheme.mockReturnValue({ setTheme: jest.fn() });
  });

  it("renders the toggle button", () => {
    render(<ModeToggle />);
    expect(screen.getByText("Toggle theme")).toBeInTheDocument();
  });

  it("calls setTheme with 'light' when Light is clicked", () => {
    const mockSetTheme = getMockSetTheme();
    render(<ModeToggle />);
    fireEvent.click(screen.getByText("Light"));
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("calls setTheme with 'dark' when Dark is clicked", () => {
    const mockSetTheme = getMockSetTheme();
    render(<ModeToggle />);
    fireEvent.click(screen.getByText("Dark"));
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("calls setTheme with 'system' when System is clicked", () => {
    const mockSetTheme = getMockSetTheme();
    render(<ModeToggle />);
    fireEvent.click(screen.getByText("System"));
    expect(mockSetTheme).toHaveBeenCalledWith("system");
  });
});
