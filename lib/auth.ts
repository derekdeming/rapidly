import { NextAuthOptions, User, getServerSession } from 'next-auth';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import prismadb from '@/lib/prismadb';

import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import SlackProvider from 'next-auth/providers/slack';

import { PrismaAdapter } from '@next-auth/prisma-adapter';
import axios from 'axios';

type SessionUser = {
  id: string;
  name?: string | null | undefined;
  email?: string | null | undefined;
  image?: string | null | undefined;
};

export const authConfig: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Sign in',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'example@example.com',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },
      async authorize(credentials) {
        if (!credentials || !credentials.email || !credentials.password) return null;
        const dbUser = await prismadb.user.findFirst({
          where: { email: credentials.email },
        });

        // TODO: add hashing and verification
        // if (dbUser && dbUser.password === credentials.password) {
        //   const { password, createdAt, id, ...dbUserWithoutPassword } = dbUser;
        //   return dbUserWithoutPassword as User;
        // }
        return dbUser;

        return null;
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          redirect_uri: process.env.NEXT_PUBLIC_APP_URL + '/api/auth/callback/google',
        },
      },
    }),
    // SlackProvider({
    //   clientId: process.env.NEXT_PUBLIC_SLACK_CLIENT_ID as string,
    //   clientSecret: process.env.SLACK_CLIENT_SECRET as string,
    //   authorization: {
    //     params: {
    //       redirect_uri:
    //         process.env.NEXT_PUBLIC_APP_URL?.replace('http', 'https') + '/api/auth/callback/slack',
    //       scope:
    //         'identity.basic,identity.email,identity.avatar:read_user,channels:history,channels:read,search:read',
    //     },
    //   },
    // }),
    {
      id: 'slack',
      name: 'Slack',
      clientId: process.env.NEXT_PUBLIC_SLACK_CLIENT_ID as string,
      clientSecret: process.env.SLACK_CLIENT_SECRET as string,
      type: 'oauth',
      wellKnown: 'https://slack.com/.well-known/openid-configuration',
      requestTokenUrl: 'https://slack.com/oauth/v2/authorize',
      authorization: {
        params: {
          request_uri: 'https://slack.com/oauth/v2/authorize',
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          redirect_uri:
            process.env.NEXT_PUBLIC_APP_URL?.replace('http', 'https') + '/api/auth/callback/slack',
          scope:
            'channels:history channels:read groups:history im:history mpim:history'
        },
      },
      profile: (profile: any) => {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    },
    {
      id: 'drive',
      name: 'Google Drive',
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      type: 'oauth',
      wellKnown: 'https://accounts.google.com/.well-known/openid-configuration',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          redirect_uri: process.env.NEXT_PUBLIC_APP_URL + '/api/auth/callback/drive',
          scope:
            'openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/drive.activity.readonly https://www.googleapis.com/auth/drive.readonly',
        },
      },
      idToken: true,
      profile: (profile: any) => {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    },
  ],
  adapter: PrismaAdapter(prismadb),
  events: {
    signIn: async ({ account, user, profile, isNewUser }) => {
      // check if user is new
      if (!profile) return;

      await prismadb.account.update({
        where: {
          provider_providerAccountId: {
            provider: account?.provider as string,
            providerAccountId: account?.providerAccountId as string,
          },
        },
        data: {
          metadata: {
            email: profile.email,
            name: profile.name,
            picture: profile.image,
          },
        },
      });
    },
  },
  callbacks: {
    // TODO: create signIn event that extends the Account with additional metadata
    jwt: async ({ token, account, user }) => {
      if (account?.accessToken) {
        token.accessToken = account.accessToken;
      }
      let id = await getUserId(user?.email as string);
      if (user) {
        token.id = id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      let id = await getUserId(session.user?.email as string);

      if (session?.user) {
        session.user = { ...session.user, id: id } as SessionUser;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const getUserId = async (email: string) => {
  const user = await prismadb.user.findFirst({ where: { email } });
  if (user) return user.id;
  return null;
};
