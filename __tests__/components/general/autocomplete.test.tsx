import React from "react";
import { act } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import {
  Autocomplete,
  AutocompleteClear,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompleteTrigger,
} from "@/components/general/autocomplete";

const items = ["Maths", "Science", "English"];

async function flushPendingAnimationFrame() {
  await act(async () => {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  });
}

async function closePopup(user: ReturnType<typeof userEvent.setup>) {
  await user.keyboard("{Escape}");
  await flushPendingAnimationFrame();
}

function AutocompleteHarness({
  onValueChange,
  showTrigger,
  showClear,
  disabled,
}: {
  onValueChange?: (value: string) => void;
  showTrigger?: boolean;
  showClear?: boolean;
  disabled?: boolean;
}) {
  const [value, setValue] = React.useState("");
  return (
    <Autocomplete
      items={items}
      value={value}
      onValueChange={(v) => {
        setValue(v);
        onValueChange?.(v);
      }}
      name="subject"
    >
      <AutocompleteInput
        id="subject"
        placeholder="e.g. Maths"
        showTrigger={showTrigger}
        showClear={showClear}
        disabled={disabled}
      />
      <AutocompleteContent>
        <AutocompleteEmpty>No matches</AutocompleteEmpty>
        <AutocompleteList>
          {(item: string) => (
            <AutocompleteItem key={item} value={item}>
              {item}
            </AutocompleteItem>
          )}
        </AutocompleteList>
      </AutocompleteContent>
    </Autocomplete>
  );
}

function renderAutocomplete(
  props: React.ComponentProps<typeof AutocompleteHarness> = {},
) {
  return render(<AutocompleteHarness {...props} />);
}

function renderInForm(onSubmit: (formData: FormData) => void) {
  function FormHarness() {
    const [value, setValue] = React.useState("");
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(new FormData(event.currentTarget));
        }}
      >
        <Autocomplete
          items={items}
          value={value}
          onValueChange={setValue}
          name="subject"
        >
          <AutocompleteInput id="subject" placeholder="e.g. Maths" />
          <AutocompleteContent>
            <AutocompleteEmpty>No matches</AutocompleteEmpty>
            <AutocompleteList>
              {(item: string) => (
                <AutocompleteItem key={item} value={item}>
                  {item}
                </AutocompleteItem>
              )}
            </AutocompleteList>
          </AutocompleteContent>
        </Autocomplete>
        <button type="submit">Submit</button>
      </form>
    );
  }
  return render(<FormHarness />);
}

describe("Autocomplete", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("input", () => {
    it("renders a combobox input with the given placeholder", () => {
      renderAutocomplete();
      expect(screen.getByPlaceholderText("e.g. Maths")).toHaveAttribute(
        "role",
        "combobox",
      );
    });

    it("calls onValueChange as the user types", async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();
      renderAutocomplete({ onValueChange });
      await user.type(screen.getByPlaceholderText("e.g. Maths"), "Ma");
      expect(onValueChange).toHaveBeenCalled();
      expect(onValueChange.mock.calls.at(-1)?.[0]).toBe("Ma");
      expect(screen.getByPlaceholderText("e.g. Maths")).toHaveValue("Ma");
      await closePopup(user);
    });

    it("disables the input when disabled is passed", () => {
      renderAutocomplete({ disabled: true });
      expect(screen.getByPlaceholderText("e.g. Maths")).toBeDisabled();
    });
  });

  describe("suggestion list", () => {
    it("shows matching items as options while typing", async () => {
      const user = userEvent.setup();
      renderAutocomplete();
      await user.type(screen.getByPlaceholderText("e.g. Maths"), "Ma");
      expect(screen.getByRole("option", { name: "Maths" })).toBeInTheDocument();
      expect(
        screen.queryByRole("option", { name: "Science" }),
      ).not.toBeInTheDocument();
      await closePopup(user);
    });

    it("shows the empty state when no items match", async () => {
      const user = userEvent.setup();
      renderAutocomplete();
      await user.type(screen.getByPlaceholderText("e.g. Maths"), "zzz");
      expect(screen.getByRole("status")).toHaveTextContent("No matches");
      await closePopup(user);
    });

    it("sets the input value when an option is clicked", async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();
      renderAutocomplete({ onValueChange });
      await user.type(screen.getByPlaceholderText("e.g. Maths"), "Sci");
      await user.click(screen.getByRole("option", { name: "Science" }));
      expect(screen.getByPlaceholderText("e.g. Maths")).toHaveValue("Science");
      expect(onValueChange.mock.calls.at(-1)?.[0]).toBe("Science");
      await flushPendingAnimationFrame();
    });
  });

  describe("trigger", () => {
    it("renders by default", () => {
      const { container } = renderAutocomplete();
      expect(
        container.querySelector('[data-slot="autocomplete-trigger"]'),
      ).toBeInTheDocument();
    });

    it("does not render when showTrigger is false", () => {
      const { container } = renderAutocomplete({ showTrigger: false });
      expect(
        container.querySelector('[data-slot="autocomplete-trigger"]'),
      ).not.toBeInTheDocument();
    });

    it("renders the default chevron icon", () => {
      const { container } = renderAutocomplete();
      const trigger = container.querySelector(
        '[data-slot="autocomplete-trigger"]',
      );
      expect(trigger?.querySelector("svg")).toHaveClass("lucide-chevron-down");
    });

    it("renders custom children instead of the default icon", () => {
      function CustomTriggerHarness() {
        const [value, setValue] = React.useState("");
        return (
          <Autocomplete items={items} value={value} onValueChange={setValue}>
            <AutocompleteTrigger>
              <span>Open</span>
            </AutocompleteTrigger>
          </Autocomplete>
        );
      }
      render(<CustomTriggerHarness />);
      expect(screen.getByText("Open")).toBeInTheDocument();
    });

    it("is disabled when the input is disabled", () => {
      const { container } = renderAutocomplete({ disabled: true });
      expect(
        container.querySelector('[data-slot="autocomplete-trigger"]'),
      ).toBeDisabled();
    });

    it("opens the list of options when clicked", async () => {
      const { container } = renderAutocomplete();
      const trigger = container.querySelector(
        '[data-slot="autocomplete-trigger"]',
      ) as HTMLElement;
      fireEvent.click(trigger);
      expect(screen.getByRole("option", { name: "Maths" })).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "Science" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "English" }),
      ).toBeInTheDocument();
      fireEvent.click(trigger);
      await flushPendingAnimationFrame();
    });
  });

  describe("clear", () => {
    it("does not render when showClear is false, even with a value", async () => {
      const user = userEvent.setup();
      const { container } = renderAutocomplete({ showClear: false });
      await user.type(screen.getByPlaceholderText("e.g. Maths"), "Ma");
      expect(
        container.querySelector('[data-slot="autocomplete-clear"]'),
      ).not.toBeInTheDocument();
      await closePopup(user);
    });

    it("does not render when showClear is true but the field is empty", () => {
      const { container } = renderAutocomplete({ showClear: true });
      expect(
        container.querySelector('[data-slot="autocomplete-clear"]'),
      ).not.toBeInTheDocument();
    });

    it("renders once there is a value, when showClear is true", async () => {
      const user = userEvent.setup();
      const { container } = renderAutocomplete({ showClear: true });
      await user.type(screen.getByPlaceholderText("e.g. Maths"), "Ma");
      expect(
        container.querySelector('[data-slot="autocomplete-clear"]'),
      ).toBeInTheDocument();
      await closePopup(user);
    });

    it("renders the default X icon", async () => {
      const user = userEvent.setup();
      const { container } = renderAutocomplete({ showClear: true });
      await user.type(screen.getByPlaceholderText("e.g. Maths"), "Ma");
      const clear = container.querySelector('[data-slot="autocomplete-clear"]');
      expect(clear?.querySelector("svg")).toHaveClass("lucide-x");
      await closePopup(user);
    });

    it("clears the value when clicked", async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();
      const { container } = renderAutocomplete({
        showClear: true,
        onValueChange,
      });
      await user.type(screen.getByPlaceholderText("e.g. Maths"), "Ma");
      const clear = container.querySelector(
        '[data-slot="autocomplete-clear"]',
      ) as HTMLElement;
      await user.click(clear);
      expect(screen.getByPlaceholderText("e.g. Maths")).toHaveValue("");
      expect(onValueChange.mock.calls.at(-1)?.[0]).toBe("");
      await closePopup(user);
    });

    it("is disabled when the input is disabled, once visible", async () => {
      function DisabledClearHarness() {
        const [value, setValue] = React.useState("Ma");
        return (
          <Autocomplete items={items} value={value} onValueChange={setValue}>
            <AutocompleteInput
              id="subject"
              placeholder="e.g. Maths"
              showClear
              disabled
            />
          </Autocomplete>
        );
      }
      const { container } = render(<DisabledClearHarness />);
      expect(
        container.querySelector('[data-slot="autocomplete-clear"]'),
      ).toBeDisabled();
    });
  });

  describe("input group addon", () => {
    it("focuses the input when the addon is clicked outside of a button", async () => {
      const { container } = renderAutocomplete({ showClear: true });
      const addon = container.querySelector(
        '[data-slot="input-group-addon"]',
      ) as HTMLElement;
      fireEvent.click(addon);
      const input = screen.getByPlaceholderText("e.g. Maths");
      await waitFor(() => expect(input).toHaveFocus());
      fireEvent.keyDown(input, { key: "Escape" });
      await flushPendingAnimationFrame();
    });

    it("does not intercept clicks on its own buttons", async () => {
      const { container } = renderAutocomplete();
      const trigger = container.querySelector(
        '[data-slot="autocomplete-trigger"]',
      ) as HTMLElement;
      fireEvent.click(trigger);
      expect(screen.getByRole("option", { name: "Maths" })).toBeInTheDocument();
      fireEvent.click(trigger);
      await flushPendingAnimationFrame();
    });
  });

  describe("open popup and surrounding page", () => {
    it("makes elements outside the popup inert while it is open", async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      renderInForm(onSubmit);
      await user.type(screen.getByPlaceholderText("e.g. Maths"), "Ma");
      expect(
        screen.queryByRole("button", { name: "Submit" }),
      ).not.toBeInTheDocument();
      await user.keyboard("{Escape}");
      expect(
        screen.getByRole("button", { name: "Submit" }),
      ).toBeInTheDocument();
      await flushPendingAnimationFrame();
    });
  });

  describe("form submission", () => {
    it("includes the typed subject in FormData", async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      renderInForm(onSubmit);
      await user.type(screen.getByPlaceholderText("e.g. Maths"), "Chemistry");
      await closePopup(user);
      await user.click(screen.getByRole("button", { name: "Submit" }));
      expect(onSubmit).toHaveBeenCalledTimes(1);
      const formData: FormData = onSubmit.mock.calls[0][0];
      expect(formData.get("subject")).toBe("Chemistry");
    });

    it("includes a value not present in the suggestion list", async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      renderInForm(onSubmit);
      await user.type(screen.getByPlaceholderText("e.g. Maths"), "Woodworking");
      await closePopup(user);
      await user.click(screen.getByRole("button", { name: "Submit" }));
      const formData: FormData = onSubmit.mock.calls[0][0];
      expect(formData.get("subject")).toBe("Woodworking");
    });
  });
});
