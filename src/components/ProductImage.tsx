'use client';

import { CSSProperties, useState } from 'react';
import { PRODUCT_IMAGE_PLACEHOLDER } from '@/lib/product-images';

export default function ProductImage({
  src,
  alt,
  className,
  style,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  style?: CSSProperties;
}) {
  const [hasError, setHasError] = useState(false);
  const imageSrc = !hasError && src ? src : PRODUCT_IMAGE_PLACEHOLDER;

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={style}
      onError={() => setHasError(true)}
    />
  );
}
