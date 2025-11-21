import React from 'react';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: string; // Codicon class name
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  icon,
  children,
  className = '',
  ...props
}) => {
  const baseClass = 'ai-supervisor-button';
  const variantClass = `${baseClass}--${variant}`;
  const classes = [baseClass, variantClass, className].filter(Boolean).join(' ');

  return (
    <button className={classes} {...props}>
      {icon && <i className={`codicon codicon-${icon}`} />}
      {children && <span className={`${baseClass}__text`}>{children}</span>}
    </button>
  );
};
