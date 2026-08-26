"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from "better-auth";
import { authClient } from "@/lib/auth-client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { PasswordRequirementsHover } from "@/components/general/password-requirements-hover";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { passwordSchema } from "@/lib/schema";

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

        const email: { email?: string } = {};

        if (raw.email !== user.email) {
          email.email = raw.email;
        }

        if (Object.keys(email).length === 0) {
          return;
        }

        startTransition(() =>
          handleOutcome(
            form,
            () =>
              authClient.changeEmail({
                newEmail: email.email!,
                callbackURL: "/dashboard",
              }),
            "Email updated.",
            "Failed to update email.",
            () => router.refresh(),
          ),
        );
        return;
      }

      default:
        throw new Error(`Unhandled form type: ${(formType as FormType).type}`);
    }
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
