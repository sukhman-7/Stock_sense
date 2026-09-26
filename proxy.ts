import middleware from "next-auth/middleware"
import { NextRequest, NextFetchEvent } from "next/server"

export default function proxy(req: NextRequest, ctx: NextFetchEvent) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return middleware(req, ctx);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/operations/:path*",
    "/products/:path*",
    "/history/:path*",
    "/settings/:path*"
  ]
}
