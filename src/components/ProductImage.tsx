'use client';

import { useState } from 'react';
import { PRODUCT_IMAGE_PLACEHOLDER } from '@/lib/product-images';

type ProductImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & {
  src?: string | null;
  alt: string;
  fill?: boolean;
};

export default function ProductImage({ src, alt, className, ...props }: ProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const imageSrc = !hasError && src ? src : PRODUCT_IMAGE_PLACEHOLDER;

  return <img src={imageSrc} alt={alt} className={className} onError={() => setHasError(true)} {...props} />;
}
