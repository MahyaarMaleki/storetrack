import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { orders, orderStatuses, products, productHistory } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { verifyAuth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
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

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        orderItems: {
          with: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // The order object includes the nested orderItems and product data
    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch order details." },
      { status: 500 }
    );
  }
}

// For updating order status
export async function PUT(
  request: NextRequest,
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

    await db.transaction(async (tx) => {
      // Fetch the order with its items to get product IDs and quantities
      const order = await tx.query.orders.findFirst({
        where: eq(orders.id, orderId),
        with: {
          orderItems: true,
        },
      });

      if (!order) {
        // Rollback the transaction
        tx.rollback();
        return NextResponse.json(
          { error: "Order not found." },
          { status: 404 }
        );
      }

      const currentStatus = order.status;

      switch (status) {
        case "cancelled":
          // Only allow cancellation if the order is still pending
          if (currentStatus !== "pending") {
            tx.rollback();
            return NextResponse.json(
              { error: "Only pending orders can be cancelled." },
              { status: 400 }
            );
          }

          // Revert product quantities for each item in the order
          if (order.orderItems && order.orderItems.length > 0) {
            const productIds = order.orderItems.map((item) => item.productId);
            const productsToUpdate = await tx.query.products.findMany({
              where: inArray(products.id, productIds),
            });

            for (const item of order.orderItems) {
              const productToUpdate = productsToUpdate.find(
                (p) => p.id === item.productId
              );

              if (productToUpdate) {
                const newSupply = productToUpdate.supply + item.quantity;

                // Update product supply
                await tx
                  .update(products)
                  .set({ supply: newSupply })
                  .where(eq(products.id, item.productId));

                // Add a history record for the stock change
                await tx.insert(productHistory).values({
                  productId: item.productId,
                  type: "arrival",
                  quantity: item.quantity,
                });
              }
            }
          }
          break;

        case "shipped":
          // Prevent shipping a cancelled order
          if (currentStatus === "cancelled") {
            tx.rollback();
            return NextResponse.json(
              { error: "Cannot ship a cancelled order." },
              { status: 400 }
            );
          }
          break;
      }

      // Finally, update the order status
      const updatedOrder = await tx
        .update(orders)
        .set({ status: status })
        .where(eq(orders.id, orderId))
        .returning();

      if (updatedOrder.length === 0) {
        tx.rollback();
        return NextResponse.json(
          { error: "Order not found." },
          { status: 404 }
        );
      }
    });

    return NextResponse.json(
      { message: "Order status updated successfully." },
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
  request: NextRequest,
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
