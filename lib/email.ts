import { Resend } from "resend";
import WelcomeEmail from "@/components/emails/welcome-email";
import PasswordResetEmail from "@/components/emails/password-reset-email";

const resendApiKey = process.env.RESEND_API_KEY;
const emailDomain = process.env.EMAIL_DOMAIN;
const resend = resendApiKey ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = emailDomain ? `Tempus <noreply@${emailDomain}>` : null;

type EmailResult = { success: true } | { success: false; error: string };

export async function sendWelcomeEmail(
  email: string,
  name: string,
): Promise<EmailResult> {
  if (!resend || !FROM) {
    console.warn(
      "Resend API key or email domain is missing. Skipping email send.",
    );
    return { success: false, error: "Email service disabled" };
  }
  const { error } = await resend.emails.send({
    from: FROM,
    to: [email],
    subject: "Welcome to Tempus",
    react: WelcomeEmail({ name, loginLink: `${process.env.TEMPUS_URL}/login` }),
  });

  if (error) return { success: false, error: error.message };

  console.log(`Sent welcome email to ${email}`);
  return { success: true };
}

export async function sendPasswordResetEmail({
  email,
  url,
}: {
  email: string;
  url: string;
}): Promise<void> {
  if (!resend || !FROM) {
    console.warn(
      "Resend API key or email domain is missing. Skipping email send.",
    );
    return;
  }
  void resend.emails.send({
    from: FROM,
    to: [email],
    subject: "Reset your Tempus password",
    react: PasswordResetEmail({ resetLink: url }),
  });
}
