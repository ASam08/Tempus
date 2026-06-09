import * as React from "react";

interface EmailTemplateProps {
  name: string;
}

export function WelcomeEmail({ name }: EmailTemplateProps) {
  return (
    <div>
      <h1>Welcome to Tempus, {name}!</h1>
      <br />
      <p>You're all signed up!</p>
      <p>
        Tempus is a timetable app, designed to give you your timetable at a
        glance, wherever you are.
      </p>
      <p>
        To get started, simply log in to your account and start loading your
        timetable.
      </p>
      <p>Happy timekeeping!</p>
    </div>
  );
}
