import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, collection, getDocs, addDoc } from 'firebase/firestore';
import { ChevronLeft, MessageCircle, UserPlus, Clock, Check, X, Star, TrendingUp, Dumbbell, Trophy } from 'lucide-react';

const ACHIEVEMENTS = [
  { id: 'first', label: 'First Workout', icon: '🏋️', threshold: 1, stat: 'workouts' },
  { id: 'ten', label: '10 Workouts', icon: '💪', threshold: 10, stat: 'workouts' },
  { id: 'fifty', label: '50 Workouts', icon: '🔥', threshold: 50, stat: 'workouts' },
  { id: 'points500', label: 'Bronze Lifter', icon: '🥉', threshold: 500, stat: 'points' },
  { id: 'points1000', label: 'Silver Lifter', icon: '🥈', threshold: 1000, stat: 'points' },
  { id: 'volume100k', label: '100k kg Lifted', icon: '🏆', threshold: 100000, stat: 'volume' },
];

const PublicProfile = () => {
  const { uid } = useParams();
  const { currentUser, userData: myData } = useAuth();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  
  // Friend State: 'none' | 'pending_sent' | 'pending_received' | 'friends'
  const [friendState, setFriendState] = useState('none');
  const [processing, setProcessing] = useState(false);

  const isMe = currentUser?.uid === uid;

  useEffect(() => {
    if (isMe) {
      navigate('/profile', { replace: true });
      return;
    }

    const fetchProfileAndFriendStatus = async () => {
      try {
        // Fetch User Profile
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          setUser({ id: userDoc.id, ...userDoc.data() });
          // Fetch workouts for achievements
          const snap = await getDocs(collection(db, 'users', uid, 'user_workouts'));
          setTotalWorkouts(snap.size);
        } else {
          setUser(null);
        }

        // Fetch Friend Status
        if (currentUser) {
          const friendDoc = await getDoc(doc(db, 'users', currentUser.uid, 'friends', uid));
          if (friendDoc.exists()) {
            setFriendState('friends');
          } else {
            // Check if I sent a request
            const sentReq = await getDoc(doc(db, 'users', uid, 'friendRequests', currentUser.uid));
            if (sentReq.exists()) {
              setFriendState('pending_sent');
            } else {
              // Check if they sent me a request
              const receivedReq = await getDoc(doc(db, 'users', currentUser.uid, 'friendRequests', uid));
              if (receivedReq.exists()) {
                setFriendState('pending_received');
              } else {
                setFriendState('none');
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndFriendStatus();
  }, [uid, currentUser, isMe, navigate]);

  const handleFriendAction = async () => {
    if (processing || !currentUser || !user) return;
    setProcessing(true);

    try {
      if (friendState === 'none') {
        // Send request
        await setDoc(doc(db, 'users', uid, 'friendRequests', currentUser.uid), {
          timestamp: serverTimestamp(),
          status: 'pending',
          fromName: myData?.firstName || currentUser.displayName || 'Lifter',
          fromPhoto: myData?.photoURL || currentUser.photoURL || null
        });
        setFriendState('pending_sent');
      } 
      else if (friendState === 'pending_sent') {
        // Cancel request
        await deleteDoc(doc(db, 'users', uid, 'friendRequests', currentUser.uid));
        setFriendState('none');
      }
      else if (friendState === 'pending_received') {
        // Accept request
        await setDoc(doc(db, 'users', currentUser.uid, 'friends', uid), { timestamp: serverTimestamp() });
        await setDoc(doc(db, 'users', uid, 'friends', currentUser.uid), { timestamp: serverTimestamp() });
        await deleteDoc(doc(db, 'users', currentUser.uid, 'friendRequests', uid));
        setFriendState('friends');
      }
      else if (friendState === 'friends') {
        // Remove friend
        if (window.confirm(`Remove ${user.firstName} from friends?`)) {
          await deleteDoc(doc(db, 'users', currentUser.uid, 'friends', uid));
          await deleteDoc(doc(db, 'users', uid, 'friends', currentUser.uid));
          setFriendState('none');
        }
      }
    } catch (error) {
      console.error("Error updating friend status:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleMessage = async () => {
    navigate(`/messages/search?uid=${uid}&name=${encodeURIComponent(user.firstName)}`);
  };

  const handleNudge = async () => {
    // Send a quick DM nudge
    if (processing || !currentUser || !user) return;
    setProcessing(true);
    try {
      const ids = [currentUser.uid, uid].sort();
      const conversationId = ids.join('_');
      
      const text = "Let's hit the gym! 🔥";
      
      const myDmRef = doc(db, 'users', currentUser.uid, 'dms', conversationId);
      const theirDmRef = doc(db, 'users', uid, 'dms', conversationId);
      
      const msgData = {
        text,
        uid: currentUser.uid,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'users', currentUser.uid, 'dms', conversationId, 'messages'), msgData);
      await addDoc(collection(db, 'users', uid, 'dms', conversationId, 'messages'), msgData);
      
      // Update snippet
      const myName = myData?.firstName || currentUser.displayName || 'Lifter';
      const myPhoto = myData?.photoURL || currentUser.photoURL || null;

      const baseDmData = {
        participantUids: [currentUser.uid, uid],
        participantNames: { [currentUser.uid]: myName, [uid]: user.firstName },
        participantPhotos: { [currentUser.uid]: myPhoto, [uid]: user.photoURL || null },
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
      };

      await setDoc(myDmRef, { ...baseDmData, unreadCount: 0 }, { merge: true });
      // For their side, we need to increment unread count. Since we can't easily increment without a transaction, we just set it to 1 for now or get and increment.
      const theirDoc = await getDoc(theirDmRef);
      const unreadCount = theirDoc.exists() ? (theirDoc.data().unreadCount || 0) + 1 : 1;
      await setDoc(theirDmRef, { ...baseDmData, unreadCount }, { merge: true });
      
      alert("Nudge sent!");
    } catch (error) {
      console.error("Error sending nudge:", error);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="bg-[#040810] min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="bg-[#040810] min-h-full flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-black text-white mb-2">User Not Found</h2>
        <p className="text-white/40 mb-6">This lifter doesn't exist or deleted their account.</p>
        <button onClick={() => navigate(-1)} className="px-6 py-3 bg-white/10 text-white rounded-2xl font-bold">Go Back</button>
      </div>
    );
  }

  const fmtVolume = (v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(1)}k` : v.toString();

  const unlockedAchievements = ACHIEVEMENTS.filter(a => {
    if (a.stat === 'workouts') return totalWorkouts >= a.threshold;
    if (a.stat === 'points') return (user.points || 0) >= a.threshold;
    if (a.stat === 'volume') return (user.totalVolumeLifted || 0) >= a.threshold;
    return false;
  });

  return (
    <div className="bg-[#040810] min-h-full flex flex-col relative animate-fade-in">
      {/* Header */}
      <div className="bg-liftly-navy px-4 pt-12 pb-8 relative overflow-hidden shrink-0 shadow-navy rounded-b-[40px]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-liftly-teal/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -ml-20 -mb-10" />
        
        <div className="relative z-10 flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all backdrop-blur-sm">
            <ChevronLeft size={20} />
          </button>
          <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Lifter Profile</span>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-28 h-28 rounded-[2rem] overflow-hidden bg-white/10 border-4 border-[#040810] shadow-xl mb-4 relative">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.firstName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/50 font-black text-4xl">
                {user.firstName?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h1 className="text-3xl font-black text-white mb-1">{user.firstName} {user.lastName}</h1>
          <p className="text-liftly-teal font-bold text-sm tracking-wide">{user.gymName || 'Independent Lifter'}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="relative z-20 flex justify-center gap-3 -mt-6 px-6">
        <button 
          onClick={handleMessage}
          className="flex-1 py-3.5 bg-liftly-teal text-liftly-navy font-black rounded-2xl shadow-teal flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <MessageCircle size={18} /> Message
        </button>
        
        <button 
          onClick={handleFriendAction}
          disabled={processing}
          className={`flex-1 py-3.5 font-black rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all border ${
            friendState === 'friends' ? 'bg-white/10 text-white border-white/10' :
            friendState === 'pending_sent' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
            friendState === 'pending_received' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
            'bg-[#0D1526] text-white border-white/10 hover:bg-white/5'
          }`}
        >
          {friendState === 'none' && <><UserPlus size={18} /> Add Friend</>}
          {friendState === 'pending_sent' && <><Clock size={18} /> Requested</>}
          {friendState === 'pending_received' && <><Check size={18} /> Accept Request</>}
          {friendState === 'friends' && <><Check size={18} /> Friends</>}
        </button>
      </div>

      {/* Quick Nudge (only if friends) */}
      {friendState === 'friends' && (
        <div className="px-6 mt-4">
          <button 
            onClick={handleNudge}
            disabled={processing}
            className="w-full py-3 bg-[#0D1526] text-white/70 font-bold text-sm rounded-xl border border-white/5 hover:bg-white/5 transition-all flex items-center justify-center gap-2"
          >
            🔥 Send a Quick Nudge
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="p-6 space-y-6">

        {/* Achievements */}
        {unlockedAchievements.length > 0 && (
          <div className="bg-[#0D1526] rounded-3xl p-5 border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Trophy size={15} className="text-yellow-500" />
              </div>
              <h2 className="font-black text-white text-sm">Achievements</h2>
              <span className="ml-auto text-[10px] font-bold bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-lg">
                {unlockedAchievements.length}/{ACHIEVEMENTS.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ACHIEVEMENTS.map(a => {
                const unlocked = unlockedAchievements.some(u => u.id === a.id);
                return (
                  <div
                    key={a.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      unlocked
                        ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                        : 'bg-white/5 border-white/5 text-white/30'
                    }`}
                  >
                    <span className={unlocked ? '' : 'grayscale opacity-40'}>{a.icon}</span>
                    {a.label}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-3">Core Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0D1526] p-4 rounded-3xl border border-white/5 flex flex-col justify-between aspect-square">
              <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 flex items-center justify-center mb-2">
                <Star size={20} className="text-yellow-500 fill-yellow-500" />
              </div>
              <div>
                <p className="text-3xl font-black text-white">{user.points || 0}</p>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Total Points</p>
              </div>
            </div>
            
            <div className="bg-[#0D1526] p-4 rounded-3xl border border-white/5 flex flex-col justify-between aspect-square">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-2">
                <TrendingUp size={20} className="text-blue-500" />
              </div>
              <div>
                <p className="text-3xl font-black text-white">{fmtVolume(user.totalVolumeLifted || 0)}</p>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Total Volume (kg)</p>
              </div>
            </div>
          </div>
        </div>

        {/* PRs */}
        <div>
          <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Trophy size={14} /> Personal Records
          </h3>
          <div className="bg-[#0D1526] rounded-3xl border border-white/5 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Dumbbell size={14} className="text-purple-400" />
                </div>
                <span className="font-bold text-white text-sm">Bench Press</span>
              </div>
              <span className="font-black text-white">{user.best1RM_bench_press || 0} <span className="text-[10px] text-white/40">kg</span></span>
            </div>
            
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Dumbbell size={14} className="text-emerald-400" />
                </div>
                <span className="font-bold text-white text-sm">Deadlift</span>
              </div>
              <span className="font-black text-white">{user.best1RM_deadlift || 0} <span className="text-[10px] text-white/40">kg</span></span>
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-pink-500/10 flex items-center justify-center">
                  <Dumbbell size={14} className="text-pink-400" />
                </div>
                <span className="font-bold text-white text-sm">Squat</span>
              </div>
              <span className="font-black text-white">{user.best1RM_squat || 0} <span className="text-[10px] text-white/40">kg</span></span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PublicProfile;
