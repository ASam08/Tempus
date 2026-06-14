"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LucideCircleQuestionMark } from "lucide-react";

export default function PasswordResetForm() {
  const [isPending, setIsPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const redirectUrl = `${process.env.NEXT_PUBLIC_TEMPUS_URL ?? "http://localhost:3000"}/reset-password`;

  const handleSubmit = async (email: string) => {
    setIsPending(true);
    const { data, error } = await authClient.requestPasswordReset({
      email,
      redirectTo: redirectUrl,
    });
    if (error) {
      console.error("Password reset error:", error);
      toast.error("Password reset error!", {
        position: "top-center",
        description:
          "An error occurred while sending the password reset email. Please try again.",
        duration: 5000,
        closeButton: true,
      });
    } else {
      setSubmitted(true);
      toast.success("Password reset requested!", {
        position: "top-center",
        description:
          "If an account with that email exists, we've sent you a link to reset your password.",
        duration: 5000,
        closeButton: true,
      });
    }
    setIsPending(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password Reset</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const email = formData.get("email") as string;
            handleSubmit(email);
          }}
        >
          <Field>
            <FieldLabel htmlFor="email">
              Email
              <div>
                <div className="hidden md:flex">
                  <HoverCard>
                    <HoverCardTrigger className="text-muted-foreground ml-1 text-xs">
                      <LucideCircleQuestionMark size={16} />
                    </HoverCardTrigger>
                    <HoverCardContent>
                      <p>
                        Enter your email address and we'll send you a link to
                        reset your password if your account exists.
                      </p>
                    </HoverCardContent>
                  </HoverCard>
                </div>
                <div className="md:hidden">
                  <Popover>
                    <PopoverTrigger className="text-muted-foreground ml-1 text-xs">
                      <LucideCircleQuestionMark size={16} />
                    </PopoverTrigger>
                    <PopoverContent>
                      <p>
                        Enter your email address and we'll send you a link to
                        reset your password if your account exists.
                      </p>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </FieldLabel>
            <Input
              id="email"
              type="email"
              name="email"
              placeholder="m@example.com"
              required
            />
          </Field>
          {submitted && (
            <div className="py-2 text-xs text-green-700">
              If an account with that email exists, we've sent you a link to
              reset your password. <br />
              <br />
              If you don't receive an email, please check your spam folder or
              try again later.
            </div>
          )}
          <Button className="my-4 w-full" type="submit" disabled={isPending}>
            {isPending ? "Sending..." : "Reset Password"}
          </Button>
          <Link
            href="/login"
            className="block pt-4 text-right text-sm text-blue-500 hover:underline"
          >
            Back to Login
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}
