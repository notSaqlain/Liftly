import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Scale, ArrowLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const WeightTracker = () => {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const [newWeight, setNewWeight] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize history with current weight if history doesn't exist
  const history = userData?.weightHistory || [];
  
  let chartData = history.map(entry => ({
    date: new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    weight: entry.weight
  }));

  // Add the initial weight if the history array is completely empty
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
        weight: weightVal, // update current weight globally
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
    <div className="p-6 bg-slate-50 min-h-screen flex flex-col pt-12 animate-in fade-in duration-300 relative">
      <button onClick={() => navigate(-1)} className="absolute top-6 left-6 p-2 bg-white rounded-full shadow-sm text-slate-400 hover:text-slate-800 transition-colors">
        <ArrowLeft size={20} />
      </button>

      <div className="mt-8 mb-6">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Scale className="text-blue-500" />
          Weight Tracker
        </h1>
        <p className="text-slate-500 text-sm font-medium mt-1">Log your weight and track your progress</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 pt-6 mb-6">
        <h3 className="font-bold text-slate-800 mb-6">Weight History (kg)</h3>    
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
              <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
              />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#3b82f6" 
                strokeWidth={4} 
                dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#3b82f6' }}
                activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-4">Log New Weight</h3>
        <form onSubmit={handleAddWeight} className="flex gap-3">
           <input 
             type="number" 
             step="0.1"
             value={newWeight}
             onChange={(e) => setNewWeight(e.target.value)}
             placeholder="e.g. 75.5" 
             className="flex-1 h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
           />
           <button 
             type="submit" 
             disabled={loading || !newWeight}
             className="h-12 w-12 bg-blue-500 text-white rounded-xl flex items-center justify-center hover:bg-blue-600 transition-colors active:scale-95 disabled:opacity-50"
           >
             <Plus size={24} />
           </button>
        </form>
      </div>

      <div className="h-10"></div>
    </div>
  );
};

export default WeightTracker;
