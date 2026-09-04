"use client";

import * as React from "react";
import { Autocomplete as AutocompletePrimitive } from "@base-ui/react/autocomplete";
import { ChevronDownIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

const Autocomplete = AutocompletePrimitive.Root;

function AutocompleteTrigger({
  className,
  children,
  ...props
}: AutocompletePrimitive.Trigger.Props) {
  return (
    <AutocompletePrimitive.Trigger
      data-slot="autocomplete-trigger"
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon-xs" }),
        "group-has-data-[slot=autocomplete-clear]/input-group:hidden",
        className,
      )}
      {...props}
    >
      {children ?? <ChevronDownIcon className="size-3.5" />}
    </AutocompletePrimitive.Trigger>
  );
}

function AutocompleteClear({
  className,
  children,
  ...props
}: AutocompletePrimitive.Clear.Props) {
  return (
    <AutocompletePrimitive.Clear
      data-slot="autocomplete-clear"
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon-xs" }),
        className,
      )}
      {...props}
    >
      {children ?? <XIcon className="size-3.5" />}
    </AutocompletePrimitive.Clear>
  );
}

function AutocompleteInput({
  className,
  children,
  disabled = false,
  showTrigger = true,
  showClear = false,
  ...props
}: Omit<AutocompletePrimitive.Input.Props, "className"> & {
  className?: string;
  showTrigger?: boolean;
  showClear?: boolean;
}) {
  return (
    <InputGroup className={className}>
      <AutocompletePrimitive.Input
        render={<InputGroupInput disabled={disabled} />}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        {showTrigger && <AutocompleteTrigger disabled={disabled} />}
        {showClear && <AutocompleteClear disabled={disabled} />}
      </InputGroupAddon>
      {children}
    </InputGroup>
  );
}

function AutocompleteContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "start",
  alignOffset = 0,
  disableAnchorTracking,
  ...props
}: AutocompletePrimitive.Popup.Props &
  Pick<
    AutocompletePrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "disableAnchorTracking"
  >) {
  return (
    <AutocompletePrimitive.Portal>
      <AutocompletePrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        disableAnchorTracking={disableAnchorTracking}
        className="isolate z-50"
      >
        <AutocompletePrimitive.Popup
          data-slot="autocomplete-content"
          className={cn(
            "bg-popover text-popover-foreground ring-foreground/10 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md shadow-md ring-1 duration-100",
            className,
          )}
          {...props}
        >
          {children}
        </AutocompletePrimitive.Popup>
      </AutocompletePrimitive.Positioner>
    </AutocompletePrimitive.Portal>
  );
}

function AutocompleteEmpty({
  className,
  ...props
}: AutocompletePrimitive.Empty.Props) {
  return (
    <AutocompletePrimitive.Empty
      data-slot="autocomplete-empty"
      className={cn("text-muted-foreground px-2 py-1.5 text-sm", className)}
      {...props}
    />
  );
}

function AutocompleteList({
  className,
  ...props
}: AutocompletePrimitive.List.Props) {
  return (
    <AutocompletePrimitive.List
      data-slot="autocomplete-list"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  );
}

function AutocompleteItem({
  className,
  children,
  ...props
}: AutocompletePrimitive.Item.Props) {
  return (
    <AutocompletePrimitive.Item
      data-slot="autocomplete-item"
      className={cn(
        "data-highlighted:bg-accent data-highlighted:text-accent-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-2 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </AutocompletePrimitive.Item>
  );
}

export {
  Autocomplete,
  AutocompleteClear,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompleteTrigger,
};
