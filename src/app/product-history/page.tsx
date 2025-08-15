"use client";

import { useState, useEffect } from "react";
import type { ProductHistory, Product } from "@/db/schema";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ProductHistoryWithProduct = ProductHistory & { product: Product };

export default function ProductHistoryPage() {
  const [history, setHistory] = useState<ProductHistoryWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        const response = await fetch("/api/products/history");

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch product history.");
        }

        const data = await response.json();
        setHistory(data);
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

    fetchHistory();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-50">
      <div className="w-full flex justify-between items-center mb-8">
        <Link href="/">
          <span className="text-3xl pb-2 font-bold border-b border-gray-300">
            StoreTrack
          </span>
        </Link>
        <h1 className="text-3xl font-extrabold text-gray-900">
          Product History
        </h1>
        <button
          onClick={handleLogout}
          className="cursor-pointer py-2 px-6 bg-red-600 text-white font-medium rounded-lg shadow-md hover:bg-red-700 transition duration-300"
        >
          Logout
        </button>
      </div>

      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Event Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {history.map((record) => (
              <tr key={record.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {record.product.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {record.type.replace("_", " ")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {record.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {record.timestamp
                    ? new Date(record.timestamp).toLocaleDateString()
                    : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading && (
        <p className="mt-4 text-center text-blue-600 text-lg">
          Loading history...
        </p>
      )}

      {error && (
        <p className="mt-4 text-center text-red-600 text-lg">Error: {error}</p>
      )}

      {!loading && !error && history.length === 0 && (
        <p className="mt-4 text-center text-gray-500 text-lg">
          No product history found.
        </p>
      )}
    </main>
  );
}
