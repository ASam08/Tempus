const mockEmailsSend = jest.fn();

jest.mock("resend", () => ({
  Resend: jest.fn(() => ({
    emails: { send: mockEmailsSend },
  })),
}));

jest.mock("@/components/emails/welcome-email", () => ({
  __esModule: true,
  default: jest.fn((props) => props),
}));

jest.mock("@/components/emails/password-reset-email", () => ({
  __esModule: true,
  default: jest.fn((props) => props),
}));

describe("email", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      RESEND_API_KEY: "re_test_key",
      EMAIL_DOMAIN: "example.com",
      TEMPUS_URL: "http://localhost",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("module initialisation", () => {
    it("instantiates Resend with RESEND_API_KEY when it is set", async () => {
      jest.resetModules();
      const { Resend: FreshResend } = await import("resend");
      await import("@/lib/email");

      expect(FreshResend).toHaveBeenCalledWith("re_test_key");
    });

    it("does not instantiate Resend when RESEND_API_KEY is missing", async () => {
      delete process.env.RESEND_API_KEY;

      jest.resetModules();
      const { Resend: FreshResend } = await import("resend");
      await import("@/lib/email");

      expect(FreshResend).not.toHaveBeenCalled();
    });

    it("instantiates Resend even when EMAIL_DOMAIN is missing", async () => {
      delete process.env.EMAIL_DOMAIN;

      jest.resetModules();
      const { Resend: FreshResend } = await import("resend");
      await import("@/lib/email");

      expect(FreshResend).toHaveBeenCalledWith("re_test_key");
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
        react: expect.any(Object),
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

    it("returns { success: false, error } when RESEND_API_KEY is not set", async () => {
      delete process.env.RESEND_API_KEY;

      jest.resetModules();
      const { sendWelcomeEmail } = await import("@/lib/email");
      const result = await sendWelcomeEmail("user@test.com", "Alice");

      expect(result).toEqual({
        success: false,
        error: "Email service disabled",
      });
      expect(mockEmailsSend).not.toHaveBeenCalled();
    });

    it("returns { success: false, error } when EMAIL_DOMAIN is not set", async () => {
      delete process.env.EMAIL_DOMAIN;

      jest.resetModules();
      const { sendWelcomeEmail } = await import("@/lib/email");
      const result = await sendWelcomeEmail("user@test.com", "Alice");

      expect(result).toEqual({
        success: false,
        error: "Email service disabled",
      });
      expect(mockEmailsSend).not.toHaveBeenCalled();
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
        react: expect.any(Object),
      });
    });

    it("resolves to undefined (fire-and-forget)", async () => {
      mockEmailsSend.mockResolvedValue({ data: {}, error: null });

      jest.resetModules();
      const { sendPasswordResetEmail } = await import("@/lib/email");
      const result = await sendPasswordResetEmail({
        email: "user@test.com",
        url: "https://example.com/reset-password?token=abc123",
      });

      expect(result).toBeUndefined();
    });

    it("resolves without throwing when resend rejects (fire-and-forget)", async () => {
      mockEmailsSend.mockRejectedValue(new Error("Network failure"));

      jest.resetModules();
      const { sendPasswordResetEmail } = await import("@/lib/email");
      await sendPasswordResetEmail({
        email: "user@test.com",
        url: "https://example.com/reset-password?token=abc123",
      });

      expect(mockEmailsSend).toHaveBeenCalled();
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

    it("skips send when RESEND_API_KEY is not set", async () => {
      delete process.env.RESEND_API_KEY;

      jest.resetModules();
      const { sendPasswordResetEmail } = await import("@/lib/email");
      await sendPasswordResetEmail({
        email: "user@test.com",
        url: "https://example.com/reset-password?token=abc123",
      });

      expect(mockEmailsSend).not.toHaveBeenCalled();
    });

    it("skips send when EMAIL_DOMAIN is not set", async () => {
      delete process.env.EMAIL_DOMAIN;

      jest.resetModules();
      const { sendPasswordResetEmail } = await import("@/lib/email");
      await sendPasswordResetEmail({
        email: "user@test.com",
        url: "https://example.com/reset-password?token=abc123",
      });

      expect(mockEmailsSend).not.toHaveBeenCalled();
    });
  });
});
