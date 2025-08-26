import React from 'react';

interface HeadingProps extends React.HTMLAttributes<HTMLElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  visuallyHidden?: boolean;
}

export const Heading: React.FC<HeadingProps> = ({
  level = 2,
  className = '',
  visuallyHidden,
  children,
  ...rest
}) => {
  const Tag = `h${level}` as const;
  return (
    <Tag className={`${visuallyHidden ? 'sr-only' : ''} ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
};
