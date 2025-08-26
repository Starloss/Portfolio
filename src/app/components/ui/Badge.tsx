import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'default' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  className = '',
  children,
  ...rest
}) => (
  <span
    className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full ${
      variant === 'outline'
        ? 'border border-slate-700 text-slate-300'
        : 'bg-slate-800/80 text-slate-300'
    } ${className}`.trim()}
    {...rest}
  >
    {children}
  </span>
);
