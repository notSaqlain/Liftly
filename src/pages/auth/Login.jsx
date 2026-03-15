import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth } from '../../firebase';
import { Loader2 } from 'lucide-react';
import liftlyLogo from '../../assets/liftly_white.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isGoogleAccount, setIsGoogleAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsGoogleAccount(false);
    setLoading(true);
    
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      // Check if this email is registered as a Google-only account
      try {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.includes('google.com') && !methods.includes('password')) {
          setIsGoogleAccount(true);
          setError('Account linked with google. Please use the "Continue with Google" button below.');
        } else {
          setError('Failed to log in. Please check your credentials.');
        }
      } catch {
        setError('Failed to log in. Please check your credentials.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center bg-slate-100 min-h-screen">
      <div className="w-full max-w-[480px] bg-liftly-navy min-h-screen relative flex flex-col justify-center items-center p-6 text-white shadow-2xl overflow-y-auto overflow-x-hidden">
        
        {/* Decorative background elements */}
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-liftly-teal/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[10%] right-[-10%] w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="z-10 w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="inline-block items-center mb-6 mt-4">
              <img src={liftlyLogo} alt="Liftly" className="w-40 h-auto object-contain" />
            </div>
            <p className="text-slate-300 font-medium text-lg">Your personal gym companion</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-xl text-sm text-center">
                {error}
              </div>
            )}
            
            <div>
              <input
                type="email"
                placeholder="Email address"
                required
                className="w-full h-14 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-5 text-white placeholder:text-slate-400 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <input
                type="password"
                placeholder="Password"
                required
                className="w-full h-14 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-5 text-white placeholder:text-slate-400 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <button
              disabled={loading}
              type="submit"
              className="w-full flex items-center justify-center h-14 mt-4 bg-liftly-teal hover:bg-teal-400 text-liftly-navy font-bold text-lg rounded-2xl shadow-[0_4px_14px_0_rgba(0,173,181,0.39)] transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6 gap-3">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          {/* Google Sign In */}
          <button
            onClick={async () => {
              setError('');
              setIsGoogleAccount(false);
              setLoading(true);
              try {
                await loginWithGoogle();
                navigate('/');
              } catch (err) {
                setError('Google sign-in failed: ' + err.message);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-3 h-14 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-base rounded-2xl transition-all active:scale-95 disabled:opacity-70 shadow-sm ${isGoogleAccount ? 'ring-2 ring-liftly-teal animate-pulse' : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="mt-8 text-center pb-8">
            <p className="text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-liftly-teal font-semibold hover:underline p-2">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
