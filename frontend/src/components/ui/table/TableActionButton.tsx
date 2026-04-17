import type { LucideIcon } from 'lucide-react';
import { cn } from '../../../utils/cn';

type ActionTone = 'neutral' | 'primary' | 'success' | 'danger';

const toneClassMap: Record<ActionTone, string> = {
  neutral: 'text-slate-600 border-slate-200 bg-white hover:bg-slate-100 hover:border-slate-300',
  primary: 'text-brand-700 border-brand-200 bg-brand-50 hover:bg-brand-100 hover:border-brand-300',
  success: 'text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300',
  danger: 'text-red-700 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300',
};

type TableActionButtonProps = {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  tone?: ActionTone;
  disabled?: boolean;
  className?: string;
};

export function TableActionButton({
  icon: Icon,
  label,
  onClick,
  tone = 'neutral',
  disabled = false,
  className,
}: TableActionButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        toneClassMap[tone],
        className,
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
