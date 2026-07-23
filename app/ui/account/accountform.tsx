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

type FormType = { type: "details" | "password" };
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

const detailsSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty"),
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
          const message =
            messages.length > 0
              ? `New password must:\n${messages.join("\n")}`
              : "Invalid input.";
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

      case "details": {
        const raw = {
          name: formData.get("name") as string,
          // email: formData.get("email") as string,
        };

        const validated = detailsSchema.safeParse(raw);
        if (!validated.success) {
          const fieldErrors = validated.error.flatten().fieldErrors;
          const messages = Object.values(fieldErrors).flat();
          const message =
            messages.length > 0 ? messages.join("\n") : "Invalid input.";
          setErrors((prev) => ({ ...prev, details: message }));
          return;
        }

        const details: { name?: string; email?: string } = {};

        if (raw.name !== user.name) {
          details.name = raw.name;
        }
        // if (raw.email !== user.email) {
        //   details.email = raw.email;
        // }

        if (Object.keys(details).length === 0) {
          return;
        }

        startTransition(() =>
          handleOutcome(
            form,
            () => authClient.updateUser(details),
            "Details updated.",
            "Failed to update details.",
            () => router.refresh(),
          ),
        );
        return;
      }

      default: {
        const _exhaustive: never = formType.type;
        /* istanbul ignore next */
        throw new Error(`Unhandled form type: ${_exhaustive}`);
      }
    }
  }

  return (
    <Tabs defaultValue="details">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="details">
        <div className="max-w-96">
          <div className="gap-4 text-lg font-bold">Details</div>
          <Separator />
          <form
            onSubmit={(e) => handleFormSubmit(e, { type: "details" })}
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
            <Field className="grid gap-3">
              <FieldLabel>Email</FieldLabel>
              <FieldDescription>
                Email cannot be changed currently
              </FieldDescription>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user.email}
                disabled
              />
            </Field>
            {errors.details && (
              <p className="text-destructive text-sm whitespace-pre-line">
                {errors.details}
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
