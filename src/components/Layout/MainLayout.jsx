import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Home, Dumbbell, BarChart3, MessageCircle, User } from 'lucide-react';
import clsx from 'clsx';
import OnboardingTutorial from '../OnboardingTutorial';

const NAV_ITEMS = [
  { to: '/',        icon: Home,          label: 'Home',    end: true },
  { to: '/workout', icon: Dumbbell,      label: 'Workout', end: false },
  { to: '/chat',    icon: MessageCircle, label: 'Chat',    end: false },
  { to: '/stats',   icon: BarChart3,     label: 'Stats',   end: false },
  { to: '/profile', icon: User,          label: 'Profile', end: false },
];

const MainLayout = () => {
  const { currentUser } = useAuth();
  const [unreadDMsCount, setUnreadDMsCount] = useState(0);
  const location = useLocation();

  const isChatPage = location.pathname.startsWith('/messages') || location.pathname.startsWith('/chat/group') || location.pathname.startsWith('/gym/support');

  useEffect(() => {
    if (!currentUser) return;

    const dmQ = query(collection(db, 'users', currentUser.uid, 'dms'), where('unreadCount', '>', 0));
    const unsubscribe = onSnapshot(dmQ, (snap) => {
      let unreadTotal = 0;
      snap.forEach(d => {
        if (!d.data().isMuted) {
          unreadTotal += d.data().unreadCount;
        }
      });
      setUnreadDMsCount(unreadTotal);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <div className="flex justify-center h-[100dvh] overflow-hidden bg-mesh-glow">
      <OnboardingTutorial />
      <div className="w-full max-w-[480px] h-full relative shadow-2xl flex flex-col bg-[#040810]/60 backdrop-blur-3xl border-x border-white/5">
        {/* Main Content Area */}
        <main className={`flex-1 flex flex-col overflow-y-auto no-scrollbar`}>
          <Outlet />
        </main>

        {/* FEATURE: Floating Pill Nav */}
        {!isChatPage && (
          <nav className="tour-nav-bar w-full shrink-0 z-50 px-4 pb-3 pt-1">
          <div
            className="rounded-[28px] border shadow-2xl"
            style={{
              background: 'rgba(13, 21, 38, 0.75)',
              backdropFilter: 'blur(40px) saturate(150%)',
              WebkitBackdropFilter: 'blur(40px) saturate(150%)',
              borderColor: 'rgba(255,255,255,0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}
          >
            <div className="flex justify-around items-center h-[68px] px-2">
              {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    clsx(
                      'flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 relative group',
                      isActive ? 'text-brand' : 'text-white/30 hover:text-white/60'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Active pill glow */}
                      {isActive && (
                        <span
                          className="absolute inset-x-1 inset-y-1.5 rounded-2xl animate-scale-in"
                          style={{ 
                            background: 'rgba(0,229,209,0.15)',
                            boxShadow: 'inset 0 1px 0 rgba(0,229,209,0.2)'
                          }}
                        />
                      )}

                      {/* Active indicator removed per design update */}

                      <div className="relative">
                        <Icon
                          size={22}
                          strokeWidth={isActive ? 2.5 : 1.8}
                          className={clsx(
                            'transition-all duration-300 relative z-10',
                            isActive ? 'scale-110' : 'group-hover:scale-105'
                          )}
                        />
                        {label === 'Chat' && unreadDMsCount > 0 && (
                          <div className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 bg-brand rounded-full flex items-center justify-center text-[8px] font-black text-[#070B14] border border-[#070B14] z-20">
                            {unreadDMsCount > 99 ? '99+' : unreadDMsCount}
                          </div>
                        )}
                      </div>

                      <span
                        className={clsx(
                          'text-[9px] font-black uppercase tracking-wider mt-1 relative z-10 transition-all duration-300',
                          isActive ? 'text-brand' : 'text-white/30'
                        )}
                      >
                        {label}
                      </span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
          </nav>
        )}
      </div>
    </div>
  );
};

export default MainLayout;
