import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, getDocs, doc, getDoc, deleteDoc, setDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { ChevronLeft, Users, UserPlus, UserCheck, X, Check, MapPin } from 'lucide-react';

const FriendsList = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('friends'); // 'friends' or 'requests'
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    const fetchFriendsAndRequests = async () => {
      setLoading(true);
      try {
        // Fetch Friends
        const friendsSnap = await getDocs(collection(db, 'users', currentUser.uid, 'friends'));
        const friendsData = [];
        for (const fDoc of friendsSnap.docs) {
          const userDoc = await getDoc(doc(db, 'users', fDoc.id));
          if (userDoc.exists()) {
            friendsData.push({ id: userDoc.id, ...userDoc.data() });
          }
        }
        setFriends(friendsData);

        // Fetch Requests
        const reqsSnap = await getDocs(query(collection(db, 'users', currentUser.uid, 'friendRequests'), orderBy('timestamp', 'desc')));
        const reqsData = [];
        for (const rDoc of reqsSnap.docs) {
          reqsData.push({ id: rDoc.id, ...rDoc.data() });
        }
        setRequests(reqsData);

      } catch (err) {
        console.error("Error fetching friends:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFriendsAndRequests();
  }, [currentUser]);

  const handleAccept = async (reqId) => {
    if (!currentUser) return;
    setProcessingId(reqId);
    try {
      await setDoc(doc(db, 'users', currentUser.uid, 'friends', reqId), { timestamp: serverTimestamp() });
      await setDoc(doc(db, 'users', reqId, 'friends', currentUser.uid), { timestamp: serverTimestamp() });
      await deleteDoc(doc(db, 'users', currentUser.uid, 'friendRequests', reqId));
      
      // Update local state
      setRequests(prev => prev.filter(r => r.id !== reqId));
      const userDoc = await getDoc(doc(db, 'users', reqId));
      if (userDoc.exists()) {
        setFriends(prev => [...prev, { id: userDoc.id, ...userDoc.data() }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (reqId) => {
    if (!currentUser) return;
    setProcessingId(reqId);
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'friendRequests', reqId));
      setRequests(prev => prev.filter(r => r.id !== reqId));
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-[#040810] min-h-full flex flex-col">
      {/* Header */}
      <div className="bg-liftly-navy px-4 pt-12 pb-6 relative overflow-hidden shrink-0 shadow-navy">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all">
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Users size={14} className="text-purple-400" />
              <span className="text-purple-400 text-[10px] font-black uppercase tracking-widest">Community</span>
            </div>
            <h1 className="text-2xl font-black text-white leading-none">Friends</h1>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-4 bg-[#0D1526] shadow-sm border-b border-white/5 sticky top-0 z-20">
        <div className="flex bg-white/5 rounded-2xl p-1">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'friends' ? 'bg-liftly-teal text-white shadow-md' : 'text-white/50 hover:text-white/80'
            }`}
          >
            <UserCheck size={16} /> My Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'requests' ? 'bg-liftly-teal text-white shadow-md' : 'text-white/50 hover:text-white/80'
            }`}
          >
            <UserPlus size={16} /> Requests
            {requests.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                {requests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 rounded-3xl shimmer" />)}
          </div>
        ) : activeTab === 'friends' ? (
          friends.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Users size={32} className="text-white/20" />
              </div>
              <p className="text-white/60 font-bold mb-1">No friends yet</p>
              <p className="text-white/40 text-sm max-w-[250px]">Find people on the Leaderboard or in Group Chats and add them!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map(friend => (
                <button
                  key={friend.id}
                  onClick={() => navigate(`/profile/${friend.id}`)}
                  className="w-full bg-[#0D1526] p-4 rounded-3xl border border-white/5 flex items-center gap-4 text-left active:scale-[0.98] transition-all"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/10 overflow-hidden shrink-0 border border-white/10">
                    {friend.photoURL ? (
                      <img src={friend.photoURL} alt={friend.firstName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-black text-white/50 text-xl">
                        {friend.firstName?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-white text-sm truncate">{friend.firstName} {friend.lastName}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <MapPin size={12} className="text-liftly-teal" />
                      <span className="text-xs text-white/40 truncate">{friend.gymName || 'Independent'}</span>
                    </div>
                  </div>
                  <div className="shrink-0 bg-white/5 px-3 py-1.5 rounded-xl flex items-center gap-1">
                    <span className="text-yellow-500 font-black text-sm">{friend.points || 0}</span>
                    <span className="text-yellow-500/50 text-[10px] font-bold uppercase">PTS</span>
                  </div>
                </button>
              ))}
            </div>
          )
        ) : (
          requests.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <UserPlus size={32} className="text-white/20" />
              </div>
              <p className="text-white/60 font-bold">No pending requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(req => (
                <div key={req.id} className="bg-[#0D1526] p-4 rounded-3xl border border-white/5 flex flex-col gap-3">
                  <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate(`/profile/${req.id}`)}>
                    <div className="w-12 h-12 rounded-2xl bg-white/10 overflow-hidden shrink-0 border border-white/10">
                      {req.fromPhoto ? (
                        <img src={req.fromPhoto} alt={req.fromName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-black text-white/50 text-xl">
                          {req.fromName?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-black text-white text-sm">{req.fromName}</h3>
                      <p className="text-xs text-white/40 mt-0.5">Wants to be friends</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={processingId === req.id}
                      onClick={(e) => { e.stopPropagation(); handleAccept(req.id); }}
                      className="flex-1 py-2.5 bg-liftly-teal text-liftly-navy font-black rounded-xl text-xs flex items-center justify-center gap-1 active:scale-95"
                    >
                      <Check size={16} /> Accept
                    </button>
                    <button
                      disabled={processingId === req.id}
                      onClick={(e) => { e.stopPropagation(); handleDecline(req.id); }}
                      className="flex-1 py-2.5 bg-white/5 text-white/60 font-black rounded-xl text-xs flex items-center justify-center gap-1 active:scale-95 border border-white/10 hover:bg-white/10"
                    >
                      <X size={16} /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default FriendsList;
