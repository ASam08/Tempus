import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { sqlConn } from "@/lib/db";
import * as schema from "@/db/schema";
import bcrypt from "bcryptjs";
import { sendPasswordResetEmail } from "@/lib/email";

export const auth = betterAuth({
  database: drizzleAdapter(sqlConn, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),

  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }, request) => {
      void sendPasswordResetEmail({
        email: user.email,
        url: url,
      });
    },
    onPasswordReset: async ({ user }, request) => {
      console.log(`Password for user ${user.email} has been reset.`);
    },
    password: {
      async hash(password) {
        return bcrypt.hash(password, 10);
      },
      async verify({ hash, password }) {
        return bcrypt.compare(password, hash);
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        async before(user) {
          const existingUsers = await sqlConn
            .select({ id: schema.users.id })
            .from(schema.users)
            .limit(1);
          const isFirstUser = existingUsers.length === 0;

          const banned =
            !isFirstUser &&
            process.env.APPROVE_SIGNUPS?.toLowerCase() === "true";

          return {
            data: {
              ...user,
              role: isFirstUser ? "admin" : "user",
              banned: banned,
              banReason: banned ? "Pending admin approval" : null,
            },
          };
        },
      },
    },
  },

  plugins: [
    admin({
      defaultRole: "user",
      bannedUserMessage:
        process.env.APPROVE_SIGNUPS === "true"
          ? "Your account has not been approved yet. Please contact the administrator."
          : "Your account has been banned. Please contact the administrator.",
    }),
  ],

  user: {
    fields: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      emailVerified: "emailVerified",
    },
  },

  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
    useSecureCookies: process.env.TEMPUS_URL?.startsWith("https") ?? false,
  },

  trustedOrigins: [process.env.TEMPUS_URL ?? "http://localhost:3000"],
  baseURL: "http://localhost:3000",
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
