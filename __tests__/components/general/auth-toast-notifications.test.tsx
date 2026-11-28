import { authToastNotifications } from "@/components/general/auth-toast-notifications";

const mockToastAdd = jest.fn();

jest.mock("@/components/ui/toast", () => ({
  toast: {
    add: (...args: unknown[]) => mockToastAdd(...args),
  },
}));

describe("authToastNotifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when the action succeeds", () => {
    it("shows a success toast and returns true when error is undefined", async () => {
      const action = jest.fn().mockResolvedValue({});

      const result = await authToastNotifications(action, "Saved");

      expect(result).toBe(true);
      expect(action).toHaveBeenCalledTimes(1);
      expect(mockToastAdd).toHaveBeenCalledTimes(1);
      expect(mockToastAdd).toHaveBeenCalledWith({
        title: "Saved",
        type: "success",
      });
    });

    it("shows a success toast and returns true when error is null", async () => {
      const action = jest.fn().mockResolvedValue({ error: null });

      const result = await authToastNotifications(action, "Saved", "Failed");

      expect(result).toBe(true);
      expect(mockToastAdd).toHaveBeenCalledTimes(1);
      expect(mockToastAdd).toHaveBeenCalledWith({
        title: "Saved",
        type: "success",
      });
    });
  });

  describe("when a success description is provided", () => {
    it("includes the description in the success toast", async () => {
      const action = jest.fn().mockResolvedValue({});

      const result = await authToastNotifications(
        action,
        "Saved",
        "Failed",
        "Your changes have been saved.",
      );

      expect(result).toBe(true);
      expect(mockToastAdd).toHaveBeenCalledTimes(1);
      expect(mockToastAdd).toHaveBeenCalledWith({
        title: "Saved",
        description: "Your changes have been saved.",
        type: "success",
      });
    });

    it("does not use the success description on failure", async () => {
      const action = jest
        .fn()
        .mockResolvedValue({ error: { message: "Nope" } });

      await authToastNotifications(
        action,
        "Saved",
        "Failed",
        "Your changes have been saved.",
      );

      expect(mockToastAdd).toHaveBeenCalledTimes(1);
      expect(mockToastAdd).toHaveBeenCalledWith({
        title: "Nope",
        description: undefined,
        type: "error",
      });
    });
  });

  describe("when the action resolves with an error", () => {
    it("includes the failure description in the error toast", async () => {
      const action = jest
        .fn()
        .mockResolvedValue({ error: { message: "Invalid password" } });

      const result = await authToastNotifications(
        action,
        "Saved",
        "Failed",
        "Your changes have been saved.",
        "Please contact an administrator for support.",
      );

      expect(result).toBe(false);
      expect(mockToastAdd).toHaveBeenCalledTimes(1);
      expect(mockToastAdd).toHaveBeenCalledWith({
        title: "Invalid password",
        description: "Please contact an administrator for support.",
        type: "error",
      });
    });

    it("shows the error message and returns false", async () => {
      const action = jest
        .fn()
        .mockResolvedValue({ error: { message: "Email already in use" } });

      const result = await authToastNotifications(action, "Saved", "Failed");

      expect(result).toBe(false);
      expect(mockToastAdd).toHaveBeenCalledTimes(1);
      expect(mockToastAdd).toHaveBeenCalledWith({
        title: "Email already in use",
        type: "error",
      });
    });

    it.each([
      ["undefined", {}],
      ["an empty string", { message: "" }],
    ])(
      "falls back to the provided message when the error message is %s",
      async (_label, error) => {
        const action = jest.fn().mockResolvedValue({ error });

        const result = await authToastNotifications(action, "Saved", "Failed");

        expect(result).toBe(false);
        expect(mockToastAdd).toHaveBeenCalledTimes(1);
        expect(mockToastAdd).toHaveBeenCalledWith({
          title: "Failed",
          type: "error",
        });
      },
    );

    it("falls back to the default message when none is provided", async () => {
      const action = jest.fn().mockResolvedValue({ error: {} });

      const result = await authToastNotifications(action, "Saved");

      expect(result).toBe(false);
      expect(mockToastAdd).toHaveBeenCalledTimes(1);
      expect(mockToastAdd).toHaveBeenCalledWith({
        title: "Something went wrong.",
        type: "error",
      });
    });
  });

  describe("when the action throws", () => {
    it("shows the provided fallback message and returns false", async () => {
      const action = jest.fn().mockRejectedValue(new Error("network"));

      const result = await authToastNotifications(action, "Saved", "Failed");

      expect(result).toBe(false);
      expect(mockToastAdd).toHaveBeenCalledTimes(1);
      expect(mockToastAdd).toHaveBeenCalledWith({
        title: "Failed",
        type: "error",
      });
    });

    it("shows the default fallback message when none is provided", async () => {
      const action = jest.fn().mockRejectedValue(new Error("network"));

      const result = await authToastNotifications(action, "Saved");

      expect(result).toBe(false);
      expect(mockToastAdd).toHaveBeenCalledTimes(1);
      expect(mockToastAdd).toHaveBeenCalledWith({
        title: "Something went wrong.",
        type: "error",
      });
    });

    it("includes the failure description in the error toast", async () => {
      const action = jest.fn().mockRejectedValue(new Error("network"));

      const result = await authToastNotifications(
        action,
        "Saved",
        "Failed",
        "Your changes have been saved.",
        "Please contact an administrator for support.",
      );

      expect(result).toBe(false);
      expect(mockToastAdd).toHaveBeenCalledTimes(1);
      expect(mockToastAdd).toHaveBeenCalledWith({
        title: "Failed",
        description: "Please contact an administrator for support.",
        type: "error",
      });
    });

    it("does not show a success toast", async () => {
      const action = jest.fn().mockRejectedValue(new Error("network"));

      await authToastNotifications(action, "Saved", "Failed");

      expect(mockToastAdd).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: "success" }),
      );
    });
  });
});
