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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { z } from "zod";

const SignupFormSchema = z
  .object({
    name: z.string().min(1, { message: "Name is required" }).trim(),
    email: z.string().email({ message: "Invalid email address" }).trim(),
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

type SignInFormErrors = {
  name?: string[];
  email?: string[];
  password?: string[];
  confirmPassword?: string[];
};

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [errors, setErrors] = useState<SignInFormErrors>({});
  const [message, setMessage] = useState<string | undefined>();

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setErrors({});
    setMessage(undefined);

    const formData = new FormData(e.currentTarget);
    const raw = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    const validated = SignupFormSchema.safeParse(raw);
    if (!validated.success) {
      setErrors(validated.error.flatten().fieldErrors);
      setIsPending(false);
      return;
    }

    const { name, email, password } = validated.data;

    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
    });

    console.log("signup error:", error);

    if (error) {
      if (error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
        setMessage("An account with this email already exists.");
      } else {
        setMessage("Failed to create account.");
        console.log("signup error:", error);
      }
      setIsPending(false);
      return;
    }

    toast.success("Account created successfully!", {
      position: "top-center",
    });
    router.push("/login");
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>
            Enter your email below to create your account
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
                  placeholder="m@example.com"
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
                  {isPending ? "Creating…" : "Create Account"}
                </Button>
                <FieldDescription className="text-center">
                  Already have an account? <Link href="/login">Sign in</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}
