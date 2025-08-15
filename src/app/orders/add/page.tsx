"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/db/schema";

interface OrderFormItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

export default function AddOrderPage() {
  const router = useRouter();
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );
  const [itemQuantity, setItemQuantity] = useState(1);
  const [orderItems, setOrderItems] = useState<OrderFormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available products
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const response = await fetch("/api/products");

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch products for order creation.");
        }

        const data = await response.json();
        setAvailableProducts(data);
        if (data.length > 0) {
          setSelectedProductId(data[0].id);
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred while fetching products.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [router]);

  // Calculate total price dynamically
  const totalOrderPrice = useMemo(() => {
    return orderItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }, [orderItems]);

  const handleAddItem = () => {
    if (selectedProductId === null || itemQuantity <= 0) {
      setError("Please select a product and enter a valid quantity.");
      return;
    }

    const productToAdd = availableProducts.find(
      (p) => p.id === selectedProductId
    );
    if (!productToAdd) {
      setError("Selected product not found.");
      return;
    }

    if (itemQuantity > productToAdd.supply) {
      setError(
        `Not enough stock for ${productToAdd.name}. Available: ${productToAdd.supply}`
      );
      return;
    }

    // Check if item already exists in the order, then update quantity
    const existingItemIndex = orderItems.findIndex(
      (item) => item.productId === selectedProductId
    );

    if (existingItemIndex > -1) {
      setOrderItems((prevItems) => {
        const newItems = [...prevItems];
        const updatedQuantity =
          newItems[existingItemIndex].quantity + itemQuantity;
        if (updatedQuantity > productToAdd.supply) {
          setError(
            `Cannot add more. Total quantity for ${productToAdd.name} would exceed available supply: ${productToAdd.supply}`
          );
          return prevItems;
        }
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: updatedQuantity,
        };
        return newItems;
      });
    } else {
      setOrderItems((prevItems) => [
        ...prevItems,
        {
          productId: productToAdd.id,
          name: productToAdd.name,
          price: productToAdd.price,
          quantity: itemQuantity,
        },
      ]);
    }
    setError(null);
  };

  const handleRemoveItem = (productId: number) => {
    setOrderItems((prevItems) =>
      prevItems.filter((item) => item.productId !== productId)
    );
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (orderItems.length === 0) {
      setError("Order must contain at least one item.");
      setSubmitting(false);
      return;
    }

    try {
      const apiOrderItems = orderItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: apiOrderItems }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to place order.");
      }

      router.push("/orders");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8 bg-gray-50">
        <p className="text-blue-600 text-lg">Loading products...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-xl">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">
          Place New Order
        </h1>

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-center"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Add Item Form */}
        <div className="mb-8 p-4 border border-gray-200 rounded-md">
          <h2 className="text-xl font-semibold mb-4">Add Items to Order</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="productSelect"
                className="block text-sm font-medium text-gray-700"
              >
                Product
              </label>
              <select
                id="productSelect"
                value={selectedProductId || ""}
                onChange={(e) => setSelectedProductId(Number(e.target.value))}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                {!selectedProductId && (
                  <option value="">Select a product</option>
                )}
                {availableProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} (Supply: {product.supply})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="itemQuantity"
                className="block text-sm font-medium text-gray-700"
              >
                Quantity
              </label>
              <input
                id="itemQuantity"
                type="number"
                value={itemQuantity}
                onChange={(e) => setItemQuantity(Number(e.target.value))}
                min="1"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAddItem}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={availableProducts.length === 0}
              >
                Add Item
              </button>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          {orderItems.length === 0 ? (
            <p className="text-gray-600">No items added to the order yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
              {orderItems.map((item) => (
                <li
                  key={item.productId}
                  className="flex justify-between items-center p-4"
                >
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      Qty: {item.quantity} x ${item.price / 100}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.productId)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 p-4 bg-gray-100 rounded-md flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">Total:</span>
            <span className="text-lg font-bold text-gray-900">
              ${(totalOrderPrice / 100).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Submit Order Button */}
        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => router.push("/orders")}
            className="py-2 px-4 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-300"
          >
            Go Back
          </button>
          <button
            type="submit"
            onClick={handleSubmitOrder}
            disabled={submitting || orderItems.length === 0}
            className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              submitting ? "bg-green-400" : "bg-green-600 hover:bg-green-700"
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50`}
          >
            {submitting ? "Placing Order..." : "Place Order"}
          </button>
        </div>
      </div>
    </main>
  );
}
