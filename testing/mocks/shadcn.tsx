import React from "react";

export const buttonMock = {
  Button: ({
    children,
    onClick,
    variant,
    size,
    className,
    disabled,
    type,
    "data-testid": testId,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
    size?: string;
    className?: string;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    "data-testid"?: string;
  }) => (
    <button
      type={type ?? "button"}
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      className={className}
      disabled={disabled}
      data-testid={testId}
    >
      {children}
    </button>
  ),
};

export const inputMock = {
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
};