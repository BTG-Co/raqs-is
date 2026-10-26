import { Redirect, router } from "expo-router";
import { useDeleteUser, useUsers } from "@raqs/shared";
import { useAuth } from "../../src/auth/auth-context";
import { ResourceList } from "../../src/components/resource-list";

export default function UsersScreen() {
  const { session } = useAuth();
  const users = useUsers();
  const remove = useDeleteUser();
  if (session && session.user.role !== "ADMIN") return <Redirect href="/(app)/(tabs)/inventory" />;

  return (
    <ResourceList
      rows={users.data ?? []}
      rowKey={(row) => row.id}
      title={(row) => row.name}
      subtitle={(row) => `${row.username} · ${row.role}`}
      isLoading={users.isLoading}
      isRefreshing={users.isRefetching}
      error={users.error}
      onRefresh={() => void users.refetch()}
      onAdd={() => router.push("/(app)/user-form")}
      addLabel="Add"
      onEdit={(row) => router.push({ pathname: "/(app)/user-form", params: { id: row.id } })}
      onDelete={session?.user.role === "ADMIN" ? (row) => remove.mutateAsync(row.id) : undefined}
      emptyLabel="No users yet."
    />
  );
}
