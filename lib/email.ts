import { Resend } from "resend";
import { WelcomeEmail } from "@/components/emails/welcome-email";
import { PasswordResetEmail } from "@/components/emails/password-reset-email";

let resend: Resend;

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not set");
} else {
  resend = new Resend(process.env.RESEND_API_KEY);
}

if (!process.env.EMAIL_DOMAIN) {
  throw new Error("EMAIL_DOMAIN is not set");
}
// const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = `Tempus <noreply@${process.env.EMAIL_DOMAIN}>`;

type EmailResult = { success: true } | { success: false; error: string };

export async function sendWelcomeEmail(
  email: string,
  name: string,
): Promise<EmailResult> {
  const { error } = await resend.emails.send({
    from: FROM,
    to: [email],
    subject: "Welcome to Tempus",
    react: WelcomeEmail({ name }),
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function sendPasswordResetEmail({
  email,
  url,
}: {
  email: string;
  url: string;
}): Promise<void> {
  void resend.emails.send({
    from: FROM,
    to: [email],
    subject: "Reset your Tempus password",
    react: PasswordResetEmail({ resetLink: url }),
  });
}
