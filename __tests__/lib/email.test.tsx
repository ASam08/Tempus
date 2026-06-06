const mockEmailsSend = jest.fn();

jest.mock("resend", () => ({
  Resend: jest.fn(() => ({
    emails: { send: mockEmailsSend },
  })),
}));

jest.mock("@/components/emails/welcome-email", () => ({
  WelcomeEmail: jest.fn((props) => props),
}));

jest.mock("@/components/emails/password-reset-email", () => ({
  PasswordResetEmail: jest.fn((props) => props),
}));

import { WelcomeEmail } from "@/components/emails/welcome-email";
import { PasswordResetEmail } from "@/components/emails/password-reset-email";

describe("email", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      RESEND_API_KEY: "re_test_key",
      EMAIL_DOMAIN: "example.com",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("module initialisation", () => {
    it("instantiates Resend with RESEND_API_KEY", async () => {
      jest.resetModules();
      await import("@/lib/email");
      const { Resend: FreshResend } = await import("resend");

      expect(FreshResend).toHaveBeenCalledWith("re_test_key");
    });

    it("instantiates Resend with undefined when RESEND_API_KEY is not set", async () => {
      delete process.env.RESEND_API_KEY;

      jest.resetModules();
      await import("@/lib/email");
      const { Resend: FreshResend } = await import("resend");

      expect(FreshResend).toHaveBeenCalledWith(undefined);
    });
  });

  describe("sendWelcomeEmail", () => {
    it("sends an email with the correct from, to, subject, and react payload", async () => {
      mockEmailsSend.mockResolvedValue({ data: {}, error: null });

      jest.resetModules();
      const { sendWelcomeEmail } = await import("@/lib/email");
      await sendWelcomeEmail("user@test.com", "Alice");

      expect(mockEmailsSend).toHaveBeenCalledWith({
        from: "Tempus <noreply@example.com>",
        to: ["user@test.com"],
        subject: "Welcome to Tempus",
        react: WelcomeEmail({ name: "Alice" }),
      });
    });

    it("returns { success: true } when the send succeeds", async () => {
      mockEmailsSend.mockResolvedValue({ data: {}, error: null });

      jest.resetModules();
      const { sendWelcomeEmail } = await import("@/lib/email");
      const result = await sendWelcomeEmail("user@test.com", "Alice");

      expect(result).toEqual({ success: true });
    });

    it("returns { success: false, error } when resend returns an error", async () => {
      mockEmailsSend.mockResolvedValue({
        data: null,
        error: { message: "Invalid API key" },
      });

      jest.resetModules();
      const { sendWelcomeEmail } = await import("@/lib/email");
      const result = await sendWelcomeEmail("user@test.com", "Alice");

      expect(result).toEqual({ success: false, error: "Invalid API key" });
    });

    it("uses EMAIL_DOMAIN in the from address", async () => {
      process.env.EMAIL_DOMAIN = "my-school.nz";
      mockEmailsSend.mockResolvedValue({ data: {}, error: null });

      jest.resetModules();
      const { sendWelcomeEmail } = await import("@/lib/email");
      await sendWelcomeEmail("user@test.com", "Alice");

      expect(mockEmailsSend).toHaveBeenCalledWith(
        expect.objectContaining({ from: "Tempus <noreply@my-school.nz>" }),
      );
    });
  });

  describe("sendPasswordResetEmail", () => {
    it("sends an email with the correct from, to, subject, and react payload", async () => {
      mockEmailsSend.mockResolvedValue({ data: {}, error: null });

      jest.resetModules();
      const { sendPasswordResetEmail } = await import("@/lib/email");
      await sendPasswordResetEmail({
        email: "user@test.com",
        url: "https://example.com/reset-password?token=abc123",
      });

      expect(mockEmailsSend).toHaveBeenCalledWith({
        from: "Tempus <noreply@example.com>",
        to: ["user@test.com"],
        subject: "Reset your Tempus password",
        react: PasswordResetEmail({
          resetLink: "https://example.com/reset-password?token=abc123",
        }),
      });
    });

    it("returns undefined (fire-and-forget — does not return a result)", async () => {
      mockEmailsSend.mockResolvedValue({ data: {}, error: null });

      jest.resetModules();
      const { sendPasswordResetEmail } = await import("@/lib/email");
      const result = await sendPasswordResetEmail({
        email: "user@test.com",
        url: "https://example.com/reset-password?token=abc123",
      });

      expect(result).toBeUndefined();
    });

    it("does not throw when resend rejects (fire-and-forget)", async () => {
      mockEmailsSend.mockRejectedValue(new Error("Network failure"));

      jest.resetModules();
      const { sendPasswordResetEmail } = await import("@/lib/email");

      await expect(
        sendPasswordResetEmail({
          email: "user@test.com",
          url: "https://example.com/reset-password?token=abc123",
        }),
      ).resolves.toBeUndefined();
    });

    it("uses EMAIL_DOMAIN in the from address", async () => {
      process.env.EMAIL_DOMAIN = "my-school.nz";
      mockEmailsSend.mockResolvedValue({ data: {}, error: null });

      jest.resetModules();
      const { sendPasswordResetEmail } = await import("@/lib/email");
      await sendPasswordResetEmail({
        email: "user@test.com",
        url: "https://example.com/reset-password?token=abc123",
      });

      expect(mockEmailsSend).toHaveBeenCalledWith(
        expect.objectContaining({ from: "Tempus <noreply@my-school.nz>" }),
      );
    });
  });
});
