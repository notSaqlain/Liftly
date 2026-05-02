import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, getDocs, doc, setDoc, deleteDoc, serverTimestamp, orderBy, onSnapshot } from 'firebase/firestore';
import { ChevronLeft, Bell, Check, X, UserPlus, MessageSquare } from 'lucide-react';

const Notifications = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [friendRequests, setFriendRequests] = useState([]);
  // We'll also fetch unread DMs that are NOT muted
  // But wait, the user said "the chat message shouldnt be in the notification pannel, instead add a floating number on the top of chat icon"
  // So NO messages in Notifications. Just Friend Requests for now, and a placeholder for other generic notifications.
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    const reqCollection = collection(db, 'users', currentUser.uid, 'friendRequests');
    const q = query(reqCollection, orderBy('timestamp', 'desc'));

    const unsub = onSnapshot(q, (snap) => {
      const reqsData = [];
      snap.forEach(rDoc => {
        reqsData.push({ id: rDoc.id, ...rDoc.data() });
      });
      setFriendRequests(reqsData);
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser]);

  const handleAccept = async (reqId) => {
    if (!currentUser) return;
    setProcessingId(reqId);
    try {
      await setDoc(doc(db, 'users', currentUser.uid, 'friends', reqId), { timestamp: serverTimestamp() });
      await setDoc(doc(db, 'users', reqId, 'friends', currentUser.uid), { timestamp: serverTimestamp() });
      await deleteDoc(doc(db, 'users', currentUser.uid, 'friendRequests', reqId));
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
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-[#040810] min-h-screen flex flex-col pb-20 animate-fade-in">
      <div className="bg-liftly-navy px-4 pt-12 pb-6 relative overflow-hidden shrink-0 shadow-navy">
        <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all">
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Bell size={14} className="text-yellow-400 fill-yellow-400" />
              <span className="text-yellow-400 text-[10px] font-black uppercase tracking-widest">Alerts</span>
            </div>
            <h1 className="text-2xl font-black text-white leading-none">Notifications</h1>
          </div>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-20 bg-white/5 rounded-3xl shimmer" />)}
          </div>
        ) : friendRequests.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Bell size={32} className="text-white/20" />
            </div>
            <h3 className="font-black text-white text-lg mb-1">All caught up!</h3>
            <p className="text-white/40 text-sm">You have no new notifications.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-xs font-black text-white/40 uppercase tracking-widest mb-3 px-2">New Alerts</h2>
            
            {friendRequests.map(req => (
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
                  <div className="flex-1">
                    <h3 className="font-black text-white text-sm">Friend Request</h3>
                    <p className="text-xs text-white/60 mt-0.5"><strong className="text-white">{req.fromName}</strong> wants to connect.</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-liftly-teal/10 flex items-center justify-center shrink-0">
                    <UserPlus size={14} className="text-liftly-teal" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={processingId === req.id}
                    onClick={(e) => { e.stopPropagation(); handleAccept(req.id); }}
                    className="flex-1 py-2.5 bg-liftly-teal text-liftly-navy font-black rounded-xl text-xs flex items-center justify-center gap-1 active:scale-95 transition-all"
                  >
                    <Check size={16} /> Accept
                  </button>
                  <button
                    disabled={processingId === req.id}
                    onClick={(e) => { e.stopPropagation(); handleDecline(req.id); }}
                    className="flex-1 py-2.5 bg-white/5 text-white/60 font-black rounded-xl text-xs flex items-center justify-center gap-1 active:scale-95 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <X size={16} /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
