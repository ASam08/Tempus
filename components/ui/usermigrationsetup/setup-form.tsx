"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { markSetupComplete } from "@/lib/actions";

const SetupFormSchema = z
  .object({
    name: z.string().min(1, { message: "Name is required" }).trim(),
    email: z
      .string()
      .email({ message: "Invalid email address" })
      .trim()
      .refine((e) => e !== "admin@tempus.local", {
        message: "Please enter your real email address",
      }),
    password: z
      .string()
      .min(8, { message: "Be at least 8 characters long" })
      .regex(/[a-zA-Z]/, { message: "Contain at least one letter." })
      .regex(/[0-9]/, { message: "Contain at least one number." })
      .regex(/[^a-zA-Z0-9]/, {
        message: "Contain at least one special character.",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SetupFormErrors = {
  name?: string[];
  email?: string[];
  password?: string[];
  confirmPassword?: string[];
};

export function SetupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [errors, setErrors] = useState<SetupFormErrors>({});
  const [message, setMessage] = useState<string | undefined>();
  const { data: session } = authClient.useSession();

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setErrors({});
    setMessage(undefined);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const raw = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    const validated = SetupFormSchema.safeParse(raw);
    if (!validated.success) {
      setErrors(validated.error.flatten().fieldErrors);
      setIsPending(false);
      return;
    }

    const { name, email, password } = validated.data;
    const userId = session?.user.id;

    if (!userId) {
      setMessage("Session not found. Please log in again.");
      setIsPending(false);
      return;
    }

    const { error: updateError } = await authClient.admin.updateUser({
      userId,
      data: { name, email },
    });

    if (updateError) {
      if (updateError.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
        setMessage("An account with this email already exists.");
      } else {
        setMessage("Something went wrong. Please try again.");
      }
      setIsPending(false);
      return;
    }

    const { error: passwordError } = await authClient.admin.setUserPassword({
      userId,
      newPassword: password,
    });

    if (passwordError) {
      setMessage(
        "Something went wrong setting your password. Please try again.",
      );
      setIsPending(false);
      return;
    }

    const result = await markSetupComplete(userId);

    if (result?.error) {
      setMessage(result.error);
      setIsPending(false);
      return;
    }

    toast.success("Setup complete! Welcome to Tempus.", {
      position: "top-center",
    });
    router.push("/dashboard");
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome to Tempus</CardTitle>
          <CardDescription>
            Let's get your account set up. You'll use these details to log in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  required
                />
                {errors.name?.map((error) => (
                  <p className="text-red-500" key={error}>
                    {error}
                  </p>
                ))}
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  required
                />
                {errors.email?.map((error) => (
                  <p className="text-red-500" key={error}>
                    {error}
                  </p>
                ))}
              </Field>
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      name="password"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirmPassword">
                      Confirm Password
                    </FieldLabel>
                    <Input
                      id="confirmPassword"
                      type="password"
                      name="confirmPassword"
                      required
                    />
                  </Field>
                </Field>
                {errors.password && (
                  <div className="text-red-500">
                    <p>Password must:</p>
                    <ul>
                      {errors.password.map((error) => (
                        <li key={error}>- {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {errors.confirmPassword?.map((error) => (
                  <p className="text-red-500" key={error}>
                    {error}
                  </p>
                ))}
                <FieldDescription>
                  Must be at least 8 characters long.
                </FieldDescription>
              </Field>
              <Field>
                {message && <p className="text-sm text-red-500">{message}</p>}
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : "Complete Setup"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
