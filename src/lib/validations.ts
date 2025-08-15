import { z } from "zod";
import { productCategories } from "@/db/schema";

const zodProductCategories = [...productCategories];

export const productSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  supply: z
    .number()
    .int({
      message: "Supply must be a whole number.",
    })
    .min(0, { message: "Supply cannot be a negative number." })
    .default(0),

  price: z
    .number()
    .int({
      message: "Price must be a whole number.",
    })
    .min(0, { message: "Price cannot be a negative number." })
    .default(0),

  category: z.enum(zodProductCategories, {
    message: `Category must be one of: ${zodProductCategories.join(", ")}.`,
  }),
});

export const orderItemSchema = z.object({
  productId: z
    .number()
    .int({
      message: "Product ID must be a whole number.",
    })
    .min(1, { message: "Product ID is required and must be at least 1." }),

  quantity: z
    .number()
    .int({
      message: "Quantity must be a whole number.",
    })
    .min(1, { message: "Quantity is required and must be at least 1." }),
});

export const orderSchema = z.object({
  items: z.array(orderItemSchema).min(1, {
    message: "An order must contain at least one item.",
  }),
});
