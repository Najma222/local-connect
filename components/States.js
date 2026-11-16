export function Spinner({ className = '' }) {
  return <span className={`spinner ${className}`} aria-hidden="true" />;
}

export function Loading({ label = 'Loading…', rows = 0 }) {
  return (
    <div className="mt-6" role="status" aria-live="polite">
      {rows > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: rows }, (_, i) => <div key={i} className="h-40 animate-pulse rounded-[28px] bg-line" />)}</div>
      ) : (
        <p className="flex items-center gap-3 text-ink/70"><Spinner />{label}</p>
      )}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function Empty({ children, action }) {
  return (
    <div className="mt-6 rounded-[28px] bg-white p-8 text-center text-ink/70">
      <div className="mx-auto max-w-sm break-words">{children}</div>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="mt-6 rounded-[28px] bg-[#F6D9D2] p-6 text-center text-[#7A2410]" role="alert">
      <p className="mx-auto max-w-sm break-words font-semibold">{message}</p>
      {onRetry && <button type="button" onClick={onRetry} className="btn btn-sm mt-3">Try again</button>}
    </div>
  );
}
