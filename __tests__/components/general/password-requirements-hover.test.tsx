import { render, within } from "@testing-library/react";
import { PasswordRequirementsHover } from "@/components/general/password-requirements-hover";

jest.mock("lucide-react", () => ({
  LucideInfo: (props: { className?: string; "aria-label"?: string }) => (
    <svg {...props} />
  ),
}));

jest.mock(
  "@/components/ui/hover-card",
  () => require("@/testing/mocks/shadcn").hoverCardMock,
);

jest.mock(
  "@/components/ui/popover",
  () => require("@/testing/mocks/shadcn").popoverMock,
);

function renderWrappers() {
  const { container } = render(<PasswordRequirementsHover />);
  const [desktopWrapper, mobileWrapper] = Array.from(
    container.firstElementChild!.children,
  ) as HTMLElement[];
  return { desktopWrapper, mobileWrapper };
}

describe("PasswordRequirementsHover", () => {
  it("shows the HoverCard variant only at md breakpoints and above, and the Popover variant only below md", () => {
    const { desktopWrapper, mobileWrapper } = renderWrappers();
    expect(desktopWrapper).toHaveClass("hidden", "md:flex");
    expect(mobileWrapper).toHaveClass("md:hidden");
  });

  it("labels the desktop hover icon itself as the password requirements trigger", () => {
    const { desktopWrapper } = renderWrappers();
    expect(
      within(desktopWrapper).getByLabelText("Password requirements"),
    ).toBeInTheDocument();
  });

  it("styles the desktop hover icon with the muted, sized icon classes", () => {
    const { desktopWrapper } = renderWrappers();
    expect(
      within(desktopWrapper).getByLabelText("Password requirements"),
    ).toHaveClass("text-muted-foreground", "h-4", "w-4");
  });

  it("labels the mobile popover trigger, rather than the icon, as the password requirements trigger", () => {
    const { mobileWrapper } = renderWrappers();
    expect(
      within(mobileWrapper).getByLabelText("Password requirements"),
    ).toBeInTheDocument();
  });

  it("renders the password requirements list inside both the HoverCard and Popover content", () => {
    const { desktopWrapper, mobileWrapper } = renderWrappers();
    [desktopWrapper, mobileWrapper].forEach((wrapper) => {
      expect(within(wrapper).getByText("Password must:")).toBeInTheDocument();
      expect(
        within(wrapper).getByText("Be at least 8 characters long."),
      ).toBeInTheDocument();
      expect(
        within(wrapper).getByText("Contain at least one letter."),
      ).toBeInTheDocument();
      expect(
        within(wrapper).getByText("Contain at least one number."),
      ).toBeInTheDocument();
      expect(
        within(wrapper).getByText("Contain at least one special character."),
      ).toBeInTheDocument();
    });
  });
});
