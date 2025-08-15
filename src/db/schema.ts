import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";

export const productCategories = [
  "Electronics",
  "Clothing",
  "Books",
  "Home Goods",
] as const;
export const orderStatuses = ["pending", "shipped", "cancelled"] as const;
export const historyTypes = ["arrival", "departure"] as const;

export const products = sqliteTable("products", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  supply: integer("supply").notNull().default(0),
  price: integer("price").notNull().default(0), // US cents
  category: text("category", { enum: productCategories }).notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  deletedAt: text("deleted_at"),
});

export const productRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
  productHistory: many(productHistory),
}));

export const orders = sqliteTable("orders", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  status: text("status", { enum: orderStatuses }).notNull().default("pending"),
  totalPrice: integer("total_price").notNull().default(0),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const orderRelations = relations(orders, ({ many }) => ({
  orderItems: many(orderItems),
}));

export const orderItems = sqliteTable("order_items", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, {
      onDelete: "cascade",
    }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull(),
  priceAtPurchase: integer("price_at_purchase").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const orderItemRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const productHistory = sqliteTable("product_history", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  productId: integer("product_id").references(() => products.id),
  type: text("type", { enum: historyTypes }).notNull(),
  quantity: integer("quantity").notNull(),
  timestamp: text("timestamp").default(sql`CURRENT_TIMESTAMP`),
});

export const productHistoryRelations = relations(productHistory, ({ one }) => ({
  product: one(products, {
    fields: [productHistory.productId],
    references: [products.id],
  }),
}));

export const admins = sqliteTable("admins", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  email: text("email").unique().notNull(),
  hashedPassword: text("hashed_password").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type ProductHistory = typeof productHistory.$inferSelect;
export type Admin = typeof admins.$inferSelect;
