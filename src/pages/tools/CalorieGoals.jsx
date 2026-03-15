import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Utensils, Target, Flame, ArrowLeft, TrendingUp, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CalorieGoals = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();

  const weight = userData?.weight || 70;
  const height = userData?.height || 175;
  const age = userData?.age || 25;
  const gender = userData?.gender || 'Male';
  const trainingDays = userData?.trainingDays || 3;
  const goal = userData?.fitnessGoal || 'Maintain Weight';

  // Calculate BMR using Mifflin-St Jeor Equation
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  if (gender === 'Female') {
    bmr -= 161;
  } else {
    // Default for Male, Gay, or unspecified
    bmr += 5;
  }

  // Activity Multiplier based on Training Days
  let multiplier = 1.2;
  if (trainingDays >= 1 && trainingDays <= 3) multiplier = 1.375;
  else if (trainingDays >= 4 && trainingDays <= 5) multiplier = 1.55;
  else if (trainingDays >= 6) multiplier = 1.725;

  const [selectedPace, setSelectedPace] = useState(
    userData?.goalPace && userData.goalPace !== 'None' ? userData.goalPace : 'Moderate'
  );

  const tdee = Math.round(bmr * multiplier);

  let calorieTarget = tdee;
  let goalMessage = "Consume these calories daily to maintain your current body weight.";
  let badgeText = "Maintenance";

  if (goal.includes('Lose Weight')) {
    let deficit = 500;
    if (selectedPace === 'Slow') deficit = 250;
    else if (selectedPace === 'Moderate') deficit = 500;
    else if (selectedPace === 'Extreme') deficit = 1000;

    calorieTarget = tdee - deficit;
    const lossRate = deficit === 250 ? '0.25' : deficit === 500 ? '0.5' : '1.0';
    goalMessage = `A ${deficit}-calorie deficit for ${selectedPace.toLowerCase()} fat loss (approx. ${lossRate} kg per week).`;
    badgeText = "Deficit";
  } else if (goal.includes('Gain Muscle')) {
    let surplus = 300;
    if (selectedPace === 'Slow') surplus = 150;
    else if (selectedPace === 'Moderate') surplus = 300;
    else if (selectedPace === 'Extreme') surplus = 500;

    calorieTarget = tdee + surplus;
    const gainDesc = selectedPace === 'Extreme' ? 'muscle growth (will likely include fat gain)' : 'muscle growth while minimizing fat gain';
    goalMessage = `A ${surplus}-calorie surplus to fuel ${selectedPace.toLowerCase()} ${gainDesc}.`;
    badgeText = "Surplus";
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen flex flex-col pt-12 animate-in fade-in duration-300 relative">
      <button onClick={() => navigate(-1)} className="absolute top-6 left-6 p-2 bg-white rounded-full shadow-sm text-slate-400 hover:text-slate-800 transition-colors">
        <ArrowLeft size={20} />
      </button>

      <div className="mt-8 mb-6">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Utensils className="text-orange-500" />
          Caloric Goals
        </h1>
        <p className="text-slate-500 text-sm font-medium mt-1">Personalized macros for your goal</p>
      </div>

      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col mb-4">
        {/* Maintenance Info */}
        <div className="flex items-center justify-between mb-8 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center">
               <Activity size={20} />
             </div>
             <div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Maintenance (TDEE)</p>
               <p className="font-black text-slate-800 text-lg">{tdee} kcal</p>
             </div>
          </div>
        </div>

        {/* Pace Selector (if not maintaining) */}
        {!goal.includes('Maintain') && (
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button 
              onClick={() => setSelectedPace('Slow')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPace === 'Slow' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Slow
            </button>
            <button 
              onClick={() => setSelectedPace('Moderate')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPace === 'Moderate' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Moderate
            </button>
            <button 
              onClick={() => setSelectedPace('Extreme')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPace === 'Extreme' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Extreme
            </button>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
           <h2 className="text-lg font-bold text-slate-800 tracking-tight">Daily Target</h2>
           <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
             <Target size={14} /> {badgeText}
           </span>
        </div>
        
        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
           <span className="text-5xl font-black text-slate-800 tracking-tighter mb-2">
             {calorieTarget}
           </span>
           <span className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
             <Flame size={14} className="text-orange-500" /> Calories / Day
           </span>
        </div>

        <p className="text-slate-500 text-sm font-medium leading-relaxed bg-blue-50/50 p-4 rounded-xl border border-blue-50 text-blue-800">
          {goalMessage}
        </p>
      </div>

      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
           <TrendingUp size={18} className="text-liftly-teal" /> Recommended Macros
        </h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
             <span className="font-semibold text-slate-600">Protein</span>
             <span className="font-bold text-slate-800">{Math.round(weight * 2.2)}g</span>
          </div>
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
             <span className="font-semibold text-slate-600">Fats</span>
             <span className="font-bold text-slate-800">{Math.round((calorieTarget * 0.25) / 9)}g</span>
          </div>
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
             <span className="font-semibold text-slate-600">Carbs</span>
             <span className="font-bold text-slate-800">{Math.round((calorieTarget - ((weight * 2.2 * 4) + ((calorieTarget * 0.25)))) / 4)}g</span>
          </div>
        </div>
      </div>
      
      <div className="h-10"></div>
    </div>
  );
};

export default CalorieGoals;
