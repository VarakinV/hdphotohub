import type { NextAuthConfig } from "next-auth";

// Edge-safe Auth.js config for middleware only. Do NOT import providers or Node-only libs here.
const edgeAuthConfig = {
  // Ensure the same secret is used on Edge for token parsing in middleware
  secret: process.env.AUTH_SECRET,
  // Explicitly no providers in Edge (empty array is valid and edge-safe)
  providers: [],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;
      // Prefer role from session.user, but also fall back to token role if present
      const role = ((auth?.user as any)?.role ?? (auth as any)?.role ?? (auth as any)?.token?.role) as string | undefined;

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
      // On sign-in, copy critical fields to the token so middleware can authorize by role
      if (user) {
        (token as any).id = (user as any).id ?? (token as any).id;
        (token as any).role = (user as any).role ?? (token as any).role;
        (token as any).realtorId = (user as any).realtorId ?? (token as any).realtorId;
        token.name = (user as any).name ?? token.name;
        (token as any).avatarUrl = (user as any).avatarUrl ?? (user as any).image ?? (token as any).avatarUrl ?? null;
      }
      // Support token updates if needed
      if (trigger === 'update' && session) {
        if (typeof (session as any).name === 'string') token.name = (session as any).name;
        if ((session as any).avatarUrl !== undefined) (token as any).avatarUrl = (session as any).avatarUrl;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any).id as string | undefined;
        (session.user as any).role = (token as any).role as string | undefined;
        (session.user as any).realtorId = (token as any).realtorId as string | undefined;
        session.user.name = token.name as string | null | undefined;
        (session.user as any).avatarUrl = (token as any).avatarUrl as string | null | undefined;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
} satisfies NextAuthConfig;

export default edgeAuthConfig;

