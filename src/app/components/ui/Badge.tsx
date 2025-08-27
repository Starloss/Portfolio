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
    className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full font-medium ${
      variant === 'outline'
        ? 'border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'
        : 'bg-slate-200 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300'
    } ${className}`.trim()}
    {...rest}
  >
    {children}
  </span>
);
