import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, { message: "Be at least 8 characters long." })
  .regex(/[a-zA-Z]/, { message: "Contain at least one letter." })
  .regex(/[0-9]/, { message: "Contain at least one number." })
  .regex(/[^a-zA-Z0-9]/, {
    message: "Contain at least one special character.",
  });

export const editUserSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }).trim(),
  email: z.string().email({ message: "Invalid email address" }).trim(),
});

export type EditUserValues = z.infer<typeof editUserSchema>;
