import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp, Timestamp, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { createPortal } from 'react-dom';
import { Flame, Users, UserPlus, Activity, CheckCircle2, Play, ChevronRight, ChevronLeft, Calendar, Dumbbell, TrendingUp, Zap, Menu, X, Scale, Trophy, Building2, Target, ShieldAlert, MapPin, MessageSquare, Bell } from 'lucide-react';

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
  const [friends, setFriends] = useState([]);


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
        // Friends list (up to 10 for the strip)
        const friendsSnap = await getDocs(collection(db, 'users', currentUser.uid, 'friends'));
        const friendsData = [];
        for (const fDoc of friendsSnap.docs.slice(0, 10)) {
          const { getDoc, doc: firestoreDoc } = await import('firebase/firestore');
          const uDoc = await getDoc(firestoreDoc(db, 'users', fDoc.id));
          if (uDoc.exists()) friendsData.push({ id: uDoc.id, ...uDoc.data() });
        }
        setFriends(friendsData);
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
      <div className="relative overflow-hidden px-5 pt-12 pb-6">
        {/* Background gradient layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D1F38] via-[#060D1A] to-[#040810]" />
        <div className="absolute top-0 right-0 w-56 h-56 bg-[#00d4aa]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[120px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top row: Avatar + Name | Streak + Bell */}
        <div className="relative z-10 flex justify-between items-center mb-6">
          <div className="flex items-center gap-3.5">
            {/* Avatar with glow ring */}
            {photoURL ? (
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#00d4aa] to-blue-500 opacity-40 blur-[6px] scale-110" />
                <img
                  src={photoURL}
                  alt="Profile"
                  className="relative w-12 h-12 rounded-2xl object-cover ring-2 ring-[#00d4aa]/50"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#060D1A] shadow-sm" />
              </div>
            ) : (
              <div className="relative shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00d4aa]/30 to-blue-500/20 border border-[#00d4aa]/30 flex items-center justify-center text-white font-black text-lg shadow-[0_0_16px_rgba(0,212,170,0.2)]">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-white/40 text-[11px] font-semibold tracking-wide">{getGreeting()},</p>
              <h1 className="text-white text-[20px] font-black tracking-tight leading-tight capitalize">
                {displayName} <span className="text-xl">👋</span>
              </h1>
            </div>
          </div>

          {/* Right: Streak pill + Bell */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border"
              style={{
                background: 'rgba(255,255,255,0.06)',
                borderColor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Flame className="text-orange-400 fill-orange-400 shrink-0" size={16} />
              <div className="text-left">
                <p className="text-white font-black text-base leading-none">{userData?.currentStreak || 0}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/35 leading-none mt-0.5">Streak</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/notifications')}
              className="relative w-11 h-11 rounded-2xl flex items-center justify-center text-white/60 active:scale-95 transition-all border"
              style={{
                background: 'rgba(255,255,255,0.06)',
                borderColor: 'rgba(255,255,255,0.1)',
              }}
            >
              <Bell size={18} />
              {pendingRequestsCount > 0 && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
              )}
            </button>
          </div>
        </div>

        {/* Quick stats strip */}
        <div className="relative z-10 grid grid-cols-3 gap-2.5">
          {[
            { label: 'Workouts', value: weekStats.count, unit: 'this week', icon: Calendar, from: '#00d4aa', to: '#0891b2' },
            { label: 'Volume', value: weekStats.volume > 999 ? `${(weekStats.volume / 1000).toFixed(1)}k` : weekStats.volume, unit: 'kg lifted', icon: TrendingUp, from: '#818cf8', to: '#6366f1' },
            { label: 'Split', value: activeSplit ? `${activeSplit.length}d` : '—', unit: activeSplit.length > 0 ? 'active' : 'setup', icon: Dumbbell, from: '#c084fc', to: '#a855f7' },
          ].map(({ label, value, unit, icon: Icon, from, to }) => (
            <div
              key={label}
              className="rounded-2xl p-3 text-center border"
              style={{
                background: 'rgba(255,255,255,0.05)',
                borderColor: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center mx-auto mb-2"
                style={{ background: `linear-gradient(135deg, ${from}20, ${to}15)`, border: `1px solid ${from}30` }}
              >
                <Icon size={13} style={{ color: from }} />
              </div>
              <p className="text-white font-black text-lg leading-none">{value}</p>
              <p className="text-white/35 text-[9px] font-bold uppercase tracking-wider mt-1 leading-tight">{unit}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 py-5 space-y-5">

        {/* ── Start Workout CTA ── */}
        <button
          onClick={handleStartWorkout}
          className="w-full relative overflow-hidden group rounded-3xl p-6 bg-[#0D1526] border border-white/5 hover:border-liftly-teal/30 active:scale-[0.98] transition-all duration-300 shadow-xl"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-liftly-teal/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-liftly-teal/20 transition-colors duration-500" />
          
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-liftly-teal flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(0,229,209,0.4)] group-hover:shadow-[0_0_30px_rgba(0,229,209,0.6)] transition-all duration-300 group-hover:scale-105">
              <Play size={28} className="ml-1 fill-[#040810] text-[#040810]" />
            </div>
            
            <div className="text-left flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-liftly-teal animate-pulse" />
                <span className="text-liftly-teal text-[10px] font-black uppercase tracking-widest">Ready to lift</span>
              </div>
              <h2 className="text-white text-2xl font-black tracking-tight mb-0.5 group-hover:text-liftly-teal transition-colors">Start Workout</h2>
              <p className="text-white/40 text-xs font-bold">
                {activeSplit && activeSplit.length > 0 ? `${activeSplit.length}-day split active` : 'Log a new session'}
              </p>
            </div>
            
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
               <ChevronRight size={18} className="text-white/40 group-hover:text-white transition-colors" />
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

        {/* ── Friends ── */}
        <div className="surface rounded-3xl p-5 relative overflow-hidden interactive-card">
          <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                  <Users size={14} className="text-purple-400" />
                </div>
                <h3 className="font-black text-white text-sm">Friends</h3>
                {friends.length > 0 && (
                  <span className="text-[10px] font-bold bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded-lg">{friends.length}</span>
                )}
              </div>
              <button
                onClick={() => navigate('/friends')}
                className="flex items-center gap-1 text-[11px] font-bold text-white/40 hover:text-white transition-colors"
              >
                See all <ChevronRight size={13} />
              </button>
            </div>

            {friends.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3 border border-white/5">
                  <UserPlus size={20} className="text-white/20" />
                </div>
                <p className="text-white/50 text-sm font-bold">No friends yet</p>
                <p className="text-white/25 text-xs mt-0.5">Find people on the Leaderboard</p>
                <button
                  onClick={() => navigate('/leaderboard')}
                  className="mt-3 px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold rounded-xl active:scale-95 transition-all"
                >
                  Browse Leaderboard
                </button>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {friends.map(friend => (
                  <button
                    key={friend.id}
                    onClick={() => navigate(`/profile/${friend.id}`)}
                    className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition-all"
                  >
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/10 bg-white/5">
                        {friend.photoURL ? (
                          <img src={friend.photoURL} alt={friend.firstName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-black text-white/50 text-xl">
                            {friend.firstName?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      {(friend.currentStreak > 0) && (
                        <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white text-[9px] font-black px-1 rounded-md leading-tight py-0.5 shadow-sm">
                          🔥{friend.currentStreak}
                        </div>
                      )}
                    </div>
                    <p className="text-white/70 text-[10px] font-bold truncate max-w-[56px]">{friend.firstName}</p>
                  </button>
                ))}
                {/* Add friends CTA */}
                <button
                  onClick={() => navigate('/friends')}
                  className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition-all"
                >
                  <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-white/15 bg-white/3 flex items-center justify-center">
                    <UserPlus size={18} className="text-white/25" />
                  </div>
                  <p className="text-white/30 text-[10px] font-bold">Add</p>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="h-4" />
      </div>

      {/* Split Day Picker Modal */}
      {showSplitPicker && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#0D1526] border border-white/10 w-full max-w-[480px] mx-auto rounded-4xl p-6 shadow-2xl animate-slide-up">
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6" />
            <h3 className="text-xl font-black text-white mb-1">What are we hitting?</h3>
            <p className="text-white/40 text-sm mb-5">Select today's training day</p>
            <div className="space-y-2.5 max-h-[55vh] overflow-y-auto no-scrollbar">
              {activeSplit.map((dayName, idx) => {
                const dayExercises = userData?.customRoutines?.[dayName] || [];
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectDay(dayName)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all active:scale-[0.98] text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-liftly-teal/10 flex items-center justify-center">
                        <Dumbbell size={16} className="text-liftly-teal" />
                      </div>
                      <div>
                        <span className="font-black text-white">{dayName}</span>
                        <p className="text-xs text-white/40">{dayExercises.length} exercises</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-white/30" />
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowSplitPicker(false)}
              className="w-full mt-5 py-4 rounded-2xl font-bold text-white/50 bg-white/5 hover:bg-white/10 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>,
        document.body
      )}


    </div>
  );
};

export default Dashboard;
