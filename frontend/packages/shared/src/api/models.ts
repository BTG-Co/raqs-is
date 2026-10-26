import type { components } from "./types";

export type Schemas = components["schemas"];

export type Product = Schemas["ProductResponse"];
export type ProductCreate = Schemas["ProductCreate"];
export type ProductUpdate = Schemas["ProductUpdate"];

export type Inventory = Schemas["InventoryResponse"];
export type InventoryCreate = Schemas["InventoryCreate"];

export type Transaction = Schemas["TransactionResponse"];
export type TransactionCreate = Schemas["TransactionCreate"];
export type TransactionType = Schemas["TransactionType"];

export type Measurement = Schemas["MeasurementResponse"];
export type MeasurementCreate = Schemas["MeasurementCreate"];
export type MeasurementUpdate = Schemas["MeasurementUpdate"];

export type MeasurementConversion = Schemas["MeasurementConversionResponse"];
export type MeasurementConversionCreate = Schemas["MeasurementConversionCreate"];
export type MeasurementConversionUpdate = Schemas["MeasurementConversionUpdate"];

export type User = Schemas["UserResponse"];
export type UserCreate = Schemas["UserCreate"];
export type UserUpdate = Schemas["UserUpdate"];
export type UserRole = Schemas["UserRole"];
