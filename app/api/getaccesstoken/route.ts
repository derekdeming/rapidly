import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth';
import prismadb from '@/lib/prismadb';

// TODO: change to getting using only provider (and default to using user id from session)
// supports only one single provider + user id per account. if more than one match, return error

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    // TODO: fix type??
    const id: string = (session.user as any).id;

    const provider = req.nextUrl.searchParams.get('provider');

    if (!provider) {
      return new NextResponse('Provider is required', { status: 400 });
    }

    // if (authConfig.providers.find((p) => p.id === provider) === undefined) {
    //   return new NextResponse('Provider is not supported', { status: 400 });
    // }

    const providerAccountId = req.nextUrl.searchParams.get('providerAccountId');

    if (!providerAccountId) {
      return new NextResponse('Provider Account Id is required', { status: 400 });
    }

    const account = await prismadb.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: provider as string,
          providerAccountId: providerAccountId as string,
        },
      },
    });

    if (!account) return new NextResponse('No matching account found', { status: 404 });

    if (account.userId !== id) return new NextResponse('Unauthorized', { status: 401 });
    const { access_token, refresh_token, expires_at } = account;

    if (!access_token || !refresh_token || !expires_at)
      return new NextResponse('Missing value', { status: 500 });

    if (expires_at * 1000 < Date.now()) {
      let response: Response | null = null;

      if (account.provider === 'google')
        response = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID as string,
            client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
            grant_type: 'refresh_token',
            refresh_token: refresh_token,
          }),
        });
      else if (account.provider === 'slack')
        response = await fetch('https://slack.com/api/oauth.v2.access', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: process.env.NEXT_PUBLIC_SLACK_CLIENT_ID as string,
            client_secret: process.env.SLACK_CLIENT_SECRET as string,
            grant_type: 'refresh_token',
            refresh_token: refresh_token,
          }),
        });
      else if (account.provider === 'confluence')
        response = await fetch(`https://auth.atlassian.com/oauth/token`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            grant_type: 'refresh_token',
            client_id: process.env.NEXT_PUBLIC_ATLASSIAN_CLIENT_ID,
            client_secret: process.env.ATLASSIAN_CLIENT_SECRET,
            refresh_token: refresh_token,
          }),
        });
      else
        return new NextResponse(
          `Provider ${account.provider} is not supported`,
          { status: 500 }
        );

      if (!response)
        return new NextResponse('Unauthorized: Issue refreshing access token', { status: 401 });

      if (!response.ok) {
        return new NextResponse('Unauthorized: Issue refreshing token', { status: 401 });
      }

      const tokens = await response.json();

      await prismadb.account.update({
        where: {
          provider_providerAccountId: {
            provider: provider as string,
            providerAccountId: providerAccountId as string,
          },
        },
        data: {
          access_token: tokens.access_token,
          expires_at: Math.floor(Date.now() / 1000 + tokens.expires_in),
          refresh_token: tokens.refresh_token ?? refresh_token,
        },
      });

      return new NextResponse(
        JSON.stringify({
          access_token: tokens.access_token,
          expires_at: Math.floor(Date.now() / 1000 + tokens.expires_in),
        }),
        { status: 200 }
      );
    }

    return new NextResponse(
      JSON.stringify({
        access_token: access_token,
        expires_at: expires_at,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.log('[ACCESS TOKEN FETCH FAILED] ', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
