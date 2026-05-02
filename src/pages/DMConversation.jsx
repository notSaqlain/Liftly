import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { ChevronLeft, Send, MessageCircle } from 'lucide-react';

const DMConversation = () => {
  const { conversationId } = useParams();
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState({ name: 'Loading...', photo: null, uid: null, isOnline: false });

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const displayName = userData?.firstName || currentUser?.displayName?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'Lifter';
  const photoURL = userData?.photoURL || currentUser?.photoURL || null;

  // Mark read and get other user info
  useEffect(() => {
    if (!currentUser || !conversationId) return;

    const fetchConvInfo = async () => {
      const dmRef = doc(db, 'users', currentUser.uid, 'dms', conversationId);
      const docSnap = await getDoc(dmRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const otherUid = data.participantUids.find(id => id !== currentUser.uid);
        setOtherUser({
          uid: otherUid,
          name: data.participantNames[otherUid] || 'User',
          photo: data.participantPhotos[otherUid] || null,
          isOnline: false
        });

        if (data.unreadCount > 0) {
          updateDoc(dmRef, { unreadCount: 0 });
        }
      }
    };

    fetchConvInfo();
  }, [currentUser, conversationId]);

  // Presence listener for other user
  useEffect(() => {
    if (!otherUser.uid) return;
    const unsub = onSnapshot(doc(db, 'gym_presence', otherUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        setOtherUser(prev => ({ ...prev, isOnline: docSnap.data().isOnline }));
      }
    });
    return () => unsub();
  }, [otherUser.uid]);

  // Messages listener
  useEffect(() => {
    if (!conversationId) return;

    const msgCollection = collection(db, 'dm_conversations', conversationId, 'messages');
    const q = query(msgCollection, orderBy('createdAt', 'asc'), limit(100));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    
    return () => unsubscribe();
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    const text = newMessage.trim();
    if (!text || !currentUser || sending || !conversationId || !otherUser.uid) return;
    
    setSending(true);
    setNewMessage('');
    
    try {
      const msgData = {
        text,
        uid: currentUser.uid,
        displayName,
        photoURL: photoURL || null,
        createdAt: serverTimestamp(),
      };

      // 1. Add message
      await addDoc(collection(db, 'dm_conversations', conversationId, 'messages'), msgData);

      // 2. Update parent DM docs
      const updateData = {
        lastMessage: text,
        lastMessageAt: serverTimestamp()
      };

      // Update my side
      await updateDoc(doc(db, 'users', currentUser.uid, 'dms', conversationId), updateData);
      
      // Update their side (increment unread)
      const theirDmRef = doc(db, 'users', otherUser.uid, 'dms', conversationId);
      const theirSnap = await getDoc(theirDmRef);
      const currentUnread = theirSnap.exists() ? (theirSnap.data().unreadCount || 0) : 0;
      await updateDoc(theirDmRef, { ...updateData, unreadCount: currentUnread + 1 });

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

  return (
    <div className="flex flex-col h-screen bg-slate-50 relative pb-[72px]">
      {/* Safe padding for notch/status bar area in iOS can be added if using Capacitor */}
      
      <div className="bg-liftly-navy px-4 pt-12 pb-3 relative overflow-hidden shrink-0 shadow-sm z-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-liftly-teal/15 rounded-full blur-3xl -mr-10 -mt-10" />
        
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate('/chat')} className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all">
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 relative shrink-0">
              {otherUser.photo ? (
                <img src={otherUser.photo} alt={otherUser.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-black text-sm">
                  {otherUser.name.charAt(0)}
                </div>
              )}
              {otherUser.isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-liftly-navy rounded-full" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-black text-white truncate leading-tight">{otherUser.name}</h1>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{otherUser.isOnline ? 'Online' : 'Offline'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 no-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="w-16 h-16 rounded-3xl bg-liftly-teal/10 flex items-center justify-center mb-4">
              <MessageCircle size={28} className="text-liftly-teal" />
            </div>
            <h3 className="font-black text-slate-700 mb-1">Say hello!</h3>
            <p className="text-slate-400 text-sm">Start a conversation with {otherUser.name}.</p>
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
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{dateStr}</span>
                </div>
              )}
              <div className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : 'flex-row'} ${msg.isFirst && !showDate ? 'mt-3' : 'mt-0.5'}`}>
                <div className={`max-w-[80%] flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2.5 text-sm font-medium leading-relaxed ${
                    mine
                      ? 'bg-liftly-teal text-white rounded-2xl rounded-br-md shadow-teal'
                      : 'bg-white text-slate-800 rounded-2xl rounded-bl-md shadow-card border border-slate-100'
                  } ${msg.isFirst && !mine ? 'rounded-tl-2xl' : ''} ${msg.isFirst && mine ? 'rounded-tr-2xl' : ''}`}>
                    {msg.text}
                  </div>
                  {msg.isLast && (
                    <span className="text-[9px] font-semibold text-slate-300 mt-1 mx-1">{formatTime(msg.createdAt)}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="fixed bottom-0 w-full max-w-[480px] z-[60] bg-white border-t border-slate-100 p-3 safe-area-bottom pb-4">
        <form onSubmit={sendMessage} className="flex items-center gap-3">
          <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-full px-4 focus-within:border-liftly-teal focus-within:ring-1 focus-within:ring-liftly-teal transition-all">
            <input
              ref={inputRef}
              type="text"
              placeholder="Message..."
              className="flex-1 h-12 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-12 h-12 rounded-full bg-liftly-teal text-white flex items-center justify-center shadow-teal active:scale-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default DMConversation;
