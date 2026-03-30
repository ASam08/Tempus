import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { z } from "zod";
import type { User } from "@/lib/definitions";
import bcrypt from "bcryptjs";
import { sqlConn } from "@/lib/db";
import { AuthError } from "next-auth";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

async function getUser(email: string): Promise<User | undefined> {
  try {
    // const user = await sql<User[]>`SELECT * FROM users WHERE email=${email}`;
    const user: User[] = await sqlConn
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user[0];
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;
          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (!passwordsMatch) {
            console.log("Invalid credentials");
            return null;
          }

          if (user.accountEnabled === false) {
            console.warn(`Account for ${email} is not enabled yet.`);
            throw new Error("ACCOUNT_NOT_ENABLED", {
              cause: { type: "AccountNotEnabled" },
            });
          }

          return {
            id: user.id,
            name: user.name ?? null,
            email: user.email,
          };
        } else return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
