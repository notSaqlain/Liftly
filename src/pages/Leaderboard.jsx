import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Trophy, Flame, Dumbbell, TrendingUp, ChevronLeft, Medal, Crown } from 'lucide-react';

const CATEGORIES = [
  { id: 'streak', label: '🔥 Streak', field: 'currentStreak', unit: 'wks', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'volume', label: '📈 Volume', field: 'totalVolumeLifted', unit: 'kg', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'bench_press', label: '🏋️ Bench Press', field: 'best1RM_bench_press', unit: 'kg', icon: Dumbbell, color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 'deadlift', label: '🏋️ Deadlift', field: 'best1RM_deadlift', unit: 'kg', icon: Dumbbell, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'squat', label: '🏋️ Squat', field: 'best1RM_squat', unit: 'kg', icon: Dumbbell, color: 'text-pink-500', bg: 'bg-pink-50' },
];

const Leaderboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'users'),
          orderBy(activeCategory.field, 'desc'),
          limit(50)
        );
        const snap = await getDocs(q);

        const fetchedLeaders = [];
        snap.forEach(doc => {
          const data = doc.data();
          // All fields are now flat top-level fields — no nested access needed
          const value = data[activeCategory.field];

          if (value !== undefined && value !== null && value > 0) {
            fetchedLeaders.push({
              id: doc.id,
              name: data.firstName
                ? `${data.firstName} ${data.lastName || ''}`.trim()
                : (data.email?.split('@')[0] || 'Lifter'),
              photoURL: data.photoURL || data.googlePhotoURL || null,
              value: value,
            });
          }
        });

        setLeaders(fetchedLeaders);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [activeCategory]);


  return (
    <div className="bg-slate-50 min-h-screen flex flex-col animate-fade-in pb-20">
      
      {/* ── Header ── */}
      <div className="bg-liftly-navy px-6 pt-12 pb-6 relative overflow-hidden shrink-0 z-10 shadow-navy">
        <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/15 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-liftly-teal/15 rounded-full blur-2xl -ml-10 -mb-10" />

        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all backdrop-blur-sm shrink-0">
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={14} className="text-yellow-400" />
              <span className="text-yellow-400/80 text-[10px] font-black uppercase tracking-widest">Global Rankings</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">Leaderboard</h1>
          </div>
        </div>
      </div>

      {/* ── Category Selector ── */}
      <div className="px-4 py-4 bg-white shadow-sm border-b border-slate-100 sticky top-0 z-20">
        <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2.5 rounded-2xl whitespace-nowrap text-xs font-black transition-all active:scale-95 flex items-center gap-2 border ${
                activeCategory.id === cat.id
                  ? 'bg-liftly-navy text-white border-liftly-navy shadow-md'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Leaderboard List ── */}
      <div className="flex-1 px-4 py-6">
        <div className="bg-white rounded-4xl p-2 shadow-card border border-slate-100/80">
          
          <div className="px-4 py-4 mb-2 flex items-center justify-between border-b border-slate-50">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeCategory.bg}`}>
                <activeCategory.icon size={16} className={activeCategory.color} />
              </div>
              <h2 className="font-black text-slate-800 text-base">{activeCategory.label.replace(/[^a-zA-Z\s]/g, '').trim()}</h2>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{activeCategory.unit}</span>
          </div>

          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 rounded-2xl shimmer" />
              ))}
            </div>
          ) : leaders.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                <Trophy size={28} className="text-slate-300" />
              </div>
              <h3 className="font-black text-slate-700 text-lg mb-1">No leaders yet</h3>
              <p className="text-sm text-slate-400 font-medium">Be the first to log this stat!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {leaders.map((leader, index) => {
                const isCurrentUser = leader.id === currentUser?.uid;
                
                let RankIcon = null;
                let rankStyle = 'text-slate-400 font-black';
                let rankBg = 'bg-slate-50 border-slate-100';

                if (index === 0) {
                  RankIcon = Crown;
                  rankStyle = 'text-yellow-500';
                  rankBg = 'bg-yellow-50 border-yellow-200';
                } else if (index === 1) {
                  RankIcon = Medal;
                  rankStyle = 'text-slate-400';
                  rankBg = 'bg-slate-100 border-slate-200';
                } else if (index === 2) {
                  RankIcon = Medal;
                  rankStyle = 'text-amber-600';
                  rankBg = 'bg-amber-50 border-amber-200';
                }

                return (
                  <div
                    key={leader.id}
                    className={`flex items-center gap-3 p-3 rounded-3xl transition-all ${
                      isCurrentUser 
                        ? 'bg-liftly-teal/10 border border-liftly-teal/30 shadow-sm' 
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    {/* Rank Number/Icon */}
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 ${rankBg}`}>
                      {RankIcon ? (
                        <RankIcon size={18} className={rankStyle} />
                      ) : (
                        <span className={`text-sm ${rankStyle}`}>#{index + 1}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    {leader.photoURL ? (
                      <img src={leader.photoURL} alt={leader.name} className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                        <span className="text-sm font-black text-slate-500">{leader.name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">
                        {leader.name}
                        {isCurrentUser && <span className="ml-2 text-[9px] uppercase tracking-wider font-black text-liftly-teal bg-white px-2 py-0.5 rounded-lg border border-liftly-teal/20">You</span>}
                      </p>
                    </div>

                    {/* Score */}
                    <div className="text-right shrink-0">
                      <p className="font-black text-liftly-navy text-lg">
                        {leader.value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Leaderboard;
