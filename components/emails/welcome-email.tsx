import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "react-email";
import * as React from "react";

interface WelcomeEmailProps {
  name: string;
  loginLink: string;
}

export default function WelcomeEmail({ name, loginLink }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Tempus — your timetable at a glance</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img
              src="https://raw.githubusercontent.com/ASam08/Tempus/57e6ca703583afdf5333fe2fecc7df52869384d0/public/logos/tempuslogo_light.png"
              alt="Tempus"
              width={340}
              height={105}
              style={logo}
            />
          </Section>
          <Text style={subheading}>Welcome to Tempus, {name}!</Text>
          <Text style={paragraph}>You're all signed up!</Text>
          <Text style={paragraph}>
            Tempus is a timetable app, designed to give you your timetable at a
            glance, wherever you are.
          </Text>
          <Text style={paragraph}>
            To get started, simply log in to your account and start loading your
            timetable.
          </Text>
          <Section style={buttonSection}>
            <Button href={loginLink} style={button}>
              Go to Tempus
            </Button>
          </Section>
          <Text style={expiry}>Happy timekeeping!</Text>
          <Text style={footer}>
            You're receiving this because you recently created a Tempus account.
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

const logoSection: React.CSSProperties = {
  textAlign: "center",
  width: "100%",
  margin: "0 0 24px",
};

const logo: React.CSSProperties = {
  display: "inline-block",
  margin: "0 auto",
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
