
import Image from 'next/image';
import { User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  src: string | null | undefined;
  size?: number;
  className?: string;
}

export function UserAvatar({ src, size = 40, className }: UserAvatarProps) {
  const iconSize = size * 0.6;

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden bg-muted flex items-center justify-center',
        className
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image
          src={src}
          alt="Foto do Perfil"
          fill
          className="object-cover"
          sizes={`${size}px`}
        />
      ) : (
        <UserIcon
          className="text-muted-foreground"
          style={{ width: iconSize, height: iconSize }}
        />
      )}
    </div>
  );
}
