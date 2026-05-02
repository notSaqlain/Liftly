import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection, addDoc, query, orderBy, limit, onSnapshot,
  serverTimestamp, doc, setDoc, where
} from 'firebase/firestore';
import { Send, Users, X, Ghost, ChevronLeft, Globe, Building2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const GroupChat = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const { mode } = useParams(); // 'global' | 'gym'

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showOnlineList, setShowOnlineList] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const displayName = userData?.firstName || currentUser?.displayName?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'Lifter';
  const photoURL = userData?.photoURL || currentUser?.photoURL || null;
  const isIncognito = userData?.hideOnlineStatus === true;

  const gymId = userData?.gymId || null;
  const gymName = userData?.gymName || null;
  const isGymMode = mode === 'gym';

  // Derived collection paths
  const msgCollection = isGymMode && gymId
    ? collection(db, 'gym_chats', gymId, 'messages')
    : collection(db, 'gym_chat');

  // Real-time messages listener
  useEffect(() => {
    const q = query(msgCollection, orderBy('createdAt', 'asc'), limit(100));
    const unsubscribe = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [mode, gymId]);

  // Presence management — includes gymId so it can be filtered
  useEffect(() => {
    if (!currentUser || isIncognito) return;
    const presenceRef = doc(db, 'gym_presence', currentUser.uid);
    setDoc(presenceRef, {
      uid: currentUser.uid,
      displayName,
      photoURL: photoURL || null,
      gymId: gymId || null,
      isOnline: true,
      lastActive: serverTimestamp(),
    });
    const setOffline = () => setDoc(presenceRef, { isOnline: false }, { merge: true });
    window.addEventListener('beforeunload', setOffline);
    return () => {
      window.removeEventListener('beforeunload', setOffline);
      setOffline();
    };
  }, [currentUser, isIncognito, displayName, photoURL, gymId]);

  // Online users — filter by gym when in gym mode
  useEffect(() => {
    let q;
    if (isGymMode && gymId) {
      q = query(
        collection(db, 'gym_presence'),
        where('isOnline', '==', true),
        where('gymId', '==', gymId)
      );
    } else {
      q = query(collection(db, 'gym_presence'), where('isOnline', '==', true));
    }
    const unsubscribe = onSnapshot(q, (snap) => {
      setOnlineUsers(snap.docs.map(d => d.data()));
    });
    return () => unsubscribe();
  }, [mode, gymId]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    const text = newMessage.trim();
    if (!text || !currentUser || sending) return;
    setSending(true);
    setNewMessage('');
    try {
      await addDoc(msgCollection, {
        text,
        uid: currentUser.uid,
        displayName,
        photoURL: photoURL || null,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error sending message:', err);
      setNewMessage(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const formatTime = (ts) => {
    if (!ts?.toDate) return '';
    return ts.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const isMe = (uid) => uid === currentUser?.uid;

  const groupedMessages = messages.map((msg, i) => {
    const prev = messages[i - 1];
    return { ...msg, isFirst: !prev || prev.uid !== msg.uid, isLast: !messages[i + 1] || messages[i + 1].uid !== msg.uid };
  });

  const modeLabel = isGymMode && gymId ? `${gymName} Community` : 'Global Community';
  const modeSubtitle = isGymMode && gymId
    ? 'Local gym feed'
    : 'The global lifter feed';
  const Icon = isGymMode ? Building2 : Globe;

  return (
    <div className="bg-[#040810] min-h-screen flex flex-col relative animate-fade-in pb-20">

      {/* Header */}
      <div className="bg-liftly-navy px-4 pt-12 pb-4 relative overflow-hidden shrink-0 shadow-navy">
        <div className="absolute top-0 right-0 w-32 h-32 bg-liftly-teal/15 rounded-full blur-3xl -mr-10 -mt-10" />
        
        <div className="relative z-10 flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/chat')} className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all backdrop-blur-sm shrink-0">
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                <Icon size={18} className={isGymMode ? "text-liftly-teal" : "text-blue-400"} />
              </div>
              <div>
                <h1 className="text-lg font-black text-white tracking-tight leading-none truncate pr-2 max-w-[180px]">{modeLabel}</h1>
                <p className="text-white/40 text-[10px] font-medium mt-0.5">{modeSubtitle}</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setShowOnlineList(!showOnlineList)}
            className="flex items-center gap-1.5 bg-white/8 hover:bg-white/15 border border-white/10 rounded-2xl px-3 py-2 transition-all active:scale-95 shrink-0"
          >
            <div className={`w-2 h-2 rounded-full ${isIncognito ? 'bg-slate-500' : 'bg-green-400 animate-pulse'}`} />
            <span className="text-white/70 text-xs font-bold">
              {isIncognito ? 'Incognito' : `${onlineUsers.length}`}
            </span>
          </button>
        </div>
      </div>

      {/* Online Users Dropdown */}
      {showOnlineList && (
        <>
          <div className="absolute inset-0 z-40 bg-[#040810]/60 backdrop-blur-[2px]" onClick={() => setShowOnlineList(false)} />
          <div className="absolute top-[100px] right-4 w-64 bg-[#0D1526] rounded-3xl shadow-2xl border border-white/10 z-50 overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
              <h3 className="font-black text-white text-sm flex items-center gap-2">
                <Users size={16} className="text-liftly-teal" />
                Who's Online
              </h3>
              <button onClick={() => setShowOnlineList(false)} className="text-white/40 hover:text-white/80 active:scale-90 transition-all">
                <X size={16} />
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto p-2 no-scrollbar">
              {isIncognito ? (
                <div className="p-5 text-center">
                  <Ghost size={24} className="text-white/20 mx-auto mb-2" />
                  <p className="text-xs font-bold text-white/50 mb-1">Incognito Mode Active</p>
                  <p className="text-[10px] text-white/30 leading-relaxed">You cannot see who is online while hidden. Disable it in Settings.</p>
                </div>
              ) : onlineUsers.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-xs font-bold text-white/40">No one else is online</p>
                </div>
              ) : (
                onlineUsers.map(user => (
                  <button key={user.uid} onClick={() => navigate(`/profile/${user.uid}`)} className="w-full text-left flex items-center gap-3 p-2 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer active:scale-95">
                    <div className="w-9 h-9 rounded-xl bg-liftly-teal/10 flex items-center justify-center shrink-0 overflow-hidden relative border border-white/10">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-liftly-teal font-black text-sm">{(user.displayName || '?').charAt(0).toUpperCase()}</span>
                      )}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-[2.5px] border-[#0D1526] rounded-full" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white truncate">{user.displayName}</p>
                      <p className="text-[9px] font-semibold text-green-400">Online</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar relative z-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              <Icon size={28} className="text-white/20" />
            </div>
            <h3 className="font-black text-white mb-1">
              Start the conversation
            </h3>
            <p className="text-white/40 text-sm">
              Be the first to say something to the community!
            </p>
          </div>
        )}

        {groupedMessages.map((msg, idx) => {
          const mine = isMe(msg.uid);
          let showDate = false;
          let dateStr = '';
          if (msg.createdAt?.toDate) {
            const currentMsgDate = msg.createdAt.toDate();
            const prevMsgDate = idx > 0 && groupedMessages[idx - 1].createdAt?.toDate ? groupedMessages[idx - 1].createdAt.toDate() : null;
            if (!prevMsgDate || currentMsgDate.toDateString() !== prevMsgDate.toDateString()) {
              showDate = true;
              const today = new Date();
              const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
              if (currentMsgDate.toDateString() === today.toDateString()) dateStr = 'Today';
              else if (currentMsgDate.toDateString() === yesterday.toDateString()) dateStr = 'Yesterday';
              else dateStr = currentMsgDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            }
          }
          return (
            <div key={msg.id} className="flex flex-col">
              {showDate && (
                <div className="flex justify-center my-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/30 bg-white/5 border border-white/10 px-3 py-1 rounded-full">{dateStr}</span>
                </div>
              )}
              <div className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : 'flex-row'} ${msg.isFirst && !showDate ? 'mt-4' : 'mt-0.5'}`}>
                {!mine && (
                  <button onClick={() => navigate(`/profile/${msg.uid}`)} className={`w-8 h-8 rounded-xl shrink-0 overflow-hidden border border-white/10 active:scale-95 transition-all cursor-pointer ${!msg.isLast ? 'invisible' : ''}`}>
                    {msg.photoURL ? (
                      <img src={msg.photoURL} alt={msg.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/50 font-black text-sm">
                        {(msg.displayName || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </button>
                )}
                <div className={`max-w-[75%] flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                  {!mine && msg.isFirst && (
                    <button onClick={() => navigate(`/profile/${msg.uid}`)} className="text-[10px] font-black text-white/40 mb-1 ml-1 hover:text-white/60 active:scale-95 transition-all cursor-pointer">
                      {msg.displayName}
                    </button>
                  )}
                  <div className={`px-4 py-2.5 text-sm font-medium leading-relaxed ${
                    mine
                      ? 'bg-liftly-teal text-liftly-navy rounded-2xl rounded-br-md shadow-teal font-bold'
                      : 'bg-[#0D1526] text-white rounded-2xl rounded-bl-md border border-white/5'
                  } ${msg.isFirst && !mine ? 'rounded-tl-2xl' : ''} ${msg.isFirst && mine ? 'rounded-tr-2xl' : ''}`}>
                    {msg.text}
                  </div>
                  {msg.isLast && (
                    <span className="text-[9px] font-semibold text-white/30 mt-1 mx-1">{formatTime(msg.createdAt)}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-3 bg-[#040810] shrink-0 sticky bottom-0 z-10">
        <form onSubmit={sendMessage} className="flex items-center gap-3">
          <div className="flex-1 flex items-center bg-[#0D1526] border border-white/10 rounded-3xl px-4 focus-within:border-liftly-teal/50 transition-all">
            <input
              ref={inputRef}
              type="text"
              placeholder="Message..."
              className="flex-1 h-12 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-12 h-12 rounded-3xl bg-liftly-teal text-liftly-navy flex items-center justify-center shadow-teal active:scale-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        </form>
      </div>

    </div>
  );
};

export default GroupChat;
