import React from 'react';

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  titleRightAdornment?: React.ReactNode;
  ariaLabel?: string;
}

export const Section: React.FC<SectionProps> = ({
  title,
  titleRightAdornment,
  children,
  className = '',
  ariaLabel,
  ...rest
}) => (
  <section className={`space-y-4 ${className}`.trim()} aria-label={ariaLabel} {...rest}>
    {title && (
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <span className="h-px grow bg-slate-700" />
        {titleRightAdornment}
      </div>
    )}
    {children}
  </section>
);
