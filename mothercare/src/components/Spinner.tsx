export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center gap-3 p-10 text-ink-muted">
      <span aria-hidden="true" className="size-5 animate-spin rounded-full border-2 border-lavender-200 border-t-plum-700" />
      <span>{label}</span>
    </div>
  );
}
