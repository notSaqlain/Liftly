import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Dumbbell, Trophy, TrendingUp, CalendarDays, Radar as RadarIcon, Target, Flame, Clock } from 'lucide-react';
import exercisesData from '../data/exercises.json';

const MUSCLE_GROUPS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

const Stats = () => {
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [weeklyData, setWeeklyData] = useState([]);
  const [muscleGroupData, setMuscleGroupData] = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [allWorkouts, setAllWorkouts] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState('Bench Press');
  const [progressData, setProgressData] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchAllStats = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(
          query(collection(db, 'users', currentUser.uid, 'user_workouts'), orderBy('completedAt', 'desc'))
        );
        const workouts = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Totals
        setTotalWorkouts(workouts.length);
        setTotalVolume(workouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0));

        // All workouts for stats
        setAllWorkouts(workouts);

        // History (last 10)
        setWorkoutHistory(workouts.slice(0, 10));

        // Weekly volume (last 7 days)
        const last7 = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          d.setHours(0, 0, 0, 0);
          const next = new Date(d);
          next.setDate(next.getDate() + 1);
          const dayWorkouts = workouts.filter(w => {
            const t = w.completedAt?.toDate?.();
            return t && t >= d && t < next;
          });
          const vol = dayWorkouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
          last7.push({
            day: d.toLocaleDateString('en-US', { weekday: 'short' }),
            volume: vol
          });
        }
        setWeeklyData(last7);

        // Muscle group radar
        const muscleCount = {};
        MUSCLE_GROUPS.forEach(m => { muscleCount[m] = 0; });
        workouts.forEach(w => {
          w.exercises?.forEach(ex => {
            const group = ex.muscleGroup || '';
            // Map to our 6 groups
            if (group.toLowerCase().includes('chest')) muscleCount['Chest'] = (muscleCount['Chest'] || 0) + (ex.sets?.length || 0);
            else if (group.toLowerCase().includes('back') || group.toLowerCase().includes('lat')) muscleCount['Back'] = (muscleCount['Back'] || 0) + (ex.sets?.length || 0);
            else if (group.toLowerCase().includes('leg') || group.toLowerCase().includes('quad') || group.toLowerCase().includes('hamstr') || group.toLowerCase().includes('glute')) muscleCount['Legs'] = (muscleCount['Legs'] || 0) + (ex.sets?.length || 0);
            else if (group.toLowerCase().includes('shoulder') || group.toLowerCase().includes('delt')) muscleCount['Shoulders'] = (muscleCount['Shoulders'] || 0) + (ex.sets?.length || 0);
            else if (group.toLowerCase().includes('arm') || group.toLowerCase().includes('bicep') || group.toLowerCase().includes('tricep')) muscleCount['Arms'] = (muscleCount['Arms'] || 0) + (ex.sets?.length || 0);
            else if (group.toLowerCase().includes('core') || group.toLowerCase().includes('abs')) muscleCount['Core'] = (muscleCount['Core'] || 0) + (ex.sets?.length || 0);
          });
        });
        const maxSets = Math.max(...Object.values(muscleCount), 1);
        setMuscleGroupData(MUSCLE_GROUPS.map(m => ({ muscle: m, value: Math.round((muscleCount[m] / maxSets) * 100) })));

      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllStats();
  }, [currentUser]);

  // Progress data for selected exercise (best set per workout)
  useEffect(() => {
    if (!currentUser || allWorkouts.length === 0) return;
    const all = [...allWorkouts].reverse();
    const pts = all
      .map(w => {
        const exData = w.exercises?.find(e => e.name?.toLowerCase() === selectedExercise.toLowerCase());
        if (!exData) return null;
        const best = exData.sets?.reduce((max, s) => Math.max(max, s.weight || 0), 0) || 0;
        if (!best) return null;
        const date = w.completedAt?.toDate?.();
        return { month: date?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || '', weight: best };
      })
      .filter(Boolean)
      .slice(-6); // show last 6 times the exercise was performed
    setProgressData(pts);
  }, [selectedExercise, allWorkouts]);

  const fmtVol = (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toString();
  const streak = userData?.currentStreak || 0;

  const availableExercises = [...new Set(
    allWorkouts.flatMap(w => w.exercises?.map(e => e.name) || [])
  )].slice(0, 15);

  if (loading) {
    return (
      <div className="p-6 pt-12 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 rounded-3xl shimmer" />
        ))}
      </div>
    );
  }

  const hasData = totalWorkouts > 0;

  return (
    <div className="bg-[#040810] min-h-full animate-fade-in pb-[80px]">

      {/* Header */}
      <div className="bg-liftly-navy px-6 pt-12 pb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/15 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-liftly-teal/10 rounded-full blur-2xl" />
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-white tracking-tight mb-1">Your Progress</h1>
          <p className="text-white/40 text-sm font-medium">Tracking every gain you make</p>
        </div>
      </div>

      <div className="px-5 py-5 space-y-5">

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={<Target size={20} />} value={hasData ? totalWorkouts : '—'} label="Total Workouts" color="bg-blue-500/10 text-blue-400 border border-blue-500/20" />
          <StatCard icon={<Dumbbell size={20} />} value={hasData ? fmtVol(totalVolume) : '—'} label="Volume (kg)" color="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" />
          <div className="bg-gradient-to-br from-orange-400 to-red-500 p-4 rounded-3xl shadow-lg flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/20 rounded-full blur-xl -mr-4 -mt-4 transition-transform group-hover:scale-150" />
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-2 z-10 backdrop-blur-sm">
              <Flame size={20} className="text-white fill-white" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight z-10">{streak}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 mt-1 z-10">Day Streak</span>
          </div>
          <StatCard icon={<Trophy size={20} />} value={hasData ? workoutHistory[0]?.durationMinutes ? `${workoutHistory[0].durationMinutes}m` : '—' : '—'} label="Last Session" color="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" />
        </div>

        {!hasData ? (
          /* Empty state */
          <div className="bg-[#0D1526] rounded-3xl p-10 shadow-card border border-white/5 text-center">
            <div className="w-16 h-16 rounded-3xl bg-liftly-teal/10 flex items-center justify-center mx-auto mb-4 border border-white/5">
              <Dumbbell size={32} className="text-liftly-teal" />
            </div>
            <h3 className="font-black text-white text-lg mb-2">No workouts yet</h3>
            <p className="text-white/40 text-sm">Complete your first workout to start seeing your progress graphs here.</p>
          </div>
        ) : (
          <>
            {/* Weekly Volume Bar Chart */}
            <div className="bg-[#0D1526] rounded-3xl p-5 shadow-card border border-white/5">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-liftly-teal/10 flex items-center justify-center border border-white/5">
                    <CalendarDays size={14} className="text-liftly-teal" />
                  </div>
                  <h3 className="font-black text-white">Weekly Volume</h3>
                </div>
                <span className="text-[10px] font-bold bg-liftly-teal/10 border border-white/5 text-liftly-teal px-2.5 py-1 rounded-lg">This Week</span>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => v >= 1000 ? `${v/1000}k` : v} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 8 }}
                      contentStyle={{ backgroundColor: '#040810', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', fontFamily: 'Plus Jakarta Sans', color: 'white' }}
                      itemStyle={{ color: '#00ADB5', fontWeight: 800 }}
                      formatter={v => [`${v} kg`, 'Volume']}
                    />
                    <Bar dataKey="volume" fill="url(#tealGradient)" radius={[8, 8, 4, 4]} barSize={28} />
                    <defs>
                      <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00ADB5" />
                        <stop offset="100%" stopColor="#0066cc" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Muscle Radar */}
            <div className="bg-[#0D1526] rounded-3xl p-5 shadow-card border border-white/5">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center border border-white/5">
                    <RadarIcon size={14} className="text-purple-400" />
                  </div>
                  <h3 className="font-black text-white">Muscle Focus</h3>
                </div>
                <span className="text-[10px] font-bold bg-purple-500/10 border border-white/5 text-purple-400 px-2.5 py-1 rounded-lg">All Time</span>
              </div>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={muscleGroupData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="muscle" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Volume" dataKey="value" stroke="#a855f7" fill="#a855f7" fillOpacity={0.35} strokeWidth={2.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-center text-[10px] text-white/30 uppercase tracking-widest font-bold mt-1">Training distribution</p>
            </div>

            {/* Progress Line Chart */}
            {availableExercises.length > 0 && (
              <div className="bg-[#0D1526] rounded-3xl p-5 shadow-card border border-white/5">
                <div className="flex justify-between items-center mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-white/5">
                      <TrendingUp size={14} className="text-indigo-400" />
                    </div>
                    <h3 className="font-black text-white">Best Weight</h3>
                  </div>
                  <select
                    value={selectedExercise}
                    onChange={(e) => setSelectedExercise(e.target.value)}
                    className="text-[10px] font-bold bg-[#040810] border border-white/10 text-white px-2 py-1.5 rounded-lg focus:ring-0 outline-none cursor-pointer"
                  >
                    {availableExercises.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                {progressData.length > 1 ? (
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={progressData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} dy={8} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#040810', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', fontFamily: 'Plus Jakarta Sans', color: 'white' }} itemStyle={{ color: '#818cf8', fontWeight: 800 }} formatter={v => [`${v} kg`, 'Best Set']} />
                        <Line type="monotone" dataKey="weight" stroke="#818cf8" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#0D1526', stroke: '#818cf8' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-24 flex items-center justify-center text-white/30 text-sm">
                    Log more {selectedExercise} sessions to see progress
                  </div>
                )}
              </div>
            )}

            {/* Workout History */}
            <div className="bg-[#0D1526] rounded-3xl p-5 shadow-card border border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
                  <Clock size={14} className="text-white/50" />
                </div>
                <h3 className="font-black text-white">Workout History</h3>
              </div>
              <div className="space-y-2.5">
                {workoutHistory.map(w => {
                  const date = w.completedAt?.toDate?.();
                  const dateStr = date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
                  return (
                    <div key={w.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-liftly-teal/10 flex items-center justify-center shrink-0 border border-liftly-teal/20">
                        <Dumbbell size={16} className="text-liftly-teal" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-white text-sm truncate">{w.day}</p>
                        <p className="text-white/40 text-[10px]">{w.totalSets} sets · {(w.totalVolume || 0).toLocaleString()} kg · {w.durationMinutes || '?'} min</p>
                      </div>
                      <span className="text-[10px] font-bold text-white/20 shrink-0">{dateStr}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
};

const StatCard = ({ icon, value, label, color }) => (
  <div className="bg-[#0D1526] p-4 rounded-3xl border border-white/5 shadow-card flex flex-col items-center justify-center text-center">
    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2 ${color}`}>
      {icon}
    </div>
    <span className="text-2xl font-black text-white tracking-tight">{value}</span>
    <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 mt-1">{label}</span>
  </div>
);

export default Stats;
