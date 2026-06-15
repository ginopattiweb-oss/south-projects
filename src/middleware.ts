import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const OWNER_ONLY_PATHS = [
  "/finances", "/invoices", "/quotes", "/subscriptions",
  "/expenses", "/vault", "/portal-access",
];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    // Clients can only access /portal
    if (role === "client" && !pathname.startsWith("/portal") && !pathname.startsWith("/api/portal") && !pathname.startsWith("/api/auth")) {
      return NextResponse.redirect(new URL("/portal", req.url));
    }

    // Employees blocked from owner-only paths
    if (role === "employee" && OWNER_ONLY_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Non-clients blocked from portal
    if (role !== "client" && pathname.startsWith("/portal")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: { authorized: ({ token }) => !!token },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*", "/clients/:path*", "/projects/:path*", "/tasks/:path*",
    "/finances/:path*", "/invoices/:path*", "/quotes/:path*", "/subscriptions/:path*",
    "/expenses/:path*", "/vault/:path*", "/wiki/:path*", "/settings/:path*",
    "/portal-access/:path*", "/portal/:path*",
  ],
};
