import { useState } from 'react';

/**
 * Mostra la GIF di dimostrazione dell'esercizio.
 * Le GIF sono ora file pubblici su GitHub, nessuna autenticazione necessaria.
 * In caso di errore di caricamento, mostra il fallback CSS animato.
 */
const ExerciseGif = ({ gifUrl, theme }) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // ── Nessun URL disponibile → fallback immediato ──
  if (!gifUrl) {
    return <FallbackCard theme={theme} />;
  }

  // ── GIF non caricabile (errore di rete, 404, ecc.) → fallback ──
  if (failed) {
    return <FallbackCard theme={theme} />;
  }

  return (
    <div
      className={`w-full rounded-3xl border ${theme.ring} overflow-hidden bg-white relative`}
      style={{ aspectRatio: '4/3' }}
    >
      {/* Placeholder mentre la GIF si carica */}
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white z-10">
          <div className="text-5xl animate-pulse">{theme.emoji}</div>
          <p className="text-slate-400 text-xs font-semibold">Caricamento GIF…</p>
        </div>
      )}

      <img
        src={gifUrl}
        alt="Dimostrazione esercizio"
        className={`w-full h-full object-contain transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </div>
  );
};

// Card CSS animata usata come fallback
const FallbackCard = ({ theme }) => (
  <div
    className={`w-full rounded-3xl border ${theme.ring} bg-gradient-to-br ${theme.gradient} relative overflow-hidden`}
    style={{ minHeight: '200px' }}
  >
    <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-10 animate-pulse" style={{ background: theme.accent }} />
    <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full opacity-10 animate-pulse" style={{ background: theme.accent, animationDelay: '1s' }} />
    <div className="relative z-10 flex flex-col items-center justify-center p-10 text-center gap-3" style={{ minHeight: '200px' }}>
      <div className="text-7xl animate-bounce" style={{ animationDuration: '2s' }}>
        {theme.emoji}
      </div>
      <p className="text-white/40 text-xs font-semibold">Anteprima non disponibile</p>
    </div>
  </div>
);

export default ExerciseGif;
