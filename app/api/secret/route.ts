import { authConfig, getUserId } from '@/lib/auth';
import prismadb from '@/lib/prismadb';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = await getUserId(session.user?.email as string);
    const body = await req.json();
    const { key, value } = body;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!key) {
      return new NextResponse('Key is required', { status: 400 });
    }

    if (!value) {
      return new NextResponse('Value is required', { status: 400 });
    }
    await prismadb.userSecret.create({
      data: {
        userId: userId,
        key: key,
        value: value,
      },
    });
    return new NextResponse('Secret created', { status: 200 });
  } catch (error) {
    console.log('[SECRET_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = await getUserId(session.user?.email as string);

    const body = await req.json();
    const { key } = body;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!key) {
      return new NextResponse('Key is required', { status: 400 });
    }

    let data = await prismadb.userSecret.findUnique({
      where: {
        userId_key: {
          userId: userId,
          key: key,
        },
      },
      select: {
        value: true,
      },
    });

    if (!data) {
      return new NextResponse('Secret not found', { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.log('[SECRET_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = await getUserId(session.user?.email as string)

    const body = await req.json();
    const { key, value } = body;
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if (!key) {
      return new NextResponse('Key is required', { status: 400 });
    }
    if (!value) {
      return new NextResponse('Value is required', { status: 400 });
    }
    await prismadb.userSecret.update({
      where: {
        userId_key: {
          userId: userId,
          key: key,
        },
      },
      data: {
        value: value,
      },
    });
    return new NextResponse('Secret updated', { status: 200 });
  } catch (error) {
    console.log('[SECRET_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = await getUserId(session.user?.email as string)

    const body = await req.json();
    const { key } = body;
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if (!key) {
      return new NextResponse('Key is required', { status: 400 });
    }
    await prismadb.userSecret.delete({
      where: {
        userId_key: {
          userId: userId,
          key: key,
        },
      },
    });
    return new NextResponse('Secret deleted', { status: 200 });
  } catch (error) {
    console.log('[SECRET_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
