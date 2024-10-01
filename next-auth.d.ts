import 'next-auth';

declare module 'next-auth' {
  export * from 'next-auth';
  export type InitOptions = auth.InitOptions;
  export default NextAuth;
  interface Session {
    user: {
      id: string | null | undefined;
      name?: string | null | undefined;
      email?: string | null | undefined;
      image?: string | null | undefined;
    };
  }
}

declare module 'next-auth/client' {
  export * from 'next-auth/client';

  export interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image: string;
    };
  }
}
