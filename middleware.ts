import NextAuth from "next-auth";
import edgeAuthConfig from "@/lib/auth/auth.edge.config";

export const { auth: middleware } = NextAuth(edgeAuthConfig);

export const config = {
  matcher: [
    "/admin/:path*",
    "/portal/:path*",
    "/my-profile",
  ],
};