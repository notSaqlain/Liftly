// Pagina di Login - il primo punto di contatto dell'utente con Liftly.
// Form semplice: email + password, bottone accedi, link alla registrazione.
// La logica Firebase e' gestita direttamente qui dentro per ora.

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase";
import AuthLayout from "../components/AuthLayout";
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineArrowRight } from "react-icons/hi";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Gestisce il submit del form di login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Login riuscito - per ora navighiamo semplicemente alla home
      // (la creeremo nei prossimi task)
      navigate("/");
    } catch (err) {
      // Traduciamo gli errori Firebase in messaggi comprensibili
      switch (err.code) {
        case "auth/user-not-found":
        case "auth/invalid-credential":
          setError("Email o password non corretti.");
          break;
        case "auth/too-many-requests":
          setError("Troppi tentativi. Riprova tra qualche minuto.");
          break;
        default:
          setError("Qualcosa e' andato storto. Riprova.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Bentornato"
      subtitle="Accedi per continuare il tuo percorso"
    >
      <form onSubmit={handleLogin} className="space-y-4">
        {/* Messaggio di errore */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Campo Email */}
        <div className="relative">
          <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300/40 text-lg" />
          <input
            id="login-email"
            type="email"
            placeholder="La tua email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-white/[0.06] border border-white/10 text-white placeholder-blue-200/30 
                       rounded-xl py-3.5 pl-12 pr-4 text-sm
                       focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30
                       transition-all duration-200"
          />
        </div>

        {/* Campo Password */}
        <div className="relative">
          <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300/40 text-lg" />
          <input
            id="login-password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-white/[0.06] border border-white/10 text-white placeholder-blue-200/30 
                       rounded-xl py-3.5 pl-12 pr-4 text-sm
                       focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30
                       transition-all duration-200"
          />
        </div>

        {/* Bottone di login */}
        <button
          id="login-submit"
          type="submit"
          disabled={loading}
          className="w-full bg-accent hover:bg-accent/90 text-white font-semibold py-3.5 rounded-xl
                     flex items-center justify-center gap-2 text-sm
                     transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                     shadow-lg shadow-accent/20 hover:shadow-accent/30
                     cursor-pointer"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Accedi
              <HiOutlineArrowRight className="text-lg" />
            </>
          )}
        </button>

        {/* Link alla registrazione */}
        <p className="text-center text-blue-200/40 text-sm pt-2">
          Non hai un account?{" "}
          <Link
            to="/register"
            className="text-accent hover:text-accent/80 font-semibold transition-colors"
          >
            Registrati
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
