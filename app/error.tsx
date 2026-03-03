'use client';

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f8f5f1] p-6 text-center">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-[#8c7b75]">Errore</p>
        <h1 className="font-serif text-3xl">Qualcosa e andato storto</h1>
        <p className="text-sm text-[#6f625e]">{error.message}</p>
        <button
          className="rounded-xl border border-black/15 bg-white px-4 py-2 text-sm"
          onClick={reset}
          type="button"
        >
          Riprova
        </button>
      </div>
    </main>
  );
}
