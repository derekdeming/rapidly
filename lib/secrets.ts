import prismadb from '@/lib/prismadb';
import { authConfig, getUserId } from './auth';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export const getAllSecrets = async () => {
  const session = await getServerSession(authConfig);
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userId = await getUserId(session.user?.email as string);

  if (!userId) return [];

  const userSecrets = await prismadb.userSecret.findMany({
    where: {
      userId: userId,
    },
    select: {
      key: true,
    },
  });

  return userSecrets.map((secret: any) => secret.key);
};

export const getSecret = async (key: string) => {
  const session = await getServerSession(authConfig);
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userId = await getUserId(session.user?.email as string);

  if (!userId) return null;

  const userSecret = await prismadb.userSecret.findUnique({
    where: {
      userId_key: {
        userId: userId,
        key: key,
      },
    },
  });

  return userSecret?.value || null;
};

export const addSecret = async (key: string, value: string) => {
  const session = await getServerSession(authConfig);
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userId = await getUserId(session.user?.email as string);

  if (!userId) return false;

  await prismadb.userSecret.create({
    data: {
      userId: userId,
      key: key,
      value: value,
    },
  });

  return true;
};

export const updateSecret = async (key: string, value: string) => {
  const session = await getServerSession(authConfig);
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userId = await getUserId(session.user?.email as string);

  if (!userId) return false;

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

  return true;
};

export const deleteSecret = async (key: string) => {
  const session = await getServerSession(authConfig);
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userId = await getUserId(session.user?.email as string);

  if (!userId) return false;

  await prismadb.userSecret.delete({
    where: {
      userId_key: {
        userId: userId,
        key: key,
      },
    },
  });

  return true;
};
