import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

const control =
  'block w-full min-h-11 rounded-2xl border border-lavender-200 bg-white px-4 py-2 text-base text-ink ' +
  'placeholder:text-ink-muted/70 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-plum-700 ' +
  'aria-[invalid=true]:border-danger';

function describedBy(...ids: Array<string | null>): string | undefined {
  const joined = ids.filter(Boolean).join(' ');
  return joined === '' ? undefined : joined;
}

interface FieldChrome {
  label: string;
  hint?: string;
  error?: string;
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & FieldChrome;

export function TextField({ label, hint, error, className = '', id, ...rest }: TextFieldProps) {
  const auto = useId();
  const inputId = id ?? auto;
  const hintId = `${inputId}-hint`;
  const errId = `${inputId}-err`;
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-plum-900">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="mb-1 text-sm text-ink-muted">
          {hint}
        </p>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hint ? hintId : null, error ? errId : null)}
        className={control}
        {...rest}
      />
      {error && (
        <p id={errId} role="alert" className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & FieldChrome & { children: ReactNode };

export function SelectField({ label, hint, error, className = '', id, children, ...rest }: SelectFieldProps) {
  const auto = useId();
  const selectId = id ?? auto;
  const hintId = `${selectId}-hint`;
  const errId = `${selectId}-err`;
  return (
    <div className={className}>
      <label htmlFor={selectId} className="mb-1 block text-sm font-medium text-plum-900">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="mb-1 text-sm text-ink-muted">
          {hint}
        </p>
      )}
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hint ? hintId : null, error ? errId : null)}
        className={control}
        {...rest}
      >
        {children}
      </select>
      {error && (
        <p id={errId} role="alert" className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

type CheckboxFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode;
  error?: string;
};

export function CheckboxField({ label, error, className = '', id, ...rest }: CheckboxFieldProps) {
  const auto = useId();
  const inputId = id ?? auto;
  const errId = `${inputId}-err`;
  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <input
          id={inputId}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(error ? errId : null)}
          className="mt-1 size-5 shrink-0 rounded border-lavender-200 accent-plum-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum-700"
          {...rest}
        />
        <label htmlFor={inputId} className="text-sm text-ink">
          {label}
        </label>
      </div>
      {error && (
        <p id={errId} role="alert" className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
