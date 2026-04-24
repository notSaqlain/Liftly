import { useAuth } from '../../context/AuthContext';
import { Activity, Info, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BmiCalculator = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();

  const weight = userData?.weight || 70;
  const height = userData?.height || 175;
  const heightInMeters = height / 100;
  
  const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);

  let category = '';
  let colorClass = '';
  let bgColorClass = '';
  let advice = '';

  if (bmi < 18.5) {
    category = 'Underweight';
    colorClass = 'text-blue-500';
    bgColorClass = 'bg-blue-50';
    advice = 'You are considered underweight. Consider a caloric surplus to build healthy mass.';
  } else if (bmi >= 18.5 && bmi < 24.9) {
    category = 'Normal weight';
    colorClass = 'text-emerald-500';
    bgColorClass = 'bg-emerald-50';
    advice = 'You are in a healthy weight range. Keep up the good work with maintenance or mild surplus for muscle gain.';
  } else if (bmi >= 25 && bmi < 29.9) {
    category = 'Overweight';
    colorClass = 'text-yellow-500';
    bgColorClass = 'bg-yellow-50';
    advice = 'You are slightly above the normal range. A slight caloric deficit could help you lean out.';
  } else {
    category = 'Obese';
    colorClass = 'text-red-500';
    bgColorClass = 'bg-red-50';
    advice = 'Your BMI indicates obesity. Focus on a sustainable caloric deficit and regular activity.';
  }

  const markerPosition = Math.min(Math.max(((bmi - 15) / (40 - 15)) * 100, 0), 100);

  return (
    <div className="bg-slate-50 min-h-full animate-fade-in flex flex-col">
      {/* Header */}
      <div className="bg-liftly-navy px-5 pt-12 pb-6 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-liftly-teal/15 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -ml-10 -mb-10" />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all backdrop-blur-sm shrink-0">
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity size={14} className="text-emerald-400" />
              <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Body Metrics</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">BMI Calculator</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-24 space-y-4">
        <div className="bg-white rounded-3xl p-8 shadow-card border border-slate-100 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-emerald-400 to-red-400" />
          
          <div className={`w-32 h-32 rounded-3xl ${bgColorClass} flex items-center justify-center mb-6 ring-4 ring-white shadow-sm rotate-3`}>
            <span className={`text-4xl font-black tracking-tighter ${colorClass} -rotate-3`}>{bmi}</span>
          </div>
          
          <h2 className="text-2xl font-black text-slate-800 mb-2">{category}</h2>
          <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-[250px] mb-8">
            {advice}
          </p>

          <div className="w-full">
            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase mb-3">
              <span>15 (Under)</span>
              <span>25 (Normal)</span>
              <span>40+ (Obese)</span>
            </div>
            <div className="h-4 w-full bg-slate-100 rounded-full relative overflow-hidden flex shadow-inner">
              <div className="h-full bg-blue-400" style={{ width: '25%' }}></div>
              <div className="h-full bg-emerald-400" style={{ width: '35%' }}></div>
              <div className="h-full bg-yellow-400" style={{ width: '20%' }}></div>
              <div className="h-full bg-red-400" style={{ width: '20%' }}></div>
              
              <div 
                className="absolute top-0 bottom-0 w-1.5 bg-liftly-navy rounded-full border border-white shadow-lg transition-all duration-1000 ease-out"
                style={{ left: `max(0%, min(100%, calc(${markerPosition}% - 3px)))` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-5 flex gap-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
            <Info size={20} className="text-blue-500" />
          </div>
          <p className="text-xs font-medium leading-relaxed text-blue-800/80">
            <strong className="text-blue-900 block mb-1">Note for Lifters:</strong> 
            BMI is a general indicator and doesn't differentiate between fat and muscle. Due to muscle density, your BMI might read higher than expected. Focus on mirror changes and strength gains!
          </p>
        </div>
      </div>
    </div>
  );
};

export default BmiCalculator;
