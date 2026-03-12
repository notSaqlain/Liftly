// Layout condiviso per le pagine di auth (Login e Registrazione).
// Il concept e' semplice: sfondo scuro brand, card centrata, logo in alto.
// Mobile-first, ovviamente - su schermi piu' grandi la card si allarga un po'.

import { Link } from "react-router-dom";

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-brand flex flex-col items-center justify-center px-4 py-8">
      {/* Background pattern - un tocco in piu' per non avere un bg piatto */}
      <div className="fixed inset-0 bg-brand overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-brand-light/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Contenuto centrato */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <Link to="/login" className="inline-block">
            <h1 className="text-4xl font-black text-white tracking-tight">
              LIFTLY
            </h1>
            <p className="text-blue-300/60 text-xs font-semibold tracking-[0.3em] uppercase mt-1">
              by DDKS
            </p>
          </Link>
        </div>

        {/* Card principale */}
        <div className="bg-white/[0.07] backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {/* Header della card */}
          {title && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">{title}</h2>
              {subtitle && (
                <p className="text-blue-200/50 text-sm mt-1">{subtitle}</p>
              )}
            </div>
          )}

          {/* Qui ci va il form specifico (login o register) */}
          {children}
        </div>
      </div>
    </div>
  );
}
