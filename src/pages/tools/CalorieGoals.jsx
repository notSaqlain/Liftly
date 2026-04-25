import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Utensils, Target, Flame, ChevronLeft, TrendingUp, Activity, Save, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CalorieGoals = () => {
  const { userData, currentUser, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  const weight = userData?.weight || 70;
  const height = userData?.height || 175;
  const age = userData?.age || 25;
  const gender = userData?.gender || 'Male';
  const trainingDays = userData?.trainingDays || 3;
  
  const [localGoal, setLocalGoal] = useState(userData?.fitnessGoal || 'Maintain Weight');
  const [selectedPace, setSelectedPace] = useState(
    userData?.goalPace && userData.goalPace !== 'None' ? userData.goalPace : 'Moderate'
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  let bmr = 10 * weight + 6.25 * height - 5 * age;
  if (gender === 'Female') bmr -= 161;
  else bmr += 5;

  let multiplier = 1.2;
  if (trainingDays >= 1 && trainingDays <= 3) multiplier = 1.375;
  else if (trainingDays >= 4 && trainingDays <= 5) multiplier = 1.55;
  else if (trainingDays >= 6) multiplier = 1.725;

  const tdee = Math.round(bmr * multiplier);

  let calorieTarget = tdee;
  let goalMessage = "Consume these calories daily to maintain your current body weight.";
  let badgeText = "Maintenance";

  if (localGoal.includes('Lose Weight') || localGoal.includes('Fat Loss')) {
    let deficit = 500;
    if (selectedPace === 'Slow') deficit = 250;
    else if (selectedPace === 'Moderate') deficit = 500;
    else if (selectedPace === 'Extreme') deficit = 1000;
    calorieTarget = tdee - deficit;
    const lossRate = deficit === 250 ? '0.25' : deficit === 500 ? '0.5' : '1.0';
    goalMessage = `A ${deficit}-calorie deficit for ${selectedPace.toLowerCase()} fat loss (approx. ${lossRate} kg per week).`;
    badgeText = "Deficit";
  } else if (localGoal.includes('Gain Muscle') || localGoal.includes('Surplus')) {
    let surplus = 300;
    if (selectedPace === 'Slow') surplus = 150;
    else if (selectedPace === 'Moderate') surplus = 300;
    else if (selectedPace === 'Extreme') surplus = 500;
    calorieTarget = tdee + surplus;
    const gainDesc = selectedPace === 'Extreme' ? 'muscle growth (will include fat gain)' : 'lean muscle growth';
    goalMessage = `A ${surplus}-calorie surplus to fuel ${selectedPace.toLowerCase()} ${gainDesc}.`;
    badgeText = "Surplus";
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserProfile(currentUser.uid, {
        fitnessGoal: localGoal,
        goalPace: localGoal.includes('Maintain') ? 'None' : selectedPace
      });
      setMessage('Goal saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error(error);
      setMessage('Error saving goal.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-full flex flex-col animate-fade-in relative">
      {message && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-lg animate-slide-up">
          {message}
        </div>
      )}
      {/* Header */}
      <div className="bg-liftly-navy px-5 pt-12 pb-6 relative overflow-hidden shrink-0 z-10 shadow-navy">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/15 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-liftly-teal/10 rounded-full blur-3xl -ml-10 -mb-10" />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all backdrop-blur-sm shrink-0">
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Utensils size={14} className="text-orange-400" />
              <span className="text-orange-400 text-[10px] font-black uppercase tracking-widest">Nutrition</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">Caloric Goals</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-24 space-y-4">
        <div className="bg-white rounded-3xl p-5 shadow-card border border-slate-100 flex flex-col">
          {/* Maintenance Info */}
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl mb-5">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-blue-100/50 text-blue-500 flex items-center justify-center shrink-0">
                 <Activity size={24} />
               </div>
               <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Maintenance (TDEE)</p>
                 <p className="font-black text-slate-800 text-xl tracking-tight">{tdee} <span className="text-sm font-bold text-slate-400">kcal</span></p>
               </div>
            </div>
          </div>

          {/* Goal Selector */}
          <div className="mb-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Main Goal</p>
            <div className="flex bg-slate-100 p-1.5 rounded-2xl overflow-x-auto no-scrollbar gap-1">
              {[
                { id: 'Lose Weight', label: 'Lose', color: 'bg-blue-500 text-white shadow-md shadow-blue-500/20' },
                { id: 'Maintain Weight', label: 'Maintain', color: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' },
                { id: 'Gain Muscle', label: 'Gain', color: 'bg-orange-500 text-white shadow-md shadow-orange-500/20' }
              ].map(g => (
                <button 
                  key={g.id}
                  onClick={() => setLocalGoal(g.id)}
                  className={`flex-1 py-2 px-3 whitespace-nowrap rounded-xl text-xs font-black transition-all ${localGoal === g.id ? g.color : 'bg-transparent text-slate-400 hover:bg-slate-200/50 hover:text-slate-600'}`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pace Selector */}
          {!localGoal.includes('Maintain') && (
            <div className="mb-5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Goal Pace</p>
              <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                {[
                  { id: 'Slow', color: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' },
                  { id: 'Moderate', color: 'bg-amber-500 text-white shadow-md shadow-amber-500/20' },
                  { id: 'Extreme', color: 'bg-red-500 text-white shadow-md shadow-red-500/20' }
                ].map(pace => (
                  <button 
                    key={pace.id}
                    onClick={() => setSelectedPace(pace.id)}
                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${selectedPace === pace.id ? pace.color : 'bg-transparent text-slate-400 hover:bg-slate-200/50 hover:text-slate-600'}`}
                  >
                    {pace.id}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-4 px-1">
             <h2 className="text-lg font-black text-slate-800 tracking-tight">Daily Target</h2>
             <span className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
               <Target size={14} /> {badgeText}
             </span>
          </div>
          
          <div className="flex flex-col items-center justify-center p-6 bg-orange-50/50 rounded-3xl border border-orange-100/50 mb-5 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Flame size={64} className="text-orange-500" />
             </div>
             <span className="text-5xl font-black text-orange-500 tracking-tighter mb-1 relative z-10">
               {calorieTarget}
             </span>
             <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 flex items-center gap-1.5 relative z-10">
               <Flame size={14} /> Calories / Day
             </span>
          </div>

          <p className="text-slate-500 text-xs font-medium leading-relaxed bg-blue-50/50 p-4 rounded-2xl border border-blue-50 text-blue-800">
            <span className="font-bold block mb-1">Plan:</span>
            {goalMessage}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-card border border-slate-100">
          <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
             <TrendingUp size={16} className="text-liftly-teal" /> 
             Recommended Macros
          </h3>
          
          <div className="space-y-2">
            {[
              { label: 'Protein', value: `${Math.round(weight * 2.2)}g`, color: 'bg-red-50 text-red-500', desc: '1g per lb of bodyweight' },
              { label: 'Fats', value: `${Math.round((calorieTarget * 0.25) / 9)}g`, color: 'bg-yellow-50 text-yellow-500', desc: '25% of total calories' },
              { label: 'Carbs', value: `${Math.round((calorieTarget - ((weight * 2.2 * 4) + ((calorieTarget * 0.25)))) / 4)}g`, color: 'bg-emerald-50 text-emerald-500', desc: 'Remaining calories' }
            ].map(({ label, value, color, desc }) => (
              <div key={label} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3.5 rounded-2xl">
                 <div className="flex flex-col">
                   <div className="flex items-center gap-2 mb-0.5">
                     <span className={`w-2 h-2 rounded-full ${color.split(' ')[0].replace('50', '400')}`} />
                     <span className="font-black text-slate-700 text-sm">{label}</span>
                   </div>
                   <span className="text-[10px] font-semibold text-slate-400 pl-4">{desc}</span>
                 </div>
                 <span className={`font-black text-lg ${color.split(' ')[1]}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full mt-6 h-14 bg-liftly-navy text-white font-black rounded-3xl shadow-navy active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
          {saving ? 'Saving...' : 'Save Goal to Profile'}
        </button>
      </div>
    </div>
  );
};

export default CalorieGoals;
