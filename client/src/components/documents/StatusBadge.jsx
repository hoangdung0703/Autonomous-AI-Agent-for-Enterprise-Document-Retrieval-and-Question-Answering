import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function StatusBadge({ status }) {
  const styles = {
    ready: 'bg-status-ready-bg text-status-ready border border-status-ready/20',
    processing: 'bg-status-processing-bg text-status-processing border border-status-processing/20',
    failed: 'bg-status-failed-bg text-status-failed border border-status-failed/20',
  };

  const labels = {
    ready: 'Ready',
    processing: 'Processing',
    failed: 'Failed',
  };

  return (
    <span className={twMerge(clsx("px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide uppercase", styles[status] || styles.failed))}>
      {labels[status] || 'Unknown'}
    </span>
  );
}
