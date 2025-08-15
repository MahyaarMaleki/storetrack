import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { orders, orderItems, orderStatuses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyAuth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authResponse = await verifyAuth(request);
  if (authResponse instanceof NextResponse) {
    return authResponse;
  }

  try {
    const orderId = Number(params.id);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID." }, { status: 400 });
    }

    // Fetch the order and its related items
    const orderWithItems = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (orderWithItems.length === 0) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const [orderDetail] = orderWithItems;

    // Fetch all items for the specific order
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderDetail.id))
      .execute();

    const finalOrder = { ...orderDetail, items };

    return NextResponse.json(finalOrder, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch order." },
      { status: 500 }
    );
  }
}

// For updating order status
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authResponse = await verifyAuth(request);
  if (authResponse instanceof NextResponse) {
    return authResponse;
  }

  try {
    const orderId = Number(params.id);
    const { status }: { status: (typeof orderStatuses)[number] } =
      await request.json();

    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID." }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json(
        { error: "New status is required." },
        { status: 400 }
      );
    }

    // Update the order's status
    const updatedOrder = await db
      .update(orders)
      .set({ status: status })
      .where(eq(orders.id, orderId))
      .returning();

    if (updatedOrder.length === 0) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Order status updated successfully.", order: updatedOrder[0] },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update order." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authResponse = await verifyAuth(request);
  if (authResponse instanceof NextResponse) {
    return authResponse;
  }

  try {
    const orderId = Number(params.id);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID." }, { status: 400 });
    }

    const deletedOrder = await db
      .delete(orders)
      .where(eq(orders.id, orderId))
      .returning()
      .execute();

    if (deletedOrder.length === 0) {
      return NextResponse.json(
        { error: "Order not found or already deleted." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Order deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete order." },
      { status: 500 }
    );
  }
}
