import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Scale, ChevronLeft, Plus, History, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const ACCENT = '#818cf8'; // indigo

const WeightTracker = () => {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const [newWeight, setNewWeight] = useState('');
  const [loading, setLoading] = useState(false);

  const history = userData?.weightHistory || [];

  let chartData = history.map(entry => ({
    date: new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    weight: entry.weight,
  }));

  // For users who onboarded before weight seeding was added,
  // fall back to showing their onboarding weight as the starting point
  if (chartData.length === 0 && userData?.weight) {
    chartData = [{
      date: new Date(userData.createdAt?.toDate() || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      weight: userData.weight,
      label: 'Starting weight',
    }];
  }

  const handleAddWeight = async (e) => {
    e.preventDefault();
    if (!newWeight || isNaN(newWeight)) return;
    setLoading(true);
    const weightVal = parseFloat(newWeight);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        weight: weightVal,
        weightHistory: arrayUnion({ date: new Date().toISOString(), weight: weightVal }),
      });
      setNewWeight('');
    } catch (error) {
      console.error('Error logging weight:', error);
    } finally {
      setLoading(false);
    }
  };

  const current = chartData[chartData.length - 1]?.weight;
  const lowest  = chartData.length > 0 ? Math.min(...chartData.map(d => d.weight)) : null;
  const highest = chartData.length > 0 ? Math.max(...chartData.map(d => d.weight)) : null;

  return (
    <div className="bg-[#040810] min-h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-12 pb-6 relative overflow-hidden shrink-0 border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D1F38] via-[#060D1A] to-[#040810]" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all shrink-0">
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Scale size={13} style={{ color: ACCENT }} />
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: ACCENT }}>Progress Tracker</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">Body Weight</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* Log weight */}
        <div className="surface rounded-3xl p-5">
          <h3 className="font-black text-white text-sm mb-3 flex items-center gap-2">
            <Plus size={15} style={{ color: ACCENT }} />
            Log New Weight
          </h3>
          <form onSubmit={handleAddWeight} className="flex gap-3">
            <input
              type="number"
              step="0.1"
              value={newWeight}
              onChange={e => setNewWeight(e.target.value)}
              placeholder="e.g. 75.5"
              className="flex-1 h-14 rounded-2xl px-5 font-black text-white placeholder:text-white/25 placeholder:font-medium focus:outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onFocus={e => e.target.style.borderColor = ACCENT}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <button
              type="submit"
              disabled={loading || !newWeight}
              className="h-14 px-5 font-black text-sm rounded-2xl flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 transition-all text-[#040810] shrink-0"
              style={{ background: ACCENT, boxShadow: `0 4px 20px ${ACCENT}40`, minWidth: '72px' }}
            >
              {loading
                ? <Loader2 size={16} className="animate-spin" />
                : <><Plus size={16} strokeWidth={3} /><span>Log</span></>
              }
            </button>
          </form>
        </div>

        {/* Chart + stats */}
        <div className="surface rounded-3xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-white text-sm flex items-center gap-2">
              <History size={15} style={{ color: ACCENT }} />
              Weight History
            </h3>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/30 bg-white/5 border border-white/8 px-2.5 py-1 rounded-lg">kg</span>
          </div>

          {/* Stats strip */}
          {chartData.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[
                { label: 'Current', value: current, color: ACCENT },
                { label: 'Lowest',  value: lowest,  color: '#00d4aa' },
                { label: 'Highest', value: highest, color: '#f87171' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex flex-col items-center p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1">{label}</span>
                  <span className="font-black text-lg" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
          )}

          {chartData.length > 0 ? (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} dy={8} />
                  <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(13,21,38,0.98)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', fontFamily: 'Plus Jakarta Sans', color: 'white' }}
                    itemStyle={{ color: ACCENT, fontWeight: 800 }}
                    formatter={value => [`${value} kg`, 'Weight']}
                  />
                  <defs>
                    <linearGradient id="weightGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#00d4aa" />
                    </linearGradient>
                  </defs>
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="url(#weightGradient)"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: '#0D1526', stroke: ACCENT }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: ACCENT, stroke: `${ACCENT}60`, strokeWidth: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center">
              <Scale className="w-12 h-12 mb-3 text-white/10" />
              <p className="text-white/40 font-bold text-sm">No weight data yet</p>
              <p className="text-white/20 text-xs mt-0.5">Log your weight above to see the chart</p>
            </div>
          )}
        </div>

        <div className="h-2" />
      </div>
    </div>
  );
};

export default WeightTracker;
