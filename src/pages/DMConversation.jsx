import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { ChevronLeft, Send, MessageCircle, Bell, BellOff, Edit2, Trash2, X, Reply } from 'lucide-react';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const DMConversation = () => {
  const { conversationId } = useParams();
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState({ name: 'Loading...', photo: null, uid: null, isOnline: false });
  const [isMuted, setIsMuted] = useState(false);
  
  // Interaction states
  const [activeMsgId, setActiveMsgId] = useState(null); // Used for Context Menu (Reply/Edit/Delete)
  const [activeReactionMenu, setActiveReactionMenu] = useState(null); // Used for Emoji picker
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  
  const pressTimer = useRef(null);

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
        
        // Fetch live user data for updated photo and name
        const otherUserSnap = await getDoc(doc(db, 'users', otherUid));
        const otherUserData = otherUserSnap.exists() ? otherUserSnap.data() : {};
        
        setOtherUser({
          uid: otherUid,
          name: otherUserData.firstName ? `${otherUserData.firstName} ${otherUserData.lastName || ''}`.trim() : (data.participantNames?.[otherUid] || 'User'),
          photo: otherUserData.photoURL || otherUserData.googlePhotoURL || data.participantPhotos?.[otherUid] || null,
          isOnline: false
        });
        setIsMuted(!!data.isMuted);

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
    const currentReply = replyingTo;
    setReplyingTo(null);
    setActiveMsgId(null);
    setActiveReactionMenu(null);
    
    try {
      if (editingMsgId) {
        await updateDoc(doc(db, 'dm_conversations', conversationId, 'messages', editingMsgId), {
          text,
          editedAt: serverTimestamp()
        });
        setEditingMsgId(null);
      } else {
        const msgData = {
          text,
          uid: currentUser.uid,
          displayName,
          photoURL: photoURL || null,
          createdAt: serverTimestamp(),
          isDeleted: false,
          ...(currentReply && { replyTo: currentReply })
        };

        await addDoc(collection(db, 'dm_conversations', conversationId, 'messages'), msgData);

        const updateData = {
          lastMessage: text,
          lastMessageAt: serverTimestamp()
        };

        const dmBaseData = {
          participantUids: [currentUser.uid, otherUser.uid],
          participantNames: {
            [currentUser.uid]: displayName,
            [otherUser.uid]: otherUser.name
          },
          participantPhotos: {
            [currentUser.uid]: photoURL || null,
            [otherUser.uid]: otherUser.photo || null
          }
        };

        await setDoc(doc(db, 'users', currentUser.uid, 'dms', conversationId), {
          ...dmBaseData,
          ...updateData
        }, { merge: true });
        
        const theirDmRef = doc(db, 'users', otherUser.uid, 'dms', conversationId);
        const theirSnap = await getDoc(theirDmRef);
        const currentUnread = theirSnap.exists() ? (theirSnap.data().unreadCount || 0) : 0;
        
        await setDoc(theirDmRef, { 
          ...dmBaseData,
          ...updateData, 
          unreadCount: currentUnread + 1 
        }, { merge: true });
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setNewMessage(text);
      setReplyingTo(currentReply);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleDelete = async (msgId) => {
    try {
      await updateDoc(doc(db, 'dm_conversations', conversationId, 'messages', msgId), {
        text: '[This message was deleted]',
        isDeleted: true
      });
      setActiveMsgId(null);
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const handleReact = async (msgId, emoji, currentReactions) => {
    try {
      const reactions = currentReactions || {};
      const emojiUsers = reactions[emoji] || [];
      
      let newEmojiUsers;
      if (emojiUsers.includes(currentUser.uid)) {
        newEmojiUsers = emojiUsers.filter(id => id !== currentUser.uid);
      } else {
        newEmojiUsers = [...emojiUsers, currentUser.uid];
      }

      const newReactions = {
        ...reactions,
        [emoji]: newEmojiUsers
      };

      // Clean up empty emoji arrays
      if (newEmojiUsers.length === 0) {
        delete newReactions[emoji];
      }

      await updateDoc(doc(db, 'dm_conversations', conversationId, 'messages', msgId), {
        reactions: newReactions
      });
      setActiveReactionMenu(null);
    } catch (err) {
      console.error('Error reacting to message:', err);
    }
  };

  const handleTouchStart = (msgId) => {
    pressTimer.current = setTimeout(() => {
      setActiveMsgId(msgId);
      setActiveReactionMenu(null);
    }, 500); // 500ms for long press
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
  };

  const handleSingleTap = (msgId) => {
    if (activeMsgId === msgId) {
      setActiveMsgId(null);
    } else {
      setActiveReactionMenu(activeReactionMenu === msgId ? null : msgId);
      setActiveMsgId(null);
    }
  };

  const handleMuteToggle = async () => {
    if (!currentUser || !conversationId) return;
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid, 'dms', conversationId), {
        isMuted: newMutedState
      });
    } catch (err) {
      console.error('Error toggling mute:', err);
      setIsMuted(!newMutedState);
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
    <div className="flex flex-col bg-[#040810] relative" style={{ height: '100dvh' }}>
      {/* Header */}
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
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-black text-white truncate leading-tight">{otherUser.name}</h1>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{otherUser.isOnline ? 'Online' : 'Offline'}</p>
            </div>
            <button onClick={handleMuteToggle} className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/50 active:scale-95 transition-all shrink-0">
              {isMuted ? <BellOff size={18} className="text-red-400" /> : <Bell size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-4 space-y-2 no-scrollbar" onClick={() => { setActiveReactionMenu(null); setActiveMsgId(null); }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="w-16 h-16 rounded-3xl bg-liftly-teal/10 flex items-center justify-center mb-4">
              <MessageCircle size={28} className="text-liftly-teal" />
            </div>
            <h3 className="font-black text-white mb-1">Say hello!</h3>
            <p className="text-white/40 text-sm">Start a conversation with {otherUser.name}.</p>
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

          const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0;

          return (
            <div key={msg.id} className="flex flex-col">
              {showDate && (
                <div className="flex justify-center my-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/30 bg-white/5 border border-white/10 px-3 py-1 rounded-full">{dateStr}</span>
                </div>
              )}
              <div className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : 'flex-row'} ${msg.isFirst && !showDate ? 'mt-3' : 'mt-0.5'}`}>
                <div className={`max-w-[80%] flex flex-col relative ${mine ? 'items-end' : 'items-start'}`}>
                  
                  {/* Reaction Menu Tooltip */}
                  {activeReactionMenu === msg.id && !msg.isDeleted && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-12 bg-[#0D1526] shadow-card rounded-2xl border border-white/10 flex p-1.5 gap-1 z-30 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                      {EMOJIS.map(emoji => (
                        <button 
                          key={emoji}
                          onClick={() => handleReact(msg.id, emoji, msg.reactions)}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-lg active:scale-75"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Context Menu (Long Press) */}
                  {activeMsgId === msg.id && !msg.isDeleted && (
                    <div className={`absolute top-0 ${mine ? 'right-0' : 'left-0'} -mt-10 bg-[#0D1526] shadow-card rounded-xl border border-white/10 flex overflow-hidden z-20 animate-fade-in`} onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => { setReplyingTo({ id: msg.id, text: msg.text, name: mine ? displayName : otherUser.name }); setActiveMsgId(null); inputRef.current?.focus(); }} className="px-3 py-2 hover:bg-white/5 text-white/60 flex items-center gap-1.5 text-xs font-bold border-r border-white/5 transition-colors">
                        <Reply size={12} /> Reply
                      </button>
                      {mine && (Date.now() - (msg.createdAt?.toMillis ? msg.createdAt.toMillis() : Date.now()) < 15 * 60 * 1000) && (
                        <>
                          <button onClick={() => { setEditingMsgId(msg.id); setNewMessage(msg.text); setActiveMsgId(null); inputRef.current?.focus(); }} className="px-3 py-2 hover:bg-white/5 text-white/60 flex items-center gap-1.5 text-xs font-bold border-r border-white/5 transition-colors">
                            <Edit2 size={12} /> Edit
                          </button>
                          <button onClick={() => handleDelete(msg.id)} className="px-3 py-2 hover:bg-red-500/10 text-red-500 flex items-center gap-1.5 text-xs font-bold transition-colors">
                            <Trash2 size={12} /> Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  <div 
                    onClick={(e) => { e.stopPropagation(); handleSingleTap(msg.id); }}
                    onTouchStart={() => handleTouchStart(msg.id)}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={handleTouchEnd}
                    onMouseDown={() => handleTouchStart(msg.id)}
                    onMouseUp={handleTouchEnd}
                    onMouseLeave={handleTouchEnd}
                    className={`px-4 py-2.5 text-sm font-medium leading-relaxed select-none relative ${
                    msg.isDeleted 
                      ? 'bg-white/5 text-white/30 italic rounded-2xl border border-white/5'
                      : mine
                        ? 'bg-liftly-teal text-liftly-navy rounded-2xl rounded-br-md shadow-teal cursor-pointer font-bold'
                        : 'bg-[#0D1526] text-white rounded-2xl rounded-bl-md border border-white/5'
                  } ${msg.isFirst && !mine ? 'rounded-tl-2xl' : ''} ${msg.isFirst && mine ? 'rounded-tr-2xl' : ''}`}
                  >
                    {/* Reply Block */}
                    {msg.replyTo && !msg.isDeleted && (
                      <div className={`mb-1.5 pl-2 border-l-2 text-xs rounded-r bg-black/10 py-1 pr-2 ${mine ? 'border-liftly-navy/30 text-liftly-navy/80' : 'border-liftly-teal text-white/60'}`}>
                        <div className="font-black mb-0.5">{msg.replyTo.name}</div>
                        <div className="truncate max-w-[150px] opacity-80">{msg.replyTo.text}</div>
                      </div>
                    )}
                    
                    {msg.text}
                    {msg.editedAt && !msg.isDeleted && <span className="text-[10px] opacity-70 ml-2">(edited)</span>}
                  </div>

                  {/* Reactions Display */}
                  {hasReactions && !msg.isDeleted && (
                    <div className={`flex flex-wrap gap-1 mt-1 z-10 relative ${mine ? 'justify-end pr-1' : 'justify-start pl-1'}`}>
                      {Object.entries(msg.reactions).map(([emoji, users]) => {
                        const iReacted = users.includes(currentUser.uid);
                        return (
                          <button
                            key={emoji}
                            onClick={(e) => { e.stopPropagation(); handleReact(msg.id, emoji, msg.reactions); }}
                            className={`px-1.5 py-0.5 rounded-full border text-[10px] flex items-center gap-1 transition-colors ${iReacted ? 'bg-liftly-teal/20 border-liftly-teal text-liftly-teal' : 'bg-[#0D1526] border-white/10 text-white/60'}`}
                          >
                            <span>{emoji}</span>
                            <span className="font-bold">{users.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

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
        {replyingTo && !editingMsgId && (
          <div className="flex items-center justify-between px-4 py-2 bg-[#0D1526] border border-white/5 border-b-0 text-xs text-white/60 rounded-t-2xl">
            <div className="flex flex-col">
              <span className="font-bold text-liftly-teal">Replying to {replyingTo.name}</span>
              <span className="truncate max-w-[200px]">{replyingTo.text}</span>
            </div>
            <button onClick={() => setReplyingTo(null)} className="w-6 h-6 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 transition-colors">
              <X size={12} />
            </button>
          </div>
        )}
        {editingMsgId && (
          <div className="flex items-center justify-between px-4 py-2 bg-[#0D1526] border border-white/5 border-b-0 text-xs font-bold text-white/50 rounded-t-2xl">
            <span>Editing message...</span>
            <button onClick={() => { setEditingMsgId(null); setNewMessage(''); }} className="w-6 h-6 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 transition-colors">
              <X size={12} />
            </button>
          </div>
        )}
        <form onSubmit={sendMessage} className="flex items-center gap-3">
          <div className={`flex-1 flex items-center bg-[#0D1526] border border-white/10 px-4 focus-within:border-liftly-teal/50 transition-all ${editingMsgId || replyingTo ? 'rounded-b-3xl rounded-t-none' : 'rounded-3xl'}`}>
            <input
              ref={inputRef}
              type="text"
              placeholder={editingMsgId ? "Edit your message..." : "Message..."}
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

export default DMConversation;
