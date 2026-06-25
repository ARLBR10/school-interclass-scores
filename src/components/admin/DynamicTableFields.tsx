"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, CircleCheck, CircleX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

import type {
  AdminTableColumn,
  AdminTableSelectOption,
} from "@/components/admin/DynamicTable";

type DynamicTableRow = Record<string, ReactNode>;

export type BooleanValue = boolean | string | number | null | undefined;
export type DateValue = string | number | null | undefined;

/**
 * Parses a table boolean field input into a boolean value.
 */
export function parseBooleanValue(value: BooleanValue) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === null || value === undefined || value === "") {
    return false;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  const normalizedValue = value.trim().toLowerCase();

  return normalizedValue === "true" || normalizedValue === "1";
}

/**
 * Parses a table date field value into a valid `Date` when possible.
 */
export function parseDateValue(value: DateValue) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const numericValue = typeof value === "number" ? value : Number(value);

  if (!Number.isNaN(numericValue)) {
    const numericDate = new Date(numericValue);

    if (!Number.isNaN(numericDate.getTime())) {
      return numericDate;
    }
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return undefined;
  }

  return parsedDate;
}

/**
 * Renders a boolean value with the admin table success and error icons.
 */
export function BooleanCell({
  value,
}: {
  value: BooleanValue;
}) {
  const isChecked = parseBooleanValue(value);
  const Icon = isChecked ? CircleCheck : CircleX;

  return (
    <span className="flex items-center justify-center">
      <Icon
        className={isChecked ? "size-4 text-emerald-600" : "size-4 text-red-600"}
        aria-hidden="true"
      />
      <span className="sr-only">{isChecked ? "Sim" : "Não"}</span>
    </span>
  );
}

/**
 * Renders a switch input that reads and writes table boolean values.
 */
export function BooleanSwitchInput({
  value,
  fallbackValue,
  onChange,
}: {
  value: string;
  fallbackValue: BooleanValue;
  onChange: (value: string) => void;
}) {
  const checked =
    value === ""
      ? parseBooleanValue(fallbackValue)
      : parseBooleanValue(value);

  return (
    <div className="flex min-h-10 items-center">
      <Switch checked={checked} onCheckedChange={(nextChecked) => onChange(String(nextChecked))} />
    </div>
  );
}

/**
 * Formats a table date value for display in table cells.
 */
export function renderDateValue(value: DateValue) {
  const date = parseDateValue(value);

  if (!date) {
    return "-";
  }

  return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
}

function getTimeInputValue(date: Date | undefined) {
  if (!date) {
    return "";
  }

  return format(date, "HH:mm");
}

function updateDatePart(
  currentDate: Date | undefined,
  nextDate: Date | undefined,
) {
  if (!nextDate) {
    return "";
  }

  const mergedDate = new Date(nextDate);
  mergedDate.setHours(currentDate?.getHours() ?? 0);
  mergedDate.setMinutes(currentDate?.getMinutes() ?? 0);
  mergedDate.setSeconds(0);
  mergedDate.setMilliseconds(0);

  return String(mergedDate.getTime());
}

function updateTimePart(currentDate: Date | undefined, nextTime: string) {
  const [hours, minutes] = nextTime.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return currentDate ? String(currentDate.getTime()) : "";
  }

  const nextDate = currentDate ? new Date(currentDate) : new Date();
  nextDate.setHours(hours);
  nextDate.setMinutes(minutes);
  nextDate.setSeconds(0);
  nextDate.setMilliseconds(0);

  return String(nextDate.getTime());
}

/**
 * Renders a date picker input that stores the selected value as a timestamp string.
 */
export function DatePickerInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseDateValue(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start px-2.5 font-normal"
        >
          <CalendarIcon data-icon="inline-start" />
          {selectedDate ? (
            format(selectedDate, "PPP HH:mm", { locale: ptBR })
          ) : (
            <span>Selecione data e hora</span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto space-y-3 p-3" align="start">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          locale={ptBR}
          selected={selectedDate}
          onSelect={(date) => {
            onChange(updateDatePart(selectedDate, date));
          }}
        />
        <div className="flex items-center gap-2 border-t pt-3">
          <Input
            type="time"
            value={getTimeInputValue(selectedDate)}
            aria-label="Hora"
            onChange={(event) => {
              onChange(updateTimePart(selectedDate, event.target.value));
            }}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
          >
            Fechar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Creates a select-backed admin table column with label rendering and form options.
 */
export function createSelectColumn<T extends DynamicTableRow>({
  key,
  label,
  options,
  placeholder,
  ...column
}: Omit<AdminTableColumn<T>, "key" | "label" | "render" | "formSelectOptions" | "formSelectPlaceholder"> & {
  key: keyof T;
  label: ReactNode;
  options: AdminTableSelectOption[];
  placeholder?: string;
}): AdminTableColumn<T> {
  return {
    ...column,
    key,
    label,
    render: (row) => {
      const rawValue = row[key];

      if (typeof rawValue !== "string") {
        return rawValue ?? "-";
      }

      const option = options.find((currentOption) => currentOption.value === rawValue);

      return option?.label ?? rawValue;
    },
    formSelectOptions: options,
    formSelectPlaceholder: placeholder,
  };
}

/**
 * Creates a boolean admin table column with a boolean cell renderer and switch input.
 */
export function createBooleanColumn<T extends DynamicTableRow>({
  key,
  label,
  falseValue = false,
  ...column
}: Omit<AdminTableColumn<T>, "key" | "label" | "render" | "formRender"> & {
  key: keyof T;
  label: ReactNode;
  falseValue?: BooleanValue;
}): AdminTableColumn<T> {
  return {
    ...column,
    key,
    label,
    render: (row) => <BooleanCell value={row[key] as BooleanValue} />,
    formRender: ({ value, onChange, mode, row }) => (
      <BooleanSwitchInput
        value={value}
        fallbackValue={
          mode === "edit"
            ? (row?.[key] as BooleanValue)
            : falseValue
        }
        onChange={onChange}
      />
    ),
  };
}

/**
 * Creates a date admin table column with formatted table rendering and a date picker input.
 */
export function createDateColumn<T extends DynamicTableRow>({
  key,
  label,
  ...column
}: Omit<AdminTableColumn<T>, "key" | "label" | "render" | "formRender"> & {
  key: keyof T;
  label: ReactNode;
}): AdminTableColumn<T> {
  return {
    ...column,
    key,
    label,
    render: (row) => renderDateValue(row[key] as DateValue),
    formRender: ({ value, onChange, mode, row }) => (
      <DatePickerInput
        value={value || (mode === "edit" ? String((row?.[key] as DateValue) ?? "") : "")}
        onChange={onChange}
      />
    ),
  };
}
