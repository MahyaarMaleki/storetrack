import "dotenv/config";
import { db } from "@/db/client";
import { products, admins, productCategories } from "@/db/schema";
import { sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import { faker } from "@faker-js/faker";

type InsertProduct = typeof products.$inferInsert;

// Function to generate a random number of products
function generateProducts(count: number): InsertProduct[] {
  const generatedProducts: InsertProduct[] = [];
  for (let i = 0; i < count; i++) {
    const category = faker.helpers.arrayElement(productCategories);

    generatedProducts.push({
      name: faker.commerce.productName(),
      supply: faker.number.int({ min: 10, max: 200 }),
      price: faker.number.int({ min: 100, max: 50000 }), // price in cents
      category: category,
    });
  }
  return generatedProducts;
}

async function seed() {
  console.log("Seeding database...");

  try {
    console.log("Clearing existing data...");
    await db.run(sql`
      DROP TABLE IF EXISTS "order_items";
      DROP TABLE IF EXISTS "product_history";
      DROP TABLE IF EXISTS "products";
      DROP TABLE IF EXISTS "orders";
      DROP TABLE IF EXISTS "admins";
    `);

    console.log("Please re-run your migrations to recreate the tables.");

    console.log("Inserting initial data...");

    // Seed the admin user
    const adminPassword = "password123";
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await db.insert(admins).values({
      email: "admin@storetrack.com",
      hashedPassword: hashedPassword,
    });

    // Seed products
    const sampleProducts = generateProducts(100);
    await db.insert(products).values(sampleProducts);
    console.log("100 products seeded successfully.");

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Database seeding failed:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seed();
