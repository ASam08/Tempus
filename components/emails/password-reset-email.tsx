import * as React from "react";

interface EmailTemplateProps {
  resetLink: string;
}

export function PasswordResetEmail({ resetLink }: EmailTemplateProps) {
  return (
    <div>
      <h3>Please reset your Tempus password</h3>
      <div style={{ padding: "8px" }}>
        <a href={resetLink}>Reset Password</a>
      </div>
      <p>If you did not request a password reset, please ignore this email.</p>
    </div>
  );
}
