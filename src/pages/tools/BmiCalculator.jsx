import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Activity, Info, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BmiCalculator = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();

  const [weightInput, setWeightInput] = useState(userData?.weight || 70);
  const [heightInput, setHeightInput] = useState(userData?.height || 175);

  const heightInMeters = heightInput / 100;
  const bmi = (weightInput / (heightInMeters * heightInMeters)).toFixed(1);

  let category = '';
  let accent = '#00d4aa';      // teal default
  let accentBg = 'rgba(0,212,170,0.1)';
  let accentBorder = 'rgba(0,212,170,0.2)';
  let advice = '';

  if (bmi < 18.5) {
    category = 'Underweight';
    accent = '#818cf8';
    accentBg = 'rgba(129,140,248,0.1)';
    accentBorder = 'rgba(129,140,248,0.2)';
    advice = 'You are considered underweight. Consider a caloric surplus to build healthy mass.';
  } else if (bmi >= 18.5 && bmi < 24.9) {
    category = 'Normal weight';
    accent = '#00d4aa';
    accentBg = 'rgba(0,212,170,0.1)';
    accentBorder = 'rgba(0,212,170,0.2)';
    advice = 'You are in a healthy weight range. Keep up the good work with maintenance or mild surplus.';
  } else if (bmi >= 25 && bmi < 29.9) {
    category = 'Overweight';
    accent = '#f59e0b';
    accentBg = 'rgba(245,158,11,0.1)';
    accentBorder = 'rgba(245,158,11,0.2)';
    advice = 'Slightly above the normal range. A slight caloric deficit could help you lean out.';
  } else {
    category = 'Obese';
    accent = '#f87171';
    accentBg = 'rgba(248,113,113,0.1)';
    accentBorder = 'rgba(248,113,113,0.2)';
    advice = 'Your BMI indicates obesity. Focus on a sustainable caloric deficit and regular activity.';
  }

  const markerPosition = Math.min(Math.max(((bmi - 15) / (40 - 15)) * 100, 0), 100);

  return (
    <div className="bg-[#040810] min-h-full animate-fade-in flex flex-col">
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
              <Activity size={13} style={{ color: accent }} />
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: accent }}>Body Metrics</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">BMI Calculator</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* Inputs */}
        <div className="surface rounded-3xl p-5 flex gap-3">
          {[
            { label: 'Weight (kg)', value: weightInput, setter: setWeightInput, step: '0.1' },
            { label: 'Height (cm)', value: heightInput, setter: setHeightInput, step: '1' },
          ].map(({ label, value, setter, step }) => (
            <div key={label} className="flex-1">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 block px-1">{label}</label>
              <input
                type="number"
                step={step}
                value={value}
                onChange={e => setter(e.target.value)}
                className="w-full h-12 rounded-2xl px-4 font-black text-white text-center focus:outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                onFocus={e => e.target.style.borderColor = accent}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
          ))}
        </div>

        {/* BMI Result */}
        <div className="surface rounded-3xl p-6 flex flex-col items-center text-center relative overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-3xl" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

          <div
            className="w-32 h-32 rounded-3xl flex items-center justify-center mb-5 rotate-3 shadow-lg"
            style={{ background: accentBg, border: `1px solid ${accentBorder}`, boxShadow: `0 0 40px ${accent}20` }}
          >
            <span className="text-5xl font-black -rotate-3" style={{ color: accent }}>{bmi}</span>
          </div>

          <h2 className="text-2xl font-black text-white mb-2">{category}</h2>
          <p className="text-white/40 text-sm font-medium leading-relaxed max-w-[260px] mb-6">{advice}</p>

          {/* Scale bar */}
          <div className="w-full">
            <div className="flex justify-between text-[9px] font-black text-white/30 uppercase mb-2">
              <span>Under (15)</span>
              <span>Normal (25)</span>
              <span>Obese (40+)</span>
            </div>
            <div className="h-3 w-full rounded-full relative overflow-hidden flex shadow-inner" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="h-full rounded-l-full" style={{ width: '25%', background: 'linear-gradient(90deg,#818cf8,#60a5fa)' }} />
              <div className="h-full" style={{ width: '35%', background: 'linear-gradient(90deg,#60a5fa,#00d4aa)' }} />
              <div className="h-full" style={{ width: '20%', background: 'linear-gradient(90deg,#00d4aa,#f59e0b)' }} />
              <div className="h-full rounded-r-full" style={{ width: '20%', background: 'linear-gradient(90deg,#f59e0b,#f87171)' }} />
              <div
                className="absolute top-0 bottom-0 w-1.5 rounded-full border border-white/30 shadow-lg transition-all duration-700 ease-out"
                style={{ left: `calc(${markerPosition}% - 3px)`, background: 'white', boxShadow: `0 0 8px ${accent}` }}
              />
            </div>
          </div>
        </div>

        {/* Note card */}
        <div
          className="rounded-3xl p-5 flex gap-4"
          style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)' }}
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Info size={18} className="text-indigo-400" />
          </div>
          <p className="text-xs font-medium leading-relaxed text-white/50">
            <strong className="text-white/80 block mb-1">Note for Lifters:</strong>
            BMI doesn't differentiate between fat and muscle. Due to muscle density, your BMI might read higher than expected. Focus on mirror changes and strength gains!
          </p>
        </div>

        <div className="h-2" />
      </div>
    </div>
  );
};

export default BmiCalculator;
