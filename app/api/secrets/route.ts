import { authConfig, getUserId } from "@/lib/auth";
import prismadb from "@/lib/prismadb";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = await getUserId(session.user?.email as string)


    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const res = await prismadb.userSecret.findMany({
      where: {
        userId: userId,
      },
      select: {
        key: true,
      }
    })

    const r = res.map((x: any) => x.key)
    return new NextResponse(JSON.stringify(r))
  }
  catch (error: any) {
    console.log('[SECRETS_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

