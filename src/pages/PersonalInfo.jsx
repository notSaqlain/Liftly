import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Save, Loader2, User, Ruler, Weight, Calendar, Dumbbell, Target, TrendingUp, Heart, Clock } from 'lucide-react';

const inputClass = "w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-sm text-slate-800 font-semibold focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal transition-all";
const selectClass = "w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-sm text-slate-800 font-semibold focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal transition-all appearance-none";
const labelClass = "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1";

const PersonalInfo = () => {
  const { currentUser, getUserData, updateUserProfile, updateDisplayName } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Basic info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Other');

  // Body metrics
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');

  // Training profile
  const [trainingDays, setTrainingDays] = useState('');
  const [sessionDuration, setSessionDuration] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Beginner');
  const [fitnessGoal, setFitnessGoal] = useState('General Fitness');
  const [trainingStyle, setTrainingStyle] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      try {
        const data = await getUserData(currentUser.uid);
        if (data) {
          setFirstName(data.firstName || '');
          setLastName(data.lastName || '');
          setAge(data.age?.toString() || '');
          setGender(data.gender || 'Other');
          setWeight(data.weight?.toString() || '');
          setHeight(data.height?.toString() || '');
          setBodyFat(data.bodyFat?.toString() || '');
          setTrainingDays(data.trainingDays?.toString() || '');
          setSessionDuration(data.sessionDuration?.toString() || '');
          setExperienceLevel(data.experienceLevel || 'Beginner');
          setFitnessGoal(data.fitnessGoal || 'General Fitness');
          setTrainingStyle(data.trainingStyle || '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser, getUserData]);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserProfile(currentUser.uid, {
        firstName,
        lastName,
        age: parseInt(age, 10) || 0,
        gender,
        weight: parseFloat(weight) || 0,
        height: parseFloat(height) || 0,
        bodyFat: parseFloat(bodyFat) || 0,
        trainingDays: parseInt(trainingDays, 10) || 0,
        sessionDuration: parseInt(sessionDuration, 10) || 0,
        experienceLevel,
        fitnessGoal,
        trainingStyle,
      });
      const displayName = `${firstName} ${lastName}`.trim();
      if (displayName) await updateDisplayName(displayName);
      showMessage('Personal information saved!');
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-6 h-[80vh]">
        <Loader2 className="text-liftly-teal w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-full flex flex-col animate-fade-in">
      {/* Toast */}
      {message.text && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-[420px] w-[90%] px-4 py-3 rounded-2xl text-sm font-bold text-center shadow-lg animate-slide-up ${
          message.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
        }`}>{message.text}</div>
      )}

      {/* Header */}
      <div className="bg-liftly-navy px-5 pt-12 pb-6 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-liftly-teal/15 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -ml-10 -mb-10" />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all backdrop-blur-sm shrink-0">
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <User size={14} className="text-liftly-teal" />
              <span className="text-liftly-teal text-[10px] font-black uppercase tracking-widest">Profile Data</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">Personal Info</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-24 space-y-4">

        {/* ─── Basic Information ─── */}
        <SectionCard title="Basic Information" icon={<User size={18} />} iconBg="bg-blue-50 text-blue-500">
          <div className="flex gap-3">
            <div className="w-1/2">
              <label className={labelClass}>First Name</label>
              <input type="text" placeholder="John" className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="w-1/2">
              <label className={labelClass}>Last Name</label>
              <input type="text" placeholder="Doe" className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 mt-3">
            <div className="w-1/2">
              <label className={labelClass}>Age</label>
              <div className="relative">
                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" placeholder="25" min="12" max="120" className={`${inputClass} pl-12`} value={age} onChange={(e) => setAge(e.target.value)} />
              </div>
            </div>
            <div className="w-1/2">
              <label className={labelClass}>Gender</label>
              <select className={selectClass} value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </SectionCard>

        {/* ─── Body Metrics ─── */}
        <SectionCard title="Body Metrics" icon={<Ruler size={18} />} iconBg="bg-emerald-50 text-emerald-500">
          <div className="flex gap-3">
            <div className="w-1/2">
              <label className={labelClass}>Weight (kg)</label>
              <div className="relative">
                <Weight size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" placeholder="75" step="0.1" min="20" max="300" className={`${inputClass} pl-12`} value={weight} onChange={(e) => setWeight(e.target.value)} />
              </div>
            </div>
            <div className="w-1/2">
              <label className={labelClass}>Height (cm)</label>
              <div className="relative">
                <Ruler size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" placeholder="175" min="100" max="250" className={`${inputClass} pl-12`} value={height} onChange={(e) => setHeight(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="mt-3">
            <label className={labelClass}>Body Fat % <span className="font-medium lowercase text-[9px]">(optional)</span></label>
            <div className="relative">
              <Heart size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="number" placeholder="15" step="0.1" min="3" max="60" className={`${inputClass} pl-12`} value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} />
            </div>
          </div>
        </SectionCard>

        {/* ─── Training Profile ─── */}
        <SectionCard title="Training Profile" icon={<Dumbbell size={18} />} iconBg="bg-orange-50 text-orange-500">
          <div className="flex gap-3">
            <div className="w-1/2">
              <label className={labelClass}>Days/Week</label>
              <div className="relative">
                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" placeholder="4" min="1" max="7" className={`${inputClass} pl-12`} value={trainingDays} onChange={(e) => setTrainingDays(e.target.value)} />
              </div>
            </div>
            <div className="w-1/2">
              <label className={labelClass}>Session (min)</label>
              <div className="relative">
                <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" placeholder="60" min="15" max="300" step="5" className={`${inputClass} pl-12`} value={sessionDuration} onChange={(e) => setSessionDuration(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="mt-3">
            <label className={labelClass}>Experience Level</label>
            <div className="relative">
              <TrendingUp size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <select className={`${selectClass} pl-12`} value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
                <option value="Beginner">Beginner (0-1 year)</option>
                <option value="Intermediate">Intermediate (1-3 years)</option>
                <option value="Advanced">Advanced (3-5 years)</option>
                <option value="Expert">Expert (5+ years)</option>
              </select>
            </div>
          </div>

          <div className="mt-3">
            <label className={labelClass}>Fitness Goal</label>
            <div className="relative">
              <Target size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <select className={`${selectClass} pl-12`} value={fitnessGoal} onChange={(e) => setFitnessGoal(e.target.value)}>
                <option value="Muscle Gain">Muscle Gain</option>
                <option value="Fat Loss">Fat Loss</option>
                <option value="Strength">Strength</option>
                <option value="Endurance">Endurance</option>
                <option value="Flexibility">Flexibility</option>
                <option value="General Fitness">General Fitness</option>
                <option value="Athletic Performance">Athletic Performance</option>
                <option value="Body Recomposition">Body Recomposition</option>
              </select>
            </div>
          </div>

          <div className="mt-3">
            <label className={labelClass}>Preferred Style</label>
            <div className="relative">
              <Dumbbell size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <select className={`${selectClass} pl-12`} value={trainingStyle} onChange={(e) => setTrainingStyle(e.target.value)}>
                <option value="">Select a style...</option>
                <option value="Bodybuilding">Bodybuilding</option>
                <option value="Powerlifting">Powerlifting</option>
                <option value="CrossFit">CrossFit</option>
                <option value="Calisthenics">Calisthenics</option>
                <option value="HIIT">HIIT</option>
                <option value="Functional Training">Functional Training</option>
                <option value="Olympic Weightlifting">Olympic Weightlifting</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>
          </div>
        </SectionCard>

        {/* Save Button */}
        <button onClick={handleSave} disabled={saving} className="w-full h-14 bg-liftly-teal hover:bg-teal-400 text-white font-black text-base rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 shadow-teal-lg mt-6">
          {saving ? <Loader2 size={20} className="animate-spin" /> : <><Save size={18} /><span>Save All Changes</span></>}
        </button>
      </div>
    </div>
  );
};

const SectionCard = ({ title, icon, iconBg, children }) => (
  <div className="bg-white rounded-3xl p-5 shadow-card border border-slate-100">
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>{icon}</div>
      <h2 className="font-black text-slate-800 text-base">{title}</h2>
    </div>
    <div>
      {children}
    </div>
  </div>
);

export default PersonalInfo;
