import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    emailVerified: string | null;
  }

  interface Session {
    user: User;
  }
  
  declare module 'next-auth/jwt' {
    interface JWT {
      user: User;
    }
}
}