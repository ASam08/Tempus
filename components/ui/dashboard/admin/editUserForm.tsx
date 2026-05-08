"use client";

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User } from "@/lib/auth";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type FormErrors = {
  name?: string[];
  email?: string[];
};

const EditUserFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }).trim(),
  email: z.string().email({ message: "Invalid email address" }).trim(),
});

export default function EditUserForm({ chosenUser }: { chosenUser: User }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [message, setMessage] = useState<string | undefined>();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const raw = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
    };

    const validated = EditUserFormSchema.safeParse(raw);

    if (!validated.success) {
      setErrors(validated.error.flatten().fieldErrors);
      setIsPending(false);
      return;
    }

    const { name, email } = validated.data;

    const { data, error } = await authClient.admin.updateUser({
      userId: chosenUser.id,
      data: { name, email },
    });

    if (error) {
      if (error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
        setMessage("An account with this email already exists.");
      } else {
        setMessage("Failed to update user.");
        console.log("edit user error:", error);
      }
      setIsPending(false);
      return;
    }

    toast.success("User updated successfully!", {
      position: "top-center",
    });
    router.push("/dashboard/admin");
  };

  return (
    <div className="flex min-h-svh">
      <div className="flex w-full max-w-sm flex-col">
        <form className="grid gap-2" onSubmit={handleSubmit}>
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input
              id="name"
              type="text"
              name="name"
              defaultValue={chosenUser.name}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              name="email"
              defaultValue={chosenUser.email}
              required
            />
          </Field>

          <Field>
            <div className="flex flex-row gap-2 pt-8">
              <Button
                className="flex-1/3"
                onClick={() => router.push("/dashboard/admin")}
              >
                Cancel
              </Button>
              <Button className="flex-2/3" type="submit">
                Update User
              </Button>
            </div>
          </Field>
        </form>
      </div>
    </div>
  );
}
