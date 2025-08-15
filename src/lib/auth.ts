import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in the environment variables");
}

export interface UserPayload {
  sub: number;
  email: string;
}

export async function verifyAuth(request: NextRequest) {
  try {
    const token =
      request.headers.get("Authorization")?.split(" ")[1] ||
      request.cookies.get("authToken")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided." },
        { status: 401 }
      );
    }

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as unknown as UserPayload;

    return payload; // The handler gets the decoded payload on success
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or expired token." },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error." },
      { status: 500 }
    );
  }
}
