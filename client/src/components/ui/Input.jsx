import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Input = forwardRef(({ label, error, icon: Icon, className, ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="text-xs font-medium text-text-secondary">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-text-muted pointer-events-none">
            <Icon size={16} />
          </div>
        )}
        <input
          ref={ref}
          style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          className={twMerge(
            clsx(
              'border border-border-subtle rounded-lg py-2 text-sm text-text-primary w-full',
              Icon ? 'pl-9 pr-3' : 'px-3',
              'focus:border-accent/50 focus:ring-2 focus:ring-accent/30 focus:outline-none transition-colors duration-150',
              'placeholder:text-text-muted disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-status-failed focus:border-status-failed',
              className
            )
          )}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-status-failed">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
