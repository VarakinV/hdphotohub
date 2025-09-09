import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/utils/password";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export default {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const validatedFields = loginSchema.safeParse(credentials);

        if (!validatedFields.success) {
          return null;
        }

        const { email, password } = validatedFields.data;

        try {
          const user = await prisma.user.findUnique({
            where: { email }
          });

          if (!user || !user.password) {
            return null;
          }

          const passwordsMatch = await verifyPassword(password, user.password);

          if (!passwordsMatch) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            avatarUrl: (user as any).avatarUrl ?? user.image ?? null,
            role: user.role,
            realtorId: user.realtorId ?? null,
          } as any;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;
      const role = (auth?.user as any)?.role as string | undefined;

      if (path.startsWith("/admin")) {
        // Admin area: ADMIN or SUPERADMIN can access
        return isLoggedIn && (role === "ADMIN" || role === "SUPERADMIN");
      }

      if (path.startsWith("/portal")) {
        // Portal area: REALTOR, ADMIN, or SUPERADMIN
        return isLoggedIn && (role === "REALTOR" || role === "ADMIN" || role === "SUPERADMIN");
      }

      // Public and other routes
      return true;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.realtorId = (user as any).realtorId ?? undefined;
        token.name = (user as any).name ?? token.name;
        (token as any).avatarUrl = (user as any).avatarUrl ?? (user as any).image ?? (token as any).avatarUrl ?? null;
      }
      // Support client-side session.update({...}) to refresh token values
      if (trigger === 'update' && session) {
        if (typeof (session as any).name === 'string') token.name = (session as any).name;
        if ((session as any).avatarUrl !== undefined) (token as any).avatarUrl = (session as any).avatarUrl;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).realtorId = (token as any).realtorId as string | undefined;
        session.user.name = token.name as string | null | undefined;
        (session.user as any).avatarUrl = (token as any).avatarUrl as string | null | undefined;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  trustHost: true,
} satisfies NextAuthConfig;