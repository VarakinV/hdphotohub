import NextAuth from "next-auth";
import authConfig from "@/lib/auth/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    "/admin/:path*",
    "/portal/:path*",
    "/my-profile",
  ],
};