import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Email from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import { hashPassword } from "@/lib/utils/password";
import { randomBytes } from "crypto";

import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/utils/password";
import { Resend } from "resend";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

// Adapter override: auto-provision Users for known Realtors or valid Invites on Magic Link
const baseAdapter = PrismaAdapter(prisma) as unknown as Adapter;
const adapter: Adapter = {
  ...baseAdapter,
  async createUser(data) {
    const email = (data?.email ?? "").trim().toLowerCase();
    if (!email) throw new Error("MissingEmail");

    // If a matching Realtor exists, create a REALTOR user linked to it
    const realtor = await prisma.realtor.findUnique({ where: { email } });

    // Otherwise, allow valid invite-based creation (keeps prior behavior)
    const invite = await prisma.invitation.findFirst({
      where: {
        email,
        OR: [
          { acceptedAt: null, expiresAt: { gt: new Date() } },
          // If you want to allow any historical invite, add: { id: { not: null } }
        ],
      },
      orderBy: { expiresAt: "desc" },
    });

    if (!realtor && !invite) {
      // Do not create unknown users via Magic Link
      throw new Error("AutoProvisionNotAllowed");
    }

    const password = await hashPassword(randomBytes(16).toString("hex"));
    const nameFromRealtor = realtor ? [realtor.firstName, realtor.lastName].filter(Boolean).join(" ").trim() : null;

    const role = realtor ? "REALTOR" : (invite?.role as any) ?? "REALTOR";
    const realtorId = realtor ? realtor.id : invite?.realtorId ?? null;

    const created = await prisma.user.create({
      data: {
        email,
        password,
        name: nameFromRealtor || (data as any)?.name || null,
        role,
        realtorId: realtorId ?? undefined,
        emailVerified: new Date(),
      },
    });

    // Return enriched user so JWT callback receives role/realtorId on first sign-in
    return {
      id: created.id,
      email: created.email,
      emailVerified: created.emailVerified,
      // extra fields for our callbacks/middleware
      role: created.role as any,
      realtorId: created.realtorId as any,
      name: created.name ?? null,
      image: created.image ?? null,
    } as unknown as AdapterUser;
  },

};

export default {
  // Ensure a stable secret is used for token hashing/verification
  secret: process.env.AUTH_SECRET,
  adapter: adapter as any,
  providers: [
    Email({
      from: (process.env.RESEND_FROM || process.env.EMAIL_FROM)!,
      maxAge: 15 * 60, // 15 minutes
      // Normalize email identifier consistently to avoid case/whitespace mismatches
      normalizeIdentifier(identifier) {
        return identifier.trim().toLowerCase();
      },
      // Provide a dummy server to satisfy Nodemailer provider validation; we send via Resend instead.
      server: {} as any,
      async sendVerificationRequest({ identifier, url }) {
        try {
          const email = identifier.trim().toLowerCase();

          // Allow-list: existing Users, valid Invites, or existing Realtors
          const user = await prisma.user.findUnique({ where: { email } });
          const invite = await prisma.invitation.findFirst({
            where: {
              email,
              OR: [
                { acceptedAt: null, expiresAt: { gt: new Date() } },
              ],
            },
          });
          const realtor = await prisma.realtor.findUnique({ where: { email } });
          if (!user && !invite && !realtor) {
            // Silently succeed to avoid user enumeration
            return;
          }


          const resend = new Resend(process.env.RESEND_API_KEY!);
          const brand = process.env.BRAND_NAME ?? "Media Portal";

          // Bot-safe interstitial: wrap the NextAuth callback URL in a page that requires JS to proceed
          const original = new URL(url);
          const safeUrl = `${original.origin}/auth/email?next=${encodeURIComponent(url)}`;

          await resend.emails.send({
            from: (process.env.RESEND_FROM || process.env.EMAIL_FROM)!,
            to: email,
            subject: `Your sign-in link for ${brand}`,
            html: `
              <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6">
                <h2 style="margin:0 0 12px">Sign in to ${brand}</h2>
                <p>Click the button below to sign in. This link expires in 15 minutes and can be used once.</p>
                <p style="margin:16px 0">
                  <a href="${safeUrl}" style="display:inline-block;background:#111827;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Sign in</a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break:break-all;color:#4b5563">${safeUrl}</p>
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0" />
                <p style="color:#6b7280;font-size:12px">If you didn’t request this email, you can safely ignore it.</p>
              </div>
            `,
          });
        } catch (err) {
          console.error("sendVerificationRequest error", err);
        }
      },
    }),
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
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          include_granted_scopes: "true",
          scope: "openid email profile https://www.googleapis.com/auth/calendar",
        },
      },
    }),
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