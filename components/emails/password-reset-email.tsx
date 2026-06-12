import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface PasswordResetEmailProps {
  resetLink: string;
  expiresInHours?: number;
}

export function PasswordResetEmail({
  resetLink,
  expiresInHours = 1,
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Reset your Tempus password — link expires in ${expiresInHours} hour${expiresInHours !== 1 ? "s" : ""}`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Img
            src="https://raw.githubusercontent.com/ASam08/Tempus/main/public/logos/tempuslogo-light.png"
            alt="Tempus"
            width={120}
            height={32}
            style={logo}
          />
          <Text style={subheading}>Password Reset Request</Text>
          <Text style={paragraph}>
            We received a request to reset the password for your Tempus account.
            Click the button below to choose a new password.
          </Text>
          <Section style={buttonSection}>
            <Button href={resetLink} style={button}>
              Reset Password
            </Button>
          </Section>
          <Text style={expiry}>
            {`This link expires in ${expiresInHours} hour${expiresInHours !== 1 ? "s" : ""}. If you didn't request a password reset, you can safely ignore this email.`}
          </Text>
          <Text style={footer}>
            You're receiving this because a password reset was requested for
            your Tempus account.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: "#f7f7f3",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container: React.CSSProperties = {
  margin: "40px auto",
  backgroundColor: "#ffffff",
  borderRadius: "0.625rem",
  padding: "40px",
  maxWidth: "480px",
};

const logo: React.CSSProperties = {
  margin: "0 0 24px",
};

const subheading: React.CSSProperties = {
  fontSize: "16px",
  color: "#737168",
  margin: "0 0 24px",
};

const paragraph: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "1.6",
  color: "#231f1c",
  margin: "0 0 24px",
};

const buttonSection: React.CSSProperties = {
  textAlign: "center",
  margin: "0 0 24px",
};

const button: React.CSSProperties = {
  backgroundColor: "#2d5be3",
  color: "#f0f3fd",
  borderRadius: "0.625rem",
  padding: "12px 24px",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  display: "inline-block",
};

const expiry: React.CSSProperties = {
  fontSize: "13px",
  color: "#737168",
  lineHeight: "1.5",
  margin: "0 0 24px",
};

const footer: React.CSSProperties = {
  fontSize: "12px",
  color: "#737168",
  borderTop: "1px solid #ebe9e6",
  paddingTop: "16px",
  margin: "0",
};
