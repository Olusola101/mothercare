import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum-700 ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-plum-700 text-white hover:bg-plum-800',
  secondary: 'bg-lavender-100 text-plum-900 hover:bg-lavender-200',
  ghost: 'bg-transparent text-plum-800 hover:bg-lavender-50',
  danger: 'bg-white text-danger ring-1 ring-danger/40 hover:bg-blush-50',
};

/** Class names so links (react-router <Link>) can look like buttons. */
export function buttonClasses(variant: ButtonVariant = 'primary', extra = ''): string {
  return `${base} ${variants[variant]} ${extra}`.trim();
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses(variant, className)}
      {...rest}
    >
      {loading ? 'Please wait…' : children}
    </button>
  );
}
