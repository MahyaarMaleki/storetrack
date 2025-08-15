"use client";

import { useState, useEffect } from "react";
import type { Product } from "@/db/schema";
import { useRouter } from "next/navigation";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);

        const response = await fetch("/api/products");

        if (response.status === 401) {
          // If the token is invalid or expired, redirect to login
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch products.");
        }

        const data = await response.json();
        setProducts(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [router]); // Add router to the dependency array

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      // Redirect to the login page after successful logout
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center p-24">
        <h1 className="text-2xl font-bold">Loading Products...</h1>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center p-24">
        <h1 className="text-2xl font-bold text-red-500">Error: {error}</h1>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="w-full flex justify-end mb-4">
        <button
          onClick={handleLogout}
          className="py-2 px-4 cursor-pointer bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          Logout
        </button>
      </div>
      <h1 className="text-2xl font-bold mb-8">All Products</h1>
      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <li key={product.id} className="bg-gray-100 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold">{product.name}</h2>
            <p className="text-gray-600">Supply: {product.supply}</p>
            <p className="text-gray-600">Price: ${product.price / 100}</p>
            <p className="text-gray-600">Category: {product.category}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
