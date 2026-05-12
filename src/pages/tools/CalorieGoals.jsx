import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Utensils, Target, Flame, ChevronLeft, TrendingUp, ChevronDown } from 'lucide-react';
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
  const [isGoalDropdownOpen, setIsGoalDropdownOpen] = useState(false);

  const goalOptions = [
    { value: 'Lose Weight',    label: 'Deficit',  accent: '#818cf8', accentBg: 'rgba(129,140,248,0.1)', accentBorder: 'rgba(129,140,248,0.2)' },
    { value: 'Maintain Weight', label: 'Maintain', accent: '#00d4aa', accentBg: 'rgba(0,212,170,0.1)',   accentBorder: 'rgba(0,212,170,0.2)' },
    { value: 'Gain Muscle',    label: 'Surplus',  accent: '#f97316', accentBg: 'rgba(249,115,22,0.1)',   accentBorder: 'rgba(249,115,22,0.2)' },
  ];
  const currentGoalOption = goalOptions.find(o => localGoal.includes(o.value.split(' ')[0])) || goalOptions[1];
  const { accent, accentBg, accentBorder } = currentGoalOption;

  useEffect(() => {
    if (!userData || !currentUser) return;
    const goalPaceToSave = localGoal.includes('Maintain') ? 'None' : selectedPace;
    if (userData.fitnessGoal !== localGoal || userData.goalPace !== goalPaceToSave) {
      const autoSave = async () => {
        try { await updateUserProfile(currentUser.uid, { fitnessGoal: localGoal, goalPace: goalPaceToSave }); }
        catch (error) { console.error('Failed to auto-save goal:', error); }
      };
      autoSave();
    }
  }, [localGoal, selectedPace, userData, currentUser, updateUserProfile]);

  let bmr = 10 * weight + 6.25 * height - 5 * age;
  if (gender === 'Female') bmr -= 161; else bmr += 5;

  let multiplier = 1.2;
  if (trainingDays >= 1 && trainingDays <= 3) multiplier = 1.375;
  else if (trainingDays >= 4 && trainingDays <= 5) multiplier = 1.55;
  else if (trainingDays >= 6) multiplier = 1.725;

  const tdee = Math.round(bmr * multiplier);
  let calorieTarget = tdee;
  let goalMessage = 'Consume these calories daily to maintain your current body weight.';
  let badgeText = 'Maintenance';

  if (localGoal.includes('Lose Weight')) {
    let deficit = selectedPace === 'Slow' ? 250 : selectedPace === 'Extreme' ? 1000 : 500;
    calorieTarget = tdee - deficit;
    const lossRate = deficit === 250 ? '0.25' : deficit === 500 ? '0.5' : '1.0';
    goalMessage = `A ${deficit}-cal deficit for ${selectedPace.toLowerCase()} fat loss (~${lossRate} kg/week).`;
    badgeText = 'Deficit';
  } else if (localGoal.includes('Gain Muscle')) {
    let surplus = selectedPace === 'Slow' ? 150 : selectedPace === 'Extreme' ? 500 : 300;
    calorieTarget = tdee + surplus;
    goalMessage = `A ${surplus}-cal surplus to fuel ${selectedPace.toLowerCase()} lean muscle growth.`;
    badgeText = 'Surplus';
  }

  const macros = [
    { label: 'Protein', value: `${Math.round(weight * 2.2)}g`, accent: '#f87171', desc: '1g per lb of bodyweight' },
    { label: 'Fats',    value: `${Math.round((calorieTarget * 0.25) / 9)}g`, accent: '#fbbf24', desc: '25% of total calories' },
    { label: 'Carbs',   value: `${Math.round((calorieTarget - (weight * 2.2 * 4) - (calorieTarget * 0.25)) / 4)}g`, accent: '#00d4aa', desc: 'Remaining calories' },
  ];

  return (
    <div className="bg-[#040810] min-h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-12 pb-6 relative overflow-hidden shrink-0 border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D1F38] via-[#060D1A] to-[#040810]" />
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl -mr-10 -mt-10" style={{ background: `${accent}20` }} />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all shrink-0">
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Utensils size={13} style={{ color: accent }} />
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: accent }}>Nutrition</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">Caloric Goals</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* Goal selector + Target card */}
        <div className="surface rounded-3xl p-5">

          {/* Picker row */}
          <div className="flex items-center justify-between mb-5 p-3.5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: accentBg, border: `1px solid ${accentBorder}` }}>
                <Target size={18} style={{ color: accent }} />
              </div>
              <div>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Primary Goal</p>
                <p className="font-black text-white text-sm leading-tight">Active Path</p>
              </div>
            </div>
            <div className="relative shrink-0 z-50">
              <button
                onClick={() => setIsGoalDropdownOpen(!isGoalDropdownOpen)}
                className="flex items-center gap-2 h-9 pl-3 pr-2.5 rounded-xl text-xs font-black outline-none transition-all border"
                style={{ background: accentBg, borderColor: accentBorder, color: accent }}
              >
                {currentGoalOption.label} <ChevronDown size={13} />
              </button>
              {isGoalDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsGoalDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-36 rounded-2xl overflow-hidden z-50 animate-slide-up" style={{ background: 'rgba(13,21,38,0.98)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                    {goalOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => { setLocalGoal(option.value); setIsGoalDropdownOpen(false); }}
                        className="w-full text-left px-4 py-3 text-xs font-black transition-colors border-b border-white/5 last:border-0"
                        style={{ color: option.accent, background: localGoal === option.value ? `${option.accent}10` : 'transparent' }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Calorie target */}
          <div className="flex flex-col items-center justify-center py-8 rounded-2xl relative overflow-hidden mb-5" style={{ background: accentBg, border: `1px solid ${accentBorder}` }}>
            <div className="absolute top-2 right-4 opacity-10">
              <Flame size={80} style={{ color: accent }} />
            </div>
            <span className="text-6xl font-black tracking-tighter relative z-10" style={{ color: accent }}>{calorieTarget}</span>
            <span className="text-[11px] font-black uppercase tracking-widest mt-2 flex items-center gap-1.5 relative z-10" style={{ color: accent }}>
              <Flame size={13} /> Calories / Day
            </span>
            <div className="mt-3 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest relative z-10" style={{ background: `${accent}20`, color: accent }}>
              {badgeText}
            </div>
          </div>

          {/* Pace selector */}
          {(localGoal.includes('Lose Weight') || localGoal.includes('Gain Muscle')) && (
            <div className="mb-5">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 px-1">Goal Pace</p>
              <div className="flex rounded-2xl gap-1 p-1.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
                {[
                  { id: 'Slow',     color: '#00d4aa' },
                  { id: 'Moderate', color: '#f59e0b' },
                  { id: 'Extreme',  color: '#f87171' },
                ].map(pace => (
                  <button
                    key={pace.id}
                    onClick={() => setSelectedPace(pace.id)}
                    className="flex-1 py-2 rounded-xl text-xs font-black transition-all"
                    style={
                      selectedPace === pace.id
                        ? { background: `${pace.color}20`, color: pace.color, border: `1px solid ${pace.color}40` }
                        : { color: 'rgba(255,255,255,0.25)' }
                    }
                  >
                    {pace.id}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Plan note */}
          <p className="text-xs font-medium leading-relaxed text-white/40 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="font-bold text-white/60 block mb-1">Plan:</span>
            {goalMessage}
          </p>
        </div>

        {/* Macros */}
        <div className="surface rounded-3xl p-5">
          <h3 className="font-black text-white text-sm mb-4 flex items-center gap-2">
            <TrendingUp size={15} style={{ color: accent }} />
            Recommended Macros
          </h3>
          <div className="space-y-2.5">
            {macros.map(({ label, value, accent: a, desc }) => (
              <div key={label} className="flex justify-between items-center p-3.5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: a }} />
                    <span className="font-black text-white text-sm">{label}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-white/30 pl-4">{desc}</span>
                </div>
                <span className="font-black text-lg" style={{ color: a }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-2" />
      </div>
    </div>
  );
};

export default CalorieGoals;
