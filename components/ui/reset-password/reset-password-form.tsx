"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { toast } from "sonner";
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
      toast.error("Invalid password reset link!", {
        position: "top-center",
        description: "The password reset link is missing a token.",
        duration: 5000,
        closeButton: true,
      });
      setIsPending(false);
      return;
    } else {
      const { data, error } = await authClient.resetPassword({
        newPassword: newPassword,
        token,
      });
      if (error) {
        toast.error("Failed to reset password", {
          description:
            "The reset link may have expired. Please request a new one.",
          position: "top-center",
        });
        setIsPending(false);
        return;
      }
      setIsPending(false);
      toast.success("Password reset successful!", {
        position: "top-center",
        description: "Your password has been reset. You can now log in.",
        duration: 5000,
        closeButton: true,
      });
      router.push("/login");
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
              toast.error("Password must:", {
                position: "top-center",
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
              toast.error("Passwords do not match.", {
                position: "top-center",
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
