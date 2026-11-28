import { toast } from "@/components/ui/toast";

type AuthResult = { error?: { message?: string } | null };

export async function authToastNotifications(
  action: () => Promise<AuthResult>,
  successMessage: string,
  fallbackErrorMessage = "Something went wrong.",
  successDescription?: string,
  failureDescription?: string,
): Promise<boolean> {
  try {
    const { error } = await action();
    if (error) {
      toast.add({
        title: error.message || fallbackErrorMessage,
        description: failureDescription,
        type: "error",
      });
      return false;
    }
  } catch {
    toast.add({
      title: fallbackErrorMessage,
      description: failureDescription,
      type: "error",
    });
    return false;
  }
  toast.add({
    title: successMessage,
    description: successDescription,
    type: "success",
  });
  return true;
}
