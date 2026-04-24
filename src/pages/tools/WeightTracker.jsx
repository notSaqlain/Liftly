import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Scale, ChevronLeft, Plus, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const WeightTracker = () => {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const [newWeight, setNewWeight] = useState('');
  const [loading, setLoading] = useState(false);

  const history = userData?.weightHistory || [];
  
  let chartData = history.map(entry => ({
    date: new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    weight: entry.weight
  }));

  if (chartData.length === 0 && userData?.weight) {
    chartData = [{
      date: new Date(userData.createdAt?.toDate() || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      weight: userData.weight
    }];
  }

  const handleAddWeight = async (e) => {
    e.preventDefault();
    if (!newWeight || isNaN(newWeight)) return;
    
    setLoading(true);
    const weightVal = parseFloat(newWeight);

    try {
      const docRef = doc(db, 'users', currentUser.uid);
      await updateDoc(docRef, {
        weight: weightVal,
        weightHistory: arrayUnion({
          date: new Date().toISOString(),
          weight: weightVal
        })
      });
      setNewWeight('');
    } catch (error) {
      console.error("Error logging weight:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="bg-liftly-navy px-5 pt-12 pb-6 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/15 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -ml-10 -mb-10" />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all backdrop-blur-sm shrink-0">
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Scale size={14} className="text-blue-400" />
              <span className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Progress Tracker</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">Body Weight</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-24 space-y-4">
        
        {/* Log Weight Card */}
        <div className="bg-white rounded-3xl p-5 shadow-card border border-slate-100">
          <h3 className="font-black text-slate-800 mb-3 text-sm flex items-center gap-2">
            <Plus size={16} className="text-blue-500" />
            Log New Weight
          </h3>
          <form onSubmit={handleAddWeight} className="flex gap-3">
             <input 
               type="number" 
               step="0.1"
               value={newWeight}
               onChange={(e) => setNewWeight(e.target.value)}
               placeholder="e.g. 75.5" 
               className="flex-1 h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-black text-slate-800 placeholder:text-slate-400 placeholder:font-medium"
             />
             <button 
               type="submit" 
               disabled={loading || !newWeight}
               className="h-14 px-6 bg-blue-500 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] hover:bg-blue-600 transition-colors active:scale-95 disabled:opacity-50"
             >
               <Plus size={18} strokeWidth={3} />
               <span>Log It</span>
             </button>
          </form>
        </div>

        {/* History Chart */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-5 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
              <History size={16} className="text-indigo-500" />
              Weight History
            </h3>    
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">kg</span>
          </div>

          {chartData.length > 0 && (
            <div className="flex justify-between items-center mb-6 bg-slate-50 border border-slate-100 rounded-2xl p-3">
              {[
                { label: 'Current', value: chartData[chartData.length - 1]?.weight, color: 'text-indigo-500' },
                { label: 'Lowest', value: Math.min(...chartData.map(d => d.weight)), color: 'text-emerald-500' },
                { label: 'Highest', value: Math.max(...chartData.map(d => d.weight)), color: 'text-rose-500' }
              ].map(({ label, value, color }) => (
                <div key={label} className="flex flex-col items-center flex-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{label}</span>
                  <span className={`font-black text-lg ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          )}

          {chartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} dy={10} />
                  <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', fontFamily: 'Plus Jakarta Sans' }}
                    labelStyle={{ fontWeight: '900', color: '#1e293b', marginBottom: '4px', fontSize: '12px' }}
                    itemStyle={{ color: '#3b82f6', fontWeight: '900', fontSize: '14px' }}
                    formatter={(value) => [`${value} kg`, 'Weight']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#3b82f6" 
                    strokeWidth={4} 
                    dot={{ r: 5, strokeWidth: 3, fill: '#fff', stroke: '#3b82f6' }}
                    activeDot={{ r: 7, strokeWidth: 0, fill: '#2563eb' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div className="h-48 flex flex-col items-center justify-center text-center">
                <Scale className="text-slate-200 w-12 h-12 mb-3" />
                <p className="text-slate-400 font-bold text-sm">No weight data yet</p>
                <p className="text-slate-300 text-xs">Log your weight above to see the chart</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeightTracker;
