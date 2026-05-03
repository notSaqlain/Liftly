import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Utensils, Target, Flame, ChevronLeft, TrendingUp, Activity, ChevronDown } from 'lucide-react';
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
    { value: 'Lose Weight', label: 'Deficit', color: 'text-blue-600', hoverBg: 'hover:bg-blue-50' },
    { value: 'Maintain Weight', label: 'Maintain', color: 'text-emerald-600', hoverBg: 'hover:bg-emerald-50' },
    { value: 'Gain Muscle', label: 'Surplus', color: 'text-orange-600', hoverBg: 'hover:bg-orange-50' }
  ];
  const currentGoalOption = goalOptions.find(o => localGoal.includes(o.value)) || goalOptions[1];

  useEffect(() => {
    if (!userData || !currentUser) return;
    const goalPaceToSave = localGoal.includes('Maintain') ? 'None' : selectedPace;
    
    if (userData.fitnessGoal !== localGoal || userData.goalPace !== goalPaceToSave) {
      const autoSave = async () => {
        try {
          await updateUserProfile(currentUser.uid, {
            fitnessGoal: localGoal,
            goalPace: goalPaceToSave
          });
        } catch (error) {
          console.error('Failed to auto-save goal:', error);
        }
      };
      autoSave();
    }
  }, [localGoal, selectedPace, userData, currentUser, updateUserProfile]);

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

  if (localGoal.includes('Fat Loss') || localGoal.includes('Lose Weight')) {
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

  return (
    <div className="bg-slate-50 min-h-full flex flex-col animate-fade-in relative">
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

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="bg-white rounded-3xl p-5 shadow-card border border-slate-100 flex flex-col">
          {/* Goal Selector Header */}
          <div className="flex items-center justify-between p-4 bg-white border border-slate-100 shadow-sm rounded-2xl mb-5">
            <div className="flex items-center gap-3">
               <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-500 flex items-center justify-center shrink-0 border border-indigo-100">
                 <Target size={22} className="drop-shadow-sm" />
               </div>
               <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Primary Goal</p>
                 <p className="font-black text-slate-800 text-lg tracking-tight leading-none">Active Path</p>
               </div>
            </div>
            
            <div className="relative shrink-0 z-50">
              <button 
                onClick={() => setIsGoalDropdownOpen(!isGoalDropdownOpen)}
                className={`flex items-center gap-2 h-9 pl-3 pr-2.5 rounded-xl text-xs font-black outline-none transition-all cursor-pointer border shadow-sm ${
                  localGoal.includes('Lose Weight') ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' :
                  localGoal.includes('Gain Muscle') ? 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100' :
                  'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {currentGoalOption.label}
                <ChevronDown size={14} className={
                  localGoal.includes('Lose Weight') ? 'text-blue-400' :
                  localGoal.includes('Gain Muscle') ? 'text-orange-400' :
                  'text-emerald-400'
                } />
              </button>
              
              {isGoalDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsGoalDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-slide-up origin-top-right">
                    {goalOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setLocalGoal(option.value);
                          setIsGoalDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-xs font-black transition-colors border-b border-slate-50 last:border-0 ${option.color} ${option.hoverBg} ${localGoal.includes(option.value) ? 'bg-slate-50' : 'bg-white'}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mb-4 px-1">
             <h2 className="text-lg font-black text-slate-800 tracking-tight">Daily Target</h2>
             <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                localGoal.includes('Lose Weight') ? 'bg-blue-50 text-blue-600' :
                localGoal.includes('Gain Muscle') ? 'bg-orange-50 text-orange-600' :
                'bg-emerald-50 text-emerald-600'
             }`}>
               <Target size={14} /> {badgeText}
             </span>
          </div>
          
          <div className={`flex flex-col items-center justify-center p-6 rounded-3xl border mb-5 relative overflow-hidden ${
             localGoal.includes('Lose Weight') ? 'bg-blue-50/50 border-blue-100/50' :
             localGoal.includes('Gain Muscle') ? 'bg-orange-50/50 border-orange-100/50' :
             'bg-emerald-50/50 border-emerald-100/50'
          }`}>
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Flame size={64} className={
                   localGoal.includes('Lose Weight') ? 'text-blue-500' :
                   localGoal.includes('Gain Muscle') ? 'text-orange-500' :
                   'text-emerald-500'
                } />
             </div>
             <span className={`text-5xl font-black tracking-tighter mb-1 relative z-10 ${
                localGoal.includes('Lose Weight') ? 'text-blue-500' :
                localGoal.includes('Gain Muscle') ? 'text-orange-500' :
                'text-emerald-500'
             }`}>
               {calorieTarget}
             </span>
             <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 relative z-10 ${
                localGoal.includes('Lose Weight') ? 'text-blue-400' :
                localGoal.includes('Gain Muscle') ? 'text-orange-400' :
                'text-emerald-400'
             }`}>
               <Flame size={14} /> Calories / Day
             </span>
          </div>

          {/* Pace Selector */}
          {(localGoal.includes('Lose Weight') || localGoal.includes('Gain Muscle')) && (
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

          <p className="text-slate-500 text-xs font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 text-slate-600">
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
      </div>
    </div>
  );
};

export default CalorieGoals;
