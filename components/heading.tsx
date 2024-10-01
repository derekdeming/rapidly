import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface HeadingProps {
  title: string;
  description: string;
  iconPath?: string;
  icon?: LucideIcon;
  iconColor?: string;
  bgColor?: string;
  className?: string;
}

export const Heading = ({ title, description, iconPath, icon: Icon, iconColor, bgColor }: HeadingProps) => {
  return (
    <div className="px-4 lg:px-8 flex items-center gap-x-3 mb-8">
      <div className={cn('p-2 w-fit rounded-md', bgColor)}>
        {iconPath != undefined && <img src={iconPath} alt="icon" className="w-10 h-10" />}
        {Icon != undefined && <Icon className={cn('w-10 h-10', iconColor)} />}
      </div>
      <div>
        <h2 className="text-3xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};
