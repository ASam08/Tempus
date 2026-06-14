import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
  useSearchParams: jest.fn(() => ({ get: jest.fn(() => null) })),
}));

jest.mock("@/components/ui/usermigrationsetup/setup-form", () => ({
  __esModule: true,
  SetupForm: () => <div>Setup Form</div>,
}));

jest.mock("@/components/branding/tempuslogobrand", () => ({
  __esModule: true,
  default: () => <img alt="Tempus logo" />,
}));

import SetupPage from "@/app/usermigrationsetup/page";

describe("SetupPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the setup form", () => {
    render(<SetupPage />);
    expect(screen.getByText(/setup form/i)).toBeInTheDocument();
  });
});
