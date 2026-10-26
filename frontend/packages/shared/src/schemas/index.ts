import { z } from "zod";

const requiredText = (label: string) => z.string().trim().min(1, `${label} is required.`);

const uuidField = (label: string) => z.string().uuid(`Choose a ${label}.`);

const imageUrl = z
  .string()
  .trim()
  .refine((value) => value === "" || /^https?:\/\/\S+$/i.test(value), "Enter a valid image URL.");

export const productCreateSchema = z.object({
  name: requiredText("Name"),
  image: imageUrl,
  base_measurement_id: uuidField("measurement"),
});

export const productUpdateSchema = z.object({
  name: requiredText("Name"),
  image: imageUrl,
  base_measurement_id: uuidField("measurement"),
});

export const measurementSchema = z.object({
  name: requiredText("Name"),
  short_name: requiredText("Short name"),
});

export const measurementCreateSchema = measurementSchema;
export const measurementUpdateSchema = measurementSchema;

export const measurementConversionSchema = z.object({
  name: requiredText("Name"),
  base_measurement_id: uuidField("base measurement"),
  converted_measurement_id: uuidField("converted measurement"),
  base_measurement_to_converted_amount: z.coerce
    .number({ invalid_type_error: "Amount is required." })
    .positive("Amount must be greater than zero."),
});

export const measurementConversionCreateSchema = measurementConversionSchema;
export const measurementConversionUpdateSchema = measurementConversionSchema;

export const inventorySchema = z.object({
  product_id: uuidField("product"),
  measurement_id: uuidField("measurement"),
  current_stock: z.coerce.number({ invalid_type_error: "Current stock is required." }).finite("Current stock must be a number."),
});

export const transactionTypeSchema = z.enum(["PURCHASE", "SALE", "ADJUSTMENT", "RETURN"]);

export const transactionCreateSchema = z.object({
  inventory_id: uuidField("inventory row"),
  measurement_id: uuidField("measurement"),
  transaction_type: transactionTypeSchema,
  quantity: z.coerce.number({ invalid_type_error: "Quantity is required." }).positive("Quantity must be greater than zero."),
  unit_price: z.coerce.number({ invalid_type_error: "Unit price is required." }).nonnegative("Unit price cannot be negative."),
});

export const inventoryCreateSchema = inventorySchema;

export const userRoleSchema = z.enum(["ADMIN", "STAFF"]);

export const userCreateSchema = z.object({
  username: requiredText("Username"),
  name: requiredText("Name"),
  password: requiredText("Password"),
  role: userRoleSchema,
});

export const userUpdateSchema = z.object({
  username: requiredText("Username"),
  name: requiredText("Name"),
  role: userRoleSchema,
  password: z.string(),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type MeasurementInput = z.infer<typeof measurementSchema>;
export type MeasurementConversionInput = z.infer<typeof measurementConversionSchema>;
export type InventoryInput = z.infer<typeof inventorySchema>;
export type TransactionInput = z.infer<typeof transactionCreateSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

export function toProductCreate(input: ProductCreateInput) {
  return {
    name: input.name,
    image: input.image === "" ? null : input.image,
    base_measurement_id: input.base_measurement_id,
  };
}

export function toProductUpdate(input: ProductUpdateInput) {
  return {
    name: input.name,
    image: input.image,
    base_measurement_id: input.base_measurement_id,
  };
}
