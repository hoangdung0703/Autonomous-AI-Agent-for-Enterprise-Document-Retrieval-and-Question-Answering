import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Spinner from './Spinner';

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  className, 
  disabled, 
  ...props 
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors duration-150 rounded-lg focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px]';
  
  const variants = {
    primary: 'bg-accent hover:bg-accent-hover text-white',
    ghost: 'bg-transparent hover:bg-background-hover border border-border-subtle text-text-primary',
    danger: 'bg-transparent hover:bg-status-failed-bg text-status-failed border border-transparent hover:border-status-failed/30',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}
