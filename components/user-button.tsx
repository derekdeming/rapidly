'use client';
import { UserAvatar } from '@/components/user-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut, useSession } from 'next-auth/react';
import { CreditCard, LogOut, Settings, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

const UserButton = () => {
  const { data } = useSession();
  const { push } = useRouter();

  if (!data) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <UserAvatar />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="mr-5">
        <DropdownMenuLabel>{data.user?.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => push('/settings')}>
          <User className="mr-2 h-4 w-4 text-gray-500" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => push('/settings')}>
          <CreditCard className="mr-2 h-4 w-4 text-gray-500" />
          Billing
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => push('/settings')}>
          <Settings className="mr-2 h-4 w-4 text-gray-500" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut className="mr-2 h-4 w-4 text-gray-500" /> Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserButton;
