import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';
import liftlyLogo from '../../assets/liftly_white.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Failed to log in. Please check your credentials.');
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
            <div className="inline-flex justify-center items-center w-20 h-20 bg-white/10 rounded-3xl backdrop-blur-md border border-white/20 mb-6 shadow-xl mt-4">
              <img src={liftlyLogo} alt="Liftly" className="w-12 h-12 object-contain" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">Liftly</h1>
            <p className="text-slate-300 font-medium">Your personal gym companion</p>
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
