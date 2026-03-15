import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2, ArrowRight } from 'lucide-react';
import liftlyLogo from '../../assets/liftly_white.png';

const Onboarding = () => {
  const { currentUser, updateUserProfile, updateDisplayName } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [trainingDays, setTrainingDays] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [goal, setGoal] = useState('');
  const [goalPace, setGoalPace] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!firstName || !lastName || !age || !sex || !weight || !height || !trainingDays || !experienceLevel || !goal) {
      setError('Please fill in all fields to continue.');
      return;
    }

    setLoading(true);
    try {
      const displayName = `${firstName} ${lastName}`.trim();
      if (displayName) await updateDisplayName(displayName);

      await updateUserProfile(currentUser.uid, {
        firstName,
        lastName,
        age: parseInt(age, 10),
        gender: sex,
        weight: parseFloat(weight),
        height: parseFloat(height),
        trainingDays: parseInt(trainingDays, 10),
        experienceLevel,
        fitnessGoal: goal,
        onboardingComplete: true
      });

      // Redirect happens automatically via ProtectedRoute since onboardingComplete is now true
      navigate('/');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const inputClass = "w-full h-12 bg-white/10 border border-white/20 rounded-xl px-4 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal transition-all";
  const selectClass = "w-full h-12 bg-[#001c55] border border-white/20 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal transition-all appearance-none";
  const labelClass = "text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5 block";

  return (
    <div className="flex justify-center bg-slate-100 min-h-screen">
      <div className="w-full max-w-[480px] bg-liftly-navy min-h-screen flex flex-col items-center justify-start shadow-2xl relative overflow-hidden overflow-y-auto">
        
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-liftly-teal/10 rounded-full blur-[80px] -mr-40 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[60px] -ml-20 -mb-20 pointer-events-none"></div>

        <div className="w-full px-8 py-10 z-10 relative flex flex-col min-h-full">
          {/* Logo & Header */}
          <div className="flex flex-col items-start mb-8">
            <img src={liftlyLogo} alt="Liftly" className="h-8 mb-6" />
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">Welcome to Liftly.</h1>
            <p className="text-blue-100/70 text-sm font-medium">Let's set up your profile to tailor your experience.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-200 text-sm p-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <div className="w-1/2">
                <label className={labelClass}>First Name</label>
                <input type="text" placeholder="John" className={inputClass} value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div className="w-1/2">
                <label className={labelClass}>Last Name</label>
                <input type="text" placeholder="Doe" className={inputClass} value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-1/2">
                <label className={labelClass}>Age</label>
                <input type="number" placeholder="25" min="12" max="120" className={inputClass} value={age} onChange={e => setAge(e.target.value)} />
              </div>
              <div className="w-1/2">
                <label className={labelClass}>Sex</label>
                <select className={selectClass} value={sex} onChange={e => setSex(e.target.value)}>
                  <option value="" disabled>Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Gay">Gay</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-1/2">
                <label className={labelClass}>Weight (kg)</label>
                <input type="number" step="0.1" placeholder="75" min="20" className={inputClass} value={weight} onChange={e => setWeight(e.target.value)} />
              </div>
              <div className="w-1/2">
                <label className={labelClass}>Height (cm)</label>
                <input type="number" placeholder="175" min="100" max="250" className={inputClass} value={height} onChange={e => setHeight(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-1/2">
                <label className={labelClass}>Training Frequency</label>
                <select className={selectClass} value={trainingDays} onChange={e => setTrainingDays(e.target.value)}>
                  <option value="" disabled>Days/week...</option>
                  <option value="1">1 day</option>
                  <option value="2">2 days</option>
                  <option value="3">3 days</option>
                  <option value="4">4 days</option>
                  <option value="5">5 days</option>
                  <option value="6">6 days</option>
                  <option value="7">Everyday</option>
                </select>
              </div>
              <div className="w-1/2">
                <label className={labelClass}>Experience Level</label>
                <select className={selectClass} value={experienceLevel} onChange={e => setExperienceLevel(e.target.value)}>
                  <option value="" disabled>Select level...</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Primary Goal</label>
              <select className={selectClass} value={goal} onChange={e => {
                setGoal(e.target.value);
              }}>
                <option value="" disabled>Select your goal...</option>
                <option value="Lose Weight (Caloric Deficit)">Lose Weight (Caloric Deficit)</option>
                <option value="Maintain Weight">Maintain Weight</option>
                <option value="Gain Muscle (Caloric Surplus)">Gain Muscle (Caloric Surplus)</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="mt-6 w-full h-14 bg-liftly-teal hover:bg-teal-400 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 shadow-[0_4px_20px_0_rgba(0,173,181,0.3)] hover:shadow-[0_4px_25px_0_rgba(0,173,181,0.5)]"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>Complete Setup</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
