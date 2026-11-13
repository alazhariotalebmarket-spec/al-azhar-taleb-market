import React, { useEffect, useState } from 'react';
import { ORG_NAME } from '../types';

export type OrgLogoVariant = 'standard' | 'compact';

interface OrgLogoProps {
  src?: string;
  alt?: string;
  variant?: OrgLogoVariant;
  className?: string;
  isPhoto?: boolean;
}

/**
 * High-quality, non-stretching circular logo component:
 * - Preserves aspect-ratio with object-fit: contain
 * - Never exceeds 120px x 120px
 * - Never stretches small images (w-auto h-auto max-w-full max-h-full)
 * - Responsive: smaller on mobile, larger on desktop
 * - Consistent standard size across Home Page, Dashboard, and Member Cards
 * - Leaves container cleanly empty (no broken image icon) if load fails
 */
export const OrgLogo: React.FC<OrgLogoProps> = ({
  src,
  alt = ORG_NAME,
  variant = 'standard',
  className = '',
  isPhoto = false,
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  // Unified size across Home Page, Dashboard & Member Cards (<= 120px)
  // Mobile: 56px, Tablet: 76px, Desktop: 96px (compact nav/table: 36px mobile, 44px desktop)
  const sizeClasses =
    variant === 'compact'
      ? 'w-9 h-9 sm:w-11 sm:h-11'
      : 'w-14 h-14 sm:w-[76px] sm:h-[76px] md:w-24 md:h-24';

  const containerStyle: React.CSSProperties = {
    borderRadius: '50%',
    aspectRatio: '1 / 1',
    maxWidth: '120px',
    maxHeight: '120px',
  };

  if (!src || hasError) {
    return (
      <div
        aria-hidden="true"
        style={containerStyle}
        className={`${sizeClasses} shrink-0 overflow-hidden bg-transparent ${className}`}
      />
    );
  }

  return (
    <div
      style={containerStyle}
      className={`${sizeClasses} shrink-0 overflow-hidden flex items-center justify-center bg-white border border-emerald-900/15 ${className}`}
    >
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="eager"
        decoding="sync"
        onError={() => setHasError(true)}
        style={{
          objectFit: isPhoto ? 'cover' : 'contain',
          borderRadius: '50%',
          maxWidth: '100%',
          maxHeight: '100%',
        }}
        className={
          isPhoto
            ? 'h-full w-full object-cover'
            : 'h-auto w-auto max-h-full max-w-full object-contain'
        }
      />
    </div>
  );
};
