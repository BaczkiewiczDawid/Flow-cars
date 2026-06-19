import type { NextAuthConfig } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: { id: string; name?: string | null; email?: string | null };
  }
}

export const authConfig: NextAuthConfig = {
  providers: [],
  pages: { signIn: '/login' },
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
};
