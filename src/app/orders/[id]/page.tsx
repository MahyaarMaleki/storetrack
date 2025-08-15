"use client";

import { useState, useEffect, useCallback } from "react";
import type { Order, OrderItem, Product } from "@/db/schema";
import { useRouter, useParams } from "next/navigation";

// Augment the Order and OrderItem types to include relations
type OrderWithDetails = Order & {
  orderItems: (OrderItem & { product?: Product })[];
};

const orderStatuses = ["pending", "shipped", "cancelled"];

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const orderId = Number(params.id);

  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newStatus, setNewStatus] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrderDetails = useCallback(async () => {
    if (isNaN(orderId)) {
      setError("Invalid order ID.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}`);

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch order details.");
      }

      const data: OrderWithDetails = await response.json();
      setOrder(data);
      setNewStatus(data.status);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred while fetching order details.");
      }
    } finally {
      setLoading(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const handleUpdateStatus = async () => {
    if (!newStatus || !order) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update order status.");
      }

      // Re-fetch the updated order to display the changes
      await fetchOrderDetails();
      setIsEditing(false); // Exit editing mode
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred while updating status.");
      }
    } finally {
      setUpdating(false);
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

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8 bg-gray-50">
        <p className="text-blue-600 text-lg">Loading order details...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center p-8 bg-gray-50">
        <div className="w-full flex justify-end mb-4">
          <button
            onClick={handleLogout}
            className="py-2 px-6 bg-red-600 text-white font-medium rounded-lg shadow-md hover:bg-red-700 transition duration-300"
          >
            Logout
          </button>
        </div>
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error: {error}</h1>
        <button
          onClick={() => router.back()}
          className="py-2 px-4 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-300"
        >
          Go Back
        </button>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8 bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">Order not found.</p>
          <button
            onClick={() => router.back()}
            className="py-2 px-4 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-300"
          >
            Go Back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-50">
      <div className="w-full flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Order Details # {order.id}
        </h1>
        <div className="flex space-x-4">
          <button
            onClick={() => router.back()}
            className="py-2 px-6 bg-gray-300 text-gray-800 font-medium rounded-lg shadow-md hover:bg-gray-400 transition duration-300"
          >
            Go Back
          </button>
          <button
            onClick={handleLogout}
            className="py-2 px-6 bg-red-600 text-white font-medium rounded-lg shadow-md hover:bg-red-700 transition duration-300"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-xl">
        {/* Order Summary */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-2xl font-bold text-gray-900">Order Summary</h2>
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleUpdateStatus}
                    disabled={
                      updating || !newStatus || newStatus === order.status
                    }
                    className={`py-1 px-3 rounded-md text-sm font-medium text-white ${
                      updating ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {updating ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="py-1 px-3 rounded-md text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="py-1 px-3 rounded-md text-sm font-medium text-blue-600 bg-blue-100 hover:bg-blue-200"
                >
                  Edit Status
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
            <p>
              <span className="font-semibold">Order ID:</span> {order.id}
            </p>
            <div className="flex items-center space-x-2">
              <span className="font-semibold">Status:</span>
              {isEditing ? (
                <select
                  value={newStatus || ""}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="py-1 px-2 border border-gray-300 rounded-md text-sm"
                >
                  {orderStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              ) : (
                <span
                  className={`capitalize ${
                    order.status === "pending"
                      ? "text-yellow-600"
                      : order.status === "shipped"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {order.status}
                </span>
              )}
            </div>
            <p>
              <span className="font-semibold">Total Price:</span> $
              {order.totalPrice ? (order.totalPrice / 100).toFixed(2) : "0.00"}
            </p>
            <p>
              <span className="font-semibold">Created At:</span>{" "}
              {order.createdAt
                ? new Date(order.createdAt).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </section>

        {/* Order Items */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">
            Order Items
          </h2>
          {/* Change `order.items` to `order.orderItems` */}
          {order.orderItems && order.orderItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price (per item)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Change `order.items` to `order.orderItems` */}
                  {order.orderItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.product?.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.product?.name || "Product Not Found"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $
                        {item.priceAtPurchase
                          ? (item.priceAtPurchase / 100).toFixed(2)
                          : "0.00"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $
                        {item.priceAtPurchase && item.quantity
                          ? (
                              (item.priceAtPurchase * item.quantity) /
                              100
                            ).toFixed(2)
                          : "0.00"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No items found for this order.</p>
          )}
        </section>
      </div>
    </main>
  );
}
