import React, { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import { micah } from '@dicebear/collection';

interface ReviewAvatarProps {
  seed: string | null;
  name?: string | null;
  size?: number;
  className?: string;
  fallbackImageUrl?: string | null;
}

export function ReviewAvatar({ seed, name, size = 56, className = "", fallbackImageUrl }: ReviewAvatarProps) {
  const avatarSvg = useMemo(() => {
    if (fallbackImageUrl) return null; // Using real uploaded image

    // If no seed provided (old reviews), we fallback to using their name as seed
    const actualSeed = seed || name || 'default-seed';

    const avatar = createAvatar(micah, {
      seed: actualSeed,
      size: size,
      radius: 50,
      backgroundColor: ["f3f4f6", "e5e7eb", "d1d5db", "fbcfe8", "fca5a5", "fdba74", "fcd34d", "bef264", "86efac", "6ee7b7", "5eead4", "7dd3fc", "93c5fd", "a5b4fc", "c4b5fd", "d8b4fe", "f9a8d4"],
    });

    return avatar.toDataUri();
  }, [seed, name, size, fallbackImageUrl]);

  if (fallbackImageUrl) {
    return (
      <img 
        src={fallbackImageUrl} 
        alt={name ? `${name}'s avatar` : "Reviewer avatar"} 
        width={size} 
        height={size} 
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  if (avatarSvg) {
    return (
      <img 
        src={avatarSvg} 
        alt={name ? `${name}'s avatar` : "Reviewer avatar"} 
        width={size} 
        height={size} 
        className={`rounded-full shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  // Fallback to initials if something fails
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <div 
      className={`rounded-full flex items-center justify-center bg-slate-200 text-slate-600 font-bold shrink-0 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  );
}
