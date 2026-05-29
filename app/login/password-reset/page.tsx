"use client";

import { authClient } from "@/lib/auth-client";
export default function PasswordResetPage() {
  const redirectUrl = `${process.env.NEXT_PUBLIC_TEMPUS_URL ?? "http://localhost:3000"}/reset-password-confirmation`;
  const handleSubmit = async (email: string) => {
    const { data, error } = await authClient.requestPasswordReset({
      email,
      redirectTo: redirectUrl,
    });
  };
  return (
    <div>
      <h1>Password Reset</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          const email = formData.get("email") as string;
          handleSubmit(email);
        }}
      >
        <label htmlFor="email">Email:</label>
        <input type="email" id="email" name="email" required />
        <button type="submit">Reset Password</button>
      </form>
    </div>
  );
}
