"use client";

import { useState, useEffect } from "react";
import type { Product } from "@/db/schema";
import { useRouter } from "next/navigation";
import { productCategories } from "@/db/schema";
import Link from "next/link";

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

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50000);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        if (debouncedSearchTerm) {
          params.set("name", debouncedSearchTerm);
        }
        if (selectedCategory) {
          params.set("category", selectedCategory);
        }
        if (minPrice > 0) {
          params.set("minPrice", minPrice.toString());
        }
        if (maxPrice < 50000) {
          params.set("maxPrice", maxPrice.toString());
        }

        const queryString = params.toString();
        const url = queryString
          ? `/api/products?${queryString}`
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
  }, [debouncedSearchTerm, selectedCategory, minPrice, maxPrice, router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <main className="flex min-h-screen p-8">
      {/* Sidebar */}
      <aside className="w-64 p-4 border-r border-gray-300">
        <Link href="/">
          <span className="text-3xl pb-2 font-bold border-b border-gray-300">
            StoreTrack
          </span>
        </Link>
        <h2 className="text-xl font-bold my-6">Filters</h2>
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Category</h3>
          {productCategories.map((category) => (
            <div key={category} className="mb-2">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="h-5 w-5 form-checkbox "
                  checked={selectedCategory === category}
                  onChange={() => {
                    if (selectedCategory === category) {
                      setSelectedCategory(null);
                    } else {
                      setSelectedCategory(category);
                    }
                  }}
                />
                <span className="ml-2 text-gray-700">{category}</span>
              </label>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-2">Price Range</h3>
          <div className="flex justify-between text-sm mb-2">
            <span>Min: ${minPrice / 100}</span>
            <span>Max: ${maxPrice / 100}</span>
          </div>
          <input
            type="range"
            min="0"
            max="50000"
            value={minPrice}
            onChange={(e) => setMinPrice(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <input
            type="range"
            min="0"
            max="50000"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="w-full flex justify-between items-center mb-4">
          <h1 className="text-3xl font-extrabold text-gray-900">Products</h1>
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

        {!loading && !error && products.length === 0 && (
          <p>No products found.</p>
        )}

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
      </div>
    </main>
  );
}
