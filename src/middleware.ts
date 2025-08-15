import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const publicPaths = ["/login"];

  // Get the auth token from cookies or localStorage (if you use localStorage)
  // For this example, we'll check cookies, but you'll need to adapt for localStorage
  const authToken = request.cookies.get("authToken");

  // If the user is on a public path and is authenticated, redirect to the dashboard
  if (publicPaths.includes(pathname) && authToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If the user is on a protected path and is not authenticated, redirect to login
  if (!publicPaths.includes(pathname) && !authToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // This matcher ensures the middleware only runs for specific paths
  matcher: ["/", "/login"],
};
