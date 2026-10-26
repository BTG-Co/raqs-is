import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useForm, type DefaultValues, type FieldValues, type Path, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType } from "zod";
import { ApiError } from "@raqs/shared";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, ui } from "../theme";

type Option = { value: string; label: string };

export type MobileField =
  | { kind: "text" | "password" | "url" | "number"; name: string; label: string }
  | { kind: "select"; name: string; label: string; options: Option[]; emptyHint: string };

type Props<T extends FieldValues> = {
  schema: ZodType<T>;
  defaultValues: DefaultValues<T>;
  fields: MobileField[];
  onSubmit: (values: T) => Promise<void>;
  submitLabel: string;
};

export function FormScreen<T extends FieldValues>({ schema, defaultValues, fields, onSubmit, submitLabel }: Props<T>) {
  const insets = useSafeAreaInsets();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<T>({
    resolver: zodResolver(schema) as Resolver<T>,
    defaultValues,
  });
  const serialized = JSON.stringify(defaultValues);

  useEffect(() => {
    form.reset(defaultValues);
  }, [serialized]);

  const missingParent = fields.find((field) => field.kind === "select" && field.options.length === 0);

  return (
    <KeyboardAvoidingView
      style={ui.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[8], gap: spacing[4] }}>
        {formError ? <Text style={{ color: colors.error }}>{formError}</Text> : null}
        {missingParent && missingParent.kind === "select" ? <Text style={ui.muted}>{missingParent.emptyHint}</Text> : null}
        {fields.map((field) => {
          const message = form.formState.errors[field.name]?.message;
          return (
            <View key={field.name} style={{ gap: spacing[2] }}>
              <Text style={ui.body}>{field.label}</Text>
              {field.kind === "select" ? (
                <SelectOptions
                  options={field.options}
                  value={String(form.watch(field.name as Path<T>) ?? "")}
                  onChange={(value) => form.setValue(field.name as Path<T>, value as never, { shouldValidate: true })}
                />
              ) : (
                <TextInput
                  accessibilityLabel={field.label}
                  secureTextEntry={field.kind === "password"}
                  keyboardType={field.kind === "number" ? "decimal-pad" : field.kind === "url" ? "url" : "default"}
                  autoCapitalize={field.kind === "url" || field.kind === "password" ? "none" : "sentences"}
                  style={ui.input}
                  value={textValue(form.watch(field.name as Path<T>), field.kind)}
                  onChangeText={(text) => {
                    const next = field.kind === "number" ? (text === "" ? Number.NaN : Number(text)) : text;
                    form.setValue(field.name as Path<T>, next as never, { shouldValidate: true });
                  }}
                />
              )}
              {typeof message === "string" ? <Text style={{ color: colors.error, fontSize: 12 }}>{message}</Text> : null}
            </View>
          );
        })}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={submitLabel}
          disabled={form.formState.isSubmitting || Boolean(missingParent)}
          onPress={form.handleSubmit(async (values) => {
            setFormError(null);
            try {
              await onSubmit(values);
            } catch (error) {
              if (error instanceof ApiError) {
                for (const [name, fieldMessage] of Object.entries(error.fieldErrors)) {
                  form.setError(name as Path<T>, { message: fieldMessage });
                }
                setFormError(typeof error.detail === "string" ? error.detail : error.message);
              } else {
                setFormError("Something went wrong.");
              }
            }
          })}
          style={[ui.primaryButton, (form.formState.isSubmitting || missingParent) && { opacity: 0.5 }]}
        >
          <Text style={ui.primaryButtonText}>{form.formState.isSubmitting ? "Saving…" : submitLabel}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function textValue(value: unknown, kind: string): string {
  if (kind === "number") return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
  return typeof value === "string" ? value : "";
}

function SelectOptions({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((option) => option.value === value);
  const filtered = options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()));

  function close() {
    setOpen(false);
    setQuery("");
  }

  return (
    <View style={{ gap: spacing[2], zIndex: open ? 1 : 0 }}>
      <TextInput
        accessibilityRole="combobox"
        accessibilityLabel="Search"
        accessibilityState={{ expanded: open }}
        placeholder={selected?.label ?? "Search"}
        placeholderTextColor={colors.textMuted}
        value={open ? query : (selected?.label ?? "")}
        onChangeText={(text) => {
          if (!open) {
            const label = selected?.label ?? "";
            if (label && text.startsWith(label)) setQuery(text.slice(label.length));
            else if (label.startsWith(text)) setQuery("");
            else setQuery(text);
          } else {
            setQuery(text);
          }
          setOpen(true);
        }}
        onFocus={() => {
          setQuery("");
          setOpen(true);
        }}
        onBlur={() => {
          setTimeout(close, 150);
        }}
        style={ui.input}
      />
      {open ? (
        filtered.length === 0 ? (
          <Text style={ui.muted}>No matches</Text>
        ) : (
          filtered.map((option) => {
            const isSelected = option.value === value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  onChange(option.value);
                  close();
                }}
                style={{
                  minHeight: 44,
                  justifyContent: "center",
                  paddingHorizontal: spacing[3],
                  borderRadius: 8,
                  backgroundColor: isSelected ? colors.primary : colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: isSelected ? colors.textOnPrimary : colors.text }}>{option.label}</Text>
              </Pressable>
            );
          })
        )
      ) : null}
    </View>
  );
}
