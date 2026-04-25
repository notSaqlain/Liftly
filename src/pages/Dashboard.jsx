import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp, Timestamp, orderBy, limit } from 'firebase/firestore';
import { Flame, Users, Activity, CheckCircle2, Play, ChevronRight, ChevronLeft, Calendar, Dumbbell, TrendingUp, Zap, Menu, X, Scale, Trophy } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const CROWD_OPTIONS = [
  { key: 'LOW',    emoji: '🟢', label: 'Quiet',    sub: 'Plenty of space',  color: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400', active: 'bg-emerald-500 text-white border-emerald-500 shadow-lg' },
  { key: 'MEDIUM', emoji: '🟡', label: 'Moderate', sub: 'A bit busy',        color: 'bg-amber-50 border-amber-200 hover:border-amber-400',   active: 'bg-amber-500 text-white border-amber-500 shadow-lg' },
  { key: 'HIGH',   emoji: '🔴', label: 'Packed',   sub: 'Very crowded',      color: 'bg-red-50 border-red-200 hover:border-red-400',         active: 'bg-red-500 text-white border-red-500 shadow-lg' },
];

const Dashboard = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [reportedStatus, setReportedStatus] = useState(false);
  const [showSplitPicker, setShowSplitPicker] = useState(false);
  const [showQuickTools, setShowQuickTools] = useState(false);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [weekStats, setWeekStats] = useState({ count: 0, volume: 0 });

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [workoutDates, setWorkoutDates] = useState(new Set());

  // Fetch workout dates for calendar
  useEffect(() => {
    if (!currentUser) return;
    const fetchWorkoutDates = async () => {
      const startOfMonth = new Date(calendarYear, calendarMonth, 1);
      const endOfMonth = new Date(calendarYear, calendarMonth + 1, 0, 23, 59, 59);
      try {
        const q = query(
          collection(db, 'users', currentUser.uid, 'user_workouts'),
          where('completedAt', '>=', Timestamp.fromDate(startOfMonth)),
          where('completedAt', '<=', Timestamp.fromDate(endOfMonth))
        );
        const snap = await getDocs(q);
        const dates = new Set();
        snap.forEach(doc => {
          const d = doc.data().completedAt?.toDate();
          if (d) dates.add(d.getDate());
        });
        setWorkoutDates(dates);
      } catch (error) {
        console.error('Error fetching workout dates:', error);
      }
    };
    fetchWorkoutDates();
  }, [currentUser, calendarMonth, calendarYear]);

  // Fetch recent workouts + weekly stats
  useEffect(() => {
    if (!currentUser) return;
    const fetchData = async () => {
      try {
        // Recent 3 workouts
        const recentQ = query(
          collection(db, 'users', currentUser.uid, 'user_workouts'),
          orderBy('completedAt', 'desc'),
          limit(3)
        );
        const recentSnap = await getDocs(recentQ);
        setRecentWorkouts(recentSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // This week stats
        const startOfWeek = new Date();
        startOfWeek.setHours(0, 0, 0, 0);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
        const weekQ = query(
          collection(db, 'users', currentUser.uid, 'user_workouts'),
          where('completedAt', '>=', Timestamp.fromDate(startOfWeek))
        );
        const weekSnap = await getDocs(weekQ);
        let totalVol = 0;
        weekSnap.forEach(d => { totalVol += d.data().totalVolume || 0; });
        setWeekStats({ count: weekSnap.size, volume: totalVol });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    };
    fetchData();
  }, [currentUser]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [calendarMonth, calendarYear]);

  const today = new Date();
  const isCurrentMonth = calendarMonth === today.getMonth() && calendarYear === today.getFullYear();

  const prevMonth = () => {
    if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1); }
    else setCalendarMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1); }
    else setCalendarMonth(m => m + 1);
  };

  const reportCrowd = async (status) => {
    if (!currentUser || reportedStatus) return;
    try {
      await addDoc(collection(db, 'gym_status'), {
        status, reportedBy: currentUser.uid, timestamp: serverTimestamp()
      });
      setReportedStatus(true);
    } catch (error) {
      console.error('Error reporting gym status:', error);
    }
  };

  const displayName = userData?.firstName || currentUser?.displayName?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'Lifter';
  const photoURL = userData?.photoURL || currentUser?.photoURL || null;
  const activeSplit = Object.keys(userData?.customRoutines || {});

  const handleStartWorkout = () => {
    if (activeSplit.length === 0) { navigate('/workout'); return; }
    setShowSplitPicker(true);
  };
  const handleSelectDay = (dayName) => {
    setShowSplitPicker(false);
    navigate(`/active-workout?day=${encodeURIComponent(dayName)}`);
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (!userData) {
    return (
      <div className="flex justify-center items-center p-6 h-[80vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-liftly-teal/10 flex items-center justify-center">
            <Activity className="text-liftly-teal w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-2.5 w-40 bg-slate-200 rounded-full shimmer" />
            <div className="h-2 w-28 bg-slate-100 rounded-full shimmer mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-full animate-fade-in">

      {/* ── Header ── */}
      <div className="bg-liftly-navy px-6 pt-12 pb-8 relative overflow-hidden">
        {/* Decorative glows */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-liftly-teal/15 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -ml-10 -mb-10" />

        <div className="relative z-10 flex justify-between items-start">
          <div className="flex items-center gap-3">
            {photoURL ? (
              <div className="relative">
                <img src={photoURL} alt="Profile" className="w-12 h-12 rounded-2xl object-cover ring-2 ring-liftly-teal/40 shrink-0" referrerPolicy="no-referrer" />
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-liftly-navy" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-liftly-teal/20 border border-liftly-teal/30 flex items-center justify-center text-white font-black text-lg shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-white/50 text-xs font-semibold">{getGreeting()},</p>
              <h1 className="text-white text-xl font-black tracking-tight capitalize">{displayName} 👋</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 border border-white/15 px-3 py-2 rounded-2xl flex flex-col items-center">
              <div className="flex items-center space-x-1">
                <Flame className="text-orange-400 fill-orange-400" size={18} />
                <span className="text-xl font-black text-white">{userData?.currentStreak || 0}</span>
              </div>
              <span className="text-[9px] uppercase tracking-widest font-bold text-white/40">Streak</span>
            </div>
            <button onClick={() => setShowQuickTools(true)} className="w-11 h-11 bg-white/10 border border-white/15 rounded-2xl flex items-center justify-center text-white active:scale-95 transition-all">
              <Menu size={22} />
            </button>
          </div>
        </div>

        {/* Quick stats strip */}
        <div className="relative z-10 grid grid-cols-3 gap-3 mt-6">
          {[
            { label: 'This Week', value: weekStats.count, unit: 'workouts', icon: Calendar, color: 'text-liftly-teal' },
            { label: 'Volume', value: weekStats.volume > 999 ? `${(weekStats.volume/1000).toFixed(1)}k` : weekStats.volume, unit: 'kg', icon: TrendingUp, color: 'text-blue-400' },
            { label: 'Split', value: activeSplit ? `${activeSplit.length}d` : '—', unit: activeSplit ? 'active' : 'setup', icon: Dumbbell, color: 'text-purple-400' },
          ].map(({ label, value, unit, icon: Icon, color }) => (
            <div key={label} className="bg-white/[0.08] border border-white/10 rounded-2xl p-3 text-center">
              <Icon size={14} className={`${color} mx-auto mb-1`} />
              <p className="text-white font-black text-lg leading-none">{value}</p>
              <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider mt-0.5">{unit}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 py-5 space-y-5">

        {/* ── Start Workout CTA ── */}
        <button
          onClick={handleStartWorkout}
          className="w-full relative overflow-hidden group rounded-3xl p-5 shadow-teal active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-liftly-teal/40"
          style={{ background: 'linear-gradient(135deg, #00ADB5 0%, #0066cc 100%)' }}
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-500" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl" />

          <div className="relative z-10 flex justify-between items-center">
            <div>
              <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Ready?</p>
              <h2 className="text-white text-2xl font-black tracking-tight">Start Workout</h2>
              <p className="text-white/70 text-xs font-medium mt-1">
                {activeSplit ? `${activeSplit.length}-day split active` : 'Log a new session'}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:scale-110 group-active:scale-95 transition-all duration-200 shrink-0">
              <Play size={26} className="ml-0.5 fill-white text-white" />
            </div>
          </div>
        </button>



        {/* ── Recent Workouts ── */}
        {recentWorkouts.length > 0 && (
          <div className="bg-white rounded-3xl p-5 shadow-card border border-slate-100/80">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-liftly-teal/10 flex items-center justify-center">
                  <Zap size={14} className="text-liftly-teal" />
                </div>
                <h3 className="font-black text-slate-800 text-sm">Recent Sessions</h3>
              </div>
              <button onClick={() => navigate('/stats')} className="text-xs font-bold text-liftly-teal">
                See All →
              </button>
            </div>
            <div className="space-y-2">
              {recentWorkouts.map((w) => {
                const date = w.completedAt?.toDate?.();
                const dateStr = date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                return (
                  <div key={w.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-liftly-teal/10 flex items-center justify-center shrink-0">
                      <Dumbbell size={16} className="text-liftly-teal" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{w.day}</p>
                      <p className="text-slate-400 text-[10px]">{w.totalSets} sets · {w.totalVolume?.toLocaleString() || 0} kg</p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 shrink-0">{dateStr}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Workout Calendar ── */}
        <div className="bg-white rounded-3xl p-5 shadow-card border border-slate-100/80">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <Calendar size={14} className="text-blue-500" />
              </div>
              <h3 className="font-black text-slate-800 text-sm">Workout Calendar</h3>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={prevMonth} className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 active:scale-90 transition-all">
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-bold text-slate-600 min-w-[110px] text-center">
                {MONTHS[calendarMonth]} {calendarYear}
              </span>
              <button onClick={nextMonth} className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 active:scale-90 transition-all">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[9px] font-black uppercase tracking-wider text-slate-300 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;
              const isToday = isCurrentMonth && day === today.getDate();
              const hasWorkout = workoutDates.has(day);
              return (
                <div
                  key={day}
                  className={`relative aspect-square flex items-center justify-center rounded-xl text-xs font-bold transition-all ${
                    isToday
                      ? 'bg-liftly-navy text-white shadow-navy'
                      : hasWorkout
                      ? 'bg-liftly-teal/15 text-liftly-teal'
                      : 'text-slate-400'
                  }`}
                >
                  {day}
                  {hasWorkout && !isToday && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-liftly-teal" />}
                  {hasWorkout && isToday && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white" />}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-5 mt-4 pt-3 border-t border-slate-50">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-liftly-navy" />
              <span className="text-[10px] font-semibold text-slate-400">Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-liftly-teal/30" />
              <span className="text-[10px] font-semibold text-slate-400">Worked out</span>
            </div>
          </div>
        </div>

        {/* ── Gym Crowd Status ── */}
        <div className="bg-white rounded-3xl p-5 shadow-card border border-slate-100/80">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users size={14} className="text-blue-500" />
            </div>
            <h3 className="font-black text-slate-800 text-sm">Gym Crowd Status</h3>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-slate-600">Community Consensus:</span>
            </div>
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-lg">🟢 Quiet</span>
          </div>

          {reportedStatus ? (
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} className="text-emerald-500" />
              </div>
              <div>
                <p className="font-bold text-emerald-700 text-sm">Thanks for reporting!</p>
                <p className="text-emerald-600/70 text-xs">Your update helps the community.</p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-slate-400 text-xs font-medium mb-4">How crowded is your gym right now?</p>
              <div className="grid grid-cols-3 gap-3">
                {CROWD_OPTIONS.map(({ key, emoji, label, sub, color }) => (
                  <button
                    key={key}
                    onClick={() => reportCrowd(key)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all active:scale-95 focus:outline-none ${color}`}
                  >
                    <span className="text-2xl mb-1">{emoji}</span>
                    <span className="text-xs font-black text-slate-700">{label}</span>
                    <span className="text-[9px] text-slate-400 font-medium">{sub}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="h-4" />
      </div>

      {/* Split Day Picker Modal */}
      {showSplitPicker && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-[400px] rounded-4xl p-6 shadow-2xl animate-slide-up">
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6" />
            <h3 className="text-xl font-black text-slate-800 mb-1">What are we hitting?</h3>
            <p className="text-slate-400 text-sm mb-5">Select today's training day</p>
            <div className="space-y-2.5 max-h-[55vh] overflow-y-auto no-scrollbar">
              {activeSplit.map((dayName, idx) => {
                const dayExercises = userData?.customRoutines?.[dayName] || [];
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectDay(dayName)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-liftly-teal/5 border border-slate-100 hover:border-liftly-teal/20 transition-all active:scale-[0.98] text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-liftly-teal/10 flex items-center justify-center">
                        <Dumbbell size={16} className="text-liftly-teal" />
                      </div>
                      <div>
                        <span className="font-black text-slate-800">{dayName}</span>
                        <p className="text-xs text-slate-400">{dayExercises.length} exercises</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-300" />
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowSplitPicker(false)}
              className="w-full mt-5 py-4 rounded-2xl font-bold text-slate-400 bg-slate-50 hover:bg-slate-100 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Quick Tools Modal */}
      {showQuickTools && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-[400px] rounded-4xl p-6 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-800">Quick Tools</h3>
                <p className="text-slate-400 text-sm">Access your fitness calculators</p>
              </div>
              <button onClick={() => setShowQuickTools(false)} className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 active:scale-90 transition-all">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-3">
              <button onClick={() => { setShowQuickTools(false); navigate('/leaderboard'); }} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-yellow-50 border border-slate-100 transition-all active:scale-[0.98] text-left">
                <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center shrink-0">
                  <Trophy size={20} className="text-yellow-500" />
                </div>
                <div>
                  <span className="font-black text-slate-800 block">Leaderboard</span>
                  <span className="text-xs text-slate-400 font-semibold">View global community rankings</span>
                </div>
              </button>
              
              <button onClick={() => { setShowQuickTools(false); navigate('/tools/bmi'); }} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 transition-all active:scale-[0.98] text-left">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <Activity size={20} className="text-emerald-500" />
                </div>
                <div>
                  <span className="font-black text-slate-800 block">BMI Calculator</span>
                  <span className="text-xs text-slate-400 font-semibold">Check your body mass index</span>
                </div>
              </button>
              
              <button onClick={() => { setShowQuickTools(false); navigate('/tools/calories'); }} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-orange-50 border border-slate-100 transition-all active:scale-[0.98] text-left">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                  <Flame size={20} className="text-orange-500" />
                </div>
                <div>
                  <span className="font-black text-slate-800 block">Calorie Goals</span>
                  <span className="text-xs text-slate-400 font-semibold">Calculate your daily macros</span>
                </div>
              </button>
              
              <button onClick={() => { setShowQuickTools(false); navigate('/tools/weight'); }} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-100 transition-all active:scale-[0.98] text-left">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                  <Scale size={20} className="text-blue-500" />
                </div>
                <div>
                  <span className="font-black text-slate-800 block">Weight Tracker</span>
                  <span className="text-xs text-slate-400 font-semibold">Log and view weight history</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
