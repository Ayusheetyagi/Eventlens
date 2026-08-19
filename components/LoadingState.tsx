export function LoadingState({ city }: { city: string }) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-[2rem] bg-cream-50 p-10 text-center shadow-clay ">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-sage-100 border-t-sage-500" />
      <p className="text-ink">
        Searching live listings for <span className="font-semibold">{city}</span>… this can take up
        to a minute.
      </p>
    </div>
  );
}
