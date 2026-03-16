import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Activity, Dumbbell, Trophy, Target, TrendingUp, CalendarDays, Radar as RadarIcon } from 'lucide-react';

// Placeholder data for Weekly Progress (e.g., total weight lifted per day or workouts)
const weeklyData = [
  { day: 'Mon', volume: 4500 },
  { day: 'Tue', volume: 0 },
  { day: 'Wed', volume: 5200 },
  { day: 'Thu', volume: 0 },
  { day: 'Fri', volume: 6100 },
  { day: 'Sat', volume: 3000 },
  { day: 'Sun', volume: 0 },
];

// Placeholder data for Monthly 1RM Progress (e.g., Bench Press)
const monthlyProgressData = [
  { month: 'Jan', weight: 60 },
  { month: 'Feb', weight: 65 },
  { month: 'Mar', weight: 67.5 },
  { month: 'Apr', weight: 70 },
  { month: 'May', weight: 75 },
  { month: 'Jun', weight: 80 },
];

// Placeholder data for Muscle Group Radar
const muscleGroupData = [
  { muscle: 'Chest', value: 75 },
  { muscle: 'Back', value: 60 },
  { muscle: 'Legs', value: 85 },
  { muscle: 'Shoulders', value: 50 },
  { muscle: 'Arms', value: 65 },
  { muscle: 'Core', value: 40 },
];

const Stats = () => {
  const { currentUser } = useAuth();
  const [selectedExercise, setSelectedExercise] = useState('Bench Press');

  return (
    <div className="p-6 pb-24 min-h-full bg-slate-50 flex flex-col space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="pt-6">
        <h1 className="text-2xl font-extrabold text-liftly-navy tracking-tight mb-2">
          Your Progress
        </h1>
        <p className="text-slate-500 text-sm font-medium">Tracking your gains over time</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-2">
            <Target size={20} />
          </div>
          <span className="text-2xl font-black text-slate-800 tracking-tight">24</span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">Total Workouts</span>
        </div>
        
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-2">
            <Dumbbell size={20} />
          </div>
          <span className="text-2xl font-black text-slate-800 tracking-tight">18.8k</span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">Volume (kg)</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-yellow-50 text-yellow-500 flex items-center justify-center shrink-0">
              <Trophy size={24} className="fill-yellow-500" />
            </div>
            <div>
              <p className="font-bold text-slate-800">Top 10%</p>
              <p className="text-xs text-slate-400 font-medium">Of lifters this week</p>
            </div>
         </div>
         <span className="bg-slate-50 text-slate-500 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">Keep going</span>
      </div>

      {/* Weekly Progress Chart */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 pt-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-liftly-teal" />
            <h3 className="font-black text-slate-800">Weekly Volume</h3>
          </div>
          <span className="text-xs font-bold bg-teal-50 text-liftly-teal px-2 py-1 rounded-lg">This Week</span>
        </div>
        
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip 
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="volume" fill="#00adb5" radius={[6, 6, 6, 6]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Muscle Group Radar Chart */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 pt-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <RadarIcon size={18} className="text-purple-500" />
            <h3 className="font-black text-slate-800">Muscle Focus</h3>
          </div>
          <span className="text-xs font-bold bg-purple-50 text-purple-600 px-2 py-1 rounded-lg">All Time</span>
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={muscleGroupData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="muscle" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="Training Volume"
                dataKey="value"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.25}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-1">Training distribution by muscle group</p>
      </div>

      {/* Monthly Max Lift Progress Chart */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 pt-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-indigo-500" />
            <h3 className="font-black text-slate-800">1RM Progress</h3>
          </div>
          <select 
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-1.5 rounded-lg border-none focus:ring-0 outline-none cursor-pointer"
          >
            <option value="Bench Press">Bench Press</option>
            <option value="Squat">Squat</option>
            <option value="Deadlift">Deadlift</option>
          </select>
        </div>
        
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyProgressData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
              />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#6366f1" 
                strokeWidth={4} 
                dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#6366f1' }}
                activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Spacer for bottom nav */}
      <div className="h-10"></div>
    </div>
  );
};

export default Stats;
