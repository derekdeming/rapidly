'use client';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';

interface IntegrationBlockProps {
  name: string;
  providerId: string;
  description: string;
  iconURL: string;
  isConnected: boolean;
  href?: string;
  isLastBlock?: boolean;
}

export const IntegrationBlock = (props: IntegrationBlockProps) => {
  const { name, providerId, description, iconURL, isConnected, isLastBlock, href } = props;

  const onButtonClick = () => {
    // console.log('href', href);
    if (!!href) window.location.href = href;
    else signIn(providerId, { callbackUrl: '/settings' })
  };

  return (
    <div className={`${isLastBlock ? '' : 'border-b border-gray-200'} pb-4 pt-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative w-8 h-8 flex-shrink-0">
            <Image fill alt="Logo" src={iconURL} className="w-full h-full" />
          </div>
          <div className="flex flex-col justify-center">
            <div className="font-bold">{name}</div>
            <div className="text-sm text-gray-600">{description}</div>
          </div>
        </div>
        <Button
          variant={isConnected ? 'outline' : 'default'}
          className="ml-auto"
          onClick={onButtonClick}
        >
          {isConnected ? 'Manage' : 'Connect'}
        </Button>
      </div>
    </div>
  );
};
