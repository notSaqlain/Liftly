import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { MessageSquare, Edit, Search, Globe, Building2, ShieldAlert, Users, BellOff } from 'lucide-react';

const ChatHub = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const hasGym = !!userData?.gymId;

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'users', currentUser.uid, 'dms'),
      orderBy('lastMessageAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setConversations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser]);

  const formatTime = (ts) => {
    if (!ts?.toDate) return '';
    const date = ts.toDate();
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getOtherParticipant = (conv) => {
    const otherUid = conv.participantUids.find(id => id !== currentUser.uid);
    return {
      uid: otherUid,
      name: conv.participantNames[otherUid] || 'Unknown',
      photo: conv.participantPhotos[otherUid] || null
    };
  };

  return (
    <div className="bg-[#040810] min-h-screen flex flex-col pb-24 animate-fade-in">
      <div className="bg-liftly-navy px-6 pt-12 pb-6 relative overflow-hidden shrink-0 shadow-navy">
        <div className="absolute top-0 right-0 w-48 h-48 bg-liftly-teal/15 rounded-full blur-3xl -mr-16 -mt-16" />
        
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare size={14} className="text-liftly-teal" />
              <span className="text-liftly-teal text-[10px] font-black uppercase tracking-widest">Inbox</span>
            </div>
            <h1 className="text-2xl font-black text-white leading-none tracking-tight">Chats</h1>
          </div>
          <button 
            onClick={() => navigate('/messages/search')}
            className="w-11 h-11 rounded-2xl bg-liftly-teal flex items-center justify-center text-liftly-navy active:scale-95 transition-all shadow-teal"
          >
            <Edit size={18} className="ml-0.5" />
          </button>
        </div>

        <div className="relative z-10">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={16} className="text-white/40" />
          </div>
          <input
            type="text"
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-liftly-teal/50 focus:bg-white/10 text-white placeholder:text-white/40 transition-all font-medium"
            placeholder="Search communities and chats..."
          />
        </div>
      </div>

      <div className="flex-1 p-4 space-y-6">
        
        {/* Pinned Communities & Services */}
        <div className="space-y-2">
          <h2 className="text-xs font-black text-white/40 uppercase tracking-widest mb-3 px-2">Communities & Support</h2>
          
          <button
            onClick={() => navigate('/chat/group/global')}
            className="w-full bg-[#0D1526] p-4 rounded-3xl border border-white/5 flex items-center gap-4 active:scale-[0.98] transition-all text-left group hover:bg-white/5"
          >
            <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Globe size={24} className="text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white truncate">Global Community</h3>
              <p className="text-xs text-white/40 truncate">Chat with lifters worldwide</p>
            </div>
          </button>

          {hasGym && (
            <button
              onClick={() => navigate('/chat/group/gym')}
              className="w-full bg-[#0D1526] p-4 rounded-3xl border border-white/5 flex items-center gap-4 active:scale-[0.98] transition-all text-left group hover:bg-white/5"
            >
              <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 bg-liftly-teal/10 border border-liftly-teal/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Building2 size={24} className="text-liftly-teal" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white truncate">{userData.gymName} Community</h3>
                <p className="text-xs text-white/40 truncate">Your local gym feed</p>
              </div>
            </button>
          )}

          {hasGym && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button onClick={() => navigate('/gym/support')} className="bg-[#0D1526] hover:bg-white/5 p-4 rounded-3xl text-left transition-all border border-white/5 flex flex-col gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <ShieldAlert size={16} className="text-orange-500" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Gym Support</p>
                  <p className="text-[10px] text-white/40">Contact staff</p>
                </div>
              </button>
              
              <button onClick={() => navigate('/gym/trainers')} className="bg-[#0D1526] hover:bg-white/5 p-4 rounded-3xl text-left transition-all border border-white/5 flex flex-col gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Users size={16} className="text-purple-400" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Trainers</p>
                  <p className="text-[10px] text-white/40">Book & message</p>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Direct Messages */}
        <div>
          <h2 className="text-xs font-black text-white/40 uppercase tracking-widest mb-3 px-2">Direct Messages</h2>
          
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 rounded-3xl shimmer" />)}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-10 flex flex-col items-center bg-[#0D1526] rounded-3xl border border-white/5">
              <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-4">
                <MessageSquare size={24} className="text-white/20" />
              </div>
              <h3 className="font-black text-white text-sm mb-1">No direct messages</h3>
              <p className="text-white/40 text-xs mb-4 max-w-[200px]">Start chatting with other lifters directly.</p>
              <button onClick={() => navigate('/messages/search')} className="px-5 py-2.5 bg-liftly-teal text-liftly-navy text-xs font-black rounded-xl active:scale-95 shadow-teal">
                New Message
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map(conv => {
                const otherUser = getOtherParticipant(conv);
                return (
                  <button
                    key={conv.id}
                    onClick={() => navigate(`/messages/${conv.id}`)}
                    className="w-full bg-[#0D1526] p-4 rounded-3xl border border-white/5 flex items-center gap-4 active:scale-[0.98] transition-all text-left hover:bg-white/5 group"
                  >
                    <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 bg-white/10 border border-white/10 relative">
                      {otherUser.photo ? (
                        <img src={otherUser.photo} alt={otherUser.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/50 font-black text-lg">
                          {otherUser.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {conv.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-liftly-teal rounded-full border-2 border-[#0D1526]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h3 className={`font-bold truncate pr-2 ${conv.unreadCount > 0 ? 'text-white' : 'text-white/80'}`}>{otherUser.name}</h3>
                        <span className={`text-[10px] font-semibold shrink-0 ${conv.unreadCount > 0 ? 'text-liftly-teal' : 'text-white/30'}`}>{formatTime(conv.lastMessageAt)}</span>
                      </div>
                      <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-white font-medium' : 'text-white/40'}`}>
                        {conv.lastMessage || 'Say hello!'}
                      </p>
                    </div>
                    {conv.isMuted ? (
                      <div className="shrink-0 flex items-center justify-center text-white/20">
                        <BellOff size={16} />
                      </div>
                    ) : conv.unreadCount > 0 && (
                      <div className="w-5 h-5 rounded-full bg-liftly-teal flex items-center justify-center text-[10px] font-black text-liftly-navy shrink-0">
                        {conv.unreadCount}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ChatHub;
