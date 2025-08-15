"use client";

import Link from "next/link"; // Import the Link component
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/products");
        if (response.status === 401) {
          router.push("/login");
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        router.push("/login");
      }
    }
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <h1 className="text-2xl font-bold text-gray-700">
          Checking authentication...
        </h1>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50">
      <button
        onClick={handleLogout}
        className="py-2 px-6 mb-12 cursor-pointer bg-red-600 text-white font-medium rounded-lg shadow-md hover:bg-red-700 transition duration-300"
      >
        Logout
      </button>

      <h1 className="text-4xl font-extrabold text-gray-900 mb-12 text-center">
        StoreTrack Admin Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Link
          href="/products"
          className="flex flex-col items-center justify-center p-8 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transform hover:scale-105 transition duration-300 ease-in-out"
        >
          <span className="text-5xl mb-4">📦</span>
          <span className="text-2xl font-semibold">Products</span>
        </Link>

        <Link
          href="/orders"
          className="flex flex-col items-center justify-center p-8 bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-700 transform hover:scale-105 transition duration-300 ease-in-out"
        >
          <span className="text-5xl mb-4">🛒</span>
          <span className="text-2xl font-semibold">Orders</span>
        </Link>

        <Link
          href="/product-history"
          className="flex flex-col items-center justify-center p-8 bg-purple-600 text-white rounded-xl shadow-lg hover:bg-purple-700 transform hover:scale-105 transition duration-300 ease-in-out"
        >
          <span className="text-5xl mb-4">📊</span>
          <span className="text-2xl font-semibold">Product History</span>
        </Link>
      </div>
    </main>
  );
}
