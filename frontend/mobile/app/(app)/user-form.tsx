import { Redirect, router, useLocalSearchParams } from "expo-router";
import {
  userCreateSchema,
  userUpdateSchema,
  useCreateUser,
  useUpdateUser,
  useUsers,
  type UserCreateInput,
  type UserUpdateInput,
} from "@raqs/shared";
import { useAuth } from "../../src/auth/auth-context";
import { FormScreen } from "../../src/components/form-screen";

const roleOptions = [
  { value: "STAFF", label: "Staff" },
  { value: "ADMIN", label: "Admin" },
];

export default function UserFormScreen() {
  const { session } = useAuth();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : undefined;
  const users = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const existing = users.data?.find((item) => item.id === id);

  if (session && session.user.role !== "ADMIN") return <Redirect href="/(app)/(tabs)/inventory" />;
  if (id && !existing) return null;

  const fields = [
    { kind: "text" as const, name: "name", label: "Name" },
    { kind: "text" as const, name: "username", label: "Username" },
    { kind: "password" as const, name: "password", label: existing ? "New password" : "Password" },
    { kind: "select" as const, name: "role", label: "Role", options: roleOptions, emptyHint: "Choose a role." },
  ];

  if (existing) {
    return (
      <FormScreen<UserUpdateInput>
        schema={userUpdateSchema}
        fields={fields}
        defaultValues={{ name: existing.name, username: existing.username, password: "", role: existing.role }}
        submitLabel="Save"
        onSubmit={async (values) => {
          await updateUser.mutateAsync({ id: existing.id, body: { ...values, password: values.password ?? "" } });
          router.back();
        }}
      />
    );
  }

  return (
    <FormScreen<UserCreateInput>
      schema={userCreateSchema}
      fields={fields}
      defaultValues={{ name: "", username: "", password: "", role: "STAFF" }}
      submitLabel="Save"
      onSubmit={async (values) => {
        await createUser.mutateAsync(values);
        router.back();
      }}
    />
  );
}
