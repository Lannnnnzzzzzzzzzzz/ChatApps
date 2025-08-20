import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSession } from "@/lib/auth"

export async function middleware(request: NextRequest) {
  // Check if the request is for a protected route
  if (request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/chat")) {
    const session = await getSession()

    if (!session) {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  // Redirect authenticated users away from auth pages
  if (request.nextUrl.pathname === "/") {
    const session = await getSession()

    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
