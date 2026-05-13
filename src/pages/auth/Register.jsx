import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Eye, EyeOff, Mail, CheckCircle2 } from 'lucide-react';
import liftlyLogo from '../../assets/liftly_white.png';

const Register = () => {
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match');
    if (formData.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(formData.email, formData.password);
      // Show verification sent screen instead of navigating immediately
      setVerificationSent(true);
    } catch (err) {
      setError(err.message.includes('email-already-in-use') ? 'An account with this email already exists.' : 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/onboarding');
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled.');
      } else {
        setError(`Google sign-in failed: ${err.message || err.code || 'Please try again.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Verification sent screen ──────────────────────────────────────────────
  if (verificationSent) {
    return (
      <div className="flex justify-center bg-slate-900 min-h-screen">
        <div className="w-full max-w-[480px] min-h-screen relative flex flex-col items-center p-6 overflow-y-auto overflow-x-hidden"
          style={{ background: 'linear-gradient(160deg, #001540 0%, #001c5e 60%, #002280 100%)' }}>

          <div className="fixed top-[-15%] right-[-15%] w-72 h-72 bg-liftly-teal/20 rounded-full blur-[80px] pointer-events-none" />
          <div className="fixed bottom-[-10%] left-[-15%] w-60 h-60 bg-blue-600/20 rounded-full blur-[80px] pointer-events-none" />

          <div className="z-10 w-full max-w-sm mt-24 mb-10 animate-slide-up text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-3xl bg-liftly-teal/15 border border-liftly-teal/30 flex items-center justify-center">
                <Mail size={36} className="text-liftly-teal" />
              </div>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mb-3">Check your inbox</h1>
            <p className="text-white/50 text-sm font-medium leading-relaxed mb-2">
              We've sent a verification link to
            </p>
            <p className="text-liftly-teal font-black text-sm mb-6 break-all">{formData.email}</p>
            <p className="text-white/40 text-xs font-medium leading-relaxed mb-8">
              Click the link in the email to verify your account, then sign in to complete your profile setup.
            </p>

            <Link
              to="/login"
              className="w-full flex items-center justify-center h-14 font-black text-liftly-navy text-base rounded-2xl shadow-teal-lg transition-all active:scale-95 mb-4"
              style={{ background: 'linear-gradient(135deg, #00ADB5 0%, #33c4cb 100%)' }}
            >
              Go to Sign In →
            </Link>
            <p className="text-white/30 text-xs font-medium">
              Didn't receive it? Check your spam folder.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Main register form ────────────────────────────────────────────────────
  return (
    <div className="flex justify-center bg-slate-900 min-h-screen">
      <div className="w-full max-w-[480px] min-h-screen relative flex flex-col items-center p-6 overflow-y-auto overflow-x-hidden"
        style={{ background: 'linear-gradient(160deg, #001540 0%, #001c5e 60%, #002280 100%)' }}>

        {/* Animated orbs */}
        <div className="fixed top-[-15%] right-[-15%] w-72 h-72 bg-liftly-teal/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="fixed bottom-[-10%] left-[-15%] w-60 h-60 bg-blue-600/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />

        <div className="z-10 w-full max-w-sm mt-10 mb-10 animate-slide-up">
          {/* Header */}
          <div className="text-center mb-8">
            <img src={liftlyLogo} alt="Liftly" className="w-32 h-auto mx-auto mb-5 object-contain" />
            <h1 className="text-3xl font-black text-white tracking-tight">Create Account</h1>
            <p className="text-white/40 mt-1 font-medium">Join Liftly and start your journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="bg-red-500/15 border border-red-500/30 text-red-300 p-3.5 rounded-2xl text-sm text-center font-medium">
                {error}
              </div>
            )}

            <input
              name="email" type="email" placeholder="Email address" required
              className="w-full h-14 bg-white/8 border border-white/12 rounded-2xl px-5 text-white placeholder:text-white/30 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal transition-all text-sm font-medium"
              value={formData.email} onChange={handleChange}
            />

            <div className="relative">
              <input
                name="password" type={showPass ? 'text' : 'password'} placeholder="Password (min. 6 characters)" required
                className="w-full h-14 bg-white/8 border border-white/12 rounded-2xl px-5 pr-12 text-white placeholder:text-white/30 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal transition-all text-sm font-medium"
                value={formData.password} onChange={handleChange}
              />
              <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <input
              name="confirmPassword" type={showPass ? 'text' : 'password'} placeholder="Confirm password" required
              className="w-full h-14 bg-white/8 border border-white/12 rounded-2xl px-5 text-white placeholder:text-white/30 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal transition-all text-sm font-medium"
              value={formData.confirmPassword} onChange={handleChange}
            />

            <button
              disabled={loading} type="submit"
              className="w-full flex items-center justify-center h-14 mt-3 font-black text-liftly-navy text-base rounded-2xl shadow-teal-lg transition-all active:scale-95 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #00ADB5 0%, #33c4cb 100%)' }}
            >
              {loading ? <Loader2 className="animate-spin" size={22} /> : 'Create Account →'}
            </button>
          </form>

          <div className="flex items-center my-6 gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs font-bold uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button
            onClick={handleGoogle} disabled={loading}
            className="w-full flex items-center justify-center gap-3 h-14 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-2xl transition-all active:scale-95 disabled:opacity-60 shadow-sm"
          >
            <GoogleIcon /> Continue with Google
          </button>

          <div className="mt-8 text-center pb-6">
            <p className="text-white/40 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-liftly-teal font-bold hover:text-liftly-teal-light transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default Register;
