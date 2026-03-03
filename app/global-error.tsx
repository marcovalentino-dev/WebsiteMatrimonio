'use client';

export default function GlobalError() {
  return (
    <html lang="it">
      <body>
        <main className="grid min-h-screen place-items-center bg-[#f8f5f1] p-6 text-center">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-[#8c7b75]">Errore Critico</p>
            <h1 className="font-serif text-3xl">Applicazione non disponibile</h1>
            <p className="text-sm text-[#6f625e]">Ricarica la pagina tra qualche secondo.</p>
          </div>
        </main>
      </body>
    </html>
  );
}
