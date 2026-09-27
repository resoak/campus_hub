import { ImgHTMLAttributes, forwardRef } from 'react';
import { cn, getInitials } from '../../utils/helpers';

interface AvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'square';
}

const sizeClasses = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-16 w-16 text-xl',
};

export const Avatar = forwardRef<HTMLImageElement, AvatarProps>(
  ({ className, src, alt, fallback, size = 'md', shape = 'circle', ...props }, ref) => {
    const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-lg';
    const hasImage = src && src.length > 0;

    if (hasImage) {
      return (
        <img
          ref={ref}
          src={src}
          alt={alt || fallback || 'Avatar'}
          className={cn('object-cover', sizeClasses[size], shapeClass, className)}
          {...props}
        />
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
          sizeClasses[size],
          shapeClass,
          className
        )}
        aria-label={alt || fallback || 'Avatar'}
        {...props}
      >
        {fallback ? getInitials(fallback) : '?'}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';