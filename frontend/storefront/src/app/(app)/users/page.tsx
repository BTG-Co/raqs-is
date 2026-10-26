"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  userCreateSchema,
  userUpdateSchema,
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUsers,
  type User,
  type UserCreateInput,
  type UserUpdateInput,
} from "@raqs/shared";
import { PageHeader } from "@/components/page-header";
import { ResourceFormDialog, type FormField } from "@/components/resource/resource-form-dialog";
import { ResourceTable } from "@/components/resource/resource-table";
import { useSessionUser } from "@/components/shell/session-context";
import { Badge } from "@/components/ui/badge";
import { errorMessage } from "@/lib/utils";

const roleOptions = [
  { value: "STAFF", label: "Staff" },
  { value: "ADMIN", label: "Admin" },
];

export default function UsersPage() {
  const session = useSessionUser();
  const users = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const fields: FormField[] = [
    { kind: "text", name: "name", label: "Name", autoComplete: "name" },
    { kind: "text", name: "username", label: "Username", autoComplete: "username" },
    {
      kind: "password",
      name: "password",
      label: editing ? "New password" : "Password",
      autoComplete: "new-password",
    },
    { kind: "select", name: "role", label: "Role", options: roleOptions, emptyHint: "Choose a role." },
  ];

  return (
    <div>
      <PageHeader title="Users" action="Add user" onAction={() => { setEditing(null); setOpen(true); }} />
      <ResourceTable
        rows={users.data ?? []}
        isLoading={users.isLoading}
        error={users.error ? errorMessage(users.error) : null}
        onRetry={() => void users.refetch()}
        rowKey={(row) => row.id}
        emptyLabel="No users yet."
        addLabel="Add user"
        onAdd={() => { setEditing(null); setOpen(true); }}
        defaultSort={{ id: "name", direction: "asc" }}
        onEdit={(row) => { setEditing(row); setOpen(true); }}
        onDelete={
          session.role === "ADMIN"
            ? async (row) => {
                try {
                  await deleteUser.mutateAsync(row.id);
                  toast.success("User deleted");
                } catch (error) {
                  toast.error(errorMessage(error));
                }
              }
            : undefined
        }
        deleteLabel={(row) => row.username}
        columns={[
          {
            id: "name",
            header: "Name",
            sortValue: (row) => row.name,
            cell: (row) => (
              <div>
                <p className="font-medium">{row.name}</p>
                <p className="text-xs text-muted">{row.username}</p>
              </div>
            ),
          },
          { id: "username", header: "Username", sortValue: (row) => row.username, cell: (row) => row.username },
          {
            id: "role",
            header: "Role",
            sortValue: (row) => row.role,
            cell: (row) => <Badge tone={row.role === "ADMIN" ? "primary" : "secondary"}>{row.role}</Badge>,
          },
        ]}
      />
      {open && !editing ? (
        <ResourceFormDialog<UserCreateInput>
          open
          title="Add user"
          schema={userCreateSchema}
          fields={fields}
          defaultValues={{ name: "", username: "", password: "", role: "STAFF" }}
          submitLabel="Save"
          onClose={() => setOpen(false)}
          onSubmit={async (values) => {
            await createUser.mutateAsync(values);
            toast.success("User created");
          }}
        />
      ) : null}
      {editing ? (
        <ResourceFormDialog<UserUpdateInput>
          open={open}
          title="Edit user"
          schema={userUpdateSchema}
          fields={fields}
          defaultValues={{ name: editing.name, username: editing.username, password: "", role: editing.role }}
          submitLabel="Save"
          onClose={() => { setOpen(false); setEditing(null); }}
          onSubmit={async (values) => {
            await updateUser.mutateAsync({
              id: editing.id,
              body: { ...values, password: values.password ?? "" },
            });
            toast.success("User updated");
          }}
        />
      ) : null}
    </div>
  );
}
