'use client';

import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';
import { FcGoogle } from 'react-icons/fc';
// For the login/signup page
export function GoogleSignInButton() {
  const handleClick = () => {
    signIn('google', { callbackUrl: '/conversation' });
  };

  return (
    <Button onClick={handleClick} className="flex flex-wrap gap-x-1 gap-y-4" variant="outline">
      <FcGoogle />
      Login with Google
    </Button>
  );
}
