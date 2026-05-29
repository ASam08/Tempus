import { WelcomeEmail } from "@/components/emails/welcome-email";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, firstName } = await request.json();
    const fromEmail = `Tempus <tempus@${process.env.EMAIL_DOMAIN}>`;
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: "Hello world",
      react: WelcomeEmail({ firstName: firstName }),
    });

    if (error) {
      console.error("Resend error:", error);

      return Response.json({ error }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error("Resend error:", error);

    return Response.json({ error }, { status: 500 });
  }
}
