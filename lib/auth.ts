import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { sqlConn } from "@/lib/db";
import * as schema from "@/db/schema";
import bcrypt from "bcryptjs";

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
          if (process.env.APPROVE_SIGNUPS?.toLowerCase() === "true") {
            return {
              data: {
                ...user,
                banned: true,
                banReason: "Pending admin approval",
              },
            };
          }
          // No modification, return undefined to proceed normally
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
    additionalFields: {
      accountEnabled: {
        type: "boolean",
        defaultValue: true,
        fieldName: "accountEnabled",
      },
    },
  },

  advanced: {
    generateId: () => crypto.randomUUID(),
    useSecureCookies: process.env.NODE_ENV === "production",
  },

  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
