import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Search, User as UserIcon, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useSearchParams } from 'react-router-dom';

const UserSearch = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  useEffect(() => {
    const uid = searchParams.get('uid');
    const name = searchParams.get('name');
    if (uid && name) {
      handleStartChat({ id: uid, firstName: name, photoURL: null });
    }
  }, [searchParams]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (!searchTerm.trim() || searchTerm.length < 2) {
        setResults([]);
        return;
      }

      setSearching(true);
      try {
        const q = query(
          collection(db, 'users'),
          where('firstName', '>=', searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1)),
          where('firstName', '<=', searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1) + '\uf8ff')
        );
        const snap = await getDocs(q);
        const users = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(u => u.id !== currentUser.uid);
        setResults(users);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, currentUser.uid]);

  const handleStartChat = async (otherUser) => {
    if (startingChat) return;
    setStartingChat(true);

    try {
      const ids = [currentUser.uid, otherUser.id].sort();
      const conversationId = ids.join('_');

      const myDmRef = doc(db, 'users', currentUser.uid, 'dms', conversationId);
      const docSnap = await getDoc(myDmRef);

      if (!docSnap.exists()) {
        const myName = userData?.firstName || currentUser.displayName || 'Lifter';
        const myPhoto = userData?.photoURL || currentUser.photoURL || null;

        const baseDmData = {
          participantUids: [currentUser.uid, otherUser.id],
          participantNames: {
            [currentUser.uid]: myName,
            [otherUser.id]: otherUser.firstName || 'User'
          },
          participantPhotos: {
            [currentUser.uid]: myPhoto,
            [otherUser.id]: otherUser.photoURL || null
          },
          lastMessage: '',
          lastMessageAt: serverTimestamp(),
          unreadCount: 0
        };

        await setDoc(myDmRef, baseDmData);

        const theirDmRef = doc(db, 'users', otherUser.id, 'dms', conversationId);
        await setDoc(theirDmRef, { ...baseDmData, unreadCount: 1 });
      }

      navigate(`/messages/${conversationId}`, { replace: true });
    } catch (error) {
      console.error('Error starting chat:', error);
      setStartingChat(false);
    }
  };

  return (
    <div className="bg-[#040810] min-h-full flex flex-col animate-fade-in">
      <div className="bg-liftly-navy px-6 pt-12 pb-6 relative overflow-hidden shrink-0 shadow-navy">
        <div className="absolute top-0 right-0 w-48 h-48 bg-liftly-teal/15 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all backdrop-blur-sm shrink-0">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-2xl font-black text-white leading-none">New Message</h1>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={18} className="text-white/40" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 pl-12 pr-4 font-bold text-white placeholder:text-white/30 focus:outline-none focus:border-liftly-teal/50 focus:ring-1 focus:ring-liftly-teal/20 transition-all"
            placeholder="Search by first name..."
            autoFocus
          />
          {searching && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <Loader2 size={16} className="text-liftly-teal animate-spin" />
            </div>
          )}
        </div>

        <div className="flex-1">
          {searchTerm.length < 2 ? (
            <div className="text-center py-20 text-white/30">
              <UserIcon size={40} className="mx-auto mb-4 opacity-20" />
              <p className="font-bold">Type a name to search</p>
            </div>
          ) : results.length === 0 && !searching ? (
            <div className="text-center py-20 text-white/30">
              <p className="font-bold">No users found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleStartChat(user)}
                  disabled={startingChat}
                  className="w-full bg-[#0D1526] p-3 rounded-2xl border border-white/5 flex items-center justify-between active:scale-[0.98] transition-all hover:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10 shrink-0">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.firstName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/50 font-black">
                          {(user.firstName || '?').charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-white">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-white/40">{user.gymName || 'No gym selected'}</p>
                    </div>
                  </div>
                  <div className="px-4 py-2 bg-liftly-teal/10 text-liftly-teal text-xs font-black rounded-xl border border-liftly-teal/20">
                    Message
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSearch;
