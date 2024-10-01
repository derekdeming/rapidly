import axios from 'axios';
import prismadb from '@/lib/prismadb';
import { authConfig, getUserId } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { NextResponse, NextRequest } from 'next/server';
import { NextApiRequest, NextApiResponse } from 'next';

// http://localhost:3000/api/auth/callback/confluence?state=%24%7BYOUR_USER_BOUND_VALUE%7D&code=eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiJlOTE1MTdmMy0xNWFiLTQyOTMtOTIwMS1iM2M4ODdiMzk5MjMiLCJzdWIiOiI3MTIwMjA6ODM5MWM2NGMtOTFjZi00YzRkLWI0MDctZWI5MDBmOTYyZjQ4IiwibmJmIjoxNjk5MjU1Njc4LCJpc3MiOiJhdXRoLmF0bGFzc2lhbi5jb20iLCJpYXQiOjE2OTkyNTU2NzgsImV4cCI6MTY5OTI1NTk3OCwiYXVkIjoic2FsRnp5NDBFYkhobFlkMXh1NFZnOUFIYzFsVXloUFgiLCJjbGllbnRfYXV0aF90eXBlIjoiUE9TVCIsImh0dHBzOi8vaWQuYXRsYXNzaWFuLmNvbS92ZXJpZmllZCI6dHJ1ZSwiaHR0cHM6Ly9pZC5hdGxhc3NpYW4uY29tL3VqdCI6ImU5MTUxN2YzLTE1YWItNDI5My05MjAxLWIzYzg4N2IzOTkyMyIsInNjb3BlIjpbInJlYWQ6Y29uZmx1ZW5jZS1jb250ZW50LnBlcm1pc3Npb24iLCJyZWFkOmNvbmZsdWVuY2UtcHJvcHMiLCJyZWFkOmNvbmZsdWVuY2UtY29udGVudC5hbGwiLCJyZWFkOmNvbmZsdWVuY2Utc3BhY2Uuc3VtbWFyeSJdLCJodHRwczovL2lkLmF0bGFzc2lhbi5jb20vYXRsX3Rva2VuX3R5cGUiOiJBVVRIX0NPREUiLCJodHRwczovL2lkLmF0bGFzc2lhbi5jb20vaGFzUmVkaXJlY3RVcmkiOnRydWUsImh0dHBzOi8vaWQuYXRsYXNzaWFuLmNvbS9zZXNzaW9uX2lkIjoiMDljMmFlYTctOGEyNi00NmZjLWJkNTUtZDY2ZWExOWQwMTQ4IiwiaHR0cHM6Ly9pZC5hdGxhc3NpYW4uY29tL3Byb2Nlc3NSZWdpb24iOiJ1cy1lYXN0LTEifQ.2gJAFLaLiSQg4GT8mETNOzKlMCfOcFF_k0Gvs9CNnug
async function fetchAtlassianUserProfile(accessToken: string) {
  try {
    const userProfileResponse = await axios.get('https://api.atlassian.com/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (userProfileResponse.status === 200) {
      const userProfile = userProfileResponse.data;
      // userProfile.accountId is the Atlassian account ID you can use as an identifier
      return userProfile;
    } else {
      console.error('Failed to fetch user profile', userProfileResponse.data);
      return null;
    }
  } catch (error) {
    console.error('Error fetching Atlassian user profile', error);
    throw error;
  }
}

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

  const data = {
    grant_type: 'authorization_code',
    client_id: process.env.NEXT_PUBLIC_ATLASSIAN_CLIENT_ID as string,
    client_secret: process.env.ATLASSIAN_CLIENT_SECRET as string,
    code: code,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/confluence`,
  };

  try {
    const response = await axios.post('https://auth.atlassian.com/oauth/token', data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status !== 200) {
      console.log('error response', response.data);
      return new Response('Error', { status: 500 });
    }

    // Get user info
    const userdata = await fetchAtlassianUserProfile(response.data.access_token);

    // get actual access token, and store into db
    await prismadb.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'confluence',
          providerAccountId: userdata.account_id,
        },
      },
      create: {
        id: userdata.account_id, 
        userId: userId,
        providerAccountId: userdata.account_id, 
        access_token: response.data.access_token,
        expires_at: response.data.expires_in + Math.floor(Date.now() / 1000),
        refresh_token: response.data.refresh_token,
        provider: 'confluence',
        id_token: userdata.account_id, 
        scope: response.data.scope,
        token_type: response.data.token_type,
        type: 'oauth',
        metadata: userdata
      },
      update: {
        access_token: response.data.access_token,
        userId: userId,
        expires_at: response.data.expires_in + Math.floor(Date.now() / 1000),
        refresh_token: response.data.refresh_token,
        scope: response.data.scope,
        metadata: userdata
      },
    });
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings`);
  } catch (e) {
    console.log('error', e);
    return new Response('Error', { status: 500 });
  }
}
