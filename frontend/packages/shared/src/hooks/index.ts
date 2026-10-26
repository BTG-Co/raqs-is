import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useResources } from "../api/context";
import type {
  InventoryCreate,
  TransactionCreate,
  MeasurementConversionCreate,
  MeasurementConversionUpdate,
  MeasurementCreate,
  MeasurementUpdate,
  ProductCreate,
  ProductUpdate,
  UserCreate,
  UserUpdate,
} from "../api/models";

export const queryKeys = {
  products: ["products"] as const,
  product: (id: string) => ["products", id] as const,
  inventory: ["inventory"] as const,
  inventoryItem: (id: string) => ["inventory", id] as const,
  transactions: ["transactions"] as const,
  measurements: ["measurements"] as const,
  measurement: (id: string) => ["measurements", id] as const,
  measurementConversions: ["measurement-conversions"] as const,
  measurementConversion: (id: string) => ["measurement-conversions", id] as const,
  users: ["users"] as const,
  user: (id: string) => ["users", id] as const,
  health: ["health"] as const,
};

export function useProducts() {
  const api = useResources();
  return useQuery({ queryKey: queryKeys.products, queryFn: () => api.products.list() });
}

export function useCreateProduct() {
  const api = useResources();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ProductCreate) => api.products.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.products }),
  });
}

export function useUpdateProduct() {
  const api = useResources();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ProductUpdate }) => api.products.update(id, body),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.products });
      void queryClient.invalidateQueries({ queryKey: queryKeys.product(variables.id) });
    },
  });
}

export function useDeleteProduct() {
  const api = useResources();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.products.delete(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.products });
      void queryClient.invalidateQueries({ queryKey: queryKeys.product(id) });
    },
  });
}

export function useInventoryList() {
  const api = useResources();
  return useQuery({ queryKey: queryKeys.inventory, queryFn: () => api.inventory.list() });
}

export function useCreateInventory() {
  const api = useResources();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: InventoryCreate) => api.inventory.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.inventory }),
  });
}

export function useDeleteInventory() {
  const api = useResources();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.inventory.delete(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventory });
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventoryItem(id) });
    },
  });
}

export function useTransactions() {
  const api = useResources();
  return useQuery({
    queryKey: queryKeys.transactions,
    queryFn: () => api.transactions.list(),
  });
}

export function useCreateTransaction() {
  const api = useResources();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: TransactionCreate) => api.transactions.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.transactions }),
  });
}

export function useApproveTransactions() {
  const api = useResources();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => api.transactions.approve(ids),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactions });
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventory });
    },
  });
}

export function useDeleteTransaction() {
  const api = useResources();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.transactions.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.transactions }),
  });
}

export function useMeasurements() {
  const api = useResources();
  return useQuery({ queryKey: queryKeys.measurements, queryFn: () => api.measurements.list() });
}

export function useCreateMeasurement() {
  const api = useResources();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: MeasurementCreate) => api.measurements.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.measurements }),
  });
}

export function useUpdateMeasurement() {
  const api = useResources();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: MeasurementUpdate }) =>
      api.measurements.update(id, body),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.measurements });
      void queryClient.invalidateQueries({ queryKey: queryKeys.measurement(variables.id) });
    },
  });
}

export function useDeleteMeasurement() {
  const api = useResources();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.measurements.delete(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.measurements });
      void queryClient.invalidateQueries({ queryKey: queryKeys.measurement(id) });
    },
  });
}

export function useMeasurementConversions() {
  const api = useResources();
  return useQuery({
    queryKey: queryKeys.measurementConversions,
    queryFn: () => api.measurementConversions.list(),
  });
}

export function useCreateMeasurementConversion() {
  const api = useResources();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: MeasurementConversionCreate) => api.measurementConversions.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.measurementConversions }),
  });
}

export function useUpdateMeasurementConversion() {
  const api = useResources();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: MeasurementConversionUpdate }) =>
      api.measurementConversions.update(id, body),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.measurementConversions });
      void queryClient.invalidateQueries({ queryKey: queryKeys.measurementConversion(variables.id) });
    },
  });
}

export function useDeleteMeasurementConversion() {
  const api = useResources();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.measurementConversions.delete(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.measurementConversions });
      void queryClient.invalidateQueries({ queryKey: queryKeys.measurementConversion(id) });
    },
  });
}

export function useUsers() {
  const api = useResources();
  return useQuery({ queryKey: queryKeys.users, queryFn: () => api.users.list() });
}

export function useCreateUser() {
  const api = useResources();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UserCreate) => api.users.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users }),
  });
}

export function useUpdateUser() {
  const api = useResources();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UserUpdate }) => api.users.update(id, body),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users });
      void queryClient.invalidateQueries({ queryKey: queryKeys.user(variables.id) });
    },
  });
}

export function useDeleteUser() {
  const api = useResources();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.users.delete(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users });
      void queryClient.invalidateQueries({ queryKey: queryKeys.user(id) });
    },
  });
}
