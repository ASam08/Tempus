import React from "react";

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
      ) : testId ? (
        <div data-testid={testId} data-open="false" />
      ) : null,
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

export const avatarMock = {
  Avatar: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="avatar">{children}</div>
  ),
  AvatarFallback: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="avatar-fallback">{children}</div>
  ),
};

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

export const checkboxMock = {
  Checkbox: ({
    id,
    name,
    defaultChecked,
  }: {
    id: string;
    name: string;
    defaultChecked: boolean;
  }) => (
    <input
      type="checkbox"
      id={id}
      name={name}
      defaultChecked={defaultChecked}
      aria-label={name}
    />
  ),
};

export const dropdownMenuMock = (() => {
  const DropdownContext = React.createContext<{
    open: boolean;
    setOpen: (v: boolean) => void;
  }>({ open: false, setOpen: () => {} });

  const SubContext = React.createContext<{
    subOpen: boolean;
    setSubOpen: (v: boolean) => void;
  }>({ subOpen: false, setSubOpen: () => {} });

  return {
    DropdownMenu: ({ children }: { children: React.ReactNode }) => {
      const [open, setOpen] = React.useState(false);
      return (
        <DropdownContext.Provider value={{ open, setOpen }}>
          {children}
        </DropdownContext.Provider>
      );
    },
    DropdownMenuTrigger: ({
      children,
      asChild,
    }: {
      children: React.ReactNode;
      asChild?: boolean;
    }) => {
      const { setOpen } = React.useContext(DropdownContext);
      if (asChild && React.isValidElement(children)) {
        return React.cloneElement(
          children as React.ReactElement<{ onClick?: () => void }>,
          { onClick: () => setOpen(true) },
        );
      }
      return <button onClick={() => setOpen(true)}>{children}</button>;
    },
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => {
      const { open } = React.useContext(DropdownContext);
      return open ? <div data-testid="dropdown-content">{children}</div> : null;
    },
    DropdownMenuSub: ({ children }: { children: React.ReactNode }) => {
      const [subOpen, setSubOpen] = React.useState(false);
      return (
        <SubContext.Provider value={{ subOpen, setSubOpen }}>
          {children}
        </SubContext.Provider>
      );
    },
    DropdownMenuSubTrigger: ({ children }: { children: React.ReactNode }) => {
      const { setSubOpen } = React.useContext(SubContext);
      return <button onClick={() => setSubOpen(true)}>{children}</button>;
    },
    DropdownMenuSubContent: ({ children }: { children: React.ReactNode }) => {
      const { subOpen } = React.useContext(SubContext);
      return subOpen ? <div>{children}</div> : null;
    },
    DropdownMenuPortal: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    DropdownMenuItem: ({
      children,
      onClick,
      onSelect,
      variant,
    }: {
      children: React.ReactNode;
      onClick?: () => void;
      onSelect?: () => void;
      variant?: string;
    }) => (
      <button
        type="button"
        role="menuitem"
        onClick={onClick ?? onSelect}
        data-variant={variant}
      >
        {children}
      </button>
    ),
    DropdownMenuLabel: ({
      children,
      className,
    }: {
      children: React.ReactNode;
      className?: string;
    }) => <div className={className}>{children}</div>,
    DropdownMenuSeparator: () => <hr />,
    DropdownMenuGroup: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  };
})();

export const fieldMock = {
  Field: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FieldLabel: ({
    children,
    htmlFor,
  }: {
    children: React.ReactNode;
    htmlFor?: string;
  }) => <label htmlFor={htmlFor}>{children}</label>,
  FieldDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
};

export const hoverCardMock = {
  HoverCard: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  HoverCardTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  HoverCardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
};

export const inputMock = {
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
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

export const paginationMock = {
  Pagination: ({ children }: { children: React.ReactNode }) => (
    <nav>{children}</nav>
  ),
  PaginationContent: ({ children }: { children: React.ReactNode }) => (
    <ul>{children}</ul>
  ),
  PaginationItem: ({ children }: { children: React.ReactNode }) => (
    <li>{children}</li>
  ),
  PaginationLink: ({
    children,
    href,
    isActive,
  }: {
    children: React.ReactNode;
    href: string;
    isActive?: boolean;
  }) => (
    <a href={href} aria-current={isActive ? "page" : undefined}>
      {children}
    </a>
  ),
  PaginationPrevious: ({ href }: { href: string }) => (
    <a href={href}>Previous</a>
  ),
  PaginationNext: ({ href }: { href: string }) => <a href={href}>Next</a>,
  PaginationEllipsis: () => <span>...</span>,
};

export const popoverMock = {
  Popover: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  PopoverContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
};

export const selectMock = {
  Select: ({
    children,
    onValueChange,
    name,
    onOpenChange,
    defaultValue,
  }: {
    children: React.ReactNode;
    onValueChange?: (v: string) => void;
    name?: string;
    onOpenChange?: () => void;
    defaultValue?: string;
  }) => (
    <select
      name={name}
      aria-label={name ?? "select"}
      title={name ?? "select"}
      defaultValue={defaultValue ?? ""}
      onChange={(e) => {
        onOpenChange?.();
        onValueChange?.(e.target.value);
      }}
    >
      {!defaultValue && <option value="" disabled />}
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectItem: ({
    value,
    children,
  }: {
    value: string;
    children: React.ReactNode;
  }) => <option value={value}>{children}</option>,
  SelectSeparator: () => <hr role="separator" />,
};

export const separatorMock = {
  Separator: () => <hr role="separator" />,
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

export const tabsMock = (() => {
  const TabsContext = React.createContext<{
    value: string;
    setValue: (v: string) => void;
  }>({ value: "", setValue: () => {} });

  return {
    Tabs: ({
      children,
      defaultValue,
    }: {
      children: React.ReactNode;
      defaultValue?: string;
    }) => {
      const [value, setValue] = React.useState(defaultValue ?? "");
      return (
        <TabsContext.Provider value={{ value, setValue }}>
          {children}
        </TabsContext.Provider>
      );
    },
    TabsList: ({ children }: { children: React.ReactNode }) => (
      <div role="tablist">{children}</div>
    ),
    TabsTrigger: ({
      children,
      value,
    }: {
      children: React.ReactNode;
      value: string;
    }) => {
      const { value: active, setValue } = React.useContext(TabsContext);
      return (
        <button
          type="button"
          role="tab"
          aria-selected={active === value}
          onClick={() => setValue(value)}
        >
          {children}
        </button>
      );
    },
    TabsContent: ({
      children,
      value,
    }: {
      children: React.ReactNode;
      value: string;
    }) => {
      const { value: active } = React.useContext(TabsContext);
      return active === value ? <>{children}</> : null;
    },
  };
})();

export const textareaMock = {
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} />
  ),
};
