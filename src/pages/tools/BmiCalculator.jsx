import { useAuth } from '../../context/AuthContext';
import { Activity, Info, ArrowLeft } from 'lucide-react';
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

  // Calculate position for the visual scale marker (min 15, max 40)
  const markerPosition = Math.min(Math.max(((bmi - 15) / (40 - 15)) * 100, 0), 100);

  return (
    <div className="p-6 bg-slate-50 min-h-screen flex flex-col pt-12 animate-in fade-in duration-300 relative">
      <button onClick={() => navigate(-1)} className="absolute top-6 left-6 p-2 bg-white rounded-full shadow-sm text-slate-400 hover:text-slate-800 transition-colors">
        <ArrowLeft size={20} />
      </button>

      <div className="mt-8 mb-6">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Activity className="text-emerald-500" />
          BMI Calculator
        </h1>
        <p className="text-slate-500 text-sm font-medium mt-1">Based on your current profile metrics</p>
      </div>

      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
        <div className={`w-32 h-32 rounded-full ${bgColorClass} flex items-center justify-center mb-6`}>
          <span className={`text-4xl font-black tracking-tighter ${colorClass}`}>{bmi}</span>
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{category}</h2>
        <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-[250px]">
          {advice}
        </p>

        <div className="w-full mt-10">
          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-2">
            <span>15 (Under)</span>
            <span>25 (Normal)</span>
            <span>40+ (Obese)</span>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full relative overflow-hidden flex">
            <div className="h-full bg-blue-400" style={{ width: '25%' }}></div>
            <div className="h-full bg-emerald-400" style={{ width: '35%' }}></div>
            <div className="h-full bg-yellow-400" style={{ width: '20%' }}></div>
            <div className="h-full bg-red-400" style={{ width: '20%' }}></div>
            
            <div 
              className="absolute top-0 bottom-0 w-1 bg-slate-800 shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-all duration-700 ease-out"
              style={{ left: `${markerPosition}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-blue-800">
        <Info size={24} className="shrink-0 text-blue-500" />
        <p className="text-xs font-medium leading-relaxed">
          <strong>Note:</strong> BMI is a general indicator and does not differentiate between body fat and muscle mass. As a lifter, your BMI might be higher due to muscle density rather than fat.
        </p>
      </div>

    </div>
  );
};

export default BmiCalculator;
