import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp, Timestamp, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Flame, Users, Activity, CheckCircle2, Play, ChevronRight, ChevronLeft, Calendar, Dumbbell, TrendingUp, Zap, Menu, X, Scale, Trophy, Building2, Target, ShieldAlert, MapPin, MessageSquare, Bell } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const CROWD_OPTIONS = [
  { key: 'LOW', emoji: '🟢', label: 'Quiet', sub: 'Plenty of space', color: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400', active: 'bg-emerald-500 text-white border-emerald-500 shadow-lg' },
  { key: 'MEDIUM', emoji: '🟡', label: 'Moderate', sub: 'A bit busy', color: 'bg-amber-50 border-amber-200 hover:border-amber-400', active: 'bg-amber-500 text-white border-amber-500 shadow-lg' },
  { key: 'HIGH', emoji: '🔴', label: 'Packed', sub: 'Very crowded', color: 'bg-red-50 border-red-200 hover:border-red-400', active: 'bg-red-500 text-white border-red-500 shadow-lg' },
];

const Dashboard = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [reportedStatus, setReportedStatus] = useState(false);
  const [showSplitPicker, setShowSplitPicker] = useState(false);
  const [weekStats, setWeekStats] = useState({ count: 0, volume: 0 });
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);


  // Fetch recent workouts + weekly stats
  useEffect(() => {
    if (!currentUser) return;
    const fetchData = async () => {
      try {
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
        // Friend requests count
        const reqQ = query(collection(db, 'users', currentUser.uid, 'friendRequests'));
        const reqSnap = await getDocs(reqQ);
        setPendingRequestsCount(reqSnap.size);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    };
    fetchData();
  }, [currentUser]);



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
    <div className="bg-[#040810] min-h-full animate-fade-in">

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
              <span className="text-[9px] uppercase tracking-widest font-bold text-white/40">Wk Streak</span>
            </div>
            <button onClick={() => navigate('/notifications')} className="w-11 h-11 bg-white/10 border border-white/15 rounded-2xl flex items-center justify-center text-white active:scale-95 transition-all relative">
              <Bell size={20} />
              {pendingRequestsCount > 0 && (
                <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-liftly-navy" />
              )}
            </button>
          </div>
        </div>

        {/* Quick stats strip */}
        <div className="relative z-10 grid grid-cols-3 gap-3 mt-6">
          {[
            { label: 'This Week', value: weekStats.count, unit: 'workouts', icon: Calendar, color: 'text-liftly-teal' },
            { label: 'Volume', value: weekStats.volume > 999 ? `${(weekStats.volume / 1000).toFixed(1)}k` : weekStats.volume, unit: 'kg', icon: TrendingUp, color: 'text-blue-400' },
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

        {/* ── Gym Hub Card ── */}
        {userData.gymId ? (
          <div className="bg-[#0D1526] rounded-3xl p-5 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-liftly-teal/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-black text-white text-lg leading-tight">{userData.gymName}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-xs font-bold text-white/50">
                      42 Active Lifters
                    </p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 shrink-0">
                  <Building2 size={20} className="text-liftly-teal" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <button onClick={() => navigate('/gym/equipment')} className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl text-left transition-all border border-white/5">
                  <Dumbbell size={16} className="text-liftly-teal mb-2" />
                  <p className="font-bold text-white text-sm">Equipment</p>
                  <p className="text-[10px] text-white/40">Status & Reports</p>
                </button>
                <button onClick={() => navigate('/gym/trainers')} className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl text-left transition-all border border-white/5">
                  <Users size={16} className="text-purple-400 mb-2" />
                  <p className="font-bold text-white text-sm">Trainers</p>
                  <p className="text-[10px] text-white/40">Book & Message</p>
                </button>
                <button onClick={() => navigate('/gym/challenges')} className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl text-left transition-all border border-white/5">
                  <Target size={16} className="text-orange-400 mb-2" />
                  <p className="font-bold text-white text-sm">Challenges</p>
                  <p className="text-[10px] text-white/40">Join & Compete</p>
                </button>
                <button onClick={() => navigate('/gym/support')} className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl text-left transition-all border border-white/5">
                  <ShieldAlert size={16} className="text-blue-400 mb-2" />
                  <p className="font-bold text-white text-sm">Support</p>
                  <p className="text-[10px] text-white/40">Contact Staff</p>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#0D1526] rounded-3xl p-5 border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
              <MapPin size={24} className="text-liftly-teal" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-white text-sm">No License Active</h3>
              <p className="text-xs text-white/40 mt-0.5">Activate PRO license to unlock local features.</p>
            </div>
            <button onClick={() => navigate('/my-plan')} className="px-4 py-2 bg-liftly-teal text-white text-xs font-black rounded-xl active:scale-95 transition-all">
              Activate →
            </button>
          </div>
        )}
        {/* ── Quick Tools ── */}
        <div className="bg-[#0D1526] rounded-3xl p-5 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Zap size={14} className="text-yellow-500" />
              </div>
              <h3 className="font-black text-white text-sm">Quick Tools</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button onClick={() => navigate('/leaderboard')} className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl text-left transition-all border border-white/5">
                <Trophy size={16} className="text-yellow-400 mb-2" />
                <p className="font-bold text-white text-sm">Leaderboard</p>
                <p className="text-[10px] text-white/40">Global rankings</p>
              </button>
              <button onClick={() => navigate('/tools/bmi')} className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl text-left transition-all border border-white/5">
                <Activity size={16} className="text-emerald-500 mb-2" />
                <p className="font-bold text-white text-sm">BMI Check</p>
                <p className="text-[10px] text-white/40">Body mass index</p>
              </button>
              <button onClick={() => navigate('/tools/calories')} className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl text-left transition-all border border-white/5">
                <Flame size={16} className="text-orange-500 mb-2" />
                <p className="font-bold text-white text-sm">Macros</p>
                <p className="text-[10px] text-white/40">Daily targets</p>
              </button>
              <button onClick={() => navigate('/tools/weight')} className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl text-left transition-all border border-white/5">
                <Scale size={16} className="text-blue-500 mb-2" />
                <p className="font-bold text-white text-sm">Weight</p>
                <p className="text-[10px] text-white/40">Track progress</p>
              </button>
            </div>
          </div>
        </div>



        {/* ── Gym Crowd Status (V2) ── */}
        {userData.gymId && (
          <div className="bg-[#0D1526] rounded-3xl p-5 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Users size={16} className="text-emerald-400" />
              </div>
              <h3 className="font-black text-white text-sm">Live Gym Crowd</h3>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <div className="relative flex items-center justify-center w-16 h-16 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path className="text-white/5" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                  <path className="text-emerald-500" strokeDasharray="30, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-lg font-black text-white leading-none">42</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <p className="text-sm font-black text-white">Active Lifters</p>
                </div>
                <p className="text-xs text-white/50 font-medium">Moderate crowd. Plenty of space available.</p>
              </div>
            </div>
          </div>
        )}

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


    </div>
  );
};

export default Dashboard;
