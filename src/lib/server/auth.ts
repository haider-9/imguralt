import { SvelteKitAuth } from "@auth/sveltekit";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { connectDBSafe } from "./db";
import { User } from "./models/user";
import bcrypt from "bcryptjs";
import type { DefaultSession } from "@auth/core/types";
import CredentialsProvider from "@auth/core/providers/credentials";
import { MongoClient } from "mongodb";
import { MONGODB_URI } from "$env/static/private";

declare module "@auth/core/types" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

// Create MongoDB client for auth adapter with error handling
let clientPromise: Promise<MongoClient>;
try {
  const client = new MongoClient(MONGODB_URI);
  clientPromise = client.connect();
} catch (error) {
  console.error("Failed to create MongoDB client for auth:", error);
  // Create a dummy promise that rejects
  clientPromise = Promise.reject(new Error("MongoDB client creation failed"));
}

export const { handle, signIn, signOut } = SvelteKitAuth({
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const dbConnected = await connectDBSafe();
          if (!dbConnected) {
            console.warn("Database unavailable for authentication");
            return null;
          }

          const user = await User.findOne({ email: credentials.email });

          if (!user) {
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password as string, user.password);

          if (!isValid) {
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.avatar,
          };
        } catch (error) {
          console.error("Auth database error:", error instanceof Error ? error.message : error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
});