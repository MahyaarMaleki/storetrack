"use client";

import { useState, useEffect } from "react";
import type { Product } from "@/db/schema";
import { useRouter } from "next/navigation";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  // Custom hook to debounce the search term
  const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);
    return debouncedValue;
  };

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const url = debouncedSearchTerm
          ? `/api/products?name=${encodeURIComponent(debouncedSearchTerm)}`
          : "/api/products";

        const response = await fetch(url);

        if (response.status === 401) {
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
  }, [debouncedSearchTerm, router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="w-full flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">StoreTrack</h1>
        <button
          onClick={handleLogout}
          className="py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <div className="w-full max-w-lg mb-8">
        <input
          type="text"
          placeholder="Search products by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading && <p>Loading products...</p>}

      {error && <p className="text-red-500">Error: {error}</p>}

      {!loading && !error && products.length === 0 && <p>No products found.</p>}

      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {!loading &&
          products.map((product) => (
            <li
              key={product.id}
              className="bg-gray-100 p-4 rounded-lg shadow-md"
            >
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
