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
    session({ session, token }) {
      session.user.id = token.sub!;
      return session;
    },
  },
};
