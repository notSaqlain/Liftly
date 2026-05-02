import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ChevronLeft, CreditCard, ShieldCheck, CheckCircle2, Loader2, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MyPlan = () => {
  const { currentUser, userData, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [licenseCode, setLicenseCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const hasPlan = !!userData?.licenseCode;
  const isExpired = userData?.expiresAt ? new Date(userData.expiresAt) < new Date() : false;
  
  const daysRemaining = userData?.expiresAt ? 
    Math.max(0, Math.ceil((new Date(userData.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))) 
    : 0;

  const handleActivate = async (e) => {
    e.preventDefault();
    if (!licenseCode.trim()) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const docRef = doc(db, 'licenses', licenseCode.trim());
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setError('Invalid license code. Please try again.');
        setLoading(false);
        return;
      }

      const licenseData = docSnap.data();
      
      // Update user document with license info
      await updateUserProfile(currentUser.uid, {
        licenseCode: licenseData.code,
        planName: licenseData.planName,
        gymName: licenseData.gymName,
        expiresAt: licenseData.expiresAt?.toDate ? licenseData.expiresAt.toDate().toISOString() : licenseData.expiresAt,
        features: licenseData.features || [],
        gymId: licenseData.gymId || userData?.gymId || 'gym_placeholder' // Optional: if license implies a gym
      });

      setSuccess('Plan activated successfully!');
      setLicenseCode('');
    } catch (err) {
      console.error('Error activating license:', err);
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col animate-fade-in pb-20">
      <div className="bg-liftly-navy px-6 pt-12 pb-6 relative overflow-hidden shrink-0 shadow-navy">
        <div className="absolute top-0 right-0 w-48 h-48 bg-liftly-teal/15 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/15 rounded-full blur-2xl -ml-10 -mb-10" />

        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all backdrop-blur-sm shrink-0">
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CreditCard size={14} className="text-liftly-teal" />
              <span className="text-liftly-teal text-[10px] font-black uppercase tracking-widest">Membership</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">My Plan</h1>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl flex items-center gap-3 animate-slide-up">
            <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
            <p className="font-bold text-sm">{success}</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl font-bold text-sm animate-slide-up">
            {error}
          </div>
        )}

        {hasPlan ? (
          <div className="relative overflow-hidden rounded-3xl p-6 shadow-2xl animate-scale-in"
               style={{ background: '#0D1526' }}>
            <div className="absolute inset-0 rounded-3xl border-2 pointer-events-none"
                 style={{ borderImage: 'linear-gradient(135deg, #00E5D1, #7C6EF5) 1', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', padding: '2px' }} />
            
            <div className="absolute top-0 right-0 w-40 h-40 bg-liftly-teal/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
            
            <div className="relative z-10 flex justify-between items-start mb-6">
              <div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-3 ${isExpired ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {isExpired ? 'Expired' : 'Active Plan'}
                </span>
                <h2 className="text-2xl font-black text-white">{userData.planName}</h2>
                <p className="text-slate-400 text-sm mt-1">{userData.gymName}</p>
              </div>
              <ShieldCheck size={32} className="text-liftly-teal opacity-50" />
            </div>

            <div className="space-y-4 mb-6">
              {userData.features?.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-liftly-teal" />
                  <span className="text-slate-300 text-sm font-medium">{feature}</span>
                </div>
              ))}
            </div>

            <div className="pt-5 border-t border-white/10 flex justify-between items-center">
              <div>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Expires On</p>
                <p className="text-white font-bold">{userData.expiresAt ? new Date(userData.expiresAt).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Days Left</p>
                <p className={`font-black text-xl ${isExpired ? 'text-red-400' : 'text-liftly-teal'}`}>{daysRemaining}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 shadow-card border border-slate-100 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
              <CreditCard size={32} className="text-slate-300" />
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-2">No Active Plan</h2>
            <p className="text-slate-500 text-sm mb-0">Enter your gym license code below to unlock premium features.</p>
          </div>
        )}

        <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100">
          <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
            <Key size={18} className="text-liftly-teal" /> {hasPlan ? 'Update License' : 'Activate License'}
          </h3>
          <form onSubmit={handleActivate} className="flex gap-2">
            <input
              type="text"
              value={licenseCode}
              onChange={(e) => setLicenseCode(e.target.value)}
              placeholder="Enter license code..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 font-bold text-sm text-slate-900 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal"
              required
            />
            <button
              type="submit"
              disabled={loading || !licenseCode.trim()}
              className="px-6 py-3.5 bg-liftly-navy text-white font-black rounded-2xl shadow-navy active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Activate'}
            </button>
          </form>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-4 text-center">
            Ask your gym reception for a code
          </p>
        </div>
      </div>
    </div>
  );
};

export default MyPlan;
