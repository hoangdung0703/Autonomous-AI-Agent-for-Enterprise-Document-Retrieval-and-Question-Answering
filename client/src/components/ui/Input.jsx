import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Input = forwardRef(({ label, error, className, ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="text-xs font-medium text-text-secondary">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={twMerge(
          clsx(
            'bg-background-primary border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary',
            'focus:border-border-default focus:outline-none transition-colors duration-150',
            'placeholder:text-text-muted disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-status-failed focus:border-status-failed',
            className
          )
        )}
        {...props}
      />
      {error && <span className="text-xs text-status-failed">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
