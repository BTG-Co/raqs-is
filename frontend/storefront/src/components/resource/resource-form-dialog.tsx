"use client";

import { useEffect, useId, useState } from "react";
import { useForm, type DefaultValues, type FieldValues, type Path, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType } from "zod";
import { ApiError } from "@raqs/shared";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

type Option = { value: string; label: string };

export type FormField =
  | { kind: "text" | "password" | "url"; name: string; label: string; autoComplete?: string }
  | { kind: "number"; name: string; label: string }
  | { kind: "select"; name: string; label: string; options: Option[]; emptyHint: string };

type Props<T extends FieldValues> = {
  open: boolean;
  title: string;
  schema: ZodType<T>;
  fields: FormField[];
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

  const missingParent = fields.find(
    (field) => field.kind === "select" && field.options.length === 0,
  );

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
          {fields.map((field) => (
            <div key={field.name} className="space-y-1.5">
              {field.kind === "select" ? (
                <SearchableSelect
                  name={field.name}
                  label={field.label}
                  options={field.options}
                  value={String(form.watch(field.name as Path<T>) ?? "")}
                  onChange={(value) => form.setValue(field.name as Path<T>, value as never, { shouldValidate: true })}
                  error={form.formState.errors[field.name]?.message as string | undefined}
                />
              ) : (
                <>
                  <Label htmlFor={field.name}>{field.label}</Label>
                  <Input
                    id={field.name}
                    type={field.kind === "number" ? "number" : field.kind === "password" ? "password" : field.kind === "url" ? "url" : "text"}
                    step={field.kind === "number" ? "any" : undefined}
                    autoComplete={field.kind === "password" || field.kind === "text" ? field.autoComplete : undefined}
                    aria-invalid={Boolean(form.formState.errors[field.name])}
                    {...form.register(field.name as Path<T>, field.kind === "number" ? { valueAsNumber: true } : undefined)}
                  />
                  {form.formState.errors[field.name]?.message ? (
                    <p className="text-xs text-error">{String(form.formState.errors[field.name]?.message)}</p>
                  ) : null}
                </>
              )}
            </div>
          ))}
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
  const [query, setQuery] = useState("");
  const selected = options.find((option) => option.value === value);
  const filtered = options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <input
        id={name}
        role="combobox"
        aria-expanded="true"
        aria-controls={listId}
        aria-autocomplete="list"
        aria-invalid={Boolean(error)}
        className="mt-1.5 h-10 w-full rounded-lg border border-line bg-card px-3 text-sm"
        placeholder={selected?.label ?? "Search"}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {selected && !query ? <p className="mt-1 text-xs text-muted">Selected: {selected.label}</p> : null}
      <ul id={listId} role="listbox" aria-label={label} className="mt-1 max-h-40 overflow-auto rounded-lg border border-line">
        {filtered.length === 0 ? (
          <li className="px-3 py-2 text-sm text-muted">No matches</li>
        ) : (
          filtered.map((option) => (
            <li key={option.value} role="option" aria-selected={option.value === value}>
              <button
                type="button"
                className={`w-full px-3 py-2 text-left text-sm ${option.value === value ? "bg-primary-50 font-medium" : "hover:bg-primary-50"}`}
                onClick={() => {
                  onChange(option.value);
                  setQuery("");
                }}
              >
                {option.label}
              </button>
            </li>
          ))
        )}
      </ul>
      {error ? <p className="mt-1 text-xs text-error">{error}</p> : null}
    </div>
  );
}
