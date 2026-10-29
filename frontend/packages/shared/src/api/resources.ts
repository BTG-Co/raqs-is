import type { ApiClient } from "./client";
import type {
  Inventory,
  InventoryCreate,
  InventoryDetail,
  Transaction,
  TransactionCreate,
  Measurement,
  MeasurementConversion,
  MeasurementConversionCreate,
  MeasurementConversionUpdate,
  MeasurementCreate,
  MeasurementUpdate,
  Product,
  ProductCreate,
  ProductUpdate,
  User,
  UserCreate,
  UserUpdate,
} from "./models";

export function createResources(client: ApiClient) {
  return {
    health: () => client.get<{ db: string }>("/health/db"),
    products: {
      list: () => client.get<Product[]>("/products"),
      get: (id: string) => client.get<Product>(`/products/${id}`),
      create: (body: ProductCreate) => client.post<Product>("/products", body),
      update: (id: string, body: ProductUpdate) => client.patch<Product>(`/products/${id}`, body),
      delete: (id: string) => client.delete(`/products/${id}`),
    },
    inventory: {
      list: async () => {
        const data = await client.get<Inventory[] | Inventory>("/inventory");
        // TODO: Older servers documented GET /inventory as a single InventoryResponse
        // while the handler returns a list. Keep this guard until every deployment
        // uses response_model=list[InventoryResponse].
        if (data && !Array.isArray(data) && typeof data === "object" && "id" in data) {
          return [data];
        }
        return Array.isArray(data) ? data : [];
      },
      get: (id: string) => client.get<Inventory>(`/inventory/${id}`),
      detail: (id: string) => client.get<InventoryDetail>(`/inventory/${id}/detail`),
      create: (body: InventoryCreate) => client.post<Inventory>("/inventory", body),
      delete: (id: string) => client.delete(`/inventory/${id}`),
    },
    transactions: {
      list: () => client.get<Transaction[]>("/transactions"),
      get: (id: string) => client.get<Transaction>(`/transactions/${id}`),
      create: (body: TransactionCreate) => client.post<Transaction>("/transactions", body),
      approve: (ids: string[]) => client.post<Transaction[]>("/transactions/approve", { ids }),
      delete: (id: string) => client.delete(`/transactions/${id}`),
    },
    measurements: {
      list: () => client.get<Measurement[]>("/measurements"),
      get: (id: string) => client.get<Measurement>(`/measurements/${id}`),
      create: (body: MeasurementCreate) => client.post<Measurement>("/measurements", body),
      update: (id: string, body: MeasurementUpdate) =>
        client.patch<Measurement>(`/measurements/${id}`, body),
      delete: (id: string) => client.delete(`/measurements/${id}`),
    },
    measurementConversions: {
      list: () => client.get<MeasurementConversion[]>("/measurement_conversions"),
      get: (id: string) => client.get<MeasurementConversion>(`/measurement_conversions/${id}`),
      create: (body: MeasurementConversionCreate) =>
        client.post<MeasurementConversion>("/measurement_conversions", body),
      update: (id: string, body: MeasurementConversionUpdate) =>
        client.patch<MeasurementConversion>(`/measurement_conversions/${id}`, body),
      delete: (id: string) => client.delete(`/measurement_conversions/${id}`),
    },
    users: {
      list: () => client.get<User[]>("/users"),
      get: (id: string) => client.get<User>(`/users/${id}`),
      create: (body: UserCreate) => client.post<User>("/users", body),
      update: (id: string, body: UserUpdate) => client.patch<User>(`/users/${id}`, body),
      delete: (id: string) => client.delete(`/users/${id}`),
    },
  };
}

export type Resources = ReturnType<typeof createResources>;
