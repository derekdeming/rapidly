import { authConfig, getUserId } from '@/lib/auth';
import prismadb from '@/lib/prismadb';
import {getServerSession} from 'next-auth'
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    if (!session)
      return new NextResponse('Unauthorized', { status: 401 });

    const userId = await getUserId(session.user?.email as string)

    if (!userId)
      return new NextResponse('Unauthorized', { status: 401 });

    const integrations = await prismadb.account.findMany({
      where: {
        userId: userId
      },
      select: {
        provider: true,
        metadata: true
      }
    })

    return new Response(JSON.stringify(integrations), {
      headers: {
        'content-type': 'application/json'
      }
    })
  }
  catch(err) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
}