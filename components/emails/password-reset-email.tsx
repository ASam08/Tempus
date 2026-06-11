import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
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
          <Heading style={heading}>Tempus</Heading>
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
            This link expires in {expiresInHours} hour
            {expiresInHours !== 1 ? "s" : ""}. If you didn&apos;t request a
            password reset, you can safely ignore this email.
          </Text>
          <Text style={footer}>
            You&apos;re receiving this because a password reset was requested
            for your Tempus account.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container: React.CSSProperties = {
  margin: "40px auto",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  padding: "40px",
  maxWidth: "480px",
};

const heading: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#09090b",
  margin: "0 0 4px",
};

const subheading: React.CSSProperties = {
  fontSize: "16px",
  color: "#71717a",
  margin: "0 0 24px",
};

const paragraph: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "1.6",
  color: "#3f3f46",
  margin: "0 0 24px",
};

const buttonSection: React.CSSProperties = {
  textAlign: "center",
  margin: "0 0 24px",
};

const button: React.CSSProperties = {
  backgroundColor: "#09090b",
  color: "#ffffff",
  borderRadius: "6px",
  padding: "12px 24px",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  display: "inline-block",
};

const expiry: React.CSSProperties = {
  fontSize: "13px",
  color: "#71717a",
  lineHeight: "1.5",
  margin: "0 0 24px",
};

const footer: React.CSSProperties = {
  fontSize: "12px",
  color: "#a1a1aa",
  borderTop: "1px solid #f4f4f5",
  paddingTop: "16px",
  margin: "0",
};
