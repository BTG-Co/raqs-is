"use client";

import { useEffect, useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useForm, type DefaultValues, type FieldValues, type Path, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType } from "zod";
import { ApiError } from "@raqs/shared";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

type Option = { value: string; label: string };

type FieldControl =
  | { kind: "text" | "password" | "url"; name: string; label: string; autoComplete?: string }
  | {
      kind: "number";
      name: string;
      label: string;
      placeholder?: string;
      step?: string;
      prefix?: string;
    }
  | {
      kind: "select";
      name: string;
      label: string;
      options: Option[];
      emptyHint: string;
      /** Clear these fields when this select changes. */
      clears?: string[];
    };

export type FormField = FieldControl | { kind: "row"; fields: FieldControl[] };

type Props<T extends FieldValues> = {
  open: boolean;
  title: string;
  schema: ZodType<T>;
  fields: FormField[] | ((values: T) => FormField[]);
  defaultValues: DefaultValues<T>;
  onSubmit: (values: T) => Promise<void>;
  onClose: () => void;
  submitLabel: string;
};

export function ResourceFormDialog<T extends FieldValues>({
  open,
  title,
  schema,
  fields,
  defaultValues,
  onSubmit,
  onClose,
  submitLabel,
}: Props<T>) {
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<T>({
    resolver: zodResolver(schema) as Resolver<T>,
    defaultValues,
  });

  const serializedDefaults = JSON.stringify(defaultValues);
  useEffect(() => {
    if (!open) return;
    form.reset(defaultValues);
    setFormError(null);
  }, [open, serializedDefaults]);

  const watchedValues = form.watch();
  const resolvedFields = typeof fields === "function" ? fields(watchedValues) : fields;
  const flatFields = flattenFields(resolvedFields);

  const missingParent = flatFields.find(
    (field) => field.kind === "select" && field.options.length === 0,
  );

  function renderControl(field: FieldControl) {
    if (field.kind === "select") {
      return (
        <SearchableSelect
          name={field.name}
          label={field.label}
          options={field.options}
          value={String(form.watch(field.name as Path<T>) ?? "")}
          onChange={(value) => {
            form.setValue(field.name as Path<T>, value as never, { shouldValidate: true });
            for (const name of field.clears ?? []) {
              form.setValue(name as Path<T>, "" as never, { shouldValidate: true });
            }
          }}
          error={form.formState.errors[field.name]?.message as string | undefined}
        />
      );
    }

    return (
      <>
        <Label htmlFor={field.name}>{field.label}</Label>
        <div className={field.kind === "number" && field.prefix ? "relative" : undefined}>
          {field.kind === "number" && field.prefix ? (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
              {field.prefix}
            </span>
          ) : null}
          <Input
            id={field.name}
            type={field.kind === "number" ? "number" : field.kind === "password" ? "password" : field.kind === "url" ? "url" : "text"}
            step={field.kind === "number" ? (field.step ?? "any") : undefined}
            placeholder={field.kind === "number" ? field.placeholder : undefined}
            autoComplete={field.kind === "password" || field.kind === "text" ? field.autoComplete : undefined}
            aria-invalid={Boolean(form.formState.errors[field.name])}
            className={field.kind === "number" && field.prefix ? "pl-12" : undefined}
            {...form.register(field.name as Path<T>, field.kind === "number" ? { valueAsNumber: true } : undefined)}
          />
        </div>
        {form.formState.errors[field.name]?.message ? (
          <p className="text-xs text-error">{String(form.formState.errors[field.name]?.message)}</p>
        ) : null}
      </>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent title={title}>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            setFormError(null);
            try {
              await onSubmit(values);
              onClose();
            } catch (error) {
              if (error instanceof ApiError) {
                for (const [field, message] of Object.entries(error.fieldErrors)) {
                  form.setError(field as Path<T>, { message });
                }
                if (typeof error.detail === "string") setFormError(error.detail);
                else if (Object.keys(error.fieldErrors).length === 0) setFormError(error.message);
              } else {
                setFormError("Something went wrong.");
              }
            }
          })}
        >
          {formError ? (
            <p className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error" role="alert">
              {formError}
            </p>
          ) : null}
          {missingParent && missingParent.kind === "select" ? (
            <p className="text-sm text-muted">{missingParent.emptyHint}</p>
          ) : null}
          {resolvedFields.map((field, index) =>
            field.kind === "row" ? (
              <div key={`row-${index}`} className="grid gap-4 sm:grid-cols-2">
                {field.fields.map((child) => (
                  <div key={child.name} className="space-y-1.5">
                    {renderControl(child)}
                  </div>
                ))}
              </div>
            ) : (
              <div key={field.name} className="space-y-1.5">
                {renderControl(field)}
              </div>
            ),
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting || Boolean(missingParent)}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function flattenFields(fields: FormField[]): FieldControl[] {
  return fields.flatMap((field) => (field.kind === "row" ? field.fields : [field]));
}

function SearchableSelect({
  name,
  label,
  options,
  value,
  onChange,
  error,
}: {
  name: string;
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const selected = options.find((option) => option.value === value);
  const filtered = options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  function choose(next: string) {
    onChange(next);
    close();
  }

  return (
    <div className={open ? "relative z-20" : "relative"}>
      <Label htmlFor={name}>{label}</Label>
      <div className="relative mt-1.5">
        <Input
          id={name}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={Boolean(error)}
          autoComplete="off"
          className="pr-9"
          placeholder={selected?.label ?? "Search"}
          value={open ? query : (selected?.label ?? "")}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setQuery("");
            setOpen(true);
          }}
          onBlur={close}
          onKeyDown={(event) => {
            if (!open && event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
              event.preventDefault();
              setQuery(event.key);
              setOpen(true);
              return;
            }
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((index) => Math.min(index + 1, Math.max(filtered.length - 1, 0)));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            } else if (event.key === "Enter" && open && filtered[activeIndex]) {
              event.preventDefault();
              choose(filtered[activeIndex].value);
            } else if (event.key === "Escape") {
              event.preventDefault();
              close();
            }
          }}
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        {open ? (
          <ul
            id={listId}
            role="listbox"
            aria-label={label}
            className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-lg border border-line bg-card shadow-card"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted">No matches</li>
            ) : (
              filtered.map((option, index) => (
                <li key={option.value} role="option" aria-selected={option.value === value}>
                  <button
                    type="button"
                    className={`w-full px-3 py-2 text-left text-sm ${
                      index === activeIndex || option.value === value ? "bg-primary-50 font-medium" : "hover:bg-primary-50"
                    }`}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => choose(option.value)}
                  >
                    {option.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
      {error ? <p className="mt-1 text-xs text-error">{error}</p> : null}
    </div>
  );
}
