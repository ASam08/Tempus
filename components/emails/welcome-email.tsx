import * as React from "react";

interface EmailTemplateProps {
  name: string;
}

export function WelcomeEmail({ name }: EmailTemplateProps) {
  return (
    <div>
      <h1>Welcome to Tempus, {name}!</h1>
    </div>
  );
}
