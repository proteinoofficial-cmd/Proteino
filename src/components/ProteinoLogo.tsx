import React from 'react';
import proteinoLogoImg from '../assets/images/WhatsApp Image 2026-08-29 at 9.57.03 PM.jpeg';

interface ProteinoLogoProps {
  size?: number | string;
  className?: string;
  variant?: 'image' | 'vector';
  showBackground?: boolean;
}

/**
 * Official Proteino Brand Logo Component
 * Displays the authentic Proteino brand artwork image
 */
export default function ProteinoLogo({
  size = 140,
  className = '',
}: ProteinoLogoProps) {
  return (
    <div 
      className={`relative overflow-hidden flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <img 
        src={proteinoLogoImg} 
        alt="Proteino Logo"
        className="w-full h-full object-contain"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}


