import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions, DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    // Called on every sign-in: sync the Google user with the Python backend.
    // Data persistence into the JWT happens in the jwt callback below —
    // Auth.js v4 signIn() can only gate access (return true/false), not store data.
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;

      const backendUrl = process.env.BACKEND_URL;
      if (!backendUrl) return true;

      try {
        await fetch(`${backendUrl}/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: profile?.sub, email: user.email }),
        });
      } catch {
        // Backend unreachable — allow sign-in; backend will sync on next request.
      }
      return true;
    },

    async jwt({ token, account }) {
      // `account` is only present on the first sign-in, so token.sub is already
      // the Google user ID. Nothing extra to store for our current needs.
      return token;
    },

    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub; // Google sub — passed to backend as x-user-id
      }
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
      },
    },
  },
};
