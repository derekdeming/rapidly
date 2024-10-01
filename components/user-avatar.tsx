'use client';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { authConfig } from '@/lib/auth';
import { AvatarFallback } from '@radix-ui/react-avatar';
import { getServerSession } from 'next-auth';
import { useSession } from 'next-auth/react';

export const UserAvatar = () => {
  const { data } = useSession();
  if (!data) return null;

  const user = data?.user;

  return (
    <Avatar className="h-8 w-8">
      <AvatarImage src={user?.image || ''} />
      <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
    </Avatar>
  );
};
