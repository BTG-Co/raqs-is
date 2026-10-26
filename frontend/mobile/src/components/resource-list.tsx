import { type ReactNode } from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { ApiError } from "@raqs/shared";
import { RetryBanner } from "./retry-banner";
import { spacing, ui } from "../theme";

type Props<T> = {
  rows: T[];
  rowKey: (row: T) => string;
  title: (row: T) => string;
  subtitle?: (row: T) => string;
  isLoading: boolean;
  isRefreshing: boolean;
  error: unknown;
  onRefresh: () => void;
  onAdd?: () => void;
  addLabel?: string;
  onEdit?: (row: T) => void;
  editLabel?: string;
  onDelete?: (row: T) => Promise<void>;
  header?: ReactNode;
  emptyLabel: string;
};

export function ResourceList<T>({
  rows,
  rowKey,
  title,
  subtitle,
  isLoading,
  isRefreshing,
  error,
  onRefresh,
  onAdd,
  addLabel = "Add",
  onEdit,
  editLabel = "Edit",
  onDelete,
  header,
  emptyLabel,
}: Props<T>) {
  function openActions(row: T) {
    if (!onEdit && !onDelete) return;
    const actions: { text: string; style?: "destructive" | "cancel"; onPress?: () => void }[] = [];
    if (onEdit) actions.push({ text: editLabel, onPress: () => onEdit(row) });
    if (onDelete) {
      actions.push({
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Alert.alert("Delete record", `Delete ${title(row)}?`, [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: () => {
                void onDelete(row).catch((deleteError: unknown) => {
                  const message = deleteError instanceof ApiError ? deleteError.message : "Could not delete.";
                  Alert.alert("Could not delete", message);
                });
              },
            },
          ]);
        },
      });
    }
    actions.push({ text: "Cancel", style: "cancel" });
    Alert.alert(title(row), undefined, actions);
  }

  return (
    <View style={ui.screen}>
      {error ? (
        <RetryBanner
          message={error instanceof ApiError ? error.message : "Could not load data."}
          onRetry={onRefresh}
        />
      ) : null}
      <FlatList
        data={rows}
        keyExtractor={rowKey}
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        contentContainerStyle={{ padding: spacing[4], gap: spacing[3], paddingBottom: 96, flexGrow: 1 }}
        ListHeaderComponent={header ? <View style={{ marginBottom: spacing[3] }}>{header}</View> : null}
        ListEmptyComponent={
          isLoading ? null : (
            <Text style={ui.muted}>{emptyLabel}</Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={title(item)}
            accessibilityHint={onEdit || onDelete ? "Long press for actions" : undefined}
            onLongPress={onEdit || onDelete ? () => openActions(item) : undefined}
            style={ui.card}
          >
            <Text style={ui.body}>{title(item)}</Text>
            {subtitle ? <Text style={ui.muted}>{subtitle(item)}</Text> : null}
          </Pressable>
        )}
      />
      {onAdd ? (
        <Pressable accessibilityRole="button" accessibilityLabel={addLabel} onPress={onAdd} style={ui.fab}>
          <Text style={ui.primaryButtonText}>{addLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
