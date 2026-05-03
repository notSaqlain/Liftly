import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Send, MessageCircle, ChevronLeft, MapPin, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GymSupport = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const gymId = userData?.gymId;
  const gymName = userData?.gymName;

  const displayName = userData?.firstName || currentUser?.displayName?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'Lifter';
  const photoURL = userData?.photoURL || currentUser?.photoURL || null;

  useEffect(() => {
    if (!gymId) return;

    const msgCollection = collection(db, 'gym_support', gymId, 'messages');
    const q = query(msgCollection, orderBy('createdAt', 'asc'), limit(100));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    
    return () => unsubscribe();
  }, [gymId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    const text = newMessage.trim();
    if (!text || !currentUser || sending || !gymId) return;
    
    setSending(true);
    setNewMessage('');
    
    try {
      await addDoc(collection(db, 'gym_support', gymId, 'messages'), {
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

  if (!gymId) {
    return (
      <div className="bg-[#040810] min-h-full flex flex-col">
        <div className="bg-liftly-navy px-6 pt-12 pb-6 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-liftly-teal/15 rounded-full blur-3xl -mr-10 -mt-10" />
          <div className="relative z-10 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all">
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-2xl font-black text-white">Gym Support</h1>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-liftly-teal/10 flex items-center justify-center mb-4">
            <MapPin size={28} className="text-liftly-teal" />
          </div>
          <h3 className="font-black text-white text-lg mb-2">No gym license active</h3>
          <p className="text-white/40 text-sm leading-relaxed max-w-[260px] mb-6">
            Activate your Liftly PRO license to contact gym staff and support.
          </p>
          <button onClick={() => navigate('/my-plan')} className="px-6 py-3 bg-liftly-teal text-liftly-navy font-black rounded-2xl active:scale-95 shadow-teal">
            Activate License →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#040810] relative" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="bg-liftly-navy px-5 pt-12 pb-4 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/15 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="relative z-10 flex items-center gap-3 mb-2">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all">
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert size={14} className="text-blue-400" />
              <span className="text-blue-400 text-[10px] font-black uppercase tracking-widest">{gymName}</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">Gym Support</h1>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center mb-4">
              <MessageCircle size={28} className="text-blue-400" />
            </div>
            <h3 className="font-black text-white mb-1">How can we help?</h3>
            <p className="text-white/40 text-sm">Send a message to gym staff.</p>
          </div>
        )}

        {groupedMessages.map((msg, idx) => {
          const mine = isMe(msg.uid);
          const isStaff = msg.isStaff === true;
          
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
                  <div className={`w-8 h-8 rounded-xl shrink-0 overflow-hidden ${!msg.isLast ? 'invisible' : ''}`}>
                    {msg.photoURL ? (
                      <img src={msg.photoURL} alt={msg.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center font-black text-sm ${isStaff ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white/50'}`}>
                        {(msg.displayName || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
                <div className={`max-w-[75%] flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                  {!mine && msg.isFirst && (
                    <div className="flex items-center gap-2 mb-1 ml-1">
                      <span className="text-[10px] font-black text-white/40">{msg.displayName}</span>
                      {isStaff && <span className="text-[8px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/15 border border-blue-500/20 px-1.5 py-0.5 rounded-md">Gym Staff</span>}
                    </div>
                  )}
                  <div className={`px-4 py-2.5 text-sm font-medium leading-relaxed ${
                    mine
                      ? 'bg-liftly-teal text-liftly-navy rounded-2xl rounded-br-md shadow-teal font-bold'
                      : isStaff 
                        ? 'bg-blue-500/10 border border-blue-500/20 text-white rounded-2xl rounded-bl-md'
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

      {/* Input bar */}
      <div className="px-4 pb-4 pt-3 bg-[#040810] shrink-0 border-t border-white/5">
        <form onSubmit={sendMessage} className="flex items-center gap-3">
          <div className="flex-1 flex items-center bg-[#0D1526] border border-white/10 rounded-3xl px-4 focus-within:border-liftly-teal/50 transition-all">
            <input
              ref={inputRef}
              type="text"
              placeholder="Send message to staff..."
              className="flex-1 h-11 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
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
            className="w-11 h-11 rounded-2xl bg-liftly-teal text-liftly-navy flex items-center justify-center shadow-teal active:scale-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default GymSupport;
