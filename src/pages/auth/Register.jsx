import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';
import liftlyLogo from '../../assets/liftly_white.png';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    weight: '',
    gender: 'Other'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    
    if (!formData.age || !formData.weight) {
      return setError('Please fill in your body metrics');
    }

    setLoading(true);
    
    try {
      await register(formData.email, formData.password, {
        age: formData.age,
        weight: formData.weight,
        gender: formData.gender
      });
      navigate('/');
    } catch (err) {
      setError('Failed to create an account: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center bg-slate-100 min-h-screen">
      <div className="w-full max-w-[480px] bg-liftly-navy min-h-screen relative flex flex-col items-center p-6 text-white shadow-2xl overflow-y-auto overflow-x-hidden">
        
        {/* Decorative background elements */}
        <div className="absolute top-0 right-[-10%] w-64 h-64 bg-liftly-teal/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="fixed bottom-0 left-[-10%] w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="z-10 w-full max-w-sm mt-8 mb-8">
          <div className="text-center mb-8">
             <div className="inline-block items-center mb-4 mt-2">
              <img src={liftlyLogo} alt="Liftly" className="w-32 h-auto object-contain" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Create Account</h1>
            <p className="text-slate-300 mt-2 font-medium">Join Liftly to track your progress</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-xl text-sm text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-liftly-teal uppercase tracking-wider pl-1">Account Info</h2>
              <input
                name="email"
                type="email"
                placeholder="Email address"
                required
                className="w-full h-14 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-5 text-white placeholder:text-slate-400 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal transition-colors"
                value={formData.email}
                onChange={handleChange}
              />
              <input
                name="password"
                type="password"
                placeholder="Password"
                required
                className="w-full h-14 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-5 text-white placeholder:text-slate-400 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal transition-colors"
                value={formData.password}
                onChange={handleChange}
              />
              <input
                name="confirmPassword"
                type="password"
                placeholder="Confirm password"
                required
                className="w-full h-14 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-5 text-white placeholder:text-slate-400 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal transition-colors"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <div className="h-px w-full bg-white/10 my-8"></div>

            <div className="space-y-4">
              <h2 className="text-xs font-bold text-liftly-teal uppercase tracking-wider pl-1">Your Body Profile</h2>
              
              <div className="flex space-x-3">
                <input
                  name="age"
                  type="number"
                  placeholder="Age"
                  required
                  min="12"
                  max="120"
                  className="w-1/2 h-14 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-5 text-white placeholder:text-slate-400 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal transition-colors"
                  value={formData.age}
                  onChange={handleChange}
                />
                <input
                  name="weight"
                  type="number"
                  placeholder="Weight (kg)"
                  required
                  step="0.1"
                  min="20"
                  max="300"
                  className="w-1/2 h-14 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-5 text-white placeholder:text-slate-400 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal transition-colors"
                  value={formData.weight}
                  onChange={handleChange}
                />
              </div>

              <div className="relative">
                <select
                  name="gender"
                  required
                  className="w-full h-14 bg-[#0a1e47] backdrop-blur-md border border-white/10 rounded-2xl px-5 text-white focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal transition-colors appearance-none"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {/* Custom dropdown arrow */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-white">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
            
            <button
              disabled={loading}
              type="submit"
              className="w-full flex items-center justify-center h-14 mt-8 bg-liftly-teal hover:bg-teal-400 text-liftly-navy font-bold text-lg rounded-2xl shadow-[0_4px_14px_0_rgba(0,173,181,0.39)] transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : 'Sign Up'}
            </button>
          </form>

          <div className="mt-8 text-center pb-8">
            <p className="text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-liftly-teal font-semibold hover:underline p-2">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
