"use client";

import { useState, useEffect } from "react";
import type { Order, orderStatuses } from "@/db/schema";
import { useRouter } from "next/navigation";
import Link from "next/link";

const statusOptions: typeof orderStatuses = ["pending", "shipped", "cancelled"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Filter States
  const [orderIdSearchTerm, setOrderIdSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        if (selectedStatus) {
          params.set("status", selectedStatus);
        }

        const queryString = params.toString();
        const url = queryString ? `/api/orders?${queryString}` : "/api/orders";

        const response = await fetch(url);

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch orders.");
        }

        const data = await response.json();
        setOrders(data);
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

    fetchOrders();
  }, [selectedStatus, router]);

  const handleSearchById = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(orderIdSearchTerm);
    if (!isNaN(id)) {
      router.push(`/orders/${id}`);
    }
  };

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
          <h3 className="font-semibold mb-2 text-gray-800">Order Status</h3>
          {statusOptions.map((status) => (
            <div key={status} className="mb-2">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="form-checkbox h-5 w-5"
                  checked={selectedStatus === status}
                  onChange={() => {
                    if (selectedStatus === status) {
                      setSelectedStatus(null);
                    } else {
                      setSelectedStatus(status);
                    }
                  }}
                />
                <span className="ml-2 text-gray-700 capitalize">{status}</span>
              </label>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="w-full flex justify-between items-center mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900">Orders</h1>
          <button
            onClick={handleLogout}
            className="cursor-pointer py-2 px-6 bg-red-600 text-white font-medium rounded-lg shadow-md hover:bg-red-700 transition duration-300"
          >
            Logout
          </button>
        </div>

        <div className="w-full max-w-lg mb-8">
          <form onSubmit={handleSearchById}>
            <input
              type="text"
              placeholder="Search orders by ID..."
              value={orderIdSearchTerm}
              onChange={(e) => setOrderIdSearchTerm(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-3 focus:ring-blue-500 text-gray-800"
            />
          </form>
        </div>

        {loading && (
          <p className="text-center text-blue-600 text-lg">Loading orders...</p>
        )}

        {error && (
          <p className="text-center text-red-600 text-lg">Error: {error}</p>
        )}

        {!loading && !error && orders.length === 0 && (
          <p className="text-center text-gray-500 text-lg">
            No orders found matching your criteria.
          </p>
        )}

        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {!loading &&
            orders.map((order) => (
              <li
                key={order.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200"
              >
                <Link href={`/orders/${order.id}`} className="block p-5">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Order #{order.id}
                  </h2>
                  <p className="text-gray-700 text-sm mb-1">
                    Status:{" "}
                    <span
                      className={`font-semibold capitalize ${
                        order.status === "pending"
                          ? "text-yellow-600"
                          : order.status === "shipped"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {order.status}
                    </span>
                  </p>
                  <p className="text-gray-700 text-sm mb-1">
                    Total Price:{" "}
                    <span className="font-semibold">
                      ${(order.totalPrice / 100).toFixed(2)}
                    </span>
                  </p>
                  <p className="text-gray-700 text-sm">
                    Created At:{" "}
                    <span className="font-semibold">
                      {new Date(
                        order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString()
                          : "N/A"
                      ).toLocaleDateString()}
                    </span>
                  </p>
                </Link>
              </li>
            ))}
        </ul>
      </div>
    </main>
  );
}
