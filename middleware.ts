export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/operations/:path*",
    "/products/:path*",
    "/history/:path*",
    "/settings/:path*"
  ]
}
