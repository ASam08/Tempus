import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
  useSearchParams: jest.fn(() => ({ get: jest.fn(() => null) })),
}));

jest.mock("@/components/ui/signup/signup-form", () => ({
  __esModule: true,
  SignupForm: () => <div>SignUp Form</div>,
}));

jest.mock("@/components/branding/tempuslogobrand", () => ({
  __esModule: true,
  default: () => <img alt="Tempus logo" />,
}));

import SignUpPage from "@/app/signup/page";

describe("SignUpPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the signup form", () => {
    render(<SignUpPage />);
    expect(screen.getByText(/signup form/i)).toBeInTheDocument();
  });
});
