import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Trophy, Star, Dumbbell, TrendingUp, ChevronLeft, Medal, Crown, Globe, Building2, Users } from 'lucide-react';

const CATEGORIES = [
  { id: 'points', label: '⭐ Points', field: 'points', unit: 'pts', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  { id: 'volume', label: '📈 Volume', field: 'totalVolumeLifted', unit: 'kg', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'bench_press', label: '🏋️ Bench Press', field: 'best1RM_bench_press', unit: 'kg', icon: Dumbbell, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 'deadlift', label: '🏋️ Deadlift', field: 'best1RM_deadlift', unit: 'kg', icon: Dumbbell, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 'squat', label: '🏋️ Squat', field: 'best1RM_squat', unit: 'kg', icon: Dumbbell, color: 'text-pink-500', bg: 'bg-pink-500/10' },
];

const Leaderboard = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [boardMode, setBoardMode] = useState('global');
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  const isGymMode = boardMode === 'gym';
  const gymId = userData?.gymId;

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        if (boardMode === 'friends' && currentUser) {
          const friendsSnap = await getDocs(collection(db, 'users', currentUser.uid, 'friends'));
          const friendIds = friendsSnap.docs.map(d => d.id);
          friendIds.push(currentUser.uid);

          const fetchedLeaders = [];
          for (const fid of friendIds) {
            const fdoc = await getDoc(doc(db, 'users', fid));
            if (fdoc.exists()) {
              const data = fdoc.data();
              const value = data[activeCategory.field];
              if (value !== undefined && value !== null && value > 0) {
                fetchedLeaders.push({
                  id: fdoc.id,
                  name: data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : (data.email?.split('@')[0] || 'Lifter'),
                  photoURL: data.photoURL || data.googlePhotoURL || null,
                  value: value,
                });
              }
            }
          }
          fetchedLeaders.sort((a, b) => b.value - a.value);
          setLeaders(fetchedLeaders.slice(0, 50));
          setLoading(false);
          return;
        }

        let q;
        if (isGymMode && gymId) {
          q = query(
            collection(db, 'users'),
            where('gymId', '==', gymId),
            orderBy(activeCategory.field, 'desc'),
            limit(50)
          );
        } else {
          q = query(
            collection(db, 'users'),
            orderBy(activeCategory.field, 'desc'),
            limit(50)
          );
        }
        const snap = await getDocs(q);

        const fetchedLeaders = [];
        snap.forEach(doc => {
          const data = doc.data();
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
  }, [activeCategory, boardMode, gymId, currentUser]);

  return (
    <div className="bg-[#040810] min-h-full flex flex-col animate-fade-in">
      
      {/* ── Header ── */}
      <div className="bg-liftly-navy px-6 pt-12 pb-4 relative overflow-hidden shrink-0 z-10 shadow-navy">
        <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/15 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-liftly-teal/15 rounded-full blur-2xl -ml-10 -mb-10" />

        <div className="relative z-10 flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all backdrop-blur-sm shrink-0">
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={14} className="text-yellow-400" />
              <span className="text-yellow-400/80 text-[10px] font-black uppercase tracking-widest">
                {boardMode === 'gym' && gymId ? userData?.gymName : boardMode === 'friends' ? 'Friends Rankings' : 'Global Rankings'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">Leaderboard</h1>
          </div>
        </div>

        {/* Global / My Gym Toggle */}
        <div className="relative z-10 flex bg-white/5 p-1 rounded-2xl gap-1 border border-white/5">
          <button
            onClick={() => setBoardMode('global')}
            className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
              !isGymMode ? 'bg-liftly-teal text-liftly-navy shadow-md' : 'text-white/50 hover:text-white/80'
            }`}
          >
            <Globe size={13} /> Global
          </button>
          <button
            onClick={() => setBoardMode('gym')}
            className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
              isGymMode ? 'bg-liftly-teal text-liftly-navy shadow-md' : 'text-white/50 hover:text-white/80'
            }`}
          >
            <Building2 size={13} /> My Gym
          </button>
          <button
            onClick={() => setBoardMode('friends')}
            className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
              boardMode === 'friends' ? 'bg-liftly-teal text-liftly-navy shadow-md' : 'text-white/50 hover:text-white/80'
            }`}
          >
            <Users size={13} /> Friends
          </button>
        </div>
      </div>

      {/* ── Category Selector ── */}
      <div className="px-4 py-4 bg-[#070B14] shadow-sm border-b border-white/5 sticky top-0 z-20">
        <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2.5 rounded-2xl whitespace-nowrap text-xs font-black transition-all active:scale-95 flex items-center gap-2 border ${
                activeCategory.id === cat.id
                  ? 'bg-liftly-navy text-white border-liftly-navy shadow-md ring-1 ring-white/10'
                  : 'bg-white/5 text-white/50 border-white/5 hover:bg-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Leaderboard List ── */}
      <div className="flex-1 px-4 py-6">
        {isGymMode && !gymId ? (
          <div className="p-10 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-4 border border-white/10">
              <Building2 size={28} className="text-white/30" />
            </div>
            <h3 className="font-black text-white text-lg mb-1">No gym license active</h3>
            <p className="text-sm text-white/50 font-medium mb-4">Activate PRO license to view local rankings.</p>
            <button onClick={() => navigate('/my-plan')} className="px-4 py-2 bg-liftly-teal text-white text-xs font-black rounded-xl active:scale-95 transition-all">
              Activate License →
            </button>
          </div>
        ) : (
          <div className="bg-[#0D1526] rounded-4xl p-2 border border-white/5">
            
            <div className="px-4 py-4 mb-2 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeCategory.bg}`}>
                  <activeCategory.icon size={16} className={activeCategory.color} />
                </div>
                <h2 className="font-black text-white text-base">{activeCategory.label.replace(/[^a-zA-Z\s]/g, '').trim()}</h2>
              </div>
              <span className="text-xs font-bold text-white/40 uppercase tracking-wider">{activeCategory.unit}</span>
            </div>

            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-16 rounded-2xl shimmer bg-white/5" />
                ))}
              </div>
            ) : leaders.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                  <Trophy size={28} className="text-white/30" />
                </div>
                <h3 className="font-black text-white text-lg mb-1">No leaders yet</h3>
                <p className="text-sm text-white/50 font-medium">Be the first to log this stat!</p>
              </div>
            ) : (
              <div className="space-y-1">
                {leaders.map((leader, index) => {
                  const isCurrentUser = leader.id === currentUser?.uid;
                  
                  let RankIcon = null;
                  let rankStyle = 'text-white/40 font-black';
                  let rankBg = 'bg-white/5 border-white/5';

                  if (index === 0) {
                    RankIcon = Crown;
                    rankStyle = 'text-yellow-500';
                    rankBg = 'bg-yellow-500/10 border-yellow-500/20';
                  } else if (index === 1) {
                    RankIcon = Medal;
                    rankStyle = 'text-slate-300';
                    rankBg = 'bg-white/10 border-white/20';
                  } else if (index === 2) {
                    RankIcon = Medal;
                    rankStyle = 'text-amber-500';
                    rankBg = 'bg-amber-500/10 border-amber-500/20';
                  }

                  return (
                    <button
                      key={leader.id}
                      onClick={() => navigate(`/profile/${leader.id}`)}
                      className={`w-full flex items-center text-left gap-3 p-3 rounded-3xl transition-all cursor-pointer ${
                        isCurrentUser 
                          ? 'bg-liftly-teal/10 border border-liftly-teal/30 shadow-sm' 
                          : 'bg-[#0D1526] hover:bg-white/5 border border-white/5'
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
                        <img src={leader.photoURL} alt={leader.name} className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                          <span className="text-sm font-black text-white/50">{leader.name.charAt(0).toUpperCase()}</span>
                        </div>
                      )}

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm truncate">
                          {leader.name}
                          {isCurrentUser && <span className="ml-2 text-[9px] uppercase tracking-wider font-black text-liftly-navy bg-liftly-teal px-2 py-0.5 rounded-lg border border-liftly-teal">You</span>}
                        </p>
                      </div>

                      {/* Score */}
                      <div className="text-right shrink-0">
                        <p className="font-black text-white text-lg">
                          {leader.value.toLocaleString()}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default Leaderboard;
