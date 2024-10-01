import axios from 'axios';
import FormData from 'form-data';
import prismadb from '@/lib/prismadb';
import { authConfig, getUserId } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { NextResponse, NextRequest } from 'next/server';
import { NextApiRequest, NextApiResponse } from 'next';

export async function GET(req: NextRequest, res: NextApiResponse) {
  const session = await getServerSession(authConfig);

  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userId = await getUserId(session.user?.email as string);

  if (!userId || typeof userId !== 'string') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const code = req.nextUrl.searchParams.get('code');

  if (!code) {
    return new Response('Code is required', { status: 400 });
  }

  const formData = new FormData();
  formData.append('client_id', process.env.NEXT_PUBLIC_SLACK_CLIENT_ID as string);
  formData.append('client_secret', process.env.SLACK_CLIENT_SECRET as string);
  formData.append('code', code);

  try {
    const response = await axios.post('https://slack.com/api/oauth.v2.access', formData, {
      headers: formData.getHeaders(),
    });
    if (!response.data.ok) {
      console.log('error response', response.data);
      return new Response('Error', { status: 500 });
    }

    // get actual access token, and store into db
    await prismadb.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'slack',
          providerAccountId: response.data.authed_user.id,
        },
      },
      create: {
        id: response.data.bot,
        userId: userId,
        providerAccountId: response.data.authed_user.id,
        access_token: response.data.access_token,
        expires_at: response.data.expires_in + Math.floor(Date.now() / 1000),
        refresh_token: response.data.refresh_token,
        provider: 'slack',
        id_token: response.data.team.id,
        scope: response.data.scope,
        token_type: response.data.token_type,
        type: 'oauth',
        metadata: {
          app_id: response.data.app_id,
          bot_user_id: response.data.bot_user_id,
          team: response.data.team,
          enterprise: response.data.enterprise,
          is_enterprise_install: response.data.is_enterprise_install,
        },
      },
      update: {
        access_token: response.data.access_token,
        userId: userId,
        expires_at: response.data.expires_in + Math.floor(Date.now() / 1000),
        refresh_token: response.data.refresh_token,
        scope: response.data.scope,
      },
    });
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings`);
  } catch (e) {
    console.log('error', e);
    return new Response('Error', { status: 500 });
  }
}
