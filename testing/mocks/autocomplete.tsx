import React from "react";

export const autocompleteMock = (() => {
  const AutocompleteContext = React.createContext<{
    items: string[];
    value: string;
    onValueChange: (value: string) => void;
    name?: string;
    disabled?: boolean;
  }>({
    items: [],
    value: "",
    onValueChange: () => {},
  });

  const filterItems = (items: string[], value: string) =>
    items.filter((item) => item.toLowerCase().includes(value.toLowerCase()));

  return {
    Autocomplete: ({
      items,
      value,
      onValueChange,
      name,
      disabled,
      children,
    }: {
      items: string[];
      value: string;
      onValueChange?: (value: string) => void;
      name?: string;
      disabled?: boolean;
      children: React.ReactNode;
    }) => (
      <AutocompleteContext.Provider
        value={{
          items,
          value,
          onValueChange: onValueChange ?? (() => {}),
          name,
          disabled,
        }}
      >
        {children}
      </AutocompleteContext.Provider>
    ),
    AutocompleteInput: ({
      id,
      placeholder,
      disabled: inputDisabled,
      showTrigger = true,
      showClear = false,
      "data-testid": testId,
    }: {
      id?: string;
      placeholder?: string;
      disabled?: boolean;
      showTrigger?: boolean;
      showClear?: boolean;
      "data-testid"?: string;
    }) => {
      const {
        value,
        onValueChange,
        name,
        disabled: contextDisabled,
      } = React.useContext(AutocompleteContext);
      const disabled = inputDisabled ?? contextDisabled;
      return (
        <div data-slot="input-group">
          <input
            role="combobox"
            id={id}
            name={name}
            placeholder={placeholder}
            value={value}
            disabled={disabled}
            data-testid={testId}
            onChange={(e) => onValueChange(e.target.value)}
          />
          {showTrigger && (
            <button
              type="button"
              aria-label="Toggle suggestions"
              disabled={disabled}
              data-slot="autocomplete-trigger"
            >
              ▾
            </button>
          )}
          {showClear && value !== "" && (
            <button
              type="button"
              aria-label="Clear"
              disabled={disabled}
              data-slot="autocomplete-clear"
              onClick={() => onValueChange("")}
            >
              ×
            </button>
          )}
        </div>
      );
    },
    AutocompleteTrigger: ({
      children,
      disabled,
    }: {
      children?: React.ReactNode;
      disabled?: boolean;
    }) => {
      const { disabled: contextDisabled } =
        React.useContext(AutocompleteContext);
      return (
        <button
          type="button"
          aria-label="Toggle suggestions"
          disabled={disabled ?? contextDisabled}
          data-slot="autocomplete-trigger"
        >
          {children ?? "▾"}
        </button>
      );
    },
    AutocompleteClear: ({
      children,
      disabled,
    }: {
      children?: React.ReactNode;
      disabled?: boolean;
    }) => {
      const {
        value,
        onValueChange,
        disabled: contextDisabled,
      } = React.useContext(AutocompleteContext);
      if (value === "") return null;
      return (
        <button
          type="button"
          aria-label="Clear"
          disabled={disabled ?? contextDisabled}
          data-slot="autocomplete-clear"
          onClick={() => onValueChange("")}
        >
          {children ?? "×"}
        </button>
      );
    },
    AutocompleteContent: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    AutocompleteEmpty: ({ children }: { children: React.ReactNode }) => {
      const { items, value } = React.useContext(AutocompleteContext);
      return filterItems(items, value).length === 0 ? (
        <p role="status">{children}</p>
      ) : null;
    },
    AutocompleteList: ({
      children,
    }: {
      children: (item: string) => React.ReactNode;
    }) => {
      const { items, value } = React.useContext(AutocompleteContext);
      return (
        <div role="listbox">
          {filterItems(items, value).map((item) => children(item))}
        </div>
      );
    },
    AutocompleteItem: ({
      value: itemValue,
      children,
    }: {
      value: string;
      children: React.ReactNode;
    }) => {
      const { onValueChange } = React.useContext(AutocompleteContext);
      return (
        <button
          type="button"
          role="option"
          onClick={() => onValueChange(itemValue)}
        >
          {children}
        </button>
      );
    },
  };
})();
