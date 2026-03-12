// Pagina di Registrazione - due step:
// 1) Dati account (email, password, conferma password)
// 2) Dati biometrici (sesso, eta', peso) come richiesto da RF1
//
// Dopo la registrazione salviamo i dati biometrici su Firestore
// nel documento users/{uid}. Cosi' li abbiamo sempre a portata di mano.

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import AuthLayout from "../components/AuthLayout";
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineArrowRight,
  HiOutlineArrowLeft,
} from "react-icons/hi";

export default function RegisterPage() {
  const navigate = useNavigate();

  // Step corrente del form (1 = account, 2 = biometrics)
  const [step, setStep] = useState(1);

  // Dati del form - step 1
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Dati del form - step 2 (biometrici)
  const [sesso, setSesso] = useState("");
  const [eta, setEta] = useState("");
  const [peso, setPeso] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Valida lo step 1 e passa al 2
  const handleNextStep = (e) => {
    e.preventDefault();
    setError("");

    // Check che le password coincidano
    if (password !== confirmPassword) {
      setError("Le password non coincidono.");
      return;
    }

    // Check lunghezza minima password
    if (password.length < 6) {
      setError("La password deve avere almeno 6 caratteri.");
      return;
    }

    setStep(2);
  };

  // Gestisce la registrazione vera e propria (step 2 submit)
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    // Validazione base dei campi biometrici
    if (!sesso || !eta || !peso) {
      setError("Compila tutti i campi per continuare.");
      return;
    }

    setLoading(true);

    try {
      // Creiamo l'utente su Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Salviamo i dati biometrici su Firestore
      // Il documento ha come ID lo uid dell'utente, cosi' e' facile da recuperare
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: email,
        sesso: sesso,
        eta: parseInt(eta),
        peso: parseFloat(peso),
        createdAt: new Date().toISOString(),
      });

      // Registrazione completata, redirect alla home
      navigate("/");
    } catch (err) {
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("Questa email e' gia' registrata.");
          setStep(1); // torniamo allo step 1 per l'email
          break;
        case "auth/invalid-email":
          setError("Email non valida.");
          setStep(1);
          break;
        default:
          setError("Errore durante la registrazione. Riprova.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={step === 1 ? "Crea il tuo account" : "Parlaci di te"}
      subtitle={
        step === 1
          ? "Inizia a tracciare i tuoi progressi"
          : "Questi dati ci aiutano a personalizzare la tua esperienza"
      }
    >
      {/* Indicatore step - quei pallini che mostrano a che punto sei */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${
            step === 1 ? "w-8 bg-accent" : "w-4 bg-white/20"
          }`}
        />
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${
            step === 2 ? "w-8 bg-accent" : "w-4 bg-white/20"
          }`}
        />
      </div>

      {/* Messaggio di errore */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      {/* -- STEP 1: Dati Account -- */}
      {step === 1 && (
        <form onSubmit={handleNextStep} className="space-y-4">
          {/* Email */}
          <div className="relative">
            <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300/40 text-lg" />
            <input
              id="register-email"
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

          {/* Password */}
          <div className="relative">
            <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300/40 text-lg" />
            <input
              id="register-password"
              type="password"
              placeholder="Password (min. 6 caratteri)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-white/[0.06] border border-white/10 text-white placeholder-blue-200/30 
                         rounded-xl py-3.5 pl-12 pr-4 text-sm
                         focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30
                         transition-all duration-200"
            />
          </div>

          {/* Conferma Password */}
          <div className="relative">
            <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300/40 text-lg" />
            <input
              id="register-confirm-password"
              type="password"
              placeholder="Conferma password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-white/[0.06] border border-white/10 text-white placeholder-blue-200/30 
                         rounded-xl py-3.5 pl-12 pr-4 text-sm
                         focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30
                         transition-all duration-200"
            />
          </div>

          {/* Bottone avanti */}
          <button
            id="register-next"
            type="submit"
            className="w-full bg-accent hover:bg-accent/90 text-white font-semibold py-3.5 rounded-xl
                       flex items-center justify-center gap-2 text-sm
                       transition-all duration-200
                       shadow-lg shadow-accent/20 hover:shadow-accent/30
                       cursor-pointer"
          >
            Avanti
            <HiOutlineArrowRight className="text-lg" />
          </button>

          {/* Link al login */}
          <p className="text-center text-blue-200/40 text-sm pt-2">
            Hai gia' un account?{" "}
            <Link
              to="/login"
              className="text-accent hover:text-accent/80 font-semibold transition-colors"
            >
              Accedi
            </Link>
          </p>
        </form>
      )}

      {/* -- STEP 2: Dati Biometrici -- */}
      {step === 2 && (
        <form onSubmit={handleRegister} className="space-y-4">
          {/* Sesso */}
          <div>
            <label className="block text-blue-200/50 text-xs font-semibold mb-2 uppercase tracking-wider">
              Sesso
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSesso("M")}
                className={`py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  sesso === "M"
                    ? "bg-accent text-white shadow-lg shadow-accent/20"
                    : "bg-white/[0.06] border border-white/10 text-white/60 hover:border-white/20"
                }`}
              >
                Maschio
              </button>
              <button
                type="button"
                onClick={() => setSesso("F")}
                className={`py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  sesso === "F"
                    ? "bg-accent text-white shadow-lg shadow-accent/20"
                    : "bg-white/[0.06] border border-white/10 text-white/60 hover:border-white/20"
                }`}
              >
                Femmina
              </button>
            </div>
          </div>

          {/* Eta' */}
          <div>
            <label
              htmlFor="register-eta"
              className="block text-blue-200/50 text-xs font-semibold mb-2 uppercase tracking-wider"
            >
              Eta'
            </label>
            <input
              id="register-eta"
              type="number"
              placeholder="Es. 22"
              value={eta}
              onChange={(e) => setEta(e.target.value)}
              min="14"
              max="99"
              required
              className="w-full bg-white/[0.06] border border-white/10 text-white placeholder-blue-200/30 
                         rounded-xl py-3.5 px-4 text-sm
                         focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30
                         transition-all duration-200"
            />
          </div>

          {/* Peso */}
          <div>
            <label
              htmlFor="register-peso"
              className="block text-blue-200/50 text-xs font-semibold mb-2 uppercase tracking-wider"
            >
              Peso (kg)
            </label>
            <input
              id="register-peso"
              type="number"
              placeholder="Es. 75"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              min="30"
              max="300"
              step="0.1"
              required
              className="w-full bg-white/[0.06] border border-white/10 text-white placeholder-blue-200/30 
                         rounded-xl py-3.5 px-4 text-sm
                         focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30
                         transition-all duration-200"
            />
          </div>

          {/* Bottoni (indietro + registrati) */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="bg-white/[0.06] border border-white/10 text-white/60 hover:border-white/20 
                         font-semibold py-3.5 px-4 rounded-xl
                         flex items-center justify-center gap-1 text-sm
                         transition-all duration-200
                         cursor-pointer"
            >
              <HiOutlineArrowLeft className="text-lg" />
            </button>

            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="flex-1 bg-accent hover:bg-accent/90 text-white font-semibold py-3.5 rounded-xl
                         flex items-center justify-center gap-2 text-sm
                         transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-lg shadow-accent/20 hover:shadow-accent/30
                         cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Registrati
                  <HiOutlineArrowRight className="text-lg" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
