"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { User } from "better-auth";
import { authClient } from "@/lib/auth-client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { PasswordRequirementsHover } from "@/components/general/password-requirements-hover";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { passwordSchema } from "@/lib/schema";
import { verifyUserPassword } from "@/lib/data";

type FormType = { type: "personal" | "email" | "password" };
type FormErrors = Partial<Record<FormType["type"], string>>;

const NewPasswordSchema = z
  .object({
    currentPassword: z.string(),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
    revokeSessions: z.boolean(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const personalSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty"),
});

const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

async function handleOutcome(
  form: HTMLFormElement,
  action: () => Promise<{ error?: { message?: string } | null }>,
  successMessage: string,
  fallbackErrorMessage = "Something went wrong.",
  onSuccess?: () => void,
) {
  const { error } = await action();

  if (error) {
    toast.error(error.message ?? fallbackErrorMessage, {
      position: "top-center",
      style: { backgroundColor: "red" },
    });
  } else {
    toast.success(successMessage, {
      position: "top-center",
      style: { backgroundColor: "forestgreen" },
    });
    form.reset();
    onSuccess?.();
  }
}

export default function AccountForm({ user }: { user: User }) {
  const router = useRouter();
  const [errors, setErrors] = useState<FormErrors>({});
  const [isPending, startTransition] = useTransition();
  const [showVerifyPasswordDialog, setShowVerifyPasswordDialog] =
    useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  async function handleFormSubmit(
    e: React.SubmitEvent<HTMLFormElement>,
    formType: FormType,
  ) {
    e.preventDefault();
    setErrors((prev) => ({ ...prev, [formType.type]: undefined }));

    const form = e.currentTarget;
    const formData = new FormData(form);

    switch (formType.type) {
      case "password": {
        const raw = {
          currentPassword: formData.get("current-password") as string,
          newPassword: formData.get("new-password") as string,
          confirmPassword: formData.get("confirm-password") as string,
          revokeSessions: formData.get("revoke-sessions") === "on",
        };

        const validated = NewPasswordSchema.safeParse(raw);
        if (!validated.success) {
          const fieldErrors = validated.error.flatten().fieldErrors;
          const messages = Object.values(fieldErrors).flat();
          const message = `New password must:\n${messages.join("\n")}`;
          setErrors((prev) => ({ ...prev, password: message }));
          return;
        }

        startTransition(() =>
          handleOutcome(
            form,
            () =>
              authClient.changePassword({
                newPassword: validated.data.newPassword,
                currentPassword: validated.data.currentPassword,
                revokeOtherSessions: validated.data.revokeSessions,
              }),
            "Password updated.",
            "Failed to update password.",
          ),
        );
        return;
      }

      case "personal": {
        const raw = {
          name: formData.get("name") as string,
        };

        const validated = personalSchema.safeParse(raw);
        if (!validated.success) {
          const fieldErrors = validated.error.flatten().fieldErrors;
          const messages = Object.values(fieldErrors).flat();
          const message =
            messages.length > 0 ? messages.join("\n") : "Invalid input.";
          setErrors((prev) => ({ ...prev, personal: message }));
          return;
        }

        const personal: { name?: string } = {};

        if (raw.name !== user.name) {
          personal.name = raw.name;
        }

        if (Object.keys(personal).length === 0) {
          return;
        }

        startTransition(() =>
          handleOutcome(
            form,
            () => authClient.updateUser(personal),
            "Personal information updated.",
            "Failed to update personal information.",
            () => router.refresh(),
          ),
        );
        return;
      }

      case "email": {
        const raw = {
          email: formData.get("email") as string,
        };
        const validated = emailSchema.safeParse(raw);
        if (!validated.success) {
          const fieldErrors = validated.error.flatten().fieldErrors;
          const messages = Object.values(fieldErrors).flat();
          const message =
            messages.length > 0 ? messages.join("\n") : "Invalid input.";
          setErrors((prev) => ({ ...prev, email: message }));
          return;
        }

        if (raw.email === user.email) {
          return;
        }

        setPendingEmail(raw.email);
        setShowVerifyPasswordDialog(true);

        return;
      }

      default:
        throw new Error(`Unhandled form type: ${(formType as FormType).type}`);
    }
  }
  async function handleVerifyPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const password = formData.get("verify-password") as string;

    startTransition(async () => {
      const verified = await verifyUserPassword(password);

      if (!verified) {
        toast.error("Password Verification Failed", {
          position: "top-center",
          style: { backgroundColor: "red" },
        });
        return;
      }

      setShowVerifyPasswordDialog(false);

      await handleOutcome(
        form,
        () =>
          authClient.changeEmail({
            newEmail: pendingEmail!,
            callbackURL: "/dashboard",
          }),
        "Email updated.",
        "Failed to update email.",
        () => router.refresh(),
      );
      setPendingEmail(null);
    });
  }
  return (
    <Tabs defaultValue="personal">
      <TabsList>
        <TabsTrigger value="personal">Personal</TabsTrigger>
        <TabsTrigger value="email">Email</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="personal">
        <div className="max-w-96">
          <div className="gap-4 text-lg font-bold">Personal</div>
          <Separator />
          <form
            onSubmit={(e) => handleFormSubmit(e, { type: "personal" })}
            className="mt-4 grid gap-3"
          >
            <Field className="grid gap-3">
              <FieldLabel>Name</FieldLabel>
              <Input
                key={user.name}
                id="name"
                name="name"
                type="text"
                defaultValue={user.name}
              />
            </Field>
            {errors.personal && (
              <p className="text-destructive text-sm whitespace-pre-line">
                {errors.personal}
              </p>
            )}
            <div className="flex flex-row gap-4 py-4">
              <Button variant="outline" type="button">
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </TabsContent>
      <TabsContent value="email">
        <div className="max-w-96">
          <div className="gap-4 text-lg font-bold">Email</div>
          <Separator />
          <form
            onSubmit={(e) => handleFormSubmit(e, { type: "email" })}
            className="mt-4 grid gap-3"
          >
            <Field className="grid gap-3">
              <FieldLabel>Email</FieldLabel>
              <Input
                key={user.email}
                id="email"
                name="email"
                type="email"
                defaultValue={user.email}
              />
            </Field>
            {errors.email && (
              <p className="text-destructive text-sm whitespace-pre-line">
                {errors.email}
              </p>
            )}
            <div className="flex flex-row gap-4 py-4">
              <Button variant="outline" type="button">
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
        <Dialog
          open={showVerifyPasswordDialog}
          onOpenChange={(open) => {
            setShowVerifyPasswordDialog(open);
            if (!open) setPendingEmail(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Verify Password</DialogTitle>
              <DialogDescription>
                Please enter your current password to confirm it&apos;s you.
              </DialogDescription>
            </DialogHeader>
            <form className="grid gap-3" onSubmit={handleVerifyPassword}>
              <Field className="grid gap-3">
                <FieldLabel htmlFor="verify-password">
                  Current Password
                </FieldLabel>
                <Input
                  id="verify-password"
                  name="verify-password"
                  type="password"
                />
              </Field>
              <DialogFooter>
                <DialogClose
                  render={
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  }
                ></DialogClose>
                <Button type="submit" disabled={isPending}>
                  Verify
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </TabsContent>
      <TabsContent value="password">
        <div className="max-w-96">
          <div className="gap-4 text-lg font-bold">Password</div>
          <Separator />
          <form
            id="password-reset-form"
            onSubmit={(e) => handleFormSubmit(e, { type: "password" })}
            className="mt-4 grid gap-3"
          >
            <Field className="grid gap-3">
              <FieldLabel>Current Password</FieldLabel>
              <Input
                id="current-password"
                name="current-password"
                type="password"
              />
            </Field>
            <Field className="grid gap-3">
              <FieldLabel>
                New Password <PasswordRequirementsHover />
              </FieldLabel>
              <Input id="new-password" name="new-password" type="password" />
            </Field>
            <Field className="grid gap-3">
              <FieldLabel>Confirm New Password</FieldLabel>
              <Input
                id="confirm-password"
                name="confirm-password"
                type="password"
              />
            </Field>
            <Field orientation="horizontal">
              <Checkbox
                defaultChecked
                id="revoke-sessions"
                name="revoke-sessions"
              />
              <FieldLabel htmlFor="revoke-sessions">
                Sign out of all other devices?
              </FieldLabel>
            </Field>
            {errors.password && (
              <p className="text-destructive text-sm whitespace-pre-line">
                {errors.password}
              </p>
            )}
            <div className="flex flex-row gap-4 py-4">
              <Button variant="outline" type="button">
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </TabsContent>
    </Tabs>
  );
}
