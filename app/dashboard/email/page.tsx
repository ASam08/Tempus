"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export default function EmailPage() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <div>Loading...</div>;
  if (!session) return <div>Please log in to send an email.</div>;

  const email = session.user.email;
  const name = session.user.name ?? "User";

  return (
    <div>
      <h1>Email Page</h1>
      <Button
        onClick={() => {
          fetch("/api/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, firstName: name }),
          });
        }}
      >
        Send Email
      </Button>
    </div>
  );
}
