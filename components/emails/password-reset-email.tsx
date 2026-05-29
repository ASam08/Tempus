import * as React from "react";

interface EmailTemplateProps {
  resetLink: string;
}

export function PasswordResetEmail({ resetLink }: EmailTemplateProps) {
  return (
    <div>
      <h1>
        Please reset your password here - <a href={resetLink}>{resetLink}</a>
      </h1>
    </div>
  );
}
