import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, doc, setDoc, where } from 'firebase/firestore';
import { Send, MessageCircle, Users, X, Ghost } from 'lucide-react';

const LiftChat = () => {
  const { currentUser, userData } = useAuth();
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

  // Real-time listener for messages
  useEffect(() => {
    const q = query(
      collection(db, 'gym_chat'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, []);

  // Presence management
  useEffect(() => {
    if (!currentUser || isIncognito) return;

    const presenceRef = doc(db, 'gym_presence', currentUser.uid);
    setDoc(presenceRef, {
      uid: currentUser.uid,
      displayName,
      photoURL: photoURL || null,
      isOnline: true,
      lastActive: serverTimestamp(),
    });

    const setOffline = () => {
      setDoc(presenceRef, { isOnline: false }, { merge: true });
    };

    window.addEventListener('beforeunload', setOffline);

    return () => {
      window.removeEventListener('beforeunload', setOffline);
      setOffline();
    };
  }, [currentUser, isIncognito, displayName, photoURL]);

  // Listen to online users
  useEffect(() => {
    const q = query(collection(db, 'gym_presence'), where('isOnline', '==', true));
    const unsubscribe = onSnapshot(q, (snap) => {
      const users = snap.docs.map(doc => doc.data());
      setOnlineUsers(users);
    });
    return () => unsubscribe();
  }, []);

  // Auto-scroll to bottom on new messages
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
      await addDoc(collection(db, 'gym_chat'), {
        text,
        uid: currentUser.uid,
        displayName,
        photoURL: photoURL || null,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error sending message:', err);
      setNewMessage(text); // restore on error
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

  // Group consecutive messages from same user
  const groupedMessages = messages.map((msg, i) => {
    const prev = messages[i - 1];
    const isFirst = !prev || prev.uid !== msg.uid;
    const isLast = !messages[i + 1] || messages[i + 1].uid !== msg.uid;
    return { ...msg, isFirst, isLast };
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">

      {/* Header */}
      <div className="bg-liftly-navy px-5 pt-12 pb-5 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-liftly-teal/15 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="relative z-10 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle size={16} className="text-liftly-teal" />
              <span className="text-liftly-teal text-xs font-black uppercase tracking-widest">Community</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">LiftChat</h1>
            <p className="text-white/40 text-xs font-medium mt-0.5">The global lifter community</p>
          </div>
          <button 
            onClick={() => setShowOnlineList(!showOnlineList)}
            className="flex items-center gap-1.5 bg-white/8 hover:bg-white/15 border border-white/10 rounded-2xl px-3 py-2 transition-all active:scale-95"
          >
            <div className={`w-2 h-2 rounded-full ${isIncognito ? 'bg-slate-500' : 'bg-green-400 animate-pulse'}`} />
            <Users size={12} className="text-white/60" />
            <span className="text-white/70 text-xs font-bold">
              {isIncognito ? 'Incognito' : `${onlineUsers.length} online`}
            </span>
          </button>
        </div>
      </div>

      {/* Online Users Dropdown */}
      {showOnlineList && (
        <>
          <div className="absolute inset-0 z-40 bg-slate-900/10 backdrop-blur-[1px]" onClick={() => setShowOnlineList(false)} />
          <div className="absolute top-[100px] right-5 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <Users size={16} className="text-liftly-teal" />
                Who's Online
              </h3>
              <button onClick={() => setShowOnlineList(false)} className="text-slate-400 hover:text-slate-600 active:scale-90 transition-all">
                <X size={16} />
              </button>
            </div>
            
            <div className="max-h-60 overflow-y-auto p-2 no-scrollbar">
              {isIncognito ? (
                <div className="p-5 text-center">
                  <Ghost size={24} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-500 mb-1">Incognito Mode Active</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed">You cannot see who is online while you are hidden. Disable it in Settings.</p>
                </div>
              ) : onlineUsers.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-xs font-bold text-slate-500">No one else is online</p>
                </div>
              ) : (
                onlineUsers.map(user => (
                  <div key={user.uid} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-liftly-teal/10 flex items-center justify-center shrink-0 overflow-hidden relative">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-liftly-teal font-black text-sm">{(user.displayName || '?').charAt(0).toUpperCase()}</span>
                      )}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-[2.5px] border-white rounded-full" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700 truncate">{user.displayName}</p>
                      <p className="text-[9px] font-semibold text-green-500">Online</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="w-16 h-16 rounded-3xl bg-liftly-teal/10 flex items-center justify-center mb-4">
              <MessageCircle size={28} className="text-liftly-teal" />
            </div>
            <h3 className="font-black text-slate-700 mb-1">Start the conversation</h3>
            <p className="text-slate-400 text-sm">Be the first to say something to the community!</p>
          </div>
        )}

        {groupedMessages.map((msg, idx) => {
          const mine = isMe(msg.uid);
          
          // Determine if we need a date separator
          let showDate = false;
          let dateStr = '';
          if (msg.createdAt?.toDate) {
            const currentMsgDate = msg.createdAt.toDate();
            const prevMsgDate = idx > 0 && groupedMessages[idx - 1].createdAt?.toDate ? groupedMessages[idx - 1].createdAt.toDate() : null;
            
            if (!prevMsgDate || currentMsgDate.toDateString() !== prevMsgDate.toDateString()) {
              showDate = true;
              const today = new Date();
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);
              
              if (currentMsgDate.toDateString() === today.toDateString()) {
                dateStr = 'Today';
              } else if (currentMsgDate.toDateString() === yesterday.toDateString()) {
                dateStr = 'Yesterday';
              } else {
                dateStr = currentMsgDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              }
            }
          }

          return (
            <div key={msg.id} className="flex flex-col">
              {showDate && (
                <div className="flex justify-center my-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                    {dateStr}
                  </span>
                </div>
              )}
              
              <div
                className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : 'flex-row'} ${msg.isFirst && !showDate ? 'mt-4' : 'mt-0.5'}`}
              >
                {/* Avatar (only last in group) */}
                {!mine && (
                  <div className={`w-8 h-8 rounded-xl shrink-0 overflow-hidden shadow-sm ${!msg.isLast ? 'invisible' : ''}`}>
                    {msg.photoURL ? (
                      <img src={msg.photoURL} alt={msg.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-liftly-teal/20 flex items-center justify-center text-liftly-teal font-black text-sm">
                        {(msg.displayName || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                )}

                <div className={`max-w-[72%] flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                  {/* Name (first in group only, not mine) */}
                  {!mine && msg.isFirst && (
                    <span className="text-[10px] font-black text-slate-400 mb-1 ml-1">{msg.displayName}</span>
                  )}

                  {/* Bubble */}
                  <div className={`px-4 py-2.5 text-sm font-medium leading-relaxed ${
                    mine
                      ? 'bg-liftly-teal text-white rounded-2xl rounded-br-md shadow-teal'
                      : 'bg-white text-slate-800 rounded-2xl rounded-bl-md shadow-card border border-slate-100'
                  } ${msg.isFirst && !mine ? 'rounded-tl-2xl' : ''} ${msg.isFirst && mine ? 'rounded-tr-2xl' : ''}`}>
                    {msg.text}
                  </div>

                  {/* Time (last in group only) */}
                  {msg.isLast && (
                    <span className={`text-[9px] font-semibold text-slate-300 mt-1 mx-1`}>
                      {formatTime(msg.createdAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 bg-white border-t border-slate-100 shrink-0">
        <form onSubmit={sendMessage} className="flex items-center gap-3">
          {/* My avatar */}
          <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0">
            {photoURL ? (
              <img src={photoURL} alt="Me" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-liftly-teal/20 flex items-center justify-center text-liftly-teal font-black">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 focus-within:border-liftly-teal focus-within:ring-1 focus-within:ring-liftly-teal transition-all">
            <input
              ref={inputRef}
              type="text"
              placeholder="Say something to the community…"
              className="flex-1 h-11 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-11 h-11 rounded-2xl bg-liftly-teal text-white flex items-center justify-center shadow-teal active:scale-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default LiftChat;
