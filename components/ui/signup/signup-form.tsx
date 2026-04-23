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
import { useActionState } from "react";
import { signup } from "@/lib/actions";
import { useFormStatus } from "react-dom";
import { SignupFormState } from "@/lib/definitions";
import { useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type="submit">
      {pending ? "Creating…" : "Create Account"}
    </Button>
  );
}

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const initialState = undefined satisfies SignupFormState;
  const [state, action] = useActionState(signup, initialState);
  const { pending } = useFormStatus();

  const router = useRouter();

  useEffect(() => {
    if (state?.message === "success") {
      toast.success("Account created successfully!", {
        position: "top-center",
      });
      router.push("/login");
    }
  }, [state, router]);

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
          <form action={action}>
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
                {state?.errors?.name?.map((error) => (
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
                {state?.errors?.email?.map((error) => (
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
                    <FieldLabel htmlFor="confirmPpassword">
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
                {state?.errors?.password && (
                  <div className="text-red-500">
                    <p>Password must:</p>
                    <ul>
                      {state.errors.password.map((error) => (
                        <li key={error}>- {error}</li>
                      ))}
                    </ul>
                    {state?.errors?.confirmPassword?.map((error) => (
                      <p className="text-red-500" key={error}>
                        {error}
                      </p>
                    ))}
                  </div>
                )}
                <FieldDescription>
                  Must be at least 8 characters long.
                </FieldDescription>
              </Field>
              <Field>
                <SubmitButton />
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
