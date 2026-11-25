import { toast } from "@/components/ui/toast";

type AuthResult = { error?: { message?: string } | null };

export async function toastNotifications(
  action: () => Promise<AuthResult>,
  successMessage: string,
  fallbackErrorMessage = "Something went wrong.",
): Promise<boolean> {
  try {
    const { error } = await action();
    if (error) {
      toast.add({
        title: error.message || fallbackErrorMessage,
        type: "error",
      });
      return false;
    }
  } catch {
    toast.add({ title: fallbackErrorMessage, type: "error" });
    return false;
  }
  toast.add({ title: successMessage, type: "success" });
  return true;
}
