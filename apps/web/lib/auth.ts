import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const { handlers, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        
        if (
          credentials.email === "demo@cove.io" &&
          credentials.password === "demo123"
        ) {
          return { id: "demo-user-id", name: "Demo Marketer", email: "demo@cove.io" };
        }

        
        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email as string },
          });
          if (!user) return null;

          const valid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );
          if (!valid) return null;

          return { id: user.id, name: user.name, email: user.email };
        } catch {
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) (session.user as any).id = token.id as string;
      return session;
    },
  },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET || "dev-nextauth-secret",
});