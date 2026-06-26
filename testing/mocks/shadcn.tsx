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

export const fieldMock = {
  Field: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FieldLabel: ({
    children,
    htmlFor,
  }: {
    children: React.ReactNode;
    htmlFor?: string;
  }) => <label htmlFor={htmlFor}>{children}</label>,
};

export const alertDialogMock = () => {
  const AlertDialogContext = React.createContext(
    undefined as ((open: boolean) => void) | undefined,
  );

  return {
    AlertDialog: ({
      open,
      onOpenChange,
      children,
      "data-testid": testId,
    }: {
      open: boolean;
      onOpenChange?: (v: boolean) => void;
      children: React.ReactNode;
      "data-testid"?: string;
    }) =>
      open ? (
        <AlertDialogContext.Provider value={onOpenChange}>
          <div role="alertdialog" data-testid={testId} data-open="true">
            {children}
          </div>
        </AlertDialogContext.Provider>
      ) : (
        <div data-testid={testId} data-open="false" />
      ),
    AlertDialogContent: ({
      children,
      "data-testid": testId,
    }: {
      children: React.ReactNode;
      "data-testid"?: string;
    }) => <div data-testid={testId}>{children}</div>,
    AlertDialogHeader: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    AlertDialogTitle: ({
      children,
      "data-testid": testId,
    }: {
      children: React.ReactNode;
      "data-testid"?: string;
    }) => <h2 data-testid={testId}>{children}</h2>,
    AlertDialogDescription: ({
      children,
      "data-testid": testId,
    }: {
      children: React.ReactNode;
      "data-testid"?: string;
    }) => <p data-testid={testId}>{children}</p>,
    AlertDialogFooter: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    AlertDialogAction: ({
      children,
      onClick,
      variant,
      "data-testid": testId,
    }: {
      children: React.ReactNode;
      onClick?: () => void;
      variant?: string;
      "data-testid"?: string;
    }) => (
      <button onClick={onClick} data-variant={variant} data-testid={testId}>
        {children}
      </button>
    ),
    AlertDialogCancel: ({
      children,
      variant,
      "data-testid": testId,
    }: {
      children: React.ReactNode;
      variant?: string;
      "data-testid"?: string;
    }) => {
      const onOpenChange = React.useContext(AlertDialogContext);
      return (
        <button
          type="button"
          data-variant={variant}
          data-testid={testId}
          onClick={() => onOpenChange?.(false)}
        >
          {children}
        </button>
      );
    },
  };
};

export const labelMock = {
  Label: ({
    children,
    htmlFor,
  }: {
    children: React.ReactNode;
    htmlFor?: string;
  }) => <label htmlFor={htmlFor}>{children}</label>,
};

export const cardMock = {
    Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    CardHeader: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    CardTitle: ({ children }: { children: React.ReactNode }) => (
        <h1>{children}</h1>
    ),
    CardContent: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
};

export const tableMock = {
  __esModule: true,
  Table: ({ children }: { children: React.ReactNode }) => (
    <table>{children}</table>
  ),
  TableHeader: ({ children }: { children: React.ReactNode }) => (
    <thead>{children}</thead>
  ),
  TableBody: ({ children }: { children: React.ReactNode }) => (
    <tbody>{children}</tbody>
  ),
  TableRow: ({ children }: { children: React.ReactNode }) => (
    <tr>{children}</tr>
  ),
  TableHead: ({ children }: { children: React.ReactNode }) => (
    <th>{children}</th>
  ),
  TableCell: ({ children }: { children: React.ReactNode }) => (
    <td>{children}</td>
  ),
};

export const textareaMock = {
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} />
  ),
};