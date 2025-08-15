import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: Request) {
  const authResponse = await verifyAuth(request);
  if (authResponse instanceof NextResponse) {
    return authResponse;
  }

  try {
    const allHistory = await db.query.productHistory.findMany({
      with: {
        product: true,
      },
    });

    return NextResponse.json(allHistory, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch product history." },
      { status: 500 }
    );
  }
}
