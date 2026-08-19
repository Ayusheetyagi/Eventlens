export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-[2rem] bg-cream-50 p-10 text-center shadow-clay ">
      <p className="text-ink">Something went wrong generating your dashboard.</p>
      <p className="text-sm text-ink-soft">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-cream-50 hover:bg-sage-700"
      >
        Try again
      </button>
    </div>
  );
}
