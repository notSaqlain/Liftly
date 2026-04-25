import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2, ArrowRight, ArrowLeft, User, Ruler, Target } from 'lucide-react';
import liftlyLogo from '../../assets/liftly_white.png';

const STEPS = [
  { id: 1, title: 'Tell us about you', subtitle: 'Basic personal info', icon: User },
  { id: 2, title: 'Your body metrics', subtitle: 'For accurate calculations', icon: Ruler },
  { id: 3, title: 'Your fitness goals', subtitle: 'Help us tailor your experience', icon: Target },
];

const inputClass = "w-full h-13 bg-white/8 border border-white/12 rounded-2xl px-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal transition-all font-medium";
const selectClass = "w-full h-13 bg-[#001540] border border-white/12 rounded-2xl px-4 text-sm text-white focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal transition-all font-medium appearance-none";
const labelClass = "text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 block";

const Onboarding = () => {
  const { currentUser, updateUserProfile, updateDisplayName } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');

  // Step 2
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  // Step 3
  const [trainingDays, setTrainingDays] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [goal, setGoal] = useState('');

  const validateStep = () => {
    if (step === 1) {
      if (!firstName || !lastName || !age || !sex) { setError('Please fill in all fields.'); return false; }
    }
    if (step === 2) {
      if (!weight || !height) { setError('Please enter your weight and height.'); return false; }
    }
    if (step === 3) {
      if (!trainingDays || !experienceLevel || !goal) { setError('Please fill in all fields.'); return false; }
    }
    setError('');
    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setStep(s => s + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    setLoading(true);
    try {
      const displayName = `${firstName} ${lastName}`.trim();
      if (displayName) await updateDisplayName(displayName);
      await updateUserProfile(currentUser.uid, {
        firstName, lastName,
        age: parseInt(age, 10),
        gender: sex,
        weight: parseFloat(weight),
        height: parseFloat(height),
        trainingDays: parseInt(trainingDays, 10),
        experienceLevel,
        fitnessGoal: goal,
        onboardingComplete: true
      });
      navigate('/');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center bg-slate-900 min-h-screen">
      <div
        className="w-full max-w-[480px] min-h-screen relative flex flex-col overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #001540 0%, #001c5e 60%, #002280 100%)' }}
      >
        {/* Background orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-liftly-teal/15 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />

        {/* Header */}
        <div className="px-6 pt-12 pb-6 relative z-10 shrink-0">
          <img src={liftlyLogo} alt="Liftly" className="h-7 mb-6" />

          {/* Progress bar */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/40 text-xs font-bold uppercase tracking-widest">Step {step} of {STEPS.length}</span>
              <span className="text-liftly-teal text-xs font-black">{Math.round((step / STEPS.length) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-liftly-teal rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(step / STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight">{STEPS[step - 1].title}</h1>
          <p className="text-white/40 text-sm font-medium mt-1">{STEPS[step - 1].subtitle}</p>
        </div>

        {/* Form content */}
        <div className="flex-1 overflow-y-auto px-6 pb-8 relative z-10 no-scrollbar">
          {error && (
            <div className="bg-red-500/15 border border-red-500/30 text-red-300 p-3 rounded-2xl text-sm mb-4 font-medium">
              {error}
            </div>
          )}

          <div className="animate-fade-in">

            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>First Name</label>
                    <input type="text" placeholder="John" className={inputClass} value={firstName} onChange={e => setFirstName(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Last Name</label>
                    <input type="text" placeholder="Doe" className={inputClass} value={lastName} onChange={e => setLastName(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Age</label>
                    <input type="number" placeholder="25" min="12" max="120" className={inputClass} value={age} onChange={e => setAge(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Sex</label>
                    <select className={selectClass} value={sex} onChange={e => setSex(e.target.value)}>
                      <option value="" disabled>Select…</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Gay">Gay</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Body Metrics */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Weight (kg)</label>
                    <input type="number" step="0.1" placeholder="75" min="20" className={inputClass} value={weight} onChange={e => setWeight(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Height (cm)</label>
                    <input type="number" placeholder="175" min="100" max="250" className={inputClass} value={height} onChange={e => setHeight(e.target.value)} />
                  </div>
                </div>

                {/* BMI Preview */}
                {weight && height && (
                  <div className="bg-white/8 border border-white/10 rounded-2xl p-4 mt-2">
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Your BMI</p>
                    <p className="text-liftly-teal font-black text-2xl">
                      {(parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2)).toFixed(1)}
                    </p>
                    <p className="text-white/30 text-xs font-medium mt-0.5">This will help tailor your experience</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Goals */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Training Frequency</label>
                  <select className={selectClass} value={trainingDays} onChange={e => setTrainingDays(e.target.value)}>
                    <option value="" disabled>Days per week…</option>
                    {['1','2','3','4','5','6','7'].map(d => (
                      <option key={d} value={d}>{d === '7' ? 'Every day' : `${d} day${d > 1 ? 's' : ''}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Experience Level</label>
                  <select className={selectClass} value={experienceLevel} onChange={e => setExperienceLevel(e.target.value)}>
                    <option value="" disabled>Select level…</option>
                    <option value="Beginner">Beginner (0–1 year)</option>
                    <option value="Intermediate">Intermediate (1–3 years)</option>
                    <option value="Advanced">Advanced (3+ years)</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Primary Goal</label>
                  <select className={selectClass} value={goal} onChange={e => setGoal(e.target.value)}>
                    <option value="" disabled>What do you want to achieve?</option>
                    <option value="Lose Weight">Lose Weight</option>
                    <option value="Maintain Weight">Maintain Weight</option>
                    <option value="Gain Muscle">Gain Muscle</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="h-14 px-5 bg-white/8 border border-white/12 text-white font-bold rounded-2xl flex items-center gap-2 active:scale-95 transition-all"
              >
                <ArrowLeft size={18} />
              </button>
            )}

            {step < STEPS.length ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 h-14 font-black text-liftly-navy text-base rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-teal-lg"
                style={{ background: 'linear-gradient(135deg, #00ADB5 0%, #33c4cb 100%)' }}
              >
                Continue <ArrowRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 h-14 font-black text-liftly-navy text-base rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-teal-lg disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #00ADB5 0%, #33c4cb 100%)' }}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <><span>Let's Lift! 🏋️</span></>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
