import NextAuth, { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const BASE_PATH = "/api/auth"

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: string | null;
  sessionExpires?: string;
  sessionToken?: string;
}

const authOptions: NextAuthConfig = {
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.user = user
      }
      return token;
    },
    async session({ session, token, user }) {
      if (token.user) {
        session.user = token.user as UserData;


        if (token.user.sessionExpires) {
          const expirationTime = new Date(token.user.sessionExpires).getTime();
          if (Date.now() > expirationTime) {
            // Session has expired
            return null;
          }
        }
      }
      return session;
    }
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const { userData } = credentials as {userData: string;};
        try {
          if (!userData) return null;
          
          const parsedUserData: UserData = JSON.parse(userData);
          if (!parsedUserData.emailVerified) return null;

          return parsedUserData;
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  pages: {  
    signIn: "/signin",
  },
  basePath: BASE_PATH,
  secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
