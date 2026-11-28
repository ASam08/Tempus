"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { toast } from "@/components/ui/toast";
import { authToastNotifications } from "@/components/general/auth-toast-notifications";
import { useSearchParams, useRouter } from "next/navigation";
import { passwordSchema } from "@/lib/schema";
import { PasswordRequirementsHover } from "@/components/general/password-requirements-hover";

export default function ResetPasswordForm() {
  const [isPending, setIsPending] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const handleSubmit = async (newPassword: string) => {
    setIsPending(true);
    if (!token) {
      toast.add({
        title: "Invalid password reset link!",
        description: "The password reset link is missing a token.",
        timeout: 5000,
        type: "error",
      });
      setIsPending(false);
      return;
    } else {
      const ok = await authToastNotifications(
        () => authClient.resetPassword({ newPassword, token }),
        "Password reset successful!",
        "Failed to reset password",
        "Your password has been reset. You can now log in.",
        "The reset link may have expired. Please request a new one.",
      );
      setIsPending(false);
      if (ok) {
        router.push("/login");
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set New Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const newPassword = formData.get("newPassword") as string;
            const confirmPassword = formData.get("confirmPassword") as string;

            const result = passwordSchema.safeParse(newPassword);
            if (!result.success) {
              toast.add({
                title: "Password must:",
                type: "error",
                description: (
                  <ul className="list-disc pl-4">
                    {result.error.issues.map((i) => (
                      <li key={i.message}>{i.message}</li>
                    ))}
                  </ul>
                ),
              });
              return;
            }
            if (newPassword !== confirmPassword) {
              toast.add({
                title: "Passwords do not match.",
                type: "error",
              });
              return;
            }

            handleSubmit(newPassword);
          }}
        >
          <Field>
            <FieldLabel htmlFor="newPassword">
              New Password <PasswordRequirementsHover />
            </FieldLabel>
            <Input
              id="newPassword"
              type="password"
              name="newPassword"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
            <Input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              required
            />
          </Field>
          <Button className="my-4 w-full" type="submit" disabled={isPending}>
            {isPending ? "Setting new password..." : "Set New Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
